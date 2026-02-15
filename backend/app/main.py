from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .schemas.evaluation import EvaluationResponse
from .services.video_convert import convert_video_to_json
from .services.landmark_load import load_reference_landmarks
from .gemini.getresponse import get_gemini_response 

app = FastAPI(title="ASL Rating API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.post("/rating", response_model=EvaluationResponse)
async def get_rating(word: str, video: UploadFile = File(...)):
    """
    Get ASL sign evaluation for a user's video attempt.

    Returns:
        EvaluationResponse: AI evaluation with score (0-4), summary, pros, and cons

    Raises:
        HTTPException 400: Invalid file type, size, or video processing error
        HTTPException 404: Reference landmarks not found for the word
        HTTPException 500: Internal server error
    """
    # Validate file type
    ALLOWED_VIDEO_TYPES = ["video/mp4"]
    if video.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid video type: {video.content_type}. Only MP4 files are allowed."
        )

    # Read video content
    video_content = await video.read()

    # Validate file size (max 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
    if len(video_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Video file too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Validate file is not empty
    if len(video_content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Video file is empty"
        )

    try:
        # Extract landmarks from user's video
        attempt_landmarks = convert_video_to_json(word, video_content)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Video processing error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process video: {str(e)}"
        )

    try:
        # Load reference landmarks
        reference_landmarks = load_reference_landmarks(word)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"No reference found for word '{word}'. Available words: hello, goodbye, please, sorry, thankyou, greeting, parents"
        )

    try:
        # Get evaluation from Gemini API
        evaluation = get_gemini_response(
            demonstrator_json=reference_landmarks,
            user_attempt_json=attempt_landmarks
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI evaluation failed: {str(e)}"
        )

    return evaluation



@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
