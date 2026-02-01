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

if not logging.getLogger().handlers:
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI()

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


def safe_unlink(path: str) -> None:
    if path and os.path.exists(path):
        try:
            os.unlink(path)
        except Exception:
            pass


def process_video_sync(input_path: str, output_path: str) -> str:
    """Runs in process pool - MoviePy/ffmpeg are CPU bound."""
    temp_out = None
    clip = None
    final_clip = None
    success = False
    try:
        clip = VideoFileClip(input_path)

        if not clip.audio:
            clip.close()
            clip = None
            temp_out_fd, temp_out = tempfile.mkstemp(suffix=".mp4")
            os.close(temp_out_fd)
            shutil.copyfile(input_path, temp_out)
            os.replace(temp_out, output_path)
            success = True
            return output_path

        # 2. Extract first 5s of audio and convert to mono
        fps = 44100
        audio_segment = clip.audio.subclipped(0, min(5, clip.duration))
        audio_array = audio_segment.to_soundarray(fps=fps)

        if audio_array.ndim > 1:
            audio_mono = np.abs(audio_array).max(axis=1).astype(np.float64)
        else:
            audio_mono = np.abs(audio_array).astype(np.float64)

        # 3. Sliding Window Analysis (The "Deuncifier" Logic)
        # Use noise-relative detection: compare each window to the silence at the very start.
        window_size = int(0.08 * fps)  # 80ms windows for quicker onset
        step_size = int(0.01 * fps)    # 10ms steps

        def rms(arr):
            return np.sqrt(np.mean(arr**2))

        # Noise floor: RMS of first 0.2–0.3s (assumed silence before speech)
        noise_start = int(0.05 * fps)
        noise_end = int(0.25 * fps)
        noise_floor = rms(audio_mono[noise_start:noise_end])
        # Avoid zero division; use minimum floor
        noise_floor = max(noise_floor, 1e-8)

        # Speech = sustained energy at least 4x the noise floor (adaptive to recording level)
        ratio_threshold = 4.0
        # Absolute fallback for very quiet recordings (raw audio typically in [-1, 1])
        abs_threshold = 0.008

        cut_time = 0.0
        start_index = int(0.05 * fps)

        for i in range(start_index, len(audio_mono) - window_size, step_size):
            window = audio_mono[i : i + window_size]
            w_rms = rms(window)
            is_speech = w_rms > (ratio_threshold * noise_floor) and w_rms > abs_threshold
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

        # 4. Apply the Trim
        # Small buffer before cut to preserve first consonant
        final_start = max(0, cut_time - 0.05)
        logger.debug(
            "Trimming video from %.3fs. Original duration: %.3fs",
            final_start,
            clip.duration,
        )

        final_clip = clip.subclipped(final_start)

        # 5. Write file - use ultrafast on low-RAM servers (t2.micro); medium for local/high-RAM
        preset = os.environ.get("FFMPEG_PRESET", "ultrafast")  # ultrafast | medium | slow
        bitrate = os.environ.get("FFMPEG_BITRATE", "5M")       # lower = less RAM
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


MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
UPLOAD_CHUNK_SIZE = 1024 * 1024  # 1MB
ALLOWED_CONTENT_TYPES = {"video/mp4", "video/quicktime"}


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    temp_in_path = None
    temp_out_path = None
    try:
        if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type. Only MP4 and MOV are allowed.")
        filename = file.filename or "video.mp4"
        suffix = os.path.splitext(filename)[1]
        if not suffix:
            suffix = ".mov" if file.content_type == "video/quicktime" else ".mp4"
        temp_in = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_in_path = temp_in.name
        temp_out_fd, temp_out_path = tempfile.mkstemp(suffix=".mp4")
        os.close(temp_out_fd)
        total_size = 0
        try:
            while True:
                chunk = await file.read(UPLOAD_CHUNK_SIZE)
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > MAX_VIDEO_SIZE:
                    raise HTTPException(status_code=413, detail="File too large. Maximum 500MB.")
                temp_in.write(chunk)
        finally:
            temp_in.close()
            await file.close()
        loop = asyncio.get_running_loop()
        async with PROCESS_SEMAPHORE:
            output_path = await loop.run_in_executor(
                EXECUTOR, process_video_sync, temp_in_path, temp_out_path
            )
        return FileResponse(
            output_path,
            media_type="video/mp4",
            headers={"Content-Disposition": f'inline; filename="deuncified_{filename}"'},
            background=BackgroundTask(safe_unlink, output_path),
        )
    except HTTPException:
        safe_unlink(temp_in_path)
        safe_unlink(temp_out_path)
        raise
    except Exception:
        safe_unlink(temp_in_path)
        safe_unlink(temp_out_path)
        logger.error("Upload failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Video processing failed.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
