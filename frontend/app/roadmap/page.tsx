"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../src/contexts/auth";
import api from "../../src/lib/api";

interface Topic {
  name: string;
  subtopics: string[];
  time_minutes: number;
  difficulty: number;
  key_idea: string;
}

interface Week {
  week: number;
  theme: string;
  goal: string;
  topics: Topic[];
}

interface RoadmapPlan {
  scenario_name: string;
  subject: string;
  grade: number;
  weeks: Week[];
  error?: string;
}

const WEEK_STYLES = [
  { gradient: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59,130,246,0.2)", badge: "rgba(59,130,246,0.15)", badgeBorder: "rgba(59,130,246,0.3)" },
  { gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)", glow: "rgba(139,92,246,0.2)", badge: "rgba(139,92,246,0.15)", badgeBorder: "rgba(139,92,246,0.3)" },
  { gradient: "linear-gradient(135deg, #10b981, #06b6d4)", glow: "rgba(16,185,129,0.2)", badge: "rgba(16,185,129,0.15)", badgeBorder: "rgba(16,185,129,0.3)" },
  { gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", glow: "rgba(245,158,11,0.2)", badge: "rgba(245,158,11,0.15)", badgeBorder: "rgba(245,158,11,0.3)" },
];

function DifficultyBadge({ d }: { d: number }) {
  if (d < 0.4) return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>Dễ</span>;
  if (d < 0.7) return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }}>TB</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>Khó</span>;
}

function RoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useAuth();
  const [plan, setPlan] = useState<RoadmapPlan | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    const id = searchParams.get("id");
    if (!id) { router.push("/dashboard"); return; }
    fetchPlan(Number(id));
  }, [isLoaded, user, searchParams]);

  const fetchPlan = async (id: number, attempt = 0) => {
    try {
      const res = await api.getRoadmapPlan(id);
      const data = res.data?.data;
      const planData = data?.roadmap_plan;
      const weeks = planData?.weeks;
      if (weeks && weeks.length > 0) {
        setPlan(planData);
        setScenarioName(data.scenario_name || "");
        setLoading(false);
        setTimeout(() => setVisible(true), 50);
      } else if (planData?.error) {
        setGenError(planData.error);
        setLoading(false);
      } else if (attempt < 100) {
        setTimeout(() => fetchPlan(id, attempt + 1), 3000);
      } else {
        setGenError("Routex mất quá nhiều thời gian. Vui lòng thử lại.");
        setLoading(false);
      }
    } catch {
      setGenError("Không thể kết nối tới server. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center noise-bg relative overflow-hidden" style={{ background: "#07080f" }}>
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 700, height: 700, top: -300, right: -250, background: "radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)" }} />
      <div className="aurora-orb aurora-orb-2 fixed pointer-events-none" style={{ width: 500, height: 500, bottom: -200, left: -150, background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)" }} />
      <div className="text-center px-6 max-w-sm relative z-10">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 animate-float"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 60px rgba(99,102,241,0.5)" }}>◈</div>
        <p className="text-white font-black text-xl mb-2">Routex đang tạo lộ trình...</p>
        <p className="text-sm mb-8 leading-relaxed font-medium" style={{ color: "#64748b" }}>
          Routex đang phân tích điểm yếu và xây dựng kế hoạch 4 tuần. Quá trình này mất khoảng 15–30 giây.
        </p>
        <div className="flex justify-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );

  if (genError) return (
    <div className="min-h-screen flex items-center justify-center p-4 noise-bg" style={{ background: "#07080f" }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl mx-auto mb-5"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>⚠</div>
        <h2 className="text-white font-black text-xl mb-2">Routex chưa thể tạo lộ trình</h2>
        <p className="text-sm mb-7 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          API đang tạm thời bận hoặc hết hạn mức.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push("/results")}
            className="px-5 py-3 font-bold text-white rounded-xl text-sm"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
            Thử lại
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="px-5 py-3 font-bold rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  if (!plan) return null;

  const totalMinutes = plan.weeks.reduce((sum, w) => sum + w.topics.reduce((s, t) => s + t.time_minutes, 0), 0);
  const totalTopics = plan.weeks.reduce((sum, w) => sum + w.topics.length, 0);
  const activeStyle = WEEK_STYLES[activeWeek % WEEK_STYLES.length];
  const week = plan.weeks[activeWeek];

  const cardStyle = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(16px)",
    transition: `all 0.5s ease ${delay}ms`,
  });

  return (
    <div className="min-h-screen pb-10 noise-bg relative overflow-x-hidden" style={{ background: "#07080f" }}>

      {/* Aurora orbs */}
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 700, height: 700, top: -280, right: -240, background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", zIndex: 0 }} />
      <div className="aurora-orb aurora-orb-2 fixed pointer-events-none" style={{ width: 480, height: 480, bottom: -180, left: -150, background: "radial-gradient(circle, rgba(139,92,246,0.07), transparent 70%)", zIndex: 0 }} />

      <div className="relative z-10">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Back */}
        <button onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm mb-8 group"
          style={{ color: "#475569" }}>
          <span className="transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-white">←</span>
          <span className="transition-colors duration-200 group-hover:text-white">Dashboard</span>
        </button>

        {/* Title Card */}
        <div className="glass-premium rounded-3xl p-6 mb-6 relative overflow-hidden shimmer-border" style={cardStyle(0)}>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
            style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)" }} />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Lộ trình được chọn</p>
              <h1 className="text-white font-black text-xl mb-1">{scenarioName || plan.scenario_name}</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{plan.subject} · Lớp {plan.grade}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>◈</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tuần", value: plan.weeks.length },
              { label: "Chủ đề", value: totalTopics },
              { label: "Giờ học", value: `${Math.round(totalMinutes / 60)}h` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-white font-black text-xl">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Week Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1" style={cardStyle(100)}>
          {plan.weeks.map((w, i) => {
            const ws = WEEK_STYLES[i % WEEK_STYLES.length];
            return (
              <button key={i} onClick={() => setActiveWeek(i)}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
                style={activeWeek === i
                  ? { background: ws.gradient, color: "#fff", boxShadow: `0 6px 24px ${ws.glow}` }
                  : { background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.06)" }}>
                Tuần {w.week}
              </button>
            );
          })}
        </div>

        {/* Active Week */}
        {week && (
          <div style={cardStyle(150)}>
            {/* Week header */}
            <div className="rounded-3xl p-6 mb-4 relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${activeStyle.badgeBorder}`, boxShadow: `0 0 40px ${activeStyle.glow}` }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: activeStyle.gradient }} />
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3"
                    style={{ background: activeStyle.badge, border: `1px solid ${activeStyle.badgeBorder}`, color: "#fff" }}>
                    Tuần {week.week}
                  </span>
                  <h2 className="text-white font-black text-xl mb-2">{week.theme}</h2>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>🎯 {week.goal}</p>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-3">
              {week.topics.map((topic, ti) => (
                <div key={ti} className="glass glass-hover rounded-2xl p-5 transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: activeStyle.gradient }}>
                        {ti + 1}
                      </div>
                      <h3 className="text-white font-bold text-sm leading-snug">{topic.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>⏱ {topic.time_minutes}p</span>
                      <DifficultyBadge d={topic.difficulty} />
                    </div>
                  </div>

                  {topic.subtopics?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3 ml-11">
                      {topic.subtopics.map((sub, si) => (
                        <span key={si} className="text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  {topic.key_idea && (
                    <div className="ml-11 rounded-xl p-3"
                      style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      <p className="text-xs font-bold mb-1" style={{ color: "#fbbf24" }}>💡 Ý tưởng chính</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#fde68a" }}>{topic.key_idea}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-5">
              {activeWeek > 0 && (
                <button onClick={() => setActiveWeek(activeWeek - 1)}
                  className="flex-1 py-3 font-bold rounded-2xl text-sm transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  ← Tuần {activeWeek}
                </button>
              )}
              {activeWeek < plan.weeks.length - 1 ? (
                <button onClick={() => setActiveWeek(activeWeek + 1)}
                  className="flex-1 py-3 font-black text-white rounded-2xl text-sm transition-all"
                  style={{ background: activeStyle.gradient, boxShadow: `0 8px 24px ${activeStyle.glow}` }}>
                  Tuần {activeWeek + 2} →
                </button>
              ) : (
                <button onClick={() => router.push("/dashboard")}
                  className="flex-1 py-3 font-black text-white rounded-2xl text-sm transition-all"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                  Về Dashboard →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07080f" }}>
        <div className="dot-loader flex gap-1"><span /><span /><span /></div>
      </div>
    }>
      <RoadmapContent />
    </Suspense>
  );
}
