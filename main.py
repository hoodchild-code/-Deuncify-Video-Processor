import os
import asyncio
import tempfile
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from moviepy import VideoFileClip

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


def process_video_sync(content: bytes, filename: str) -> bytes:
    """Runs in thread pool - MoviePy blocks the event loop otherwise."""
    suffix = os.path.splitext(filename)[1]
    temp_in = tempfile.mktemp(suffix=suffix)
    temp_out = tempfile.mktemp(suffix=".mp4")
    try:
        with open(temp_in, "wb") as f:
            f.write(content)

        clip = VideoFileClip(temp_in)

        if not clip.audio:
            clip.close()
            with open(temp_in, "rb") as f:
                out = f.read()
            os.unlink(temp_in)
            return out

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
                print(f"DEBUG: Speech onset at {cut_time:.3f}s (RMS={w_rms:.5f}, noise_floor={noise_floor:.5f}, ratio={w_rms/noise_floor:.1f}x)")
                break

        if cut_time == 0:
            print(f"DEBUG: No speech detected (noise_floor={noise_floor:.5f}); keeping video from start")

        # 4. Apply the Trim
        # Small buffer before cut to preserve first consonant
        final_start = max(0, cut_time - 0.05)
        print(
            f"DEBUG: Trimming video from {final_start}s. Original duration: {clip.duration}s"
        )

        final_clip = clip.subclipped(final_start)

        # 5. Write file with balanced quality (medium preset + explicit bitrate)
        final_clip.write_videofile(
            temp_out,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile=None,
            remove_temp=True,
            preset="medium",
            bitrate="8M",
            audio_bitrate="192k",
            logger=None,
        )

        clip.close()
        final_clip.close()

        with open(temp_out, "rb") as f:
            result = f.read()
        os.unlink(temp_in)
        os.unlink(temp_out)
        return result

    except Exception as e:
        for p in [temp_in, temp_out]:
            if os.path.exists(p):
                try:
                    os.unlink(p)
                except Exception:
                    pass
        print(f"CRITICAL ERROR: {e}")
        raise


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    try:
        content = await file.read()
        loop = asyncio.get_running_loop()
        output_bytes = await loop.run_in_executor(
            None, process_video_sync, content, file.filename or "video.mp4"
        )
        return Response(
            content=output_bytes,
            media_type="video/mp4",
            headers={"Content-Disposition": f'inline; filename="deuncified_{file.filename or "video.mp4"}"'},
        )
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
