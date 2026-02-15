"""
Quick test script for video_convert.py
"""
from video_convert import convert_video_to_json


VIDEO_PATH = "/Users/paulfomitchev/Documents/Coding/ctrl-hack-del/Douling-for-ASL/backend/app/services/reference_videos/greeting.mp4"
WORD = "greeting"  

def test_video_conversion():
    """Test converting a video to landmark JSON"""

    print(f"Reading video from: {VIDEO_PATH}")

    # Read video file as bytes
    with open(VIDEO_PATH, 'rb') as f:
        video_bytes = f.read()

    print(f"Video size: {len(video_bytes)} bytes")
    print(f"Processing video for word: '{WORD}'")

    # Convert video to JSON string
    landmarks_json = convert_video_to_json(WORD, video_bytes)

    # Save to file
    output_path = f"{WORD}_landmarks.json"
    with open(output_path, 'w') as f:
        f.write(landmarks_json)

    print(f"✅ Successfully saved landmarks to: {output_path}")
    print(f"File size: {len(landmarks_json)} bytes")


if __name__ == "__main__":
    test_video_conversion()