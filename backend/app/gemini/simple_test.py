#!/usr/bin/env python3
"""
Simple test script for Gemini API - no pytest required.
Loads test files, calls API, and saves output to JSON.
"""
import json
import sys
from pathlib import Path
from datetime import datetime

# Add backend directory to path
backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.gemini.getresponse import get_gemini_response


def main():
    print("=" * 80)
    print("GEMINI API SIMPLE TEST")
    print("=" * 80)
    print()

    # Paths to test files
    test_files_dir = Path(__file__).parent / "test_files"
    example_file = test_files_dir / "example" / "greeting.json"
    attempt_file = test_files_dir / "attempt" / "greeting_attempt.json"

    # Output file with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = test_files_dir / f"output_{timestamp}.json"

    # Load test files
    print("📂 Loading test files...")
    with open(example_file, 'r') as f:
        example_json = f.read()
    with open(attempt_file, 'r') as f:
        attempt_json = f.read()

    print(f"   ✓ Loaded: {example_file.name}")
    print(f"   ✓ Loaded: {attempt_file.name}")
    print()

    # Call Gemini API
    print("🤖 Calling Gemini API...")
    print("   Model: gemini-2.5-flash")
    print("   (This may take 10-30 seconds)")
    print()

    try:
        result = get_gemini_response(example_json, attempt_json)

        # Display results
        print("=" * 80)
        print("✅ SUCCESS - Evaluation Complete")
        print("=" * 80)
        print()

        print(f"📊 Overall Score: {result.overall_score_0_to_4}/4")
        print()

        print("📝 Summary:")
        print(f"   {result.summary}")
        print()

        print("👍 Pros:")
        for i, point in enumerate(result.pros.points, 1):
            print(f"   {i}. {point}")
        print()

        print("👎 Cons:")
        for i, point in enumerate(result.cons.points, 1):
            print(f"   {i}. {point}")
        print()

        # Save to JSON file
        output_data = {
            "timestamp": timestamp,
            "model": "gemini-2.5-flash",
            "input": {
                "example_file": str(example_file.name),
                "attempt_file": str(attempt_file.name)
            },
            "result": {
                "overall_score_0_to_4": result.overall_score_0_to_4,
                "summary": result.summary,
                "pros": {"points": result.pros.points},
                "cons": {"points": result.cons.points}
            }
        }

        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2)

        print("=" * 80)
        print("💾 Output saved to:")
        print(f"   {output_file}")
        print("=" * 80)
        print()
        print("✨ Test completed successfully!")
        print()

    except Exception as e:
        print()
        print("=" * 80)
        print("❌ ERROR")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        print()
        print("Common issues:")
        print("  - API quota exhausted (wait 60 seconds)")
        print("  - Invalid API key")
        print("  - No internet connection")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()