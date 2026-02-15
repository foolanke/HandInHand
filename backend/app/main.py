from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from .schemas.evaluation import EvaluationResponse
from .services.video_convert import convert_video_to_json
from .services.landmark_load import load_reference_landmarks
from .gemini.getresponse import get_gemini_response

app = FastAPI(title="ASL Rating API")

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})

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



@app.post("/api/evaluate-sign")
async def evaluate_sign(word: str, video: UploadFile = File(...)):
    """
    Evaluate a user's sign recording against the reference.
    Accepts video/webm (browser recordings) in addition to video/mp4.
    Returns the evaluation wrapped as { word, evaluation: { ... } }.
    """
    CONTENT_TYPE_TO_SUFFIX = {
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "video/x-matroska": ".mkv",
    }
    mime = (video.content_type or "").split(";")[0].strip().lower()
    if mime not in CONTENT_TYPE_TO_SUFFIX:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid video type: {video.content_type}. Allowed: mp4, webm."
        )
    file_suffix = CONTENT_TYPE_TO_SUFFIX[mime]

    video_content = await video.read()

    MAX_FILE_SIZE = 50 * 1024 * 1024
    if len(video_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Video file too large. Maximum size: 50MB")
    if len(video_content) == 0:
        raise HTTPException(status_code=400, detail="Video file is empty")

    try:
        attempt_landmarks = convert_video_to_json(word, video_content, suffix=file_suffix)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Video processing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process video: {str(e)}")

    try:
        reference_landmarks = load_reference_landmarks(word)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"No reference found for word '{word}'.")

    try:
        evaluation = get_gemini_response(
            demonstrator_json=reference_landmarks,
            user_attempt_json=attempt_landmarks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI evaluation failed: {str(e)}")

    return {"word": word, "evaluation": evaluation}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
