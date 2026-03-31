
import joblib
import pandas as pd
import os

class MLService:
    def __init__(self):
        # Đường dẫn tới thư mục chứa não AI
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(base_dir, 'ml_models', 'routex_xgboost_v1.pkl')
        features_path = os.path.join(base_dir, 'ml_models', 'routex_features.pkl')
        
        # Load Model và Feature List vào RAM
        try:
            self.model = joblib.load(model_path)
            self.feature_cols = joblib.load(features_path)
            print("✅ Đã load XGBoost Model vào bộ nhớ thành công!")
        except Exception as e:
            print(f"❌ Lỗi load model ML: {e}")
            self.model = None

    def generate_scenarios_and_predict(self, current_state: dict) -> list:
        scenarios = [
            {
                "name": "Lộ trình Chill",
                "action": {'action_topic_count': 2, 'action_avg_difficulty': 0.4, 'action_review_ratio': 0.8, 'action_planned_time': 150}
            },
            {
                "name": "Lộ trình Cân bằng",
                "action": {'action_topic_count': 4, 'action_avg_difficulty': 0.5, 'action_review_ratio': 0.6, 'action_planned_time': 300}
            },
            {
                "name": "Lộ trình Bứt phá",
                "action": {'action_topic_count': 7, 'action_avg_difficulty': 0.8, 'action_review_ratio': 0.2, 'action_planned_time': 500}
            }
        ]

        if not self.model:
            return scenarios

        for s in scenarios:
            combined_data = {**current_state, **s['action']}
            df_predict = pd.DataFrame([combined_data])[self.feature_cols]
            pred_score = self.model.predict(df_predict)[0]
            s['predicted_score'] = round(max(0.0, min(10.0, float(pred_score))), 2)

        return scenarios

# DÒNG NÀY CỰC KỲ QUAN TRỌNG ĐỂ CÁC FILE KHÁC IMPORT ĐƯỢC NÈ
ml_service = MLService()
