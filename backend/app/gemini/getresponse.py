"""
Gemini API integration for ASL sign language evaluation.
No caching - sends full prompt on each request.
"""
import json
import os
from pathlib import Path
from typing import Optional

from google import genai

from ..schemas.evaluation import EvaluationResponse


# IMPORTANT: Don't hardcode API keys in code (and never commit them).
# Set in your shell: export GEMINI_API_KEY="..."
API_KEY = os.getenv("GEMINI_API_KEY", "")
if not API_KEY:
    # You can still run in dev if you want, but it will fail fast with a clear message.
    # Remove this check if you prefer silent failure.
    raise RuntimeError("Missing GEMINI_API_KEY env var. Set it before running the backend.")

# Initialize the client
client = genai.Client(api_key=API_KEY)

# Load global context from prompt.json
CONTEXT_PATH = Path(__file__).parent / "context" / "prompt.json"
with open(CONTEXT_PATH, "r") as f:
    GLOBAL_CONTEXT = json.load(f)


def _strip_code_fences(text: str) -> str:
    """Remove ```json / ``` wrappers if Gemini returns markdown."""
    t = (text or "").strip()
    if t.startswith("```"):
        t = t.replace("```json", "").replace("```", "").strip()
    return t


def _extract_largest_json_object(text: str) -> Optional[str]:
    """
    Extract the biggest {...} block from a string.
    This handles Gemini returning: 'Here is the JSON: {...} additional text'
    """
    t = _strip_code_fences(text)

    start = t.find("{")
    end = t.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    return t[start : end + 1]


def _fallback_response(word: str, reason: str, raw: str) -> EvaluationResponse:
    """Always return a valid schema object so the API never 500s on parse problems."""
    data = {
        "word": word or "unknown",
        "video_path": "",
        "evaluation": {
            "overall_score_0_to_4": 0,
            "summary": "We couldn’t read the AI feedback this time. Please retry.",
            "pros": {"points": ["Recording received."]},
            "cons": {"points": [reason]},
        },
        # Keep raw short so you don't blow up responses/logs
        "raw_model_output": (raw or "")[:1500],
    }
    return EvaluationResponse(**data)


def parse_gemini_json_response(response_text: str, *, word_hint: str = "") -> EvaluationResponse:
    """
    Parse and validate the JSON response from Gemini.

    - Strips markdown fences
    - Extracts JSON object even if extra text exists
    - If parsing fails, returns a fallback (NO 500)
    """
    raw = response_text or ""
    candidate = _extract_largest_json_object(raw)

    if candidate is None:
        return _fallback_response(
            word_hint,
            "Gemini response contained no JSON object.",
            raw,
        )

    # Parse JSON
    try:
        json_data = json.loads(candidate)
    except Exception as e:
        return _fallback_response(
            word_hint,
            f"Failed to parse Gemini JSON: {e}",
            raw,
        )

    # Validate against schema
    try:
        # Ensure word exists (sometimes Gemini might omit it)
        if isinstance(json_data, dict) and "word" not in json_data and word_hint:
            json_data["word"] = word_hint
        return EvaluationResponse(**json_data)
    except Exception as e:
        return _fallback_response(
            word_hint,
            f"Response validation failed: {e}",
            raw,
        )


def get_gemini_response(demonstrator_json: str, user_attempt_json: str) -> EvaluationResponse:
    """
    Receives 2 JSONs (demonstrator and user_attempt as JSON strings),
    sends them to Gemini with the global context prompt,
    and returns a validated evaluation response.

    IMPORTANT: This function should never raise due to Gemini formatting.
    It returns a fallback EvaluationResponse instead.
    """
    # Try to pull the word out of the user attempt JSON for better fallbacks
    word_hint = ""
    try:
        attempt_obj = json.loads(user_attempt_json)
        if isinstance(attempt_obj, dict):
            word_hint = str(attempt_obj.get("word", "")).strip()
    except Exception:
        pass

    # Build the full prompt with system instruction and data
    system_instruction = f"""
{GLOBAL_CONTEXT['task']}

CONTEXT:
- Domain: {GLOBAL_CONTEXT['context']['domain']}
- Description: {GLOBAL_CONTEXT['context']['description']}
- Data Type: {GLOBAL_CONTEXT['context']['data_type']}

INPUT CONTRACT:
- Demonstrator Key: {GLOBAL_CONTEXT['input_contract']['demonstrator_key']}
- User Attempt Key: {GLOBAL_CONTEXT['input_contract']['user_attempt_key']}
- Alignment: {GLOBAL_CONTEXT['input_contract']['alignment']}

JUDGING RULES:
- Primary Principle: {GLOBAL_CONTEXT['judging_rules']['primary_principle']}
- Limitations: {', '.join(GLOBAL_CONTEXT['judging_rules']['limitations'])}

JUDGING RUBRIC:
{json.dumps(GLOBAL_CONTEXT['judging_rubric'], indent=2)}

OUTPUT REQUIREMENTS:
{json.dumps(GLOBAL_CONTEXT['output_format'], indent=2)}
"""

    prompt = f"""
{system_instruction}

DATA TO EVALUATE:

Demonstrator (correct execution):
{demonstrator_json}

User Attempt (to be evaluated):
{user_attempt_json}

Return ONLY a single JSON object. No markdown. No extra text.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return parse_gemini_json_response(response.text, word_hint=word_hint)

    except Exception as e:
        # Never raise up to FastAPI; return fallback so frontend can show Retry UI nicely
        return _fallback_response(
            word_hint,
            f"Gemini API call failed: {e}",
            "",
        )