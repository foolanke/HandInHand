from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from schemas.response import Response

app = FastAPI(title="ASL Rating API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
=======

>>>>>>> 74c83b0581baf76ce0220e43cf5a3320caacd4aa
class RatingResponse(BaseModel):
    rating: float
    message: str



@app.post("/rating", response_model=Response)
async def get_rating(video: UploadFile = File(...)):
    """Get rating endpoint"""
    
    # Verify the file is a video
    if not video.content_type.startswith('video/'):
        return RatingResponse(
            rating=0.0,
            message=f"Invalid file type. Expected video, got {video.content_type}"
        )

    # Read video content
    video_content = await video.read()

    # TODO: Process the video and calculate rating
    # For now, return a placeholder response
    return RatingResponse(
        rating=0.0,
        message=f"Video received: {video.filename}, size: {len(video_content)} bytes"
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
