from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Literal, Optional
from sqlalchemy.orm import Session
from app.services.llm_service import llm_service
from app.db.session import get_db
from app.models.assessment import Question, Test, UserAnswer
from app.models.curriculum import Topic
from app.models.progress import UserMastery, WeeklyProgress
from collections import defaultdict

router = APIRouter(redirect_slashes=False)


class HistoryTurn(BaseModel):
    role: Literal["user", "bot"]
    text: str


class ChatRequest(BaseModel):
    message: str
    user_context: dict = {}
    history: list[HistoryTurn] = Field(default_factory=list)


class MascotMessageRequest(BaseModel):
    user_context: dict = {}


class TheoryRequest(BaseModel):
    topic: str
    subject: str
    grade: int
    weak_subtopics: list[str] = []


class TutorRequest(BaseModel):
    message: str
    theory_content: str = ""
    topic: str = ""
    subject: str = ""
    grade: int = 12
    user_id: Optional[int] = None
    user_context: dict = {}
    history: list[HistoryTurn] = Field(default_factory=list)


def _fetch_learning_history(user_id: int, db: Session) -> dict:
    """Fetch recent wrong answers and study-hour effectiveness from DB."""

    # ── 1. Recent wrong answers (last 8) ─────────────────────────────
    wrong_answers_raw = (
        db.query(UserAnswer, Question, Topic, Test)
        .join(Question, UserAnswer.question_id == Question.id)
        .join(Topic, Question.topic_id == Topic.id)
        .join(Test, UserAnswer.test_id == Test.id)
        .filter(UserAnswer.user_id == user_id, UserAnswer.is_correct == False)  # noqa: E712
        .order_by(Test.created_at.desc())
        .limit(8)
        .all()
    )
    recent_wrong = []
    for ua, q, t, test in wrong_answers_raw:
        recent_wrong.append({
            "topic": t.name,
            "content": (q.content or "")[:120],
            "selected": ua.selected_option or "?",
            "correct": q.correct_answer or "?",
            "explanation": (q.explanation or "")[:200],
        })

    # ── 2. Effective study hours from test timestamps ─────────────────
    tests = (
        db.query(Test)
        .filter(Test.user_id == user_id, Test.score.isnot(None))
        .order_by(Test.created_at.desc())
        .limit(30)
        .all()
    )
    hour_scores: dict[int, list[float]] = defaultdict(list)
    for test in tests:
        if test.created_at and test.score is not None:
            h = test.created_at.hour
            hour_scores[h].append(float(test.score))

    effective_hours: Optional[str] = None
    if len(hour_scores) >= 2:
        # Find hour with highest average score (min 2 data points)
        valid = {h: (sum(vs) / len(vs), len(vs)) for h, vs in hour_scores.items() if len(vs) >= 2}
        if valid:
            best_h = max(valid, key=lambda h: valid[h][0])
            avg = valid[best_h][0]
            # Format as readable time block
            if 5 <= best_h <= 9:
                effective_hours = f"{best_h}h–{best_h+1}h sáng (điểm TB: {avg:.1f}/10)"
            elif 10 <= best_h <= 11:
                effective_hours = f"{best_h}h–{best_h+1}h trưa (điểm TB: {avg:.1f}/10)"
            elif 12 <= best_h <= 16:
                effective_hours = f"{best_h}h–{best_h+1}h chiều (điểm TB: {avg:.1f}/10)"
            else:
                effective_hours = f"{best_h}h–{best_h+1}h tối (điểm TB: {avg:.1f}/10)"

    # ── 3. Study time stats from WeeklyProgress ───────────────────────
    progresses = (
        db.query(WeeklyProgress)
        .filter(WeeklyProgress.user_id == user_id)
        .order_by(WeeklyProgress.week.desc())
        .limit(10)
        .all()
    )
    study_times = [p.study_time for p in progresses if p.study_time]
    week_scores = [p.score for p in progresses if p.score]
    avg_study_time = round(sum(study_times) / len(study_times), 1) if study_times else None
    best_week_score = round(max(week_scores), 1) if week_scores else None

    # ── 4. Weakest topics from UserMastery ───────────────────────────
    masteries = (
        db.query(UserMastery, Topic)
        .join(Topic, UserMastery.topic_id == Topic.id)
        .filter(UserMastery.user_id == user_id)
        .order_by(UserMastery.mastery.asc())
        .limit(5)
        .all()
    )
    weak_topics = [
        {"topic": t.name, "mastery": round(float(um.mastery * 100))}
        for um, t in masteries if um.mastery < 0.8
    ]

    return {
        "recent_wrong": recent_wrong,
        "effective_hours": effective_hours,
        "avg_study_time_hrs": avg_study_time,
        "best_week_score": best_week_score,
        "weak_topics": weak_topics,
    }


@router.post("")
@router.post("/")
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Tin nhắn không được rỗng!")
    reply = await llm_service.chat(
        message=request.message,
        user_context=request.user_context,
        history=[{"role": t.role, "text": t.text} for t in request.history],
    )
    return {"status": "success", "reply": reply}


@router.post("/mascot-message")
async def mascot_message(request: MascotMessageRequest):
    """Generate daily mascot speech bubble for dashboard."""
    message = await llm_service.generate_mascot_message(request.user_context)
    return {"status": "success", "message": message}


@router.post("/tutor")
async def tutor_chat(request: TutorRequest, db: Session = Depends(get_db)):
    """Real-time tutor chat — mascot knows user learning history in detail."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Tin nhắn không được rỗng!")

    learning_history: dict = {}
    if request.user_id:
        try:
            learning_history = _fetch_learning_history(request.user_id, db)
        except Exception:
            pass  # Graceful degradation — tutor still works without history

    reply = await llm_service.tutor_chat(
        message=request.message,
        theory_content=request.theory_content,
        topic=request.topic,
        subject=request.subject,
        grade=request.grade,
        user_context=request.user_context,
        history=[{"role": t.role, "text": t.text} for t in request.history],
        learning_history=learning_history,
    )
    return {"status": "success", "reply": reply}


@router.post("/theory")
async def generate_theory(request: TheoryRequest):
    """Generate AI theory notes for a topic."""
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Thiếu tên chủ đề!")
    content = await llm_service.generate_theory(
        topic=request.topic,
        subject=request.subject,
        grade=request.grade,
        weak_subtopics=request.weak_subtopics,
    )
    return {"status": "success", "content": content}
