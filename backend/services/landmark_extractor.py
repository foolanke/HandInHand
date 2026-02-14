import cv2
import mediapipe as mp
import json
from pathlib import Path

mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands

def extract_landmarks_from_video(video_path, word):
    """
    Extract hand and face landmarks from a video
    Returns: dict with landmarks data
    """
    
    # Initialize MediaPipe
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # Open video
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise Exception(f"Could not open video file: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    landmarks_data = []
    frame_count = 0
    frames_with_hands = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Flip horizontally (mirror mode) - optional
        frame = cv2.flip(frame, 1)
        
        # Convert to RGB for MediaPipe
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results_hands = hands.process(rgb)
        results_face = face_mesh.process(rgb)
        
        # Prepare frame data
        frame_data = {
            'frame_number': frame_count,
            'hands': [],
            'face': None
        }
        
        # Extract hand landmarks
        if results_hands.multi_hand_landmarks:
            frames_with_hands += 1
            
            for hand_idx, hand_landmarks in enumerate(results_hands.multi_hand_landmarks):
                handedness = results_hands.multi_handedness[hand_idx].classification[0].label
                
                landmarks_list = []
                for lm in hand_landmarks.landmark:
                    landmarks_list.append({
                        'x': lm.x,
                        'y': lm.y,
                        'z': lm.z
                    })
                
                frame_data['hands'].append({
                    'handedness': handedness,
                    'landmarks': landmarks_list
                })
        
        # Extract face landmarks (optional)
        if results_face.multi_face_landmarks:
            face_landmarks_list = []
            for lm in results_face.multi_face_landmarks[0].landmark:
                face_landmarks_list.append({
                    'x': lm.x,
                    'y': lm.y,
                    'z': lm.z
                })
            frame_data['face'] = face_landmarks_list
        
        landmarks_data.append(frame_data)
        frame_count += 1
    
    cap.release()
    hands.close()
    face_mesh.close()
    
    if frames_with_hands == 0:
        raise Exception("No hands detected in any frame")
    
    # Return the data (don't save to file in service)
    return {
        'word': word,
        'total_frames': frame_count,
        'frames_with_hands': frames_with_hands,
        'fps': fps,
        'video_file': video_path,
        'frames': landmarks_data
    }