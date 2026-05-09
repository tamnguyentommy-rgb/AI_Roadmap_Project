from sqlalchemy.orm import Session
from app.models.progress import UserMastery
from app.models.assessment import Question
from app.schemas.assessment import TestSubmit

def update_user_mastery_after_test(db: Session, user_id: int, test_submission: TestSubmit):
    """
    Sau khi chấm điểm xong, duyệt lại các câu hỏi để tăng/giảm độ thông thạo (mastery)
    của từng Topic tương ứng.
    """
    for ans in test_submission.answers:
        # Tìm xem câu hỏi này thuộc Topic nào
        question_db = db.query(Question).filter(Question.question_id == ans.question_id).first()
        if not question_db:
            continue

        topic_id = question_db.topic_id
        is_correct = (ans.selected_answer == question_db.correct_answer)

        # Lấy trạng thái Mastery hiện tại của User ở Topic này
        mastery_record = db.query(UserMastery).filter(
            UserMastery.user_id == user_id,
            UserMastery.topic_id == topic_id
        ).first()

        # Nếu user chưa từng học/test topic này thì tạo mới
        if not mastery_record:
            mastery_record = UserMastery(user_id=user_id, topic_id=topic_id, mastery=0.0)
            db.add(mastery_record)
            db.commit()
            db.refresh(mastery_record)

        # Logic cập nhật điểm Mastery (Ví dụ đơn giản: đúng cộng 0.1, sai trừ 0.05)
        # Điểm luôn nằm trong khoảng 0.0 đến 1.0
        if is_correct:
            mastery_record.mastery = min(1.0, mastery_record.mastery + 0.1)
        else:
            mastery_record.mastery = max(0.0, mastery_record.mastery - 0.05)

    db.commit()
