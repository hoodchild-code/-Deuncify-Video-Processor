import os
import tempfile
import shutil
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
from moviepy import VideoFileClip

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def cleanup_files(paths):
    for p in paths:
        if p and os.path.exists(p):
            try:
                os.unlink(p)
            except Exception as e:
                print(f"Cleanup error: {e}")


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    # 1. Setup temporary files
    suffix = os.path.splitext(file.filename)[1]
    temp_in = tempfile.mktemp(suffix=suffix)
    temp_out = tempfile.mktemp(suffix=".mp4")

    try:
        with open(temp_in, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        clip = VideoFileClip(temp_in)

        if not clip.audio:
            clip.close()
            return FileResponse(temp_in, filename=f"no_audio_{file.filename}")

        # 2. Extract first 5s of audio and convert to mono
        fps = 44100
        audio_segment = clip.audio.subclipped(0, min(5, clip.duration))
        audio_array = audio_segment.to_soundarray(fps=fps)

        if audio_array.ndim > 1:
            audio_mono = np.abs(audio_array).max(axis=1)
        else:
            audio_mono = np.abs(audio_array)

        # 3. Sliding Window Analysis (The "Deuncifier" Logic)
        # We look for 0.2s of sustained sound above threshold
        window_size = int(0.2 * fps)
        threshold = 0.03  # Roughly -30dB after normalization-ish

        # Normalize audio_mono to 1.0
        max_vol = np.max(audio_mono)
        if max_vol > 0:
            audio_mono = audio_mono / max_vol

        cut_time = 0.0
        # Start scanning after 0.1s to avoid button-click noise
        start_index = int(0.1 * fps)

        for i in range(start_index,
                       len(audio_mono) - window_size, int(0.05 * fps)):
            window = audio_mono[i:i + window_size]
            if np.mean(window) > threshold:
                cut_time = i / fps
                print(f"DEBUG: Sustained speech detected at {cut_time}s")
                break

        # 4. Apply the Trim
        # Add a tiny 0.05s buffer so we don't cut the first consonant
        final_start = max(0, cut_time - 0.05)
        print(
            f"DEBUG: Trimming video from {final_start}s. Original duration: {clip.duration}s"
        )

        final_clip = clip.subclipped(final_start)

        # 5. Write file with high-compatibility settings
        final_clip.write_videofile(temp_out,
                                   codec="libx264",
                                   audio_codec="aac",
                                   temp_audiofile=None,
                                   remove_temp=True,
                                   preset="ultrafast",
                                   logger=None)

        clip.close()
        final_clip.close()

        task = BackgroundTask(cleanup_files, [temp_in, temp_out])
        return FileResponse(temp_out,
                            media_type="video/mp4",
                            filename=f"deuncified_{file.filename}",
                            background=task)

    except Exception as e:
        cleanup_files([temp_in, temp_out])
        print(f"CRITICAL ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
