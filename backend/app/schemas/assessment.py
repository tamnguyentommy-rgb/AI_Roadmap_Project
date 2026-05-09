from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionOut(BaseModel):
    id: int
    content: str
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    topic_id: Optional[int] = None

    class Config:
        from_attributes = True

class TestOut(BaseModel):
    test_id: int
    questions: List[QuestionOut]

class AnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str = Field(..., pattern="^[ABCD]$")

class TestSubmit(BaseModel):
    test_id: int
    answers: List[AnswerSubmit]
    week: Optional[int] = None
    topic_name: Optional[str] = None
    is_mini_test: bool = False

class AnswerResult(BaseModel):
    question_id: int
    selected_answer: str
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None

class TestResult(BaseModel):
    test_id: int
    total_questions: int
    correct_count: int
    score: float
    results: List[AnswerResult]
    weak_topics: List[str] = []
    overlap_with_prev_week: List[str] = []
    chronic_weak_topics: List[str] = []
