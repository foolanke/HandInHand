"""
Gemini API integration for ASL sign language evaluation.
No caching - sends full prompt on each request.
"""
import json
from google import genai
from pathlib import Path
from ..schemas.evaluation import EvaluationResponse

API_KEY = "AIzaSyCzXbX96SbDPZN-hz9UMBCRk6Vux9IBAEc"

# Initialize the client
client = genai.Client(api_key=API_KEY)

# Load global context from prompt.json
CONTEXT_PATH = Path(__file__).parent / "context" / "prompt.json"
with open(CONTEXT_PATH, 'r') as f:
    GLOBAL_CONTEXT = json.load(f)


def parse_gemini_json_response(response_text: str) -> EvaluationResponse:
    """
    Parse and validate the JSON response from Gemini.

    Handles common issues like markdown code blocks and validates
    the response against the EvaluationResponse schema.

    Args:
        response_text: Raw text response from Gemini API

    Returns:
        EvaluationResponse: Validated response object

    Raises:
        ValueError: If response cannot be parsed or doesn't match schema
        json.JSONDecodeError: If response is not valid JSON
    """
    # Clean up the response text
    text = response_text.strip()

    # Remove markdown code blocks if present
    if text.startswith('```json'):
        text = text.replace('```json', '').replace('```', '').strip()
    elif text.startswith('```'):
        text = text.replace('```', '').strip()

    # Parse JSON
    try:
        json_data = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON response: {e}\nResponse text: {text[:200]}...")

    # Validate against schema
    try:
        return EvaluationResponse(**json_data)
    except Exception as e:
        raise ValueError(f"Response validation failed: {e}\nJSON data: {json_data}")


def get_gemini_response(demonstrator_json: str, user_attempt_json: str) -> EvaluationResponse:
    """
    Receives 2 JSONs (demonstrator and user_attempt as JSON strings),
    sends them to Gemini with the global context prompt,
    and returns the validated evaluation response.

    Args:
        demonstrator_json: JSON string of the demonstrator's sign language performance
        user_attempt_json: JSON string of the user's sign language attempt

    Returns:
        EvaluationResponse: Validated evaluation response from Gemini

    Raises:
        Exception: If API call fails or response cannot be parsed/validated
    """
    try:
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

Please evaluate the user's attempt and return ONLY valid JSON with no markdown or extra text.
"""

        # Generate response using Gemini
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )

        # Parse and validate the response
        return parse_gemini_json_response(response.text)

    except Exception as e:
        print(f"Error in get_gemini_response: {e}")
        raise