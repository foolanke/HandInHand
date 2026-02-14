from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from services.landmark_extractor import extract_landmarks_from_video
import os
from pathlib import Path
import json

asl_bp = Blueprint('asl', __name__)

UPLOAD_FOLDER = 'uploads'
REFERENCE_LANDMARKS_FOLDER = 'reference_landmarks'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm'}

Path(UPLOAD_FOLDER).mkdir(exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@asl_bp.route('/process-user-video', methods=['POST'])
def process_user_video():
    """
    1. Receive user video from frontend
    2. Extract landmarks from user video
    3. Load reference landmarks
    4. Return both for comparison
    """
    
    # Check if video file is present
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    word = request.form.get('word', 'unknown')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Allowed: mp4, avi, mov, webm'}), 400
    
    # Save uploaded video
    filename = secure_filename(f"user_{word}_{file.filename}")
    user_video_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(user_video_path)
    
    try:
        # Extract landmarks from user video
        print(f"Extracting landmarks from user video: {user_video_path}")
        user_landmarks = extract_landmarks_from_video(user_video_path, word)
        
        # Load reference landmarks
        reference_path = os.path.join(REFERENCE_LANDMARKS_FOLDER, f'{word}.json')
        
        if not os.path.exists(reference_path):
            # Clean up uploaded file
            os.remove(user_video_path)
            return jsonify({
                'error': f'No reference landmarks found for word: {word}',
                'available_words': get_available_words()
            }), 404
        
        with open(reference_path, 'r') as f:
            reference_landmarks = json.load(f)
        
        # Optional: Delete uploaded video after processing
        # os.remove(user_video_path)
        
        return jsonify({
            'success': True,
            'user_landmarks': user_landmarks,
            'reference_landmarks': reference_landmarks,
            'word': word
        }), 200
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(user_video_path):
            os.remove(user_video_path)
        
        return jsonify({'error': str(e)}), 500


@asl_bp.route('/available-words', methods=['GET'])
def get_available_words_route():
    """Get list of words that have reference videos"""
    words = get_available_words()
    return jsonify({'words': words}), 200


def get_available_words():
    """Helper function to get available reference words"""
    reference_files = Path(REFERENCE_LANDMARKS_FOLDER).glob('*.json')
    return [f.stem for f in reference_files]


@asl_bp.route('/compare-with-gemini', methods=['POST'])
def compare_with_gemini():
    """
    Optional: Integrate Gemini API for comparison
    Receives both landmarks and sends to Gemini
    """
    import google.generativeai as genai
    
    data = request.get_json()
    user_landmarks = data.get('user_landmarks')
    reference_landmarks = data.get('reference_landmarks')
    word = data.get('word')
    
    if not all([user_landmarks, reference_landmarks, word]):
        return jsonify({'error': 'Missing required data'}), 400
    
    # Configure Gemini (put your API key in environment variable)
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return jsonify({'error': 'Gemini API key not configured'}), 500
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    
    # Create prompt
    prompt = f"""
You are an expert ASL instructor. Compare these two ASL sign attempts for "{word}":

REFERENCE (correct):
- Total frames: {reference_landmarks['total_frames']}
- Frames with hands: {reference_landmarks['frames_with_hands']}

USER ATTEMPT:
- Total frames: {user_landmarks['total_frames']}
- Frames with hands: {user_landmarks['frames_with_hands']}

Analyze and provide feedback in JSON format:
{{
    "accuracy_score": <0-100>,
    "overall_assessment": "...",
    "what_went_well": "...",
    "needs_improvement": "...",
    "hand_shape_feedback": "...",
    "movement_feedback": "...",
    "tips": "..."
}}
"""
    
    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Clean up markdown
        if '```' in result_text:
            parts = result_text.split('```')
            for part in parts:
                if 'json' in part.lower() or part.strip().startswith('{'):
                    result_text = part.replace('json', '').replace('JSON', '').strip()
                    break
        
        result = json.loads(result_text)
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Gemini API error: {str(e)}'}), 500