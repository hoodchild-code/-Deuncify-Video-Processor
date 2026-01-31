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
            threshold_db = -30.0
            
            if clip.audio:
                try:
                    audio_segment = clip.audio.subclipped(0, analysis_duration)
                except AttributeError:
                    audio_segment = clip.audio.subclip(0, analysis_duration)

                chunk = audio_segment.to_soundarray()
                
                if chunk is not None and len(chunk) > 0:
                    max_amps = np.max(np.abs(chunk), axis=1)
                    threshold_amp = 10 ** (threshold_db / 20)
                    indices = np.where(max_amps > threshold_amp)[0]
                    
                    if len(indices) > 0:
                        first_index = indices[0]
                        fps = audio_segment.fps
                        cut_time = first_index / fps
                        found_voice = True
            
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
