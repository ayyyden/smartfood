"use client";

import { useState, useEffect } from "react";
import ChatBox from "@/components/ChatBox";
import ProPanel from "@/components/ProPanel";
import DailyInfoCard from "@/components/DailyInfoCard";

type TrackingMode = "smart" | "pro";
const MODE_KEY = "smartfood_mode";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const [mode, setMode] = useState<TrackingMode>("smart");

  useEffect(() => {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "smart" || saved === "pro") setMode(saved as TrackingMode);
  }, []);

  const greeting = getGreeting();

  return (
    <div className="flex h-full flex-col">
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
