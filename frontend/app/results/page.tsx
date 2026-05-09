"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/contexts/auth";
import api from "../../src/lib/api";
import ReactMarkdown from "react-markdown";

const SCENARIO_STYLES = [
  { gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59,130,246,0.30)", label: "BALANCED", accent: "#6366f1" },
  { gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)", glow: "rgba(139,92,246,0.30)", label: "STANDARD", accent: "#8b5cf6" },
  { gradient: "linear-gradient(135deg, #ef4444, #f97316)", glow: "rgba(239,68,68,0.30)", label: "INTENSIVE", accent: "#ef4444" },
];

export default function ResultsPage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectingScenario, setSelectingScenario] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [userConfig, setUserConfig] = useState<{ subject?: string; grade?: number } | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Record<number, boolean>>({});
  const didGenerate = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    const stored = sessionStorage.getItem("testResult");
    if (!stored) { router.push("/test"); return; }
    if (didGenerate.current) return;
    didGenerate.current = true;
    const r = JSON.parse(stored);
    setResult(r);
    api.getConfig(user.id).then((configRes) => {
      const config = configRes.data?.data ?? configRes.data;
      setUserConfig(config || null);
    }).catch(() => setUserConfig(null));
    if (!r.is_mini_test) {
      generateRoadmap(r);
    }
    setTimeout(() => setVisible(true), 100);
  }, [isLoaded, user]);

  const startWeeklyReview = (topic: string) => {
    if (result?.week === undefined || result?.week === null) return;
    sessionStorage.setItem("testTopic", topic);
    sessionStorage.setItem("testWeek", String(result.week));
    sessionStorage.removeItem("testWeakTopics");
    router.push("/test");
  };

  const goToTheory = () => {
    if (!result?.topic_name && !result?.weak_topics?.length) return;
    const theoryTopic = result.topic_name || result.weak_topics[0];
    sessionStorage.setItem("theoryTopic", theoryTopic);
    sessionStorage.setItem("theorySubject", userConfig?.subject || "Toán");
    sessionStorage.setItem("theoryGrade", String(userConfig?.grade || 12));
    sessionStorage.setItem("theoryWeakTopics", JSON.stringify(result.weak_topics || []));
    if (result.week != null) sessionStorage.setItem("theoryWeek", String(result.week));
    router.push("/theory");
  };

  const explainWrongAnswer = async (item: any, detail: any) => {
    if (!user) return;
    const questionId = item?.question_id;
    if (!questionId || loadingExplanations[questionId] || explanations[questionId]) return;
    setLoadingExplanations((prev) => ({ ...prev, [questionId]: true }));
    const selectedText = detail?.options?.[item.selected_answer] || "";
    const correctText = detail?.options?.[item.correct_answer] || "";
    const msg = [
      "Giải thích ngắn gọn vì sao học sinh làm sai câu này.",
      "Yêu cầu format 3 ý: (1) Sai ở đâu, (2) Concept đúng là gì, (3) Mẹo nhớ nhanh.",
      `Câu hỏi: ${detail?.content || "Không có nội dung câu hỏi"}`,
      `Đáp án học sinh chọn: ${item.selected_answer}${selectedText ? ` - ${selectedText}` : ""}`,
      `Đáp án đúng: ${item.correct_answer}${correctText ? ` - ${correctText}` : ""}`,
      `Topic: ${detail?.topic || result?.topic_name || "Chưa xác định"}`,
      `Môn: ${userConfig?.subject || "Chưa xác định"}, Lớp: ${userConfig?.grade || "Chưa xác định"}`,
      `Điểm yếu lặp tuần trước: ${(result?.overlap_with_prev_week || []).join(", ") || "không có"}`,
      `Chronic weak topics: ${(result?.chronic_weak_topics || []).join(", ") || "không có"}`,
    ].join("\n");
    try {
      const res = await api.chat(msg, {
        username: user.username,
        subject: userConfig?.subject || "",
        grade: userConfig?.grade || "",
        current_score: result?.score || 0,
        weak_topics: result?.weak_topics || [],
      });
      const reply = res.data?.reply || "Chưa tạo được giải thích cho câu này.";
      setExplanations((prev) => ({ ...prev, [questionId]: reply }));
    } catch {
      setExplanations((prev) => ({ ...prev, [questionId]: "Routex tạm thời chưa giải thích được câu này. Bạn thử lại sau nhé." }));
    } finally {
      setLoadingExplanations((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const generateRoadmap = async (r: any) => {
    if (!user) return;
    setLoadingRoadmap(true);
    try {
      const totalQ = r.total_questions || 10;
      const score = r.score || 5;
      const weakRatio = r.weak_topics?.length ? r.weak_topics.length / totalQ : 0.3;

      const configRes = await api.getConfig(user.id);
      const config = configRes.data?.data ?? configRes.data;
      if (!config?.subject || !config?.grade) {
        setLoadingRoadmap(false);
        return;
      }

      const res = await api.generateRoadmap(user.id, {
        current_score: score, mastery_avg: score / 10, mastery_std: 0.15,
        weak_ratio: weakRatio, improvement_last_week: 0, prev_week_time: 120,
        weak_topics: r.weak_topics || [],
        subject: config.subject, grade: config.grade,
      });
      setRoadmap(res.data.data);
    } catch (err) {
      console.error("Roadmap error:", err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const selectScenario = async (name: string) => {
    if (!roadmap || selectingScenario || selectedScenario) return;
    setSelectingScenario(name);
    const durationWeeks = parseInt(sessionStorage.getItem("examDurationWeeks") || "4");
    try {
      await api.selectRoadmap(roadmap.roadmap_id, name, durationWeeks);
      setSelectedScenario(name);
      setTimeout(() => router.push(`/roadmap?id=${roadmap.roadmap_id}`), 700);
    } catch (e: any) {
      if (e?.response?.status >= 500 || !e?.response) {
        setSelectedScenario(name);
        setTimeout(() => router.push(`/roadmap?id=${roadmap.roadmap_id}`), 700);
      } else {
        setSelectingScenario(null);
      }
    }
  };

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: "#07080f" }}>
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 500, height: 500, top: -200, right: -150, background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)", zIndex: 0 }} />
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl relative z-10 animate-float"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>◈</div>
    </div>
  );

  const pct = Math.round((result.correct_count / result.total_questions) * 100);
  const score = result.score;
  const scoreGradient = score >= 8
    ? "linear-gradient(135deg, #10b981, #06b6d4)"
    : score >= 5
    ? "linear-gradient(135deg, #f59e0b, #f97316)"
    : "linear-gradient(135deg, #ef4444, #dc2626)";
  const scoreGlow = score >= 8
    ? "0 0 60px rgba(16,185,129,0.3), 0 20px 60px rgba(0,0,0,0.5)"
    : score >= 5
    ? "0 0 60px rgba(245,158,11,0.3), 0 20px 60px rgba(0,0,0,0.5)"
    : "0 0 60px rgba(239,68,68,0.3), 0 20px 60px rgba(0,0,0,0.5)";
  const scoreLabel = score >= 8 ? "Xuất sắc" : score >= 6.5 ? "Khá tốt" : score >= 5 ? "Trung bình" : "Cần cải thiện";

  const cardStyle = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(24px)",
    transition: `all 0.55s cubic-bezier(.22,1,.36,1) ${delay}ms`,
  });

  const questionDetailsMap = new Map<number, any>(
    (result.question_details || []).map((detail: any) => [detail.question_id, detail]),
  );
  const wrongAnswers = (result.results || []).filter((item: any) => !item.is_correct);

  return (
    <div className="min-h-screen pb-10 noise-bg relative overflow-x-hidden" style={{ background: "#07080f" }}>

      {/* Aurora orbs */}
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 700, height: 700, top: -300, right: -250, background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", zIndex: 0 }} />
      <div className="aurora-orb aurora-orb-2 fixed pointer-events-none" style={{ width: 500, height: 500, bottom: -200, left: -180, background: "radial-gradient(circle, rgba(139,92,246,0.07), transparent 70%)", zIndex: 0 }} />

      <div className="relative z-10">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Back */}
        <button onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm mb-8 group"
          style={{ color: "#475569" }}>
          <span className="transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-white">←</span>
          <span className="transition-colors duration-200 group-hover:text-white">Dashboard</span>
        </button>

        {/* Score Card */}
        <div className="glass-premium rounded-3xl p-8 mb-5 text-center relative overflow-hidden shimmer-border" style={cardStyle(0)}>
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: scoreGradient }} />
          {/* Background glow */}
          <div className="absolute inset-0 opacity-5 rounded-3xl" style={{ background: scoreGradient }} />

          <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: "#475569", letterSpacing: "0.18em" }}>
            Kết quả kiểm tra
          </p>

          {/* Score bubble */}
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-5 text-white font-black text-5xl relative"
            style={{ background: scoreGradient, boxShadow: scoreGlow }}>
            {score.toFixed(1)}
          </div>

          <p className="text-white font-black text-xl mb-1">{scoreLabel}</p>
          <p className="text-sm font-medium mb-5" style={{ color: "#64748b" }}>
            {result.correct_count}/{result.total_questions} câu đúng · {pct}%
          </p>

          {/* Score bar */}
          <div className="h-1.5 rounded-full mx-2" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full rounded-full transition-all duration-1000 delay-300"
              style={{ width: visible ? `${pct}%` : "0%", background: scoreGradient, boxShadow: scoreGlow.split(",")[0] }} />
          </div>

          {result.weak_topics?.length > 0 && (
            <div className="mt-5 p-4 rounded-2xl text-left"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#f87171", letterSpacing: "0.16em" }}>
                ◎ Topics cần cải thiện
              </p>
              <div className="flex flex-wrap gap-2">
                {result.weak_topics.map((t: string) => (
                  <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {t}
                  </span>
                ))}
              </div>
              {result.is_mini_test && score < 7 && result.week !== undefined && result.week !== null && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.weak_topics.map((t: string) => (
                    <button key={"review-" + t} onClick={() => startWeeklyReview(t)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.14)" }}>
                      Ôn lại tuần {result.week} → {t}
                    </button>
                  ))}
                </div>
              )}
              {result.is_mini_test && score < 7 && (
                <button onClick={goToTheory}
                  className="mt-3 w-full py-2.5 rounded-2xl font-black text-sm transition-all duration-200 btn-glow"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }}>
                  📖 Xem lý thuyết & ôn lại →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mini-test mode */}
        {result.is_mini_test ? (
          <div className="space-y-4">
            <div className="glass-premium rounded-3xl p-6 relative overflow-hidden" style={cardStyle(150)}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                style={{ background: score >= 7
                  ? "linear-gradient(90deg, #10b981, #06b6d4)"
                  : "linear-gradient(90deg, #f59e0b, #ef4444)" }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white font-black"
                  style={{ background: score >= 7
                    ? "linear-gradient(135deg, #10b981, #06b6d4)"
                    : "linear-gradient(135deg, #f59e0b, #ef4444)",
                    boxShadow: score >= 7
                      ? "0 6px 20px rgba(16,185,129,0.35)"
                      : "0 6px 20px rgba(245,158,11,0.35)" }}>
                  {score >= 7 ? "✓" : "!"}
                </div>
                <div>
                  <p className="text-white font-black text-sm">
                    Mini Test{result.topic_name ? " · " + result.topic_name : ""}
                  </p>
                  {result.week !== undefined && result.week !== null && (
                    <p className="text-xs font-medium" style={{ color: "#475569" }}>Tuần {result.week}</p>
                  )}
                </div>
              </div>

              {score >= 8.5 ? (
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                  Xuất sắc! Bạn đã nắm vững <strong style={{ color: "#fff" }}>{result.topic_name || "chủ đề này"}</strong>. Sổ học tập đã được cập nhật và Routex sẽ chuyển bạn sang chủ đề tiếp theo trong lộ trình.
                </p>
              ) : score >= 7 ? (
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                  Tốt lắm! Bạn đã đạt mức đậu cho <strong style={{ color: "#fff" }}>{result.topic_name || "chủ đề này"}</strong>. Tuần này được đánh dấu hoàn thành — tiếp tục với tuần tiếp theo nhé!
                </p>
              ) : score >= 5 ? (
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                  Bạn đang gần đạt rồi! Hãy ôn lại <strong style={{ color: "#fff" }}>{result.topic_name || "chủ đề này"}</strong> và làm lại Mini Test khi sẵn sàng.
                </p>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                  Chủ đề <strong style={{ color: "#fff" }}>{result.topic_name || "này"}</strong> còn yếu. Hãy quay lại học kỹ phần lý thuyết rồi thử lại Mini Test.
                </p>
              )}

              {result.weak_topics?.length > 0 && score < 7 && (
                <div className="mt-4 p-3 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#f87171" }}>
                    Điểm yếu phát hiện
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.weak_topics.map((t: string) => (
                      <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5" }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.overlap_with_prev_week?.length > 0 && (
                <div className="mt-3 p-3 rounded-2xl"
                  style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#f59e0b" }}>
                    Trùng điểm yếu với tuần trước
                  </p>
                  <p className="text-xs mb-2 font-medium" style={{ color: "#fde68a" }}>
                    {result.overlap_with_prev_week.join(", ")}
                  </p>
                  {result.week !== undefined && result.week !== null && result.week > 1 && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          sessionStorage.setItem("testTopic", result.overlap_with_prev_week[0]);
                          sessionStorage.setItem("testWeek", String(result.week - 1));
                          sessionStorage.setItem("testWeakTopics", JSON.stringify(result.overlap_with_prev_week));
                          router.push("/test");
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                        style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.14)" }}>
                        Làm lại Mini Test tuần {result.week - 1}
                      </button>
                      <button onClick={goToTheory}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                        style={{ background: "rgba(99,102,241,0.18)", color: "#c4b5fd", border: "1px solid rgba(99,102,241,0.28)" }}>
                        📖 Lý thuyết
                      </button>
                    </div>
                  )}
                </div>
              )}

              {result.chronic_weak_topics?.length > 0 && (
                <div className="mt-3 p-3 rounded-2xl"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#f87171" }}>
                    Chronic weak phát hiện
                  </p>
                  <p className="text-xs font-medium" style={{ color: "#fecaca" }}>
                    {result.chronic_weak_topics.join(", ")} đang yếu liên tục 2-3 tuần. Nên học lại từ đầu thay vì chỉ làm thêm bài tập.
                  </p>
                </div>
              )}

              {wrongAnswers.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#475569", letterSpacing: "0.16em" }}>
                    Giải thích câu sai
                  </p>
                  {wrongAnswers.map((item: any, idx: number) => {
                    const detail = questionDetailsMap.get(item.question_id) || {};
                    const aiText = explanations[item.question_id];
                    const isLoading = !!loadingExplanations[item.question_id];
                    return (
                      <div key={"wrong-" + item.question_id + "-" + idx}
                        className="rounded-2xl p-4"
                        style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#e2e8f0" }}>
                          Câu {idx + 1}: {detail?.content || "Nội dung câu hỏi không khả dụng"}
                        </p>
                        <p className="text-xs mb-3 font-medium" style={{ color: "#64748b" }}>
                          Bạn chọn <span style={{ color: "#fca5a5" }}>{item.selected_answer}</span>
                          {" · "}Đáp án đúng <span style={{ color: "#6ee7b7" }}>{item.correct_answer}</span>
                        </p>
                        <button
                          onClick={() => explainWrongAnswer(item, detail)}
                          disabled={isLoading || !!aiText}
                          className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200"
                          style={{
                            background: aiText
                              ? "rgba(16,185,129,0.14)"
                              : "rgba(99,102,241,0.18)",
                            color: aiText ? "#6ee7b7" : "#c4b5fd",
                            border: aiText
                              ? "1px solid rgba(16,185,129,0.25)"
                              : "1px solid rgba(99,102,241,0.25)",
                            letterSpacing: "0.08em",
                          }}>
                          {isLoading ? "Đang phân tích..." : aiText ? "✓ Đã giải thích" : "Tại sao sai?"}
                        </button>
                        {aiText && (
                          <div className="mt-3 p-3 rounded-xl"
                            style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
                            <p className="text-xs leading-relaxed" style={{ color: "#94a3b8", whiteSpace: "pre-wrap" }}>
                              {aiText}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="space-y-3" style={cardStyle(250)}>
              {score < 7 && (result.topic_name || result.weak_topics?.length > 0) && (
                <button onClick={goToTheory}
                  className="w-full py-3.5 font-black text-white rounded-2xl text-sm transition-all duration-200 btn-glow"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  📖 Xem lý thuyết & củng cố kiến thức →
                </button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => router.push("/test")}
                  className="py-4 font-bold text-white rounded-2xl text-sm transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  Làm lại Mini Test
                </button>
                <button onClick={() => router.push("/dashboard")}
                  className="py-4 font-black text-white rounded-2xl text-sm transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", boxShadow: "0 6px 24px rgba(16,185,129,0.28)" }}>
                  Về Dashboard →
                </button>
              </div>
            </div>
          </div>

        ) : loadingRoadmap ? (
          <div className="glass-premium rounded-3xl p-10 text-center mb-5 shimmer-border" style={cardStyle(100)}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 text-2xl animate-float"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 50px rgba(99,102,241,0.4)" }}>◈</div>
            <p className="text-white font-black text-base mb-2">Routex đang tạo lộ trình cá nhân hóa...</p>
            <p className="text-sm mb-6 font-medium" style={{ color: "#64748b" }}>Phân tích kết quả và điều chỉnh theo năng lực của bạn</p>
            <div className="flex justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>

        ) : roadmap && (
          <div className="space-y-4">
            {/* AI Advisor */}
            <div className="glass-premium rounded-3xl p-6 relative overflow-hidden" style={cardStyle(150)}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #3b82f6)" }} />
              <div className="absolute inset-0 opacity-[0.03] rounded-3xl"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 6px 24px rgba(99,102,241,0.35)" }}>◈</div>
                <div>
                  <p className="text-white font-black text-sm">AI Advisor</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>Routex Analysis</p>
                </div>
              </div>
              {roadmap.ai_advisor_message && !roadmap.ai_advisor_message.startsWith("⚠️") ? (
                <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed relative" style={{ color: "#94a3b8" }}>
                  <ReactMarkdown>{roadmap.ai_advisor_message}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm leading-relaxed relative" style={{ color: "#94a3b8" }}>
                  Routex tạm thời không khả dụng. Hãy chọn một trong 3 lộ trình bên dưới — Routex dự đoán điểm số dựa trên kết quả bài test của bạn.
                </p>
              )}
            </div>

            {/* 3 Scenarios */}
            {roadmap.scenarios?.length > 0 && (
              <div style={cardStyle(200)}>
                <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                  <span style={{ color: "#a78bfa" }}>◈</span> 3 Lộ trình cho tuần này
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {roadmap.scenarios.map((s: any, i: number) => {
                    const style = SCENARIO_STYLES[i] || SCENARIO_STYLES[0];
                    const isSelected = selectedScenario === s.name;
                    const isSelecting = selectingScenario === s.name;
                    const isDisabled = (selectedScenario !== null && !isSelected) || selectingScenario !== null;
                    return (
                      <div key={i} className="rounded-3xl p-5 relative overflow-hidden transition-all duration-300"
                        style={{
                          background: isSelected ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.035)",
                          border: isSelected ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.07)",
                          boxShadow: isSelected ? "0 0 50px rgba(16,185,129,0.12)" : "none",
                          transform: isSelected ? "scale(1.02)" : "none",
                          backdropFilter: "blur(20px)",
                        }}>
                        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: style.gradient }} />

                        <div className="mb-1">
                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#475569" }}>{style.label}</span>
                        </div>
                        <h3 className="text-white font-black text-base mb-4">{s.name}</h3>

                        <div className="space-y-2 text-xs mb-5" style={{ color: "#64748b" }}>
                          {[
                            { label: "Thời gian", value: s.action?.action_planned_time + " phút/tuần" },
                            { label: "Chủ đề", value: s.action?.action_topic_count },
                            { label: "Độ khó", value: (s.action?.action_avg_difficulty * 10).toFixed(1) + "/10" },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center">
                              <span>{label}</span>
                              <span className="font-black text-white">{value}</span>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl p-3 mb-4 text-center"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "#475569" }}>Routex dự đoán điểm</p>
                          <p className="text-3xl font-black"
                            style={{ background: style.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            {s.predicted_score?.toFixed(1)}
                          </p>
                        </div>

                        <button onClick={() => selectScenario(s.name)} disabled={isDisabled}
                          className="w-full py-2.5 rounded-xl font-black text-sm transition-all duration-200"
                          style={isSelected
                            ? { background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", boxShadow: "0 6px 20px rgba(16,185,129,0.3)" }
                            : isSelecting
                            ? { background: "rgba(255,255,255,0.07)", color: "#475569" }
                            : isDisabled
                            ? { background: "rgba(255,255,255,0.03)", color: "#334155", cursor: "not-allowed" }
                            : { background: style.gradient, color: "#fff", boxShadow: "0 6px 24px " + style.glow }}>
                          {isSelected ? "✓ Đã chọn" : isSelecting ? "Đang xử lý..." : "Chọn lộ trình này"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={() => router.push("/dashboard")}
              className="w-full py-4 font-bold text-white rounded-2xl text-sm transition-all duration-200"
              style={{
                ...cardStyle(300),
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              ← Về Dashboard
            </button>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
