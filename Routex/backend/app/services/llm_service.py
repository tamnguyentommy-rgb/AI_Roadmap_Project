import os
from google import genai

class LLMService:
    def __init__(self):
        # Lấy API key từ file .env
        self.api_key = os.getenv("GEMINI_API_KEY", "AIzaSyCH1cG7wZPPTjWltexLLFEgCjdxVxq8ud0")
        
        # Khởi tạo Client theo chuẩn mới nhất của Google GenAI
        self.client = genai.Client(api_key=self.api_key)
        
        # Trỏ đường dẫn tới file advisor.txt
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.prompt_path = os.path.join(base_dir, 'prompts', 'advisor.txt')

    async def generate_advice(self, current_state: dict, ml_scenarios: list) -> str:
        # 1. Gom kịch bản
        scenarios_text = ""
        for s in ml_scenarios:
            action = s['action']
            scenarios_text += (
                f"- {s['name']} "
                f"({action['action_planned_time']} phút, "
                f"{action['action_topic_count']} chủ đề, "
                f"độ khó {action['action_avg_difficulty']}, "
                f"tỷ lệ ôn tập {int(action['action_review_ratio']*100)}%): "
                f"AI dự đoán điểm đạt {s['predicted_score']}\n"
            )
        
        # 2. Đọc Prompt
        try:
            with open(self.prompt_path, 'r', encoding='utf-8') as f:
                prompt_template = f.read()
        except FileNotFoundError:
            return "❌ Lỗi hệ thống: Không tìm thấy file prompts/advisor.txt"

        # 3. Thay biến
        final_prompt = prompt_template.format(
            current_score=current_state.get('current_score', 0),
            weak_ratio=int(current_state.get('weak_ratio', 0) * 100),
            prev_week_time=current_state.get('prev_week_time', 0),
            scenarios_text=scenarios_text
        )

        # 4. Bắn API (Chuẩn mới)
        try:
            response = self.client.models.generate_content(
                model='gemini-1.5-flash',
                contents=final_prompt
            )
            return response.text
        except Exception as e:
            return f"⚠️ Routex AI đang bảo trì: {str(e)}"

llm_service = LLMService()
