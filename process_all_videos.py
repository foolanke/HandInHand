#!/usr/bin/env python3
"""
Process all reference videos and extract landmarks
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

from app.services.landmark_extractor import extract_multiple_videos

if __name__ == "__main__":
    print("\n🎬 Processing all reference videos...")
    print("This will extract landmarks from every video in reference_videos/")
    print("and save them as JSON files in reference_landmarks/\n")

    # Process all videos with face sampling every 10 frames
    extract_multiple_videos(face_sample_rate=10)

    print("\n✅ All done!")
