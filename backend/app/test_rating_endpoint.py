"""
Simple test file for the rating endpoint.
Reads existing MP4 files and outputs the JSON response.
"""
import asyncio
import json
import sys
from pathlib import Path

# Add the app directory to Python path for imports
app_dir = Path(__file__).parent
if str(app_dir) not in sys.path:
    sys.path.insert(0, str(app_dir))

from services.video_convert import convert_video_to_json
from services.landmark_load import load_reference_landmarks
from gemini.getresponse import get_gemini_response


async def test_rating_with_video(word: str, video_path: str, output_path: str):
    """
    Test the rating endpoint logic with a video file.

    Args:
        word: The ASL word being signed
        video_path: Path to the MP4 file
        output_path: Path to save the JSON output
    """
    print(f"\n{'='*60}")
    print(f"Testing word: {word}")
    print(f"Video: {video_path}")
    print(f"{'='*60}\n")

    # Read video file
    with open(video_path, 'rb') as f:
        video_content = f.read()

    print(f"✓ Video loaded ({len(video_content)} bytes)")

    # Extract landmarks from user's video
    print("→ Extracting landmarks from video...")
    attempt_landmarks = convert_video_to_json(word, video_content)
    print("✓ User landmarks extracted")

    # Load reference landmarks
    print("→ Loading reference landmarks...")
    reference_landmarks = load_reference_landmarks(word)
    print("✓ Reference landmarks loaded")

    # Get evaluation from Gemini API
    print("→ Calling Gemini API for evaluation...")
    evaluation = get_gemini_response(
        demonstrator_json=reference_landmarks,
        user_attempt_json=attempt_landmarks
    )
    print("✓ Gemini evaluation received")

    # Convert to dict for JSON output
    result = {
        "word": word,
        "video_path": video_path,
        "evaluation": {
            "overall_score_0_to_4": evaluation.overall_score_0_to_4,
            "summary": evaluation.summary,
            "pros": {
                "points": evaluation.pros.points
            },
            "cons": {
                "points": evaluation.cons.points
            }
        }
    }

    # Save to JSON file
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\n{'='*60}")
    print(f"✓ Results saved to: {output_path}")
    print(f"Score: {evaluation.overall_score_0_to_4}/4")
    print(f"Summary: {evaluation.summary}")
    print(f"{'='*60}\n")

    return result


async def main():
    """Run tests on available videos."""

    # Base paths
    video_dir = Path("services/reference_videos")
    output_dir = Path("test_outputs")
    output_dir.mkdir(exist_ok=True)

    # Test cases: (word, video_file)
    test_cases = [
        ("hello", "hello.mp4"),
        ("goodbye", "goodbye.mp4"),
        ("please", "please.mp4"),
    ]

    results = []

    for word, video_file in test_cases:
        video_path = video_dir / video_file

        if not video_path.exists():
            print(f"⚠ Skipping {word} - video not found at {video_path}")
            continue

        output_path = output_dir / f"{word}_result.json"

        try:
            result = await test_rating_with_video(
                word=word,
                video_path=str(video_path),
                output_path=str(output_path)
            )
            results.append(result)
        except Exception as e:
            print(f"✗ Error testing {word}: {e}")
            import traceback
            traceback.print_exc()

    # Save summary
    summary_path = output_dir / "test_summary.json"
    with open(summary_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n{'='*60}")
    print(f"All tests complete! Summary saved to: {summary_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
