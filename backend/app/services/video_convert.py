import cv2
import mediapipe as mp
import json
import tempfile
import os

mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands

# Key face landmarks for reference (8 points instead of 478)
FACE_KEY_POINTS = {
    'nose_tip': 1,
    'forehead': 10,
    'chin': 152,
    'left_eye': 33,
    'right_eye': 263,
    'left_ear': 234,
    'right_ear': 454,
    'mouth_center': 13
}


def convert_video_to_json(word: str, video: bytes) -> str:
    """
    Convert video to JSON landmark string.

    Args:
        word: The ASL word being signed
        video: Video file content as bytes

    Returns:
        JSON string containing landmark data
    """
    # Write video bytes to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        temp_file.write(video)
        temp_path = temp_file.name

    try:
        # Extract landmarks using the same logic as landmark_extractor
        landmarks_json = _extract_landmarks(temp_path, word, face_sample_rate=10)
        return landmarks_json
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)


def _extract_landmarks(video_path: str, word: str, face_sample_rate: int = 10) -> str:
    """
    Extract hand landmarks (every frame) + face reference (sampled).
    Same logic as landmark_extractor.py but returns JSON string instead of saving to file.
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
        raise ValueError(f"Could not open video file")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    landmarks_data = []
    frame_count = 0
    frames_with_hands = 0
    frames_with_face = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results_hands = hands.process(rgb)
        results_face = face_mesh.process(rgb)

        # Save EVERY frame for hands
        frame_data = {
            'frame_number': frame_count,
            'hands': [],
            'face_reference': None  # Only populated every Nth frame
        }

        # Extract hand landmarks - EVERY FRAME
        if results_hands.multi_hand_landmarks:
            frames_with_hands += 1

            for hand_idx, hand_landmarks in enumerate(results_hands.multi_hand_landmarks):
                handedness = results_hands.multi_handedness[hand_idx].classification[0].label

                landmarks_list = []
                for lm in hand_landmarks.landmark:
                    landmarks_list.append({
                        'x': round(lm.x, 4),
                        'y': round(lm.y, 4),
                        'z': round(lm.z, 4)
                    })

                frame_data['hands'].append({
                    'handedness': handedness,
                    'landmarks': landmarks_list
                })

        # Extract face landmarks - ONLY EVERY Nth FRAME
        if frame_count % face_sample_rate == 0:
            if results_face.multi_face_landmarks:
                frames_with_face += 1
                face_landmarks = results_face.multi_face_landmarks[0].landmark

                face_key_points = {}
                for name, idx in FACE_KEY_POINTS.items():
                    lm = face_landmarks[idx]
                    face_key_points[name] = {
                        'x': round(lm.x, 4),
                        'y': round(lm.y, 4),
                        'z': round(lm.z, 4)
                    }

                frame_data['face_reference'] = face_key_points

        # Save ALL frames (even if no hands, to keep frame numbers consistent)
        landmarks_data.append(frame_data)
        frame_count += 1

    cap.release()
    hands.close()
    face_mesh.close()

    if frames_with_hands == 0:
        raise ValueError("No hands detected in video")

    # Build output data
    output_data = {
        'word': word,
        'total_frames': frame_count,
        'frames_with_hands': frames_with_hands,
        'frames_with_face': frames_with_face,
        'face_sample_rate': face_sample_rate,
        'fps': fps,
        'face_key_points_info': list(FACE_KEY_POINTS.keys()),
        'frames': landmarks_data
    }

    return json.dumps(output_data, indent=2)