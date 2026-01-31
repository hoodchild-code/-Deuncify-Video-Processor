import os
import tempfile
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
from moviepy import VideoFileClip
import numpy as np

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://0.0.0.0:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def cleanup_files(paths):
    """Cleanup temporary files after response is sent."""
    for p in paths:
        if p and os.path.exists(p):
            try:
                os.unlink(p)
            except Exception as e:
                print(f"Error cleaning up {p}: {e}")

# IMPORTANT: The Node.js proxy strips the '/api' prefix when forwarding requests.
# So we define routes relative to the root of the Python app.
# e.g. Node receives /api/health -> forwards /health to Python.

@app.get("/")
async def root():
    return {"message": "Deuncify Backend Running"}

@app.get("/health")
async def health_check():
    return {"status": "Deuncify API is live"}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.mp4', '.mov')):
        raise HTTPException(status_code=400, detail="Invalid file format. Only MP4 and MOV are supported.")

    # Create temp files
    temp_input_fd, temp_input_path = tempfile.mkstemp(suffix=os.path.splitext(file.filename)[1])
    temp_output_fd, temp_output_path = tempfile.mkstemp(suffix=".mp4")
    
    os.close(temp_input_fd)
    os.close(temp_output_fd)

    try:
        # Save uploaded file
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process video
        try:
            clip = VideoFileClip(temp_input_path)
            
            # Analyze first 5 seconds
            analysis_duration = min(5, clip.duration)
            
            cut_time = 0.0
            found_voice = False
            threshold_db = -45.0  # Lowered threshold for sensitivity
            
            if clip.audio:
                try:
                    audio_segment = clip.audio.subclipped(0, analysis_duration)
                except AttributeError:
                    audio_segment = clip.audio.subclip(0, analysis_duration)

                # Get audio as array (N, n_channels)
                audio_array = audio_segment.to_soundarray()
                
                if audio_array is not None and len(audio_array) > 0:
                    # Convert to mono if stereo by taking max absolute value across channels
                    if audio_array.ndim > 1:
                        audio_mono = np.max(np.abs(audio_array), axis=1)
                    else:
                        audio_mono = np.abs(audio_array)

                    # Normalize
                    max_val = np.max(audio_mono)
                    if max_val > 0:
                        audio_mono = audio_mono / max_val
                        print(f"Audio normalized. Max value was: {max_val}")
                    else:
                        print("Audio is purely silent.")

                    # Calculate threshold amplitude
                    threshold_amp = 10 ** (threshold_db / 20)
                    print(f"Threshold dB: {threshold_db}, Threshold Amp: {threshold_amp:.6f}")

                    # Chunk analysis
                    fps = audio_segment.fps
                    chunk_duration = 0.05
                    chunk_size = int(chunk_duration * fps)
                    
                    total_samples = len(audio_mono)
                    
                    for i in range(0, total_samples, chunk_size):
                        chunk = audio_mono[i:i + chunk_size]
                        if len(chunk) == 0:
                            break
                            
                        chunk_max = np.max(chunk)
                        
                        if chunk_max > threshold_amp:
                            current_time = i / fps
                            cut_time = current_time
                            found_voice = True
                            print(f"Voice detected! Time: {current_time:.3f}s, Max Amp: {chunk_max:.6f} > {threshold_amp:.6f}")
                            break
                        elif chunk_max > threshold_amp * 0.1:
                             current_time = i / fps
                             print(f"Time: {current_time:.3f}s, Max Amp: {chunk_max:.6f} (Threshold: {threshold_amp:.6f})")

            if found_voice:
                start_time = max(0, cut_time - 0.1)
                print(f"Voice detected at {cut_time:.3f}s. Trimming from {start_time:.3f}s.")
                try:
                    final_clip = clip.subclipped(start_time)
                except AttributeError:
                    final_clip = clip.subclip(start_time)
            else:
                print("No voice detected above threshold. Returning original.")
                final_clip = clip

            # Write output
            final_clip.write_videofile(
                temp_output_path, 
                codec="libx264", 
                audio_codec="aac", 
                temp_audiofile=None, 
                remove_temp=True, 
                preset="ultrafast",
                logger=None
            )
            
            final_clip.close()
            clip.close()
            
        except Exception as e:
            print(f"Processing error: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

        cleanup_task = BackgroundTask(cleanup_files, [temp_input_path, temp_output_path])
        
        return FileResponse(
            temp_output_path, 
            media_type="video/mp4", 
            filename=f"processed_{file.filename}",
            background=cleanup_task
        )
        
    except Exception as e:
        cleanup_files([temp_input_path, temp_output_path])
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
