"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../src/contexts/auth";
import api from "../../src/lib/api";

function OAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    const userId = params.get("user_id");
    if (!token || !userId) {
      router.replace("/");
      return;
    }
    (async () => {
      try {
        const res = await api.getUser(Number(userId));
        login(res.data, token);
        try {
          await api.getConfig(Number(userId));
          router.replace("/dashboard");
        } catch {
          router.replace("/onboarding/subject");
        }
      } catch {
        router.replace("/");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#070b14" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
          style={{ animation: "spin 1s linear infinite" }} />
        <p className="text-sm" style={{ color: "#64748b" }}>Đang xác thực…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070b14" }}>
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
          style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <OAuthCallbackInner />
    </Suspense>
  );
}
