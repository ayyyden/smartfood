"use client";

import { useState, useEffect } from "react";
import ChatBox from "@/components/ChatBox";
import ProPanel from "@/components/ProPanel";
import DailyInfoCard from "@/components/DailyInfoCard";
import Tutorial from "@/components/Tutorial";
import { useAuth } from "@/context/AuthContext";
import { fetchProfile, markTutorialCompleted } from "@/lib/db/profiles";

type TrackingMode = "smart" | "pro";
const MODE_KEY = "smartfood_mode";
const TUTORIAL_REOPEN_KEY = "smartfood_tutorial_reopen";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<TrackingMode>("smart");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "smart" || saved === "pro") setMode(saved as TrackingMode);
  }, []);

  // Show tutorial on first visit after onboarding, or when reopened from Settings
  useEffect(() => {
    const reopen = localStorage.getItem(TUTORIAL_REOPEN_KEY) === "1";
    if (reopen) {
      localStorage.removeItem(TUTORIAL_REOPEN_KEY);
      setShowTutorial(true);
      return;
    }
    if (!user) return;
    fetchProfile(user.id)
      .then((p) => { if (p && !p.tutorialCompleted) setShowTutorial(true); })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTutorialDone() {
    setShowTutorial(false);
    if (user) {
      try { await markTutorialCompleted(user.id); } catch { /* non-critical */ }
    }
  }

  const greeting = getGreeting();

  return (
    <div className="flex h-full flex-col">
      {showTutorial && <Tutorial onDone={handleTutorialDone} />}

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Greeting */}
        <div className="px-1">
          <p
            suppressHydrationWarning
            className="text-[22px] font-black leading-tight"
            style={{ color: "var(--sf-text1)" }}
          >
            {greeting}
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--sf-text6)" }}>
            Here&apos;s your day so far
          </p>
        </div>

        {/* Daily card */}
        <DailyInfoCard />

      </div>

      {/* Bottom input — swaps based on mode */}
      {mode === "smart" ? <ChatBox /> : <ProPanel />}
    </div>
  );
}
