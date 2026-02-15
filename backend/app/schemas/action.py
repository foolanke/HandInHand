# Data Type for an Action (Landmarks)
from pydantic import BaseModel

class Action(BaseModel):
    word: str
    # how to add video