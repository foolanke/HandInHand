def load_reference_landmarks(word: str) -> str:
    """
    Load reference landmarks JSON for a given word.
    
    Args:
        word: The ASL word/sign name
        
    Returns:
        JSON string of reference landmarks
    """
    import json
    from pathlib import Path

    # Adjust path to your reference landmarks folder
    # Use absolute path based on this file's location
    services_dir = Path(__file__).parent
    reference_path = services_dir / "reference_landmarks" / f"{word}.json"
    
    if not reference_path.exists():
        raise FileNotFoundError(f"No reference landmarks found for '{word}'")
    
    with open(reference_path, 'r') as f:
        return json.dumps(json.load(f))