import ReactMarkdown from "react-markdown";
import { api } from "../lib/api";
import { useState } from "react";

export default function RoadmapResult({ result, roadmapId }: { result: any, roadmapId: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (scenarioName: string) => {
    setLoading(true);
    try {
      await api.selectRoadmap(roadmapId, scenarioName);
      setSelected(scenarioName);
      alert(`🎉 Đã chốt lộ trình: ${scenarioName}! Chúc mày cày rank mượt mà!`);
    } catch (error) {
      alert("Lỗi khi chốt lộ trình!");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Lời khuyên của Gemini (The Mouth) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
        <h2 className="text-xl font-bold mb-4 text-blue-600 flex items-center gap-2">
          🤖 AI Advisor (Gemini)
        </h2>
        <div className="prose prose-blue max-w-none text-gray-700">
          <ReactMarkdown>{result.ai_advisor_message}</ReactMarkdown>
        </div>
      </div>

      {/* 2. Ba kịch bản của XGBoost (The Brain) */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-800">🎯 3 Phương án cho tuần này</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {result.scenarios.map((scenario: any, index: number) => {
            const isSelected = selected === scenario.name;
            return (
              <div 
                key={index} 
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isSelected 
                    ? "border-green-500 bg-green-50 shadow-md transform scale-105" 
                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{scenario.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>⏱️ Thời gian: <span className="font-semibold">{scenario.action.action_planned_time} phút</span></p>
                    <p>📚 Số chủ đề: <span className="font-semibold">{scenario.action.action_topic_count}</span></p>
                    <p>🔥 Độ khó: <span className="font-semibold">{scenario.action.action_avg_difficulty}/1.0</span></p>
                    <p>🔄 Ôn tập: <span className="font-semibold">{Math.round(scenario.action.action_review_ratio * 100)}%</span></p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100/50">
                  <div className="text-center mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Mục tiêu AI dự đoán</p>
                    <p className="text-2xl font-black text-blue-600">{scenario.predicted_score.toFixed(2)}</p>
                  </div>
                  
                  <button
                    onClick={() => handleSelect(scenario.name)}
                    disabled={loading || selected !== null}
                    className={`w-full py-2.5 rounded-xl font-semibold transition-colors ${
                      isSelected 
                        ? "bg-green-500 text-white" 
                        : selected !== null
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    {isSelected ? "✅ Đã Chọn" : "Chốt Lộ Trình Này"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}