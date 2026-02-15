from pydantic import BaseModel, Field
from typing import List


class ProsCons(BaseModel):
    """Pros or cons section with bullet points."""
    points: List[str]


class EvaluationResponse(BaseModel):
    """Schema for Gemini's sign language evaluation response."""
    overall_score_0_to_4: int = Field(..., ge=0, le=4)
    summary: str
    pros: ProsCons
    cons: ProsCons
