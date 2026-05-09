from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from app.models.assessment import Question, Test, UserAnswer
from app.models.curriculum import Topic

def get_random_mini_test(db: Session, subject: str, grade: int, limit: int = 10):
    return db.query(Question).join(Topic).filter(
        Topic.subject == subject,
        Topic.grade == grade
    ).order_by(func.random()).limit(limit).all()

def submit_and_evaluate_test(db: Session, user_id: int, test_submission):
    new_test = Test(user_id=user_id, week=1)
    db.add(new_test)
    db.commit()
    db.refresh(new_test)

    correct_count = 0
    results = []

    for ans in test_submission.answers:
        question_db = db.query(Question).filter(Question.id == int(ans.question_id)).first()
        if not question_db:
            continue

        is_correct = (ans.selected_answer == question_db.correct_answer)
        if is_correct:
            correct_count += 1

        db.add(UserAnswer(
            test_id=new_test.id,
            question_id=question_db.id,
            user_id=user_id,
            selected_option=ans.selected_answer,
            is_correct=is_correct
        ))

        results.append({
            "question_id": question_db.id,
            "selected_answer": ans.selected_answer,
            "is_correct": is_correct,
            "correct_answer": question_db.correct_answer or "A",
            "explanation": question_db.explanation or ""
        })

    db.commit()
    total_q = len(test_submission.answers)
    score = (correct_count / total_q) * 10 if total_q > 0 else 0
    return {"test_id": new_test.id, "total_questions": total_q, "correct_count": correct_count, "score": round(score, 2), "results": results}
