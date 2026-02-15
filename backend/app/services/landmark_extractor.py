import cv2
import mediapipe as mp
import json
from pathlib import Path
import os

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent
REFERENCE_VIDEOS_DIR = SCRIPT_DIR / 'reference_videos'
REFERENCE_LANDMARKS_DIR = SCRIPT_DIR / 'reference_landmarks'

mp_face_mesh = mp.solutions.face_mesh
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

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

def extract_landmarks_from_video(video_path, word, show_preview=True, face_sample_rate=10):
    """
    Extract hand landmarks (every frame) + face reference (sampled)
    
    Args:
        video_path: Path to the reference video file
        word: The ASL word being signed
        show_preview: If True, shows a preview window while processing
        face_sample_rate: Only save face every Nth frame (default: 10)
                         Hands are saved EVERY frame for fluid motion
    """
    
    print(f"\n{'='*60}")
    print(f"Extracting landmarks from: {video_path}")
    print(f"Word: {word}")
    print(f"Hand frames: ALL (fluid motion)")
    print(f"Face frames: Every {face_sample_rate} frames (reference only)")
    print(f"{'='*60}\n")
    
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
    cap = cv2.VideoCapture(str(video_path))
    
    if not cap.isOpened():
        print(f"❌ Error: Could not open video file: {video_path}")
        return None
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"📹 Video info:")
    print(f"   FPS: {fps}")
    print(f"   Total frames: {total_frames}")
    print(f"   Duration: {total_frames/fps:.2f} seconds")
    print(f"   Hand frames to save: {total_frames}")
    print(f"   Face frames to save: ~{total_frames // face_sample_rate}\n")
    
    landmarks_data = []
    frame_count = 0
    frames_with_hands = 0
    frames_with_face = 0
    
    print("Processing frames...")
    
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
                
                if show_preview:
                    mp_drawing.draw_landmarks(
                        frame,
                        hand_landmarks,
                        mp_hands.HAND_CONNECTIONS,
                        mp_drawing_styles.get_default_hand_landmarks_style(),
                        mp_drawing_styles.get_default_hand_connections_style()
                    )
        
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
        
        # Draw face on preview (even if not saving this frame)
        if show_preview and results_face.multi_face_landmarks:
            mp_drawing.draw_landmarks(
                image=frame,
                landmark_list=results_face.multi_face_landmarks[0],
                connections=mp_face_mesh.FACEMESH_CONTOURS,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style()
            )
        
        # Save ALL frames (even if no hands, to keep frame numbers consistent)
        landmarks_data.append(frame_data)
        frame_count += 1
        
        if frame_count % 30 == 0:
            print(f"  Processed {frame_count}/{total_frames} frames ({frame_count/total_frames*100:.1f}%)")
        
        if show_preview:
            cv2.putText(frame, f"Frame: {frame_count}/{total_frames}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, f"Hands: {frames_with_hands} | Face: {frames_with_face}", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            cv2.imshow("Processing Reference Video (Press Q to skip preview)", frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                show_preview = False
                cv2.destroyAllWindows()
    
    cap.release()
    hands.close()
    face_mesh.close()
    
    if show_preview:
        cv2.destroyAllWindows()
    
    print(f"\n✅ Processing complete!")
    print(f"   Total frames: {frame_count}")
    print(f"   Frames with hands: {frames_with_hands} ({frames_with_hands/frame_count*100:.1f}%)")
    print(f"   Frames with face data: {frames_with_face}")
    
    if frames_with_hands == 0:
        print(f"\n⚠️ WARNING: No hands detected!")
        return None
    
    # Save JSON
    output_data = {
        'word': word,
        'total_frames': frame_count,
        'frames_with_hands': frames_with_hands,
        'frames_with_face': frames_with_face,
        'face_sample_rate': face_sample_rate,
        'fps': fps,
        'face_key_points_info': list(FACE_KEY_POINTS.keys()),
        'video_file': str(video_path),
        'frames': landmarks_data
    }
    
    REFERENCE_LANDMARKS_DIR.mkdir(exist_ok=True)
    output_path = REFERENCE_LANDMARKS_DIR / f'{word}.json'
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n💾 Saved landmarks to: {output_path}")
    print(f"📊 File size: {output_path.stat().st_size / 1024:.1f} KB")
    
    return str(output_path)


def extract_multiple_videos(video_folder=None, face_sample_rate=10):
    """Extract landmarks from all videos in a folder"""
    
    if video_folder is None:
        video_folder = REFERENCE_VIDEOS_DIR
    else:
        video_folder = Path(video_folder)
    
    if not video_folder.exists():
        print(f"❌ Folder not found: {video_folder}")
        return
    
    video_files = list(video_folder.glob('*.mp4')) + list(video_folder.glob('*.avi')) + list(video_folder.glob('*.mov'))
    
    if not video_files:
        print(f"❌ No video files found in {video_folder}")
        return
    
    print(f"\n📁 Found {len(video_files)} video(s) in {video_folder}")
    
    for video_path in video_files:
        word = video_path.stem
        
        print(f"\n{'='*60}")
        print(f"Processing: {video_path.name}")
        print(f"{'='*60}")
        
        extract_landmarks_from_video(str(video_path), word, show_preview=True, face_sample_rate=face_sample_rate)
        
        print(f"\n✅ Completed: {word}")
    
    print(f"\n{'='*60}")
    print(f"🎉 All videos processed!")
    print(f"{'='*60}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🎬 REFERENCE VIDEO LANDMARK EXTRACTOR")
    print("="*60)
    print("\nExtracts:")
    print("  - Hand landmarks: EVERY frame (fluid motion)")
    print("  - Face reference: Sampled (8 points, every 10th frame)\n")
    
    if not REFERENCE_VIDEOS_DIR.exists():
        print(f"❌ Creating reference_videos folder at: {REFERENCE_VIDEOS_DIR}")
        REFERENCE_VIDEOS_DIR.mkdir(exist_ok=True)
        print(f"   Please add your reference videos to this folder and run again.")
        exit()
    
    # OPTION 1: Extract from a single video
    video_path = REFERENCE_VIDEOS_DIR / 'please.mp4'
    if video_path.exists():
        # face_sample_rate=10 means save face every 10th frame
        # Hands are saved EVERY frame
        extract_landmarks_from_video(str(video_path), 'please', show_preview=True, face_sample_rate=10)
    else:
        print(f"❌ Video not found: {video_path}")
        print(f"\n   Add 'please.mp4' to {REFERENCE_VIDEOS_DIR}")
        print(f"   Or uncomment OPTION 2 below to process all videos\n")
    
    # OPTION 2: Extract from all videos
    # extract_multiple_videos(face_sample_rate=10)
    
    print("\n✅ Done! Your reference landmarks are ready.")
    print(f"   Saved to: {REFERENCE_LANDMARKS_DIR}\n")