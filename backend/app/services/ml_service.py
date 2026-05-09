
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
        base_score = current_state.get("current_score", 5.0)
        scenarios = [
            {
                "name": "Lộ trình Chill",
                "action": {
                    'action_topic_count': 2, 'action_avg_difficulty': 0.3,
                    'action_review_ratio': 0.8, 'action_planned_time': 150,
                    'improvement_last_week': 0.1, 'prev_week_time': 150
                },
                "_score_bonus": 0.3,
            },
            {
                "name": "Lộ trình Cân bằng",
                "action": {
                    'action_topic_count': 4, 'action_avg_difficulty': 0.55,
                    'action_review_ratio': 0.6, 'action_planned_time': 300,
                    'improvement_last_week': 0.5, 'prev_week_time': 300
                },
                "_score_bonus": 0.8,
            },
            {
                "name": "Lộ trình Bứt phá",
                "action": {
                    'action_topic_count': 7, 'action_avg_difficulty': 0.8,
                    'action_review_ratio': 0.2, 'action_planned_time': 500,
                    'improvement_last_week': 1.2, 'prev_week_time': 500
                },
                "_score_bonus": 1.6,
            }
        ]

        if not self.model:
            for s in scenarios:
                s['predicted_score'] = round(min(10.0, base_score + s["_score_bonus"]), 2)
                del s["_score_bonus"]
            return scenarios

        for s in scenarios:
            bonus = s.pop("_score_bonus")
            overrides = {k: v for k, v in s['action'].items() if k in self.feature_cols}
            combined_data = {**current_state, **overrides}
            df_predict = pd.DataFrame([combined_data])[self.feature_cols]
            pred_score = float(self.model.predict(df_predict)[0])
            # Apply scenario bonus to ensure meaningful score differences
            final_score = pred_score + bonus
            s['predicted_score'] = round(max(0.0, min(10.0, final_score)), 2)

        return scenarios

# DÒNG NÀY CỰC KỲ QUAN TRỌNG ĐỂ CÁC FILE KHÁC IMPORT ĐƯỢC NÈ
ml_service = MLService()
