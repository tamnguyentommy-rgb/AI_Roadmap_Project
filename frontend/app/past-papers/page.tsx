"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/contexts/auth";
import api from "../../src/lib/api";

interface PaperRecord {
  test_id: number;
  score: number;
  week: number | null;
  created_at: string | null;
  total_questions: number;
  correct_count: number;
  is_mini_test: boolean;
  topic_name: string | null;
  weak_topics: string[];
}

interface AnswerItem {
  question_id: number;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  selected_option: string;
  is_correct: boolean;
  explanation: string;
  topic: string;
}

const OPTION_MAP: Record<string, string> = { A: "option_a", B: "option_b", C: "option_c", D: "option_d" };

function scoreGrad(s: number) {
  if (s >= 8) return "linear-gradient(135deg, #10b981, #06b6d4)";
  if (s >= 6) return "linear-gradient(135deg, #f59e0b, #f97316)";
  return "linear-gradient(135deg, #ef4444, #dc2626)";
}

function fmt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PastPapersPage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mini" | "entrance">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Record<number, AnswerItem[]>>({});
  const [loadingReview, setLoadingReview] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    loadPapers();
  }, [isLoaded, user]);

  const loadPapers = async () => {
    if (!user) return;
    try {
      const res = await api.getPastPapers(user.id);
      setPapers(res.data?.data || []);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
      setTimeout(() => setVisible(true), 50);
    }
  };

  const toggleExpand = async (testId: number) => {
    if (expandedId === testId) { setExpandedId(null); return; }
    setExpandedId(testId);
    if (reviews[testId]) return;
    setLoadingReview(testId);
    try {
      const res = await api.getPaperReview(testId, user!.id);
      setReviews((prev) => ({ ...prev, [testId]: res.data?.data || [] }));
    } catch {
      setReviews((prev) => ({ ...prev, [testId]: [] }));
    } finally {
      setLoadingReview(null);
    }
  };

  const retakeTest = (paper: PaperRecord) => {
    if (paper.topic_name) {
      sessionStorage.setItem("testTopic", paper.topic_name);
      if (paper.week) sessionStorage.setItem("testWeek", String(paper.week));
      if (paper.weak_topics?.length) sessionStorage.setItem("testWeakTopics", JSON.stringify(paper.weak_topics));
    }
    router.push("/test");
  };

  const filtered = papers.filter((p) =>
    filter === "all" ? true : filter === "mini" ? p.is_mini_test : !p.is_mini_test
  );

  const miniCount = papers.filter((p) => p.is_mini_test).length;
  const avgScore = papers.length ? (papers.reduce((s, p) => s + p.score, 0) / papers.length).toFixed(1) : "—";
  const bestScore = papers.length ? Math.max(...papers.map((p) => p.score)).toFixed(1) : "—";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center noise-bg relative overflow-hidden" style={{ background: "#07080f" }}>
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 600, height: 600, top: -200, right: -200, background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)" }} />
      <div className="text-center relative z-10">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-6 animate-float"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 50px rgba(99,102,241,0.45)" }}>
          📋
        </div>
        <div className="flex justify-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="text-white font-black">Đang tải lịch sử bài thi...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-16 noise-bg relative overflow-x-hidden" style={{ background: "#07080f" }}>

      {/* Aurora orbs */}
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 600, height: 600, top: -220, right: -200, background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", zIndex: 0 }} />
      <div className="aurora-orb aurora-orb-2 fixed pointer-events-none" style={{ width: 400, height: 400, bottom: -150, left: -130, background: "radial-gradient(circle, rgba(139,92,246,0.07), transparent 70%)", zIndex: 0 }} />

      <div className="relative z-10">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6"
          style={{ opacity: visible ? 1 : 0, transition: "all 0.45s ease" }}>
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm group"
            style={{ color: "#475569" }}>
            <span className="transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-white">←</span>
            <span className="transition-colors duration-200 group-hover:text-white">Dashboard</span>
          </button>
        </div>

        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "all 0.4s ease 50ms" }}>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ background: "rgba(99,102,241,0.15)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.2)" }}>
            Lịch sử · Reflect
          </div>
          <h1 className="text-white font-black text-2xl mb-1">Past Papers</h1>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Xem lại bài làm cũ, đánh giá tiến bộ thực sự của bạn</p>
        </div>

        {/* Stats row */}
        {papers.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "all 0.4s ease 100ms" }}>
            {[
              { label: "Tổng bài thi", value: papers.length.toString(), icon: "📋" },
              { label: "Điểm TB", value: avgScore, icon: "📊" },
              { label: "Điểm cao nhất", value: bestScore, icon: "🏆" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass rounded-2xl p-3 text-center">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-white font-black text-lg leading-none">{value}</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {papers.length > 0 && (
          <div className="flex gap-2 mb-4"
            style={{ opacity: visible ? 1 : 0, transition: "all 0.4s ease 150ms" }}>
            {([
              { id: "all", label: `Tất cả (${papers.length})` },
              { id: "mini", label: `Mini Test (${miniCount})` },
              { id: "entrance", label: `Đầu vào (${papers.length - miniCount})` },
            ] as const).map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={filter === f.id
                  ? { background: "rgba(99,102,241,0.2)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.3)" }
                  : { background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Papers list */}
        {filtered.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center"
            style={{ opacity: visible ? 1 : 0, transition: "all 0.4s ease 200ms" }}>
            <div className="text-4xl mb-4">📋</div>
            <p className="text-white font-bold mb-2">Chưa có bài thi nào</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Làm bài kiểm tra để bắt đầu theo dõi tiến bộ của bạn.
            </p>
            <button onClick={() => router.push("/test")}
              className="px-6 py-2.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              Làm bài thi ngay →
            </button>
          </div>
        ) : (
          <div className="space-y-3"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "all 0.4s ease 200ms" }}>
            {filtered.map((paper, idx) => {
              const isExpanded = expandedId === paper.test_id;
              const review = reviews[paper.test_id] || [];
              const wrongAnswers = review.filter((a) => !a.is_correct);
              const grad = scoreGrad(paper.score);
              const pct = paper.total_questions > 0
                ? Math.round((paper.correct_count / paper.total_questions) * 100) : 0;

              return (
                <div key={paper.test_id} className="glass rounded-3xl overflow-hidden transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Card header */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Score badge */}
                      <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white flex-shrink-0"
                        style={{ background: grad, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                        <span className="font-black text-lg leading-none">{paper.score.toFixed(1)}</span>
                        <span className="text-[9px] opacity-80">/ 10</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={paper.is_mini_test
                              ? (paper.week && paper.week > 0
                                  ? { background: "rgba(99,102,241,0.15)", color: "#a78bfa" }
                                  : { background: "rgba(245,158,11,0.15)", color: "#fbbf24" })
                              : { background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }}>
                            {paper.is_mini_test
                              ? (paper.week && paper.week > 0 ? `Mini Test · T${paper.week}` : "Ôn lại")
                              : "Đầu vào"}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{fmt(paper.created_at)}</span>
                        </div>
                        <p className="text-white font-bold text-sm truncate">
                          {paper.topic_name || "Tổng hợp"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {paper.correct_count}/{paper.total_questions} câu đúng · {pct}%
                        </p>
                      </div>

                      {/* Score bar + expand */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: grad }} />
                        </div>
                        <button onClick={() => toggleExpand(paper.test_id)}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                          style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {isExpanded ? "Thu gọn ↑" : "Xem chi tiết ↓"}
                        </button>
                      </div>
                    </div>

                    {/* Weak topics chips */}
                    {paper.weak_topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {paper.weak_topics.slice(0, 4).map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px]"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.15)" }}>
                            ⚠ {t}
                          </span>
                        ))}
                        {paper.weak_topics.length > 4 && (
                          <span className="px-2 py-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                            +{paper.weak_topics.length - 4} topic nữa
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded review */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {/* Action buttons */}
                      <div className="flex gap-2 mt-4 mb-4">
                        <button onClick={() => retakeTest(paper)}
                          className="flex-1 py-2.5 font-bold text-sm rounded-2xl text-white transition-all"
                          style={{ background: grad, boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
                          {paper.score < 7 ? "Làm lại để cải thiện →" : "Làm lại kiểm tra →"}
                        </button>
                        {paper.score < 7 && paper.topic_name && (
                          <button
                            onClick={() => {
                              sessionStorage.setItem("theoryTopic", paper.topic_name!);
                              sessionStorage.setItem("theorySubject", sessionStorage.getItem("testSubject") || "Toán");
                              sessionStorage.setItem("theoryGrade", "12");
                              sessionStorage.setItem("theoryWeakTopics", JSON.stringify(paper.weak_topics));
                              router.push("/theory");
                            }}
                            className="px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                            style={{ background: "rgba(99,102,241,0.15)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.2)" }}>
                            📖
                          </button>
                        )}
                      </div>

                      {loadingReview === paper.test_id ? (
                        <div className="py-4 flex justify-center">
                          <div className="dot-loader flex gap-1"><span /><span /><span /></div>
                        </div>
                      ) : review.length === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                          Không có dữ liệu câu trả lời cho bài thi này.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                            style={{ color: "var(--text-muted)" }}>
                            Câu sai ({wrongAnswers.length}/{review.length}) · Phân tích chi tiết
                          </p>
                          {/* Progress mini bar */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: grad }} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: pct >= 70 ? "#6ee7b7" : "#fca5a5" }}>
                              {pct}%
                            </span>
                          </div>
                          {wrongAnswers.length === 0 ? (
                            <div className="py-4 text-center">
                              <p className="text-2xl mb-2">🎯</p>
                              <p className="text-sm font-bold" style={{ color: "#6ee7b7" }}>Làm đúng hết! Xuất sắc!</p>
                            </div>
                          ) : (
                            wrongAnswers.map((ans, i) => (
                              <div key={`${ans.question_id}-${i}`} className="rounded-2xl p-3"
                                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                                <div className="flex items-start gap-2 mb-1.5">
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                                    style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                                    ✗
                                  </span>
                                  <p className="text-xs font-medium leading-snug" style={{ color: "#e2e8f0" }}>
                                    {ans.content || "Nội dung câu hỏi không khả dụng"}
                                  </p>
                                </div>
                                <div className="flex gap-3 text-[11px] mt-2">
                                  <span style={{ color: "#f87171" }}>
                                    Bạn chọn: <strong>{ans.selected_option}</strong>
                                    {(ans as any)[`option_${ans.selected_option?.toLowerCase()}`]
                                      ? ` — ${(ans as any)[`option_${ans.selected_option?.toLowerCase()}`]}`.substring(0, 50)
                                      : ""}
                                  </span>
                                </div>
                                <div className="flex gap-3 text-[11px]">
                                  <span style={{ color: "#6ee7b7" }}>
                                    Đáp án: <strong>{ans.correct_answer}</strong>
                                    {(ans as any)[`option_${ans.correct_answer?.toLowerCase()}`]
                                      ? ` — ${(ans as any)[`option_${ans.correct_answer?.toLowerCase()}`]}`.substring(0, 50)
                                      : ""}
                                  </span>
                                </div>
                                {ans.topic && (
                                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px]"
                                    style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
                                    {ans.topic}
                                  </span>
                                )}
                                {ans.explanation && (
                                  <p className="text-[11px] mt-2 leading-relaxed" style={{ color: "#94a3b8" }}>
                                    💡 {ans.explanation.substring(0, 200)}{ans.explanation.length > 200 ? "..." : ""}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                          {/* Correct answers count */}
                          {review.filter((a) => a.is_correct).length > 0 && wrongAnswers.length < review.length && (
                            <p className="text-center text-[11px] mt-2 pt-2"
                              style={{ color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                              ✓ {review.filter((a) => a.is_correct).length} câu làm đúng
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="h-8" />
      </div>
      </div>
    </div>
  );
}
