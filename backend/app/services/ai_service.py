import json
import os
import xgboost as xgb
import pandas as pd

class AIService:
    def __init__(self):
        self.model_path = "app/models/roadmap_model.json"
        self.graph_path = "app/models/master_knowledge_graph.json"
        self.model = None
        self.knowledge_graph = {}
        
        # Load dữ liệu khi khởi tạo
        if os.path.exists(self.model_path):
            self.model = xgb.Booster()
            self.model.load_model(self.model_path)
            
        if os.path.exists(self.graph_path):
            with open(self.graph_path, "r", encoding="utf-8") as f:
                self.knowledge_graph = json.load(f)

    def get_recommendation(self, user_data, mode="general"):
        """
        user_data: dict chứa điểm số hiện tại của user
        mode: 'general' (học chắc) hoặc 'exam' (cấp tốc)
        """
        # 1. Giả lập việc chấm điểm ưu tiên bằng AI (XGBoost)
        # Trong thực tế, mày sẽ convert user_data thành DataFrame và model.predict
        scores = {}
        for skill_id in self.knowledge_graph:
            # Tạm thời giả lập score, sau này thay bằng model thực
            scores[skill_id] = 5.0 # Mức độ ưu tiên mặc định

        # 2. Thuật toán Duyệt Đồ Thị (Core Logic)
        recommendations = []
        
        if mode == "general":
            # Mode học chắc: Duyệt từ gốc (những thằng ko có prerequisites)
            for skill_id, info in self.knowledge_graph.items():
                recommendations.append({
                    "skill_id": skill_id,
                    "name": info["name"],
                    "reason": "Học theo trình tự nền tảng"
                })
        else:
            # Mode cấp tốc: Tập trung vào những thằng priority cao
            # (Phần này sẽ phức tạp hơn, làm sau)
            recommendations = [{"skill_id": k, "name": v["name"]} for k, v in self.knowledge_graph.items()]

        return recommendations

# Khởi tạo instance dùng chung
ai_engine = AIService()
