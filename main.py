import os
import asyncio
import tempfile
import logging
import shutil
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
from moviepy import VideoFileClip
import magic

if not logging.getLogger().handlers:
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI()


class Config:
    """Centralized config for video processing (avoids magic numbers)."""
    # Silence/speech detection (seconds)
    NOISE_START_SEC = 0.05
    NOISE_END_SEC = 0.25
    WINDOW_SIZE_SEC = 0.08
    STEP_SIZE_SEC = 0.01
    SPEECH_ANALYSIS_DURATION_SEC = 5.0
    # Thresholds
    RATIO_THRESHOLD = 4.0
    ABS_THRESHOLD = 0.008
    # Trim buffer before detected speech start (seconds)
    TRIM_BUFFER_SEC = 0.05
    # Limits
    MAX_DURATION_SEC = 600  # 10 minutes
    MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024  # 500MB
    UPLOAD_CHUNK_SIZE = 1024 * 1024  # 1MB
    ALLOWED_CONTENT_TYPES = frozenset({"video/mp4", "video/quicktime"})


DEFAULT_MAX_CONCURRENT_JOBS = max(1, min(2, os.cpu_count() or 1))
MAX_CONCURRENT_JOBS = int(os.environ.get("MAX_CONCURRENT_JOBS", str(DEFAULT_MAX_CONCURRENT_JOBS)))
MAX_CONCURRENT_JOBS = max(1, MAX_CONCURRENT_JOBS)
PROCESS_SEMAPHORE = asyncio.Semaphore(MAX_CONCURRENT_JOBS)
EXECUTOR = ProcessPoolExecutor(max_workers=MAX_CONCURRENT_JOBS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


def safe_unlink(path: str | None) -> None:
    if path and os.path.exists(path):
        try:
            os.unlink(path)
        except Exception:
            pass


def process_video_sync(
    input_path: str,
    output_path: str,
    ratio_threshold: float = Config.RATIO_THRESHOLD,
) -> str:
    """Runs in process pool - MoviePy/ffmpeg are CPU bound."""
    cfg = Config
    temp_out = None
    clip = None
    final_clip = None
    success = False
    try:
        clip = VideoFileClip(input_path)

        if clip.duration > cfg.MAX_DURATION_SEC:
            clip.close()
            clip = None
            raise ValueError(
                f"Video too long. Maximum {cfg.MAX_DURATION_SEC}s ({cfg.MAX_DURATION_SEC // 60} minutes)."
            )

        if not clip.audio:
            clip.close()
            clip = None
            temp_out_fd, temp_out = tempfile.mkstemp(suffix=".mp4")
            os.close(temp_out_fd)
            shutil.copyfile(input_path, temp_out)
            os.replace(temp_out, output_path)
            success = True
            return output_path

        # Extract first N seconds of audio and convert to mono
        fps = 44100
        analysis_dur = min(cfg.SPEECH_ANALYSIS_DURATION_SEC, clip.duration)
        audio_segment = clip.audio.subclipped(0, analysis_dur)
        audio_array = audio_segment.to_soundarray(fps=fps)

        if audio_array.ndim > 1:
            audio_mono = np.abs(audio_array).max(axis=1).astype(np.float64)
        else:
            audio_mono = np.abs(audio_array).astype(np.float64)

        # Sliding window analysis (noise-relative speech detection)
        window_size = int(cfg.WINDOW_SIZE_SEC * fps)
        step_size = int(cfg.STEP_SIZE_SEC * fps)

        def rms(arr: np.ndarray) -> float:
            return float(np.sqrt(np.mean(arr**2)))

        noise_start = int(cfg.NOISE_START_SEC * fps)
        noise_end = int(cfg.NOISE_END_SEC * fps)
        noise_floor = rms(audio_mono[noise_start:noise_end])
        noise_floor = max(noise_floor, 1e-8)

        cut_time = 0.0
        start_index = int(cfg.NOISE_START_SEC * fps)

        for i in range(start_index, len(audio_mono) - window_size, step_size):
            window = audio_mono[i : i + window_size]
            w_rms = rms(window)
            is_speech = (
                w_rms > (ratio_threshold * noise_floor)
                and w_rms > cfg.ABS_THRESHOLD
            )
            if is_speech:
                cut_time = i / fps
                logger.debug(
                    "Speech onset at %.3fs (RMS=%.5f, noise_floor=%.5f, ratio=%.1fx)",
                    cut_time,
                    w_rms,
                    noise_floor,
                    w_rms / noise_floor,
                )
                break

        if cut_time == 0:
            logger.debug(
                "No speech detected (noise_floor=%.5f); keeping video from start",
                noise_floor,
            )

        final_start = max(0, cut_time - cfg.TRIM_BUFFER_SEC)
        logger.debug(
            "Trimming video from %.3fs. Original duration: %.3fs",
            final_start,
            clip.duration,
        )

        final_clip = clip.subclipped(final_start)

        preset = os.environ.get("FFMPEG_PRESET", "ultrafast")
        bitrate = os.environ.get("FFMPEG_BITRATE", "5M")
        temp_out_fd, temp_out = tempfile.mkstemp(suffix=".mp4")
        os.close(temp_out_fd)
        final_clip.write_videofile(
            temp_out,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile=None,
            remove_temp=True,
            preset=preset,
            bitrate=bitrate,
            audio_bitrate="192k",
            logger=None,
        )

        os.replace(temp_out, output_path)
        success = True
        return output_path

    except ValueError:
        raise
    except MemoryError:
        logger.error("Out of memory during video processing", exc_info=True)
        raise
    except Exception:
        logger.error("Video processing failed", exc_info=True)
        raise
    finally:
        for obj in (final_clip, clip):
            if obj is not None:
                try:
                    obj.close()
                except Exception:
                    pass
        safe_unlink(temp_out)
        safe_unlink(input_path)
        if not success:
            safe_unlink(output_path)


def _verify_file_content_type(path: str) -> None:
    """Validate actual file content (not just upload headers). Raises ValueError if invalid."""
    detected = magic.from_file(path, mime=True)
    if detected not in Config.ALLOWED_CONTENT_TYPES:
        raise ValueError(
            f"Invalid file content. Detected type: {detected!r}. "
            f"Only MP4 and MOV are allowed."
        )


# Max bytes to read in /validate (quick check; full size enforced on upload)
VALIDATE_READ_CAP = 2 * 1024 * 1024  # 2MB


@app.post("/validate")
async def validate_video(file: UploadFile = File(...)):
    """
    Quick validation: declared type and content sniff on first 2MB.
    Returns whether file passes basic checks. Full size/duration enforced on upload.
    """
    if file.content_type and file.content_type not in Config.ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only MP4 and MOV are supported. Got: {file.content_type!r}.",
        )
    size = 0
    chunk_size = 64 * 1024  # 64KB
    first_chunk = None
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        if first_chunk is None:
            first_chunk = chunk
        size += len(chunk)
        if size > Config.MAX_VIDEO_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum {Config.MAX_VIDEO_SIZE_BYTES // (1024*1024)}MB.",
            )
        if size >= VALIDATE_READ_CAP:
            break
    await file.close()

    # Content-type from first bytes (python-magic from_buffer)
    try:
        buf = first_chunk[:8192] if first_chunk else b""
        if buf:
            detected = magic.from_buffer(buf, mime=True)
            if detected not in Config.ALLOWED_CONTENT_TYPES:
                return {
                    "valid": False,
                    "error": f"Content appears to be {detected!r}. Only MP4/MOV allowed.",
                    "size_bytes": size,
                }
    except Exception:
        pass

    return {
        "valid": True,
        "size_bytes": size,
        "size_mb": round(size / (1024 * 1024), 2),
        "message": "File passes basic checks. Full size and duration enforced on upload.",
    }


@app.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    sensitivity: float = 4.0,
):
    """
    Upload a video to remove leading silence (deuncify).
    Only MP4 and MOV are supported. Max size 500MB, max duration 10 minutes.
    sensitivity: speech vs noise ratio (default 4.0); higher = less sensitive to quiet speech.
    """
    temp_paths_to_clean: list[str | None] = []
    temp_in_path: str | None = None
    temp_out_path: str | None = None
    try:
        if file.content_type and file.content_type not in Config.ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only MP4 and MOV are allowed.",
            )
        filename = file.filename or "video.mp4"
        suffix = os.path.splitext(filename)[1]
        if not suffix:
            suffix = ".mov" if file.content_type == "video/quicktime" else ".mp4"
        temp_in = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_in_path = temp_in.name
        temp_paths_to_clean.append(temp_in_path)

        temp_out_fd, temp_out_path = tempfile.mkstemp(suffix=".mp4")
        os.close(temp_out_fd)

        total_size = 0
        try:
            while True:
                chunk = await file.read(Config.UPLOAD_CHUNK_SIZE)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > Config.MAX_VIDEO_SIZE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum {Config.MAX_VIDEO_SIZE_BYTES // (1024*1024)}MB.",
                    )
                temp_in.write(chunk)
        finally:
            temp_in.close()
            await file.close()

        # Validate actual file content (not just headers)
        _verify_file_content_type(temp_in_path)

        loop = asyncio.get_running_loop()
        async with PROCESS_SEMAPHORE:
            output_path = await loop.run_in_executor(
                EXECUTOR,
                process_video_sync,
                temp_in_path,
                temp_out_path,
                sensitivity,
            )
        return FileResponse(
            output_path,
            media_type="video/mp4",
            headers={"Content-Disposition": f'inline; filename="deuncified_{filename}"'},
            background=BackgroundTask(safe_unlink, output_path),
        )
    except HTTPException:
        temp_paths_to_clean.append(temp_out_path)
        raise
    except ValueError as e:
        temp_paths_to_clean.append(temp_out_path)
        msg = str(e)
        if "too long" in msg.lower():
            raise HTTPException(status_code=413, detail=msg)
        raise HTTPException(status_code=422, detail=f"Invalid video: {msg}")
    except MemoryError:
        temp_paths_to_clean.append(temp_out_path)
        logger.error("Upload failed: out of memory", exc_info=True)
        raise HTTPException(
            status_code=507,
            detail="Video too complex to process. Try a shorter or smaller file.",
        )
    except Exception:
        temp_paths_to_clean.append(temp_out_path)
        logger.error("Upload failed", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Video processing failed. Check format (MP4/MOV) and try again.",
        )
    finally:
        for path in temp_paths_to_clean:
            safe_unlink(path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
