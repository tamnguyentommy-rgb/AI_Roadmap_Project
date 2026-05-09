"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/contexts/auth";
import api from "../../src/lib/api";
import ChatBot from "../../src/components/ChatBot";

interface DueReview {
  topic: string;
  subject: string;
  grade: number;
  mastery: number;
  next_review_date: string;
  sm2_interval: number;
  sm2_repetitions: number;
  days_overdue: number;
}

interface DashData {
  user: any;
  config: any;
  overview: any;
  mastery_topics: any[];
  weak_topics: any[];
  chronic_weak_topics?: string[];
  current_topic_warning?: { topic?: string | null; related_weak_topics?: string[]; message?: string | null };
  weekly_progress: any[];
  learning_path: any[];
  study_streak?: {
    current: number;
    longest: number;
    studied_today: boolean;
    last_study_date: string | null;
    earned_milestones: number[];
    next_milestone: number | null;
  };
  due_reviews?: DueReview[];
  due_reviews_count?: number;
  roadmap?: {
    roadmap_plan?: {
      weeks?: any[];
      [key: string]: any;
    };
    [key: string]: any;
  };
}

const SUBJECT_LABEL: Record<string, string> = {
  Toán: "Mathematics", Lý: "Physics", Hóa: "Chemistry", Sinh: "Biology",
};
const SUBJECT_ICON: Record<string, string> = {
  Toán: "∑", Lý: "⚡", Hóa: "⬡", Sinh: "◉",
};
const SUBJECT_COLORS: Record<string, string> = {
  Toán: "linear-gradient(135deg, #3b82f6, #6366f1)",
  Lý: "linear-gradient(135deg, #f59e0b, #ef4444)",
  Hóa: "linear-gradient(135deg, #10b981, #06b6d4)",
  Sinh: "linear-gradient(135deg, #14b8a6, #8b5cf6)",
};

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-60" style={{ background: color }} />
      <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-black text-xl leading-none" style={{ background: color, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</p>
      {sub && <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

function getTimeRemaining(createdAt: string | null, totalWeeks: number) {
  if (!createdAt || !totalWeeks) return null;
  const start = new Date(createdAt).getTime();
  const end = start + totalWeeks * 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return { days: 0, hours: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, expired: false };
}

function MascotDisplay({ avatarData, size = 48 }: { avatarData: string | null; size?: number }) {
  if (!avatarData) {
    return (
      <div className="rounded-full flex items-center justify-center text-white font-black"
        style={{ width: size, height: size, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: size * 0.4 }}>
        R
      </div>
    );
  }
  return (
    <img src={avatarData} alt="Mascot" className="rounded-full object-cover"
      style={{ width: size, height: size, border: "2px solid rgba(139,92,246,0.5)" }} />
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded, logout } = useAuth();
  const [dash, setDash] = useState<DashData | null>(null);
  const [latestRoadmap, setLatestRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"focus" | "test" | "roadmap" | "profile">("focus");
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; expired: boolean } | null>(null);
  const [streakNudge, setStreakNudge] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mascotName, setMascotName] = useState("");
  const [mascotPersonality, setMascotPersonality] = useState<"serious" | "funny" | "coach">("coach");
  const [editingMascotName, setEditingMascotName] = useState("");
  const [editingPersonality, setEditingPersonality] = useState<"serious" | "funny" | "coach">("coach");
  const [savingMascot, setSavingMascot] = useState(false);
  const [mascotMessage, setMascotMessage] = useState<string | null>(null);
  const mascotMsgCtxRef = useRef(false);
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [scrapePhase, setScrapePhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [scrapeStats, setScrapeStats] = useState<any>(null);
  const [scrapeNewCount, setScrapeNewCount] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    loadDash();
    loadAvatar();
    loadMascot();
  }, [isLoaded, user]);

  useEffect(() => {
    if (!dash) return;
    requestAnimationFrame(() => setVisible(true));
    import("animejs").then(({ animate }) => {
      const fills = document.querySelectorAll<HTMLElement>(".progress-fill");
      fills.forEach((el, i) => {
        el.style.width = "0%";
        animate(el, { width: el.dataset.width || "0%", duration: 900, delay: 500 + i * 80, ease: "outQuart" });
      });
    });
  }, [dash]);

  useEffect(() => {
    if (!dash?.study_streak) return;
    const st = dash.study_streak;
    if (st.studied_today) {
      setStreakNudge(null);
      return;
    }

    // In-app reminder (simple + reliable). Also try browser notification once per day.
    setStreakNudge(st.current > 0
      ? `Bạn đang có streak ${st.current} ngày. Làm 1 Mini Test để giữ streak hôm nay nhé!`
      : "Hôm nay bạn chưa học. Làm 1 Mini Test để bắt đầu streak nhé!");

    const todayKey = new Date().toISOString().slice(0, 10);
    const lastNotified = localStorage.getItem("streakReminderDate");
    if (lastNotified === todayKey) return;

    const scheduleNotification = () => {
      try {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") {
          // Fire immediately (simple). If you want a specific hour, we can add a timer later.
          new Notification("Routex nhắc học", {
            body: st.current > 0
              ? `Giữ streak ${st.current} ngày: làm 1 Mini Test nhé!`
              : "Làm 1 Mini Test để bắt đầu streak hôm nay nhé!",
          });
          localStorage.setItem("streakReminderDate", todayKey);
        } else if (Notification.permission === "default") {
          Notification.requestPermission().then((p) => {
            if (p === "granted") scheduleNotification();
          }).catch(() => {});
        }
      } catch {}
    };

    scheduleNotification();
  }, [dash?.study_streak]);

  useEffect(() => {
    if (!latestRoadmap) return;
    const plan = latestRoadmap?.roadmap_plan;
    if (!plan?.total_weeks || !latestRoadmap?.created_at) return;
    const update = () => setTimeLeft(getTimeRemaining(latestRoadmap.created_at, plan.total_weeks));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [latestRoadmap]);

  const loadDash = async () => {
    if (!user) return;
    try {
      const [dashRes, roadmapRes] = await Promise.all([
        api.getDashboard(user.id),
        api.getLatestRoadmap(user.id).catch(() => null),
      ]);
      setDash(dashRes.data);
      if (roadmapRes?.data?.status === "success") setLatestRoadmap(roadmapRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvatar = async () => {
    if (!user) return;
    try {
      const res = await api.getAvatar(user.id);
      if (res.data.avatar_data) setAvatarData(res.data.avatar_data);
    } catch {}
  };

  const loadMascot = async () => {
    if (!user) return;
    try {
      const res = await api.getMascot(user.id);
      const name = res.data.mascot_name || "";
      const pers = (res.data.mascot_personality || "coach") as "serious" | "funny" | "coach";
      setMascotName(name);
      setMascotPersonality(pers);
      setEditingMascotName(name);
      setEditingPersonality(pers);
    } catch {}
  };

  const handleSaveMascot = async () => {
    if (!user) return;
    setSavingMascot(true);
    try {
      await api.saveMascot(user.id, editingMascotName, editingPersonality);
      setMascotName(editingMascotName);
      setMascotPersonality(editingPersonality);
      // Invalidate cached mascot message so it refreshes
      const todayKey = new Date().toISOString().slice(0, 10);
      localStorage.removeItem(`mascot_msg_${user.id}_${todayKey}`);
      setMascotMessage(null);
    } catch {}
    finally { setSavingMascot(false); }
  };

  const loadMascotMessage = async (ctx: object) => {
    if (!user) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const cacheKey = `mascot_msg_${user.id}_${todayKey}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setMascotMessage(cached); return; }
    try {
      const res = await api.generateMascotMessage(ctx);
      const msg = res.data.message;
      setMascotMessage(msg);
      localStorage.setItem(cacheKey, msg);
    } catch {}
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = ev.target?.result as string;
          setAvatarData(base64);
          await api.uploadAvatar(user.id, base64);
        } catch {
          setAvatarData(null);
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.onerror = () => {
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => { logout(); router.push("/"); };

  const goToTopicTest = (topicName?: string, weekNumber?: number) => {
    if (topicName) {
      sessionStorage.setItem("testTopic", topicName);
      if (weekNumber !== undefined) {
        sessionStorage.setItem("testWeek", String(weekNumber));
      } else {
        sessionStorage.removeItem("testWeek");
      }
    } else {
      sessionStorage.removeItem("testTopic");
      sessionStorage.removeItem("testWeek");
    }
    router.push("/test");
  };

  // Must be before any early return — Rules of Hooks
  useEffect(() => {
    if (mascotMsgCtxRef.current) return;
    if (!dash || !user) return;
    mascotMsgCtxRef.current = true;
    const wkDetail = (dash?.weak_topics || []).slice(0, 4).map((t: any) => ({ topic: t.topic, mastery: Math.round(t.mastery) }));
    const roadmapWeeksInner = dash?.roadmap?.roadmap_plan?.weeks || latestRoadmap?.roadmap_plan?.weeks || [];
    const completedInner = (dash?.learning_path || []).filter((p: any) => p.status === "completed");
    const currentWeekInner = roadmapWeeksInner[Math.min(completedInner.length, roadmapWeeksInner.length - 1)];
    const ctx = {
      username: dash?.user?.username || user?.username || "",
      mascot_name: mascotName,
      mascot_personality: mascotPersonality,
      streak: dash?.study_streak?.current || 0,
      studied_today: dash?.study_streak?.studied_today || false,
      weak_topics: wkDetail.map((t) => t.topic),
      weak_topics_detail: wkDetail,
      current_week_theme: currentWeekInner?.theme || "",
      days_left: timeLeft?.days ?? null,
      subject: dash?.config?.subject || "",
    };
    loadMascotMessage(ctx);
  }, [dash, mascotName, mascotPersonality]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center noise-bg relative overflow-hidden" style={{ background: "#07080f" }}>
      <div className="aurora-orb" style={{ width: 500, height: 500, top: -200, right: -180, background: "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)" }} />
      <div className="aurora-orb aurora-orb-2" style={{ width: 400, height: 400, bottom: -160, left: -140, background: "radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)" }} />
      <div className="relative z-10 text-center">
        <div className="relative w-20 h-20 mx-auto mb-7">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl text-white animate-float-slow shadow-2xl"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 20px 60px rgba(99,102,241,0.5)" }}>◈</div>
          <div className="absolute -inset-3 rounded-full border border-dashed opacity-25 animate-spin-slow"
            style={{ borderColor: "rgba(99,102,241,0.6)" }} />
        </div>
        <div className="dot-loader flex justify-center gap-1 mb-4">
          <span style={{ background: "#6366f1" }} /><span style={{ background: "#8b5cf6" }} /><span style={{ background: "#a78bfa" }} />
        </div>
        <p className="text-white font-black text-lg mb-1">Đang tải Dashboard...</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Routex AI đang chuẩn bị cho bạn</p>
      </div>
    </div>
  );

  const cfg = dash?.config;
  const ov = dash?.overview;
  const subjectLabel = cfg ? (SUBJECT_LABEL[cfg.subject] || cfg.subject) : "Mathematics";
  const subjectIcon = cfg ? (SUBJECT_ICON[cfg.subject] || "◎") : "◎";
  const subjectGradient = cfg ? (SUBJECT_COLORS[cfg.subject] || SUBJECT_COLORS["Toán"]) : SUBJECT_COLORS["Toán"];
  const SUBJECT_AURORA: Record<string, string> = {
    Toán: "rgba(59,130,246,0.10)",
    Lý:   "rgba(245,158,11,0.08)",
    Hóa:  "rgba(16,185,129,0.08)",
    Sinh: "rgba(20,184,166,0.09)",
  };
  const subjectAuroraColor = SUBJECT_AURORA[cfg?.subject || "Toán"] || "rgba(59,130,246,0.10)";
  const progress = ov?.avg_mastery || 0;
  const totalTopics = ov?.total_topics || 0;
  const strongCount = ov?.strong_count || 0;
  const weakCount = ov?.weak_count || 0;
  const lastScore = dash?.weekly_progress?.length
    ? Math.round((dash.weekly_progress[dash.weekly_progress.length - 1].score / 10) * 100)
    : 0;
  const totalStudyTime = dash?.weekly_progress?.reduce((acc: number, w: any) => acc + (w.study_time || 0), 0) || 0;

  const learningPath = dash?.learning_path || [];
  const completed = learningPath.filter((p: any) => p.status === "completed");
  const inProgress = learningPath.find((p: any) => p.status === "in_progress") || learningPath.find((p: any) => p.status !== "completed");
  const upcoming = learningPath.filter((p: any) => p !== inProgress && p.status !== "completed").slice(0, 3);
  const roadmapWeeks = latestRoadmap?.roadmap_plan?.weeks || [];
  const hasValidRoadmap = roadmapWeeks.length > 0;
  const currentWeekIndex = Math.min(completed.length, roadmapWeeks.length - 1);
  const currentWeek = roadmapWeeks[currentWeekIndex];
  const totalWeeks = latestRoadmap?.roadmap_plan?.total_weeks || 0;

  const focusedTopic = currentWeek?.topics?.[0] || null;
  const focusedTopicName = focusedTopic?.name || null;
  const topicWarning = dash?.current_topic_warning;

  const weakTopicsDetail = (dash?.weak_topics || []).slice(0, 5).map((t: any) => ({ topic: t.topic, mastery: Math.round(t.mastery) }));
  const weakestTopic = weakTopicsDetail[0]?.topic || "";
  const weakestMastery = weakTopicsDetail[0]?.mastery || 0;

  const chatContext = {
    username: dash?.user?.username || user?.username || "",
    subject: cfg?.subject || "", grade: cfg?.grade || "", mode: cfg?.mode || "",
    target_score: cfg?.target_score || 0, daily_study_time: cfg?.daily_study_time || 0,
    current_score: dash?.weekly_progress?.length ? dash.weekly_progress[dash.weekly_progress.length - 1].score : (dash?.user?.current_score || 0),
    mastery_avg: ov?.avg_mastery || 0, strong_count: strongCount, weak_count: weakCount,
    total_topics: totalTopics,
    weak_topics: weakTopicsDetail.map((t) => t.topic),
    weak_topics_detail: weakTopicsDetail,
    weakest_topic: weakestTopic,
    weakest_mastery: weakestMastery,
    streak: dash?.study_streak?.current || 0,
    studied_today: dash?.study_streak?.studied_today || false,
    days_left: timeLeft?.days ?? null,
    current_week: currentWeekIndex + 1,
    scenario_name: latestRoadmap?.scenario_name || "", current_week_theme: currentWeek?.theme || "",
    mascot_name: mascotName, mascot_personality: mascotPersonality,
  };


  const cardStyle = (i: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(28px)",
    transition: `opacity 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 90}ms, transform 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 90}ms`,
  });

  async function handleUpdateQuestions() {
    if (scrapePhase === "loading") return;
    setScrapePhase("loading");
    setScrapeNewCount(0);
    try {
      // get baseline count first
      const statusBefore = await api.getScrapeStatus();
      const countBefore = statusBefore.data?.db_stats?.total_questions_in_db || 0;
      // trigger scrape
      await api.triggerScrape();
      // poll until job finishes
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const s = await api.getScrapeStatus();
          setScrapeStats(s.data?.db_stats);
          if (!s.data?.job_running || attempts > 120) {
            clearInterval(poll);
            const countAfter = s.data?.db_stats?.total_questions_in_db || 0;
            setScrapeNewCount(Math.max(0, countAfter - countBefore));
            setScrapePhase("done");
          }
        } catch { clearInterval(poll); setScrapePhase("error"); }
      }, 5000);
    } catch {
      setScrapePhase("error");
    }
  }

  return (
    <div className="min-h-screen pb-28 lg:pb-10 noise-bg relative overflow-x-hidden" style={{ background: "#07080f" }}>

      {/* Aurora background orbs */}
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 600, height: 600, top: -240, right: -200, background: "radial-gradient(circle, " + subjectAuroraColor + ", transparent 70%)", zIndex: 0 }} />
      <div className="aurora-orb aurora-orb-2 fixed pointer-events-none" style={{ width: 500, height: 500, bottom: -200, left: -160, background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", zIndex: 0 }} />
      <div className="aurora-orb fixed pointer-events-none" style={{ width: 360, height: 360, top: "45%", left: "30%", background: "radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)", zIndex: 0, animationDelay: "6s" }} />

      <div className="relative z-10">
      <div className="max-w-6xl mx-auto px-4 pt-7">

        {/* Header */}
        <div className="flex items-center justify-between mb-7" style={cardStyle(0)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 6px 24px rgba(99,102,241,0.4)" }}>R</div>
            <div>
              <p className="text-white font-black text-base leading-none">Routex</p>
              <p className="text-[10px] mt-0.5 font-bold" style={{ color: "var(--text-muted)" }}>AI Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab("profile")} className="flex items-center gap-2 group">
              <MascotDisplay avatarData={avatarData} size={32} />
              <div className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: "var(--text-secondary)" }}>
                {user?.username}
              </div>
            </button>
            <button onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105"
              style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171" }}>
              Đăng xuất
            </button>
          </div>
        </div>

        {/* ── Desktop 3-column layout ── */}
        <div className="lg:flex lg:gap-5 lg:items-start">

        {/* LEFT SIDEBAR — desktop only */}
        <div className="hidden lg:flex flex-col gap-4 w-60 flex-shrink-0 sticky top-6 self-start">
          {/* Subject + progress */}
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: subjectGradient }} />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white font-black mb-3" style={{ background: subjectGradient }}>
              {subjectIcon}
            </div>
            <p className="text-white font-black text-lg leading-none">{cfg?.subject || "—"}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{subjectLabel} · Lớp {cfg?.grade}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: subjectGradient }} />
              </div>
              <span className="text-xs font-black text-white">{progress}%</span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Tổng tiến độ</p>
          </div>

          {/* Streak */}
          {dash?.study_streak && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>🔥 Streak</span>
                {dash.study_streak.studied_today && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>✓ Hôm nay</span>
                )}
              </div>
              <p className="text-white font-black text-3xl leading-none">
                {dash.study_streak.current}
                <span className="text-sm font-medium ml-1" style={{ color: "var(--text-muted)" }}>ngày</span>
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Kỷ lục: {dash.study_streak.longest} ngày</p>
              {(dash.study_streak.earned_milestones?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {dash.study_streak.earned_milestones.slice(-3).map(m => (
                    <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24" }}>🏅 {m}d</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats overview */}
          <div className="rounded-2xl p-4 space-y-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Thống kê học tập</p>
            {[
              { label: "Điểm gần nhất", value: `${lastScore}%`, color: subjectGradient },
              { label: "Chủ đề mạnh", value: `${strongCount}/${totalTopics}`, color: "linear-gradient(135deg,#10b981,#06b6d4)" },
              { label: "Cần cải thiện", value: `${weakCount}`, color: "linear-gradient(135deg,#ef4444,#f97316)" },
              { label: "Giờ học tích lũy", value: `${totalStudyTime}p`, color: "linear-gradient(135deg,#f59e0b,#f97316)" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                <span className="text-xs font-black" style={{ background: s.color, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Config info */}
          {cfg && (
            <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Cấu hình</p>
              {[
                { label: "Chế độ", value: cfg.mode === "exam" ? "Chuẩn bị Thi" : "Toàn Diện" },
                { label: "Điểm mục tiêu", value: `${cfg.target_score}/10` },
                { label: "Thời gian/ngày", value: `${cfg.daily_study_time} phút` },
                ...(timeLeft && !timeLeft.expired ? [{ label: "Còn lại", value: `${timeLeft.days} ngày` }] : []),
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.label}</span>
                  <span className="text-xs font-bold text-white">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Thao tác nhanh</p>
            <button onClick={() => goToTopicTest(focusedTopicName || undefined, currentWeek?.week)}
              className="w-full py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95"
              style={{ background: subjectGradient }}>
              Mini Test ngay →
            </button>
            {hasValidRoadmap && (
              <button onClick={() => router.push(`/roadmap?id=${latestRoadmap.roadmap_id}`)}
                className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
                Xem lộ trình →
              </button>
            )}
            <button onClick={() => router.push("/mock-exam")}
              className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}>
              Thi thử THPT
            </button>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div className="flex-1 min-w-0">

        {activeTab === "profile" ? (
          /* ===== PROFILE / MASCOT TAB ===== */
          <div style={cardStyle(1)}>
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setActiveTab("focus")} className="text-xs px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>← Quay lại</button>
              <p className="text-white font-black text-lg">Mascot & Hồ sơ</p>
            </div>

            {/* Mascot section */}
            <div className="glass rounded-3xl p-6 mb-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <MascotDisplay avatarData={avatarData} size={96} />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}>
                    {uploadingAvatar ? "..." : "✎"}
                  </button>
                </div>
              </div>
              <p className="text-white font-black text-xl mb-1">{user?.username}</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                {cfg ? `${subjectLabel} · Lớp ${cfg.grade}` : "Chưa có cấu hình"}
              </p>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

              <button onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 6px 24px rgba(99,102,241,0.3)" }}>
                {uploadingAvatar ? "Đang tải lên..." : avatarData ? "Đổi ảnh mascot →" : "Upload ảnh làm mascot →"}
              </button>
              {!avatarData && (
                <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                  Tải ảnh của bạn lên để tạo mascot nhắc học mỗi ngày!
                </p>
              )}
            </div>

            {/* Mascot personality picker */}
            <div className="glass rounded-3xl p-5 mb-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Tùy chỉnh Mascot</p>

              {/* Name input */}
              <div className="mb-4">
                <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>Tên mascot</label>
                <input
                  value={editingMascotName}
                  onChange={(e) => setEditingMascotName(e.target.value)}
                  placeholder="Đặt tên cho mascot của bạn..."
                  maxLength={20}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-transparent outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Personality selector */}
              <div className="mb-5">
                <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>Tính cách</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "serious", label: "Nghiêm túc", sub: "Thầy/Cô giáo", icon: "📚" },
                    { id: "funny",   label: "Hài hước",   sub: "Bạn thân",    icon: "😂" },
                    { id: "coach",   label: "Coach",      sub: "Huấn luyện viên", icon: "💪" },
                  ] as const).map((p) => (
                    <button key={p.id}
                      onClick={() => setEditingPersonality(p.id)}
                      className="flex flex-col items-center gap-1 py-3 rounded-2xl text-center transition-all"
                      style={{
                        background: editingPersonality === p.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                        border: editingPersonality === p.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      }}>
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-xs font-bold text-white">{p.label}</span>
                      <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{p.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveMascot}
                disabled={savingMascot}
                className="w-full py-3 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 6px 20px rgba(99,102,241,0.3)" }}>
                {savingMascot ? "Đang lưu..." : "Lưu thiết lập mascot →"}
              </button>

              {mascotName && (
                <p className="text-xs text-center mt-3" style={{ color: "var(--text-muted)" }}>
                  Mascot hiện tại: <strong className="text-white">{mascotName}</strong> · {mascotPersonality === "serious" ? "Nghiêm túc" : mascotPersonality === "funny" ? "Hài hước" : "Coach"}
                </p>
              )}
            </div>

            {/* Mascot motivational message */}
            <div className="rounded-3xl p-5 mb-4"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.12))", border: "1px solid rgba(99,102,241,0.25)" }}>
              <div className="flex items-start gap-3">
                <MascotDisplay avatarData={avatarData} size={40} />
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-1">{mascotName || "Routex"} nhắc bạn học!</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#c4b5fd" }}>
                    {mascotMessage
                      ? mascotMessage
                      : focusedTopicName
                        ? `Hôm nay hãy tập trung vào "${focusedTopicName}" nhé! Đừng bỏ cuộc!`
                        : "Hãy bắt đầu hành trình học tập của bạn! Làm bài kiểm tra đầu vào để Routex AI tạo lộ trình riêng cho bạn!"}
                  </p>
                  {!mascotMessage && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="dot-loader flex gap-0.5"><span style={{ width: 4, height: 4 }} /><span style={{ width: 4, height: 4 }} /><span style={{ width: 4, height: 4 }} /></div>
                      <span className="text-[10px]" style={{ color: "rgba(196,181,253,0.5)" }}>Đang tạo lời nhắc...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="glass rounded-3xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Thống kê học tập</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Điểm gần nhất" value={`${lastScore}%`} color={subjectGradient} />
                <StatCard label="Tổng giờ học" value={`${totalStudyTime}m`} color="linear-gradient(135deg, #f59e0b, #f97316)" />
                <StatCard label="Chủ đề mạnh" value={`${strongCount}`} color="linear-gradient(135deg, #10b981, #06b6d4)" />
                <StatCard label="Cần cải thiện" value={`${weakCount}`} color="linear-gradient(135deg, #ef4444, #f97316)" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ===== FOCUS TAB (default) ===== */}

            {/* ===== DAILY BRIEFING CARD ===== */}
            <div className="rounded-3xl p-5 mb-4 relative overflow-hidden" style={{
              ...cardStyle(1),
              background: "linear-gradient(145deg, rgba(99,102,241,0.16), rgba(139,92,246,0.10), rgba(59,130,246,0.06))",
              border: "1px solid rgba(139,92,246,0.30)",
            }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #6366f1)" }} />
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", transform: "translate(40%, -40%)" }} />

              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(99,102,241,0.22)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.3)" }}>
                    🌅 Daily Briefing
                  </span>
                </div>
                <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  {new Date().toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" })}
                </span>
              </div>

              {/* Mascot + speech bubble */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex flex-col items-center flex-shrink-0 gap-1">
                  <div className="relative">
                    <MascotDisplay avatarData={avatarData} size={56} />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", border: "1.5px solid #07080f" }}>
                      ✦
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-center leading-tight max-w-[56px] truncate mt-1"
                    style={{ color: "#a78bfa" }}>
                    {mascotName || "Gia sư AI"}
                  </p>
                </div>

                <div className="flex-1 relative">
                  <div className="absolute -left-2 top-3 w-0 h-0"
                    style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: "7px solid rgba(99,102,241,0.22)" }} />
                  <div className="rounded-2xl rounded-tl-sm p-3.5"
                    style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(139,92,246,0.18)" }}>
                    {mascotMessage ? (
                      <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>{mascotMessage}</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="dot-loader flex gap-0.5"><span style={{ width: 4, height: 4 }} /><span style={{ width: 4, height: 4 }} /><span style={{ width: 4, height: 4 }} /></div>
                        <span className="text-xs" style={{ color: "#a78bfa" }}>Đang soạn daily brief...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stat pills row */}
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Streak */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <span className="text-xs">🔥</span>
                  <span className="text-xs font-bold" style={{ color: "#fbbf24" }}>
                    {dash?.study_streak?.current ?? 0} ngày streak
                  </span>
                  {dash?.study_streak?.studied_today && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.2)", color: "#34d399" }}>✓</span>
                  )}
                </div>

                {/* Days to exam */}
                {timeLeft && !timeLeft.expired && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <span className="text-xs">📅</span>
                    <span className="text-xs font-bold" style={{ color: "#a78bfa" }}>
                      Còn {timeLeft.days}d {timeLeft.hours}h
                    </span>
                  </div>
                )}

                {/* Today's focus */}
                {focusedTopicName && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                    style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <span className="text-xs">📖</span>
                    <span className="text-xs font-bold truncate max-w-[120px]" style={{ color: "#6ee7b7" }}>
                      {focusedTopicName}
                    </span>
                  </div>
                )}

                {/* Subject */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                    {subjectIcon} Lớp {cfg?.grade}
                  </span>
                </div>
              </div>

              {/* Action button */}
              <button onClick={() => setActiveTab("test")}
                className="w-full py-2.5 rounded-2xl font-black text-white text-xs transition-all active:scale-98"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))", border: "1px solid rgba(139,92,246,0.3)" }}>
                Hỏi {mascotName || "gia sư"} bất cứ điều gì →
              </button>
            </div>

            {/* ===== ÔN LẠI TUẦN X BANNER ===== */}
            {(() => {
              const currentWeekNum = currentWeekIndex + 1;
              const weekProg = dash?.weekly_progress?.find((w: any) => w.week === currentWeekNum)
                || (dash?.weekly_progress?.length ? dash.weekly_progress[dash.weekly_progress.length - 1] : null);
              const weekScore = weekProg?.score;
              if (weekScore === undefined || weekScore === null || weekScore >= 7 || !focusedTopicName) return null;
              return (
                <div className="rounded-3xl p-4 mb-4 relative overflow-hidden" style={{
                  ...cardStyle(1.5),
                  background: "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(245,158,11,0.07))",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                    style={{ background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(239,68,68,0.18)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                      ⚠ Ôn lại tuần {currentWeekNum}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                      {weekScore.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-white font-bold text-sm mb-1 leading-snug">
                    Điểm chưa đạt — nên ôn lại trước khi qua tuần {currentWeekNum + 1}
                  </p>
                  <p className="text-xs mb-3" style={{ color: "rgba(248,113,113,0.75)" }}>
                    {focusedTopicName}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => goToTopicTest(focusedTopicName, currentWeekNum)}
                      className="flex-1 py-2.5 font-black text-sm text-white rounded-2xl transition-all active:scale-98"
                      style={{ background: "linear-gradient(135deg, #ef4444, #f97316)", boxShadow: "0 4px 16px rgba(239,68,68,0.25)" }}>
                      Làm lại Mini Test →
                    </button>
                    <button onClick={() => {
                      sessionStorage.setItem("theoryTopic", focusedTopicName);
                      sessionStorage.setItem("theorySubject", cfg?.subject || "Toán");
                      sessionStorage.setItem("theoryGrade", String(cfg?.grade || 12));
                      sessionStorage.setItem("theoryWeakTopics", JSON.stringify(dash?.weak_topics?.map((t: any) => t.topic) || []));
                      sessionStorage.setItem("theoryWeek", String(currentWeekNum));
                      router.push("/theory");
                    }}
                      className="px-4 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-98"
                      style={{ background: "rgba(99,102,241,0.15)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.25)" }}>
                      📖 Lý thuyết
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Study streak */}
            {dash?.study_streak && (
              <div className="glass rounded-3xl p-5 mb-4" style={cardStyle(2)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                      🔥 Study Streak
                    </p>
                    <p className="text-white font-black text-2xl leading-none">
                      {dash.study_streak.current} ngày
                      <span className="text-xs font-semibold ml-2" style={{ color: dash.study_streak.studied_today ? "#34d399" : "#fbbf24" }}>
                        {dash.study_streak.studied_today ? "Đã học hôm nay" : "Chưa học hôm nay"}
                      </span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Kỷ lục: {dash.study_streak.longest} ngày
                      {dash.study_streak.next_milestone ? ` · Mốc tiếp theo: ${dash.study_streak.next_milestone} ngày` : ""}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black"
                    style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.35), rgba(239,68,68,0.25))", border: "1px solid rgba(245,158,11,0.25)" }}>
                    🔥
                  </div>
                </div>

                {dash.study_streak.earned_milestones?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {dash.study_streak.earned_milestones.slice(-3).map((m) => (
                      <span key={m} className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                        🏅 {m} ngày
                      </span>
                    ))}
                  </div>
                )}

                {streakNudge && (
                  <div className="mt-3 px-3 py-2 rounded-2xl"
                    style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.18)", color: "#fde68a" }}>
                    <p className="text-xs">{streakNudge}</p>
                    <button
                      onClick={() => goToTopicTest(focusedTopicName || undefined, currentWeek?.week)}
                      className="mt-2 w-full py-2.5 rounded-xl font-black text-xs text-white"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}
                    >
                      Làm Mini Test để giữ streak →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Topic focused this week card */}
            {hasValidRoadmap && focusedTopic && (
              <div className="rounded-3xl p-5 mb-4 relative overflow-hidden" style={{
                ...cardStyle(2),
                background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.12))",
                border: "1px solid rgba(139,92,246,0.3)",
              }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                  style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1)" }} />

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
                    ◈ Topic focused this week
                  </span>
                  {timeLeft && !timeLeft.expired && (
                    <span className="text-xs font-bold" style={{ color: timeLeft.days <= 3 ? "#f87171" : "#a3e635" }}>
                      ⏱ {timeLeft.days}d {timeLeft.hours}h
                    </span>
                  )}
                  {timeLeft?.expired && (
                    <span className="text-xs font-bold" style={{ color: "#f87171" }}>Hết hạn!</span>
                  )}
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <MascotDisplay avatarData={avatarData} size={40} />
                  <div className="flex-1">
                    <p className="text-white font-black text-lg leading-tight">{focusedTopic.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#c4b5fd" }}>
                      Tuần {currentWeek.week} · {currentWeek.theme}
                    </p>
                  </div>
                </div>

                {focusedTopic.subtopics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {focusedTopic.subtopics.slice(0, 4).map((st: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>
                        {st}
                      </span>
                    ))}
                  </div>
                )}

                {focusedTopic.key_idea && (
                  <p className="text-xs mb-4 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", color: "#e2e8f0" }}>
                    💡 {focusedTopic.key_idea}
                  </p>
                )}

                {topicWarning?.message && (
                  <div className="mb-4 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#fde68a" }}>
                    <p className="text-xs">⚠ {topicWarning.message}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => goToTopicTest(focusedTopicName || undefined, currentWeek?.week)}
                    className="flex-1 py-3 font-black text-white text-sm rounded-2xl transition-all active:scale-98"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", boxShadow: "0 6px 24px rgba(139,92,246,0.3)" }}>
                    Mini Test chủ đề này →
                  </button>
                  <span className="flex items-center px-3 text-xs font-bold" style={{ color: "#c4b5fd" }}>
                    5 câu
                  </span>
                </div>
              </div>
            )}

            {/* ===== MOCK EXAM CARD ===== */}
            <div className="rounded-3xl p-5 mb-4 relative overflow-hidden" style={{
              ...cardStyle(3),
              background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))",
              border: "1px solid rgba(245,158,11,0.28)",
            }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444, #f97316)" }} />
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, #f59e0b, transparent)", transform: "translate(40%, -40%)" }} />

              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(245,158,11,0.2)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>
                  📝 Mock Exam
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                  THPT Format
                </span>
              </div>

              <p className="text-white font-black text-base mb-1 leading-snug">Thi thử đúng format</p>
              <p className="text-xs mb-3" style={{ color: "rgba(251,191,36,0.75)" }}>
                50 câu · 90 phút · Nộp 1 lần · Tính điểm thật
              </p>

              <div className="flex gap-2 mb-3">
                {[
                  { icon: "📋", label: "50 câu MCQ" },
                  { icon: "⏱", label: "90 phút" },
                  { icon: "🎯", label: "Thang 10" },
                ].map((item) => (
                  <div key={item.label} className="flex-1 text-center px-2 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-base mb-0.5">{item.icon}</p>
                    <p className="text-[9px] font-bold" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push("/mock-exam")}
                className="w-full py-3 font-black text-white rounded-2xl text-sm transition-all active:scale-98"
                style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", boxShadow: "0 6px 24px rgba(245,158,11,0.3)" }}>
                Bắt đầu thi thử →
              </button>
            </div>

            {/* SM-2 Spaced Repetition Review Card */}
            {(dash?.due_reviews_count ?? 0) > 0 && (
              <div className="rounded-3xl p-5 mb-4 relative overflow-hidden" style={{
                ...cardStyle(3),
                background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.10))",
                border: "1px solid rgba(16,185,129,0.3)",
              }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                  style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }} />

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(16,185,129,0.18)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" }}>
                    ◈ Ôn tập hôm nay · SM-2
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>
                    {dash!.due_reviews_count} topic
                  </span>
                </div>

                <p className="text-white font-black text-base mb-1 leading-snug">
                  Đã đến lúc ôn lại!
                </p>
                <p className="text-xs mb-3" style={{ color: "#6ee7b7" }}>
                  Hệ thống nhắc đúng lúc bạn sắp quên. Ôn ngay để giữ kiến thức.
                </p>

                <div className="space-y-2 mb-4">
                  {dash!.due_reviews!.slice(0, 3).map((r, i) => (
                    <div key={r.topic + i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all active:scale-98"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}
                      onClick={() => goToTopicTest(r.topic, undefined)}
                    >
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">{r.topic}</p>
                        <p className="text-[10px]" style={{ color: "rgba(110,231,183,0.6)" }}>
                          {r.days_overdue === 0 ? "Đến hạn hôm nay" : `Quá hạn ${r.days_overdue} ngày`}
                          {" · "}Mastery {r.mastery}%
                          {" · "}Lần ôn {r.sm2_repetitions}
                        </p>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: r.days_overdue > 0 ? "#f87171" : "#34d399" }}>
                        {r.days_overdue > 0 ? "⚠" : "✓"}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => goToTopicTest(dash!.due_reviews![0].topic, undefined)}
                  className="w-full py-3 font-black text-sm rounded-2xl transition-all active:scale-98"
                  style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", boxShadow: "0 6px 24px rgba(16,185,129,0.3)", color: "#fff" }}
                >
                  Bắt đầu ôn tập →
                </button>
              </div>
            )}

            {/* Active Roadmap Card */}
            {hasValidRoadmap ? (
              <div className="rounded-3xl p-5 mb-4 relative overflow-hidden" style={{
                ...cardStyle(3),
                background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.12))",
                border: "1px solid rgba(99,102,241,0.25)",
                boxShadow: "0 20px 60px rgba(59,130,246,0.1)"
              }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
                  style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#a78bfa", border: "1px solid rgba(99,102,241,0.3)" }}>
                    ◈ LỘ TRÌNH HIỆN TẠI
                  </span>
                  <button onClick={() => router.push(`/roadmap?id=${latestRoadmap.roadmap_id}`)}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: "var(--text-secondary)" }}>
                    Xem đầy đủ →
                  </button>
                </div>

                <p className="text-white font-black text-lg mb-1">{latestRoadmap.scenario_name}</p>
                {currentWeek && (
                  <>
                    <p className="text-sm mb-3" style={{ color: "#93c5fd" }}>Tuần {currentWeek.week}/{totalWeeks}: {currentWeek.theme}</p>
                    <div className="space-y-2 mb-4">
                      {currentWeek.topics.slice(0, 3).map((t: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.06)" }}>
                          <span className="text-xs font-black w-4" style={{ color: "rgba(147,197,253,0.6)" }}>{i + 1}</span>
                          <span className="text-white text-xs font-medium flex-1">{t.name}</span>
                          <span className="text-xs" style={{ color: "rgba(147,197,253,0.5)" }}>⏱ {t.time_minutes}p</span>
                        </div>
                      ))}
                      {currentWeek.topics.length > 3 && (
                        <p className="text-center text-xs" style={{ color: "rgba(147,197,253,0.4)" }}>+{currentWeek.topics.length - 3} chủ đề nữa</p>
                      )}
                    </div>
                  </>
                )}
                <button onClick={() => goToTopicTest(focusedTopicName || undefined, currentWeek?.week)}
                  className="w-full py-3 font-black text-sm rounded-2xl transition-all active:scale-98"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 6px 24px rgba(59,130,246,0.3)" }}>
                  Làm bài kiểm tra tuần này →
                </button>
              </div>
            ) : (
              <div className="glass rounded-3xl p-6 mb-4 text-center" style={{ ...cardStyle(3), border: "1px dashed rgba(255,255,255,0.1)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl mx-auto mb-4"
                  style={{ background: "rgba(255,255,255,0.05)" }}>◎</div>
                <p className="text-white font-bold mb-1">Chưa có lộ trình AI</p>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Làm bài kiểm tra để Gemini tạo lộ trình cá nhân hóa cho bạn!</p>
                <button onClick={() => goToTopicTest()}
                  className="px-6 py-3 font-black text-white rounded-2xl text-sm"
                  style={{ background: subjectGradient, boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}>
                  Bắt đầu kiểm tra →
                </button>
              </div>
            )}

            {/* Progress Card */}
            <div className="glass rounded-3xl p-5 mb-4" style={cardStyle(4)}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    CURRENT FOCUS
                  </span>
                  <h2 className="text-white font-black text-lg mt-2 leading-snug">
                    {inProgress ? inProgress.topic : `${cfg?.subject || "Môn học"} của bạn`}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {cfg?.mode === "exam" ? "Chế độ thi cử" : "Học toàn diện"} · Tuần {inProgress?.week || 1}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                  style={{ background: subjectGradient }}>
                  {subjectIcon}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Total Progress</span>
                  <span className="font-black text-white">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full progress-fill" data-width={`${progress}%`}
                    style={{ width: "0%", background: subjectGradient }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <StatCard label="Modules" value={`${strongCount}/${totalTopics}`} color={subjectGradient} />
                <StatCard label="Score" value={`${lastScore}%`} color="linear-gradient(135deg, #10b981, #06b6d4)" />
                <StatCard label="Time" value={`${totalStudyTime}m`} color="linear-gradient(135deg, #f59e0b, #f97316)" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => goToTopicTest(focusedTopicName || undefined, currentWeek?.week)}
                  className="flex-1 py-3 font-black text-white rounded-2xl text-sm transition-all active:scale-98"
                  style={{ background: subjectGradient, boxShadow: "0 6px 24px rgba(99,102,241,0.2)" }}>
                  Continue →
                </button>
                {hasValidRoadmap && (
                  <button onClick={() => router.push(`/roadmap?id=${latestRoadmap.roadmap_id}`)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
                    ◎
                  </button>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3 mb-4" style={cardStyle(5)}>
              <div className="glass rounded-3xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Tuần đã học</p>
                <p className="font-black text-2xl leading-none text-white">
                  <AnimatedNumber target={dash?.weekly_progress?.length || 0} />
                  <span className="text-sm ml-1 font-medium" style={{ color: "var(--text-muted)" }}>tuần</span>
                </p>
                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(((dash?.weekly_progress?.length || 0) / (totalWeeks || 4)) * 100, 100)}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)" }} />
                </div>
              </div>
              <div className="glass rounded-3xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  {timeLeft && !timeLeft.expired ? "Còn lại" : "Focus Units"}
                </p>
                {timeLeft && !timeLeft.expired ? (
                  <>
                    <p className="font-black text-2xl leading-none" style={{ color: timeLeft.days <= 3 ? "#f87171" : "white" }}>
                      {timeLeft.days}<span className="text-sm ml-1 font-medium" style={{ color: "var(--text-muted)" }}>ngày</span>
                    </p>
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${Math.min(((totalWeeks * 7 - timeLeft.days) / (totalWeeks * 7)) * 100, 100)}%`, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-black text-2xl leading-none text-white">
                      <AnimatedNumber target={weakCount || 0} />
                      <span className="text-sm ml-1 font-medium" style={{ color: "var(--text-muted)" }}>topics</span>
                    </p>
                    <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(((60 - (totalStudyTime % 60)) / 60) * 100, 100)}%`, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Learning Path */}
            <div className="glass rounded-3xl p-5 mb-4" style={cardStyle(6)}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Module Roadmap</p>
              <div className="space-y-2">
                {completed.slice(-2).map((item: any) => (
                  <div key={item.topic} className="flex items-center gap-3 py-2.5 px-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <span className="text-[10px] text-emerald-400 font-black">✓</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through truncate" style={{ color: "var(--text-muted)" }}>{item.topic}</p>
                      <p className="text-[10px]" style={{ color: "rgba(100,116,139,0.6)" }}>Completed · Tuần {item.week}</p>
                    </div>
                  </div>
                ))}

                {inProgress && (
                  <div className="flex items-center gap-3 py-3 px-3 rounded-2xl"
                    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                      <span className="text-[10px] text-white font-black">▶</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{inProgress.topic}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>In Progress</p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  </div>
                )}

                {upcoming.map((item: any, i: number) => (
                  <div key={item.topic + i} className="flex items-center gap-3 py-2.5 px-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>◎</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-secondary)" }}>{item.topic}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Up Next · Tuần {item.week}</p>
                    </div>
                  </div>
                ))}

                {learningPath.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-3xl mb-2">◎</p>
                    <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Chưa có lộ trình. Hãy làm bài kiểm tra!</p>
                    <button onClick={() => router.push("/test")}
                      className="px-5 py-2 font-bold text-white text-sm rounded-xl"
                      style={{ background: subjectGradient }}>
                      Bắt đầu ngay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Weak Topics */}
            {dash?.weak_topics?.length ? (
              <div className="glass rounded-3xl p-5 mb-4" style={cardStyle(7)}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>◈ Cần Tập Trung</p>
                <div className="space-y-3">
                  {dash.weak_topics.slice(0, 5).map((t: any) => (
                    <div key={t.topic} className="flex items-center gap-3">
                      <p className="text-sm flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{t.topic}</p>
                      <div className="w-20 h-1 rounded-full overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full progress-fill" data-width={`${t.mastery}%`}
                          style={{ width: "0%", background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right flex-shrink-0" style={{ color: "#f87171" }}>{t.mastery}%</span>
                    </div>
                  ))}
                </div>
                {!!dash?.chronic_weak_topics?.length && (
                  <div className="mt-4 p-3 rounded-2xl"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f87171" }}>
                      Chronic weak
                    </p>
                    <p className="text-xs" style={{ color: "#fecaca" }}>
                      {dash.chronic_weak_topics.join(", ")} đang yếu lặp lại nhiều tuần. Nên học lại từ nền tảng trước khi luyện đề.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}

        </div>{/* center column */}

        {/* RIGHT SIDEBAR — desktop only */}
        <div className="hidden lg:flex flex-col gap-4 w-60 flex-shrink-0 sticky top-6 self-start">

          {/* Weak topics */}
          {!!dash?.weak_topics?.length && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>◈ Cần tập trung</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>{dash.weak_topics.length} chủ đề</span>
              </div>
              <div className="space-y-2.5">
                {dash.weak_topics.slice(0, 5).map((t: any) => (
                  <div key={t.topic} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs truncate flex-1 pr-2" style={{ color: "var(--text-secondary)" }}>{t.topic}</p>
                      <span className="text-[10px] font-black flex-shrink-0" style={{ color: "#f87171" }}>{t.mastery}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${t.mastery}%`, background: "linear-gradient(90deg,#ef4444,#f97316)" }} />
                    </div>
                  </div>
                ))}
              </div>
              {!!dash?.chronic_weak_topics?.length && (
                <div className="mt-3 px-2.5 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#f87171" }}>Lặp lại yếu</p>
                  <p className="text-[10px]" style={{ color: "#fca5a5" }}>{dash.chronic_weak_topics.slice(0, 2).join(", ")}</p>
                </div>
              )}
            </div>
          )}

          {/* Due reviews */}
          {(dash?.due_reviews_count ?? 0) > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>◈ Ôn tập SM-2</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>{dash!.due_reviews_count}</span>
              </div>
              <div className="space-y-2">
                {dash?.due_reviews?.slice(0, 4).map((r, i) => (
                  <div key={r.topic + i}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => goToTopicTest(r.topic, undefined)}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r.days_overdue > 0 ? "#f87171" : "#34d399" }} />
                    <p className="text-xs flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{r.topic}</p>
                    <span className="text-[9px] font-bold flex-shrink-0" style={{ color: r.days_overdue > 0 ? "#f87171" : "#34d399" }}>
                      {r.days_overdue > 0 ? `+${r.days_overdue}d` : "Hôm nay"}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => goToTopicTest(dash?.due_reviews?.[0]?.topic, undefined)}
                className="w-full mt-3 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }}>
                Ôn tập ngay →
              </button>
            </div>
          )}

          {/* Learning path preview */}
          {learningPath.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Lộ trình học</p>
              <div className="space-y-2">
                {learningPath.slice(0, 6).map((item: any, i: number) => (
                  <div key={item.topic + i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[8px] font-black"
                      style={item.status === "completed"
                        ? { background: "rgba(16,185,129,0.15)", color: "#34d399" }
                        : item.status === "in_progress"
                        ? { background: subjectGradient, color: "#fff" }
                        : { background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                      {item.status === "completed" ? "✓" : item.status === "in_progress" ? "▶" : "○"}
                    </div>
                    <p className="text-xs flex-1 truncate"
                      style={{ color: item.status === "in_progress" ? "#fff" : item.status === "completed" ? "var(--text-muted)" : "var(--text-secondary)" }}>
                      {item.topic}
                    </p>
                    {item.status === "in_progress" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly progress mini */}
          {(dash?.weekly_progress?.length || 0) > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Điểm tuần gần nhất</p>
              <div className="space-y-1.5">
                {dash!.weekly_progress.slice(-4).reverse().map((w: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] w-10 flex-shrink-0" style={{ color: "var(--text-muted)" }}>Tuần {w.week}</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(w.score * 10, 100)}%`, background: subjectGradient }} />
                    </div>
                    <span className="text-[10px] font-bold w-5 text-right flex-shrink-0 text-white">{w.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>{/* right sidebar */}

        </div>{/* lg:flex 3-col close */}

      </div>
      </div>

      {/* Update Questions Panel (slides up above bottom nav) */}
      {showUpdatePanel && (
        <div className="fixed bottom-[68px] left-0 right-0 z-50 flex justify-center px-4 animate-slide-up">
          <div className="w-full max-w-md rounded-3xl p-5 shadow-2xl"
            style={{ background: "rgba(10,11,20,0.97)", border: "1px solid rgba(167,139,250,0.3)", backdropFilter: "blur(32px)", boxShadow: "0 -8px 40px rgba(99,102,241,0.15), 0 20px 60px rgba(0,0,0,0.5)" }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🗃️</span>
                <p className="text-white font-black text-sm">Ngân hàng câu hỏi</p>
              </div>
              <button onClick={() => { setShowUpdatePanel(false); setScrapePhase("idle"); }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>✕</button>
            </div>

            {/* Stats row */}
            {scrapeStats && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>Tổng câu hỏi</p>
                  <p className="text-white font-black text-xl">{(scrapeStats.total_questions_in_db || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>URL đã crawl</p>
                  <p className="font-black text-xl" style={{ color: "#10b981" }}>{scrapeStats.scraped_urls_success || 0}</p>
                </div>
              </div>
            )}

            {/* Subject breakdown */}
            {scrapeStats?.by_subject_grade?.length > 0 && (
              <div className="mb-4 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "var(--text-muted)" }}>Theo môn</p>
                <div className="space-y-1">
                  {Object.entries(
                    scrapeStats.by_subject_grade.reduce((acc: any, row: any) => {
                      acc[row.subject] = (acc[row.subject] || 0) + row.questions;
                      return acc;
                    }, {})
                  ).map(([subj, count]: any) => (
                    <div key={subj} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{subj}</span>
                      <span className="text-xs font-bold text-white">{count.toLocaleString()} câu</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status message */}
            {scrapePhase === "loading" && (
              <div className="flex items-center gap-3 mb-4 rounded-xl p-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0" style={{ borderColor: "#a78bfa", borderTopColor: "transparent" }} />
                <p className="text-xs font-medium" style={{ color: "#a78bfa" }}>Đang cập nhật câu hỏi từ VietJack... có thể mất vài phút.</p>
              </div>
            )}
            {scrapePhase === "done" && (
              <div className="flex items-center gap-2 mb-4 rounded-xl p-3" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <span className="text-base">✅</span>
                <p className="text-xs font-bold" style={{ color: "#10b981" }}>
                  Hoàn thành!{scrapeNewCount > 0 ? ` Thêm được ${scrapeNewCount.toLocaleString()} câu hỏi mới.` : " Không có câu hỏi mới (đã cập nhật đầy đủ)."}
                </p>
              </div>
            )}
            {scrapePhase === "error" && (
              <div className="flex items-center gap-2 mb-4 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <span className="text-base">⚠️</span>
                <p className="text-xs font-bold" style={{ color: "#ef4444" }}>Có lỗi xảy ra. Vui lòng thử lại.</p>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleUpdateQuestions}
              disabled={scrapePhase === "loading"}
              className="w-full py-3 rounded-xl font-black text-sm text-white transition-all"
              style={{
                background: scrapePhase === "loading"
                  ? "rgba(99,102,241,0.3)"
                  : scrapePhase === "done"
                  ? "linear-gradient(135deg,#10b981,#06b6d4)"
                  : "linear-gradient(135deg,#6366f1,#a78bfa)",
                opacity: scrapePhase === "loading" ? 0.7 : 1,
              }}>
              {scrapePhase === "loading" ? "Đang cập nhật..." : scrapePhase === "done" ? "✓ Cập nhật lại" : "⟳ Cập nhật câu hỏi"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation — mobile only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: "rgba(7,8,15,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
        }}>
        <div className="max-w-md mx-auto flex items-center justify-around px-3 py-2.5">
          {([
            { id: "focus",   label: "Focus",   icon: "◉" },
            { id: "test",    label: "Test",    icon: "◎" },
            { id: "roadmap", label: "Roadmap", icon: "◈" },
            { id: "papers",  label: "Papers",  icon: "📋" },
            { id: "profile", label: "Profile", icon: "○" },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id}
                onClick={() => {
                  if (tab.id === "test") goToTopicTest(focusedTopicName || undefined, currentWeek?.week);
                  else if (tab.id === "roadmap") hasValidRoadmap ? router.push(`/roadmap?id=${latestRoadmap.roadmap_id}`) : goToTopicTest();
                  else if (tab.id === "papers") router.push("/past-papers");
                  else setActiveTab(tab.id);
                }}
                className="flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-2xl transition-all duration-200 relative"
                style={isActive
                  ? { background: "rgba(99,102,241,0.18)", color: "#a78bfa", boxShadow: "0 0 16px rgba(99,102,241,0.2)" }
                  : { color: "#475569" }}>
                {isActive && (
                  <span className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)", boxShadow: "0 0 6px rgba(99,102,241,0.6)" }} />
                )}
                <span className="text-base leading-none">{tab.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}

          {/* Update Questions button */}
          <button
            onClick={async () => {
              if (!showUpdatePanel) {
                try {
                  const s = await api.getScrapeStatus();
                  setScrapeStats(s.data?.db_stats);
                } catch {}
              }
              setShowUpdatePanel(v => !v);
            }}
            className="flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-2xl transition-all duration-200 relative"
            style={showUpdatePanel
              ? { background: "rgba(16,185,129,0.18)", color: "#34d399", boxShadow: "0 0 16px rgba(16,185,129,0.2)" }
              : { color: "#475569" }}>
            {scrapePhase === "loading" && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" style={{ boxShadow: "0 0 6px rgba(99,102,241,0.7)" }} />
            )}
            {scrapePhase === "done" && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
            )}
            <span className={`text-base leading-none ${scrapePhase === "loading" ? "animate-spin-slow" : ""}`}>⟳</span>
            <span className="text-[9px] font-black uppercase tracking-widest">Update</span>
          </button>
        </div>
      </div>

      <ChatBot
        userContext={chatContext}
        avatarData={avatarData}
        mascotName={mascotName}
        mascotPersonality={mascotPersonality}
      />
    </div>
  );
}
