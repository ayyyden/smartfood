"use client";

import { useState, useEffect } from "react";
import { loadProfile, DEFAULT_PROFILE } from "@/lib/profile";
import type { Profile } from "@/lib/profile";
import {
  createWeightLog,
  kgToLb,
  lbToKg,
  type WeightLog,
} from "@/lib/weightLogs";
import { useAuth } from "@/context/AuthContext";
import { fetchWeightLogs, insertWeightLog, updateWeightLog, deleteWeightLog } from "@/lib/db/weight-logs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split("T")[0]; }

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div
      className="overflow-hidden rounded-full"
      style={{ height: "5px", backgroundColor: "var(--sf-border2)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.round(clamped * 100)}%`,
          backgroundColor: "#00d2ff",
          boxShadow: clamped > 0 ? "0 0 10px rgba(0,210,255,0.5)" : "none",
        }}
      />
    </div>
  );
}

// ─── Edit row ─────────────────────────────────────────────────────────────────

function EditRow({
  log,
  unit,
  value,
  onChange,
  onSave,
  onCancel,
}: {
  log: WeightLog;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex flex-1 items-center gap-2 rounded-xl px-3.5 py-2.5"
        style={{
          backgroundColor: "var(--sf-input)",
          border: "1px solid rgba(0,210,255,0.35)",
        }}
      >
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          className="flex-1 min-w-0 bg-transparent text-sm font-bold focus:outline-none"
          style={{ color: "var(--sf-text1)" }}
        />
        <span className="shrink-0 text-xs" style={{ color: "var(--sf-text5)" }}>{unit}</span>
      </div>
      <button
        onClick={onSave}
        className="rounded-xl px-3.5 py-2.5 text-xs font-bold"
        style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
      >
        Save
      </button>
      <button
        onClick={onCancel}
        className="rounded-xl px-3 py-2.5 text-xs font-bold"
        style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text4)" }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [logs, setLogs]       = useState<WeightLog[]>([]);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [logWeight, setLogWeight]   = useState("");
  const [logDate, setLogDate]       = useState("");

  useEffect(() => {
    setProfile(loadProfile());
    setLogDate(todayStr());
    if (user) {
      fetchWeightLogs(user.id).then((loaded) => setLogs(loaded));
    }
  }, [user]);

  const isImperial    = profile.unitSystem === "imperial";
  const unit          = isImperial ? "lb" : "kg";
  const goalKg        = profile.goalWeightKg !== "" ? (profile.goalWeightKg as number) : null;
  const profileWtKg   = profile.weightKg     !== "" ? (profile.weightKg     as number) : null;

  const latestLog  = logs[0]                     ?? null;
  const oldestLog  = logs.length > 0 ? logs[logs.length - 1] : null;

  // Current: newest log → fallback to profile weight
  const currentKg = latestLog?.weight ?? profileWtKg ?? null;

  // Starting: oldest log if ≥2 entries; profile weight if no logs; else null
  const startKg =
    logs.length >= 2  ? oldestLog!.weight :
    logs.length === 0 ? profileWtKg :
    null;

  // Change shown only when we have ≥2 logs
  const changeKg =
    logs.length >= 2 && currentKg !== null && startKg !== null
      ? currentKg - startKg
      : null;

  // Remaining (positive = still to lose/gain, negative = overshot)
  const remainingKg =
    currentKg !== null && goalKg !== null ? goalKg - currentKg : null;

  // Progress bar 0→1
  let progressPct = 0;
  if (goalKg !== null && startKg !== null && currentKg !== null && startKg !== goalKg) {
    progressPct = goalKg < startKg
      ? (startKg - currentKg) / (startKg - goalKg)   // losing
      : (currentKg - startKg) / (goalKg - startKg);  // gaining
    progressPct = Math.max(0, Math.min(1, progressPct));
  } else if (goalKg !== null && startKg !== null && startKg === goalKg) {
    progressPct = 1;
  }

  function dw(kg: number) {
    return isImperial ? `${kgToLb(kg)} lb` : `${kg.toFixed(1)} kg`;
  }

  async function handleLog() {
    if (!user) return;
    const raw = parseFloat(logWeight);
    if (!raw || raw <= 0) return;
    const wKg = isImperial ? lbToKg(raw) : Math.round(raw * 10) / 10;
    const entry = createWeightLog(wKg, logDate || todayStr(), nowTime());
    const updated = [entry, ...logs].sort((a, b) =>
      a.date + a.time < b.date + b.time ? 1 : -1,
    );
    setLogs(updated);
    setLogWeight("");
    await insertWeightLog(user.id, entry);
  }

  async function handleDelete(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    await deleteWeightLog(id);
  }

  function startEdit(log: WeightLog) {
    setEditingId(log.id);
    setEditWeight(String(isImperial ? kgToLb(log.weight) : log.weight));
  }

  async function handleEditSave(log: WeightLog) {
    const raw = parseFloat(editWeight);
    if (!raw || raw <= 0) return;
    const wKg = isImperial ? lbToKg(raw) : Math.round(raw * 10) / 10;
    const updated = logs.map((l) => l.id === log.id ? { ...l, weight: wKg } : l);
    setLogs(updated);
    setEditingId(null);
    await updateWeightLog({ ...log, weight: wKg });
  }

  const canLog = logWeight.trim() !== "" && parseFloat(logWeight) > 0;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: "var(--sf-bg)" }}
    >
      <div className="space-y-4 px-4 py-5" style={{ paddingBottom: "2.5rem" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-1">
          <p className="text-[22px] font-black leading-tight" style={{ color: "var(--sf-text1)" }}>
            Progress
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--sf-text5)" }}>
            Your weight journey
          </p>
        </div>

        {/* ── Summary card ───────────────────────────────────────────────── */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          {/* Hero: current weight */}
          <div className="px-5 pb-5 pt-5" style={{ borderBottom: "1px solid var(--sf-border)" }}>
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sf-text6)" }}
            >
              Current Weight
            </p>

            <p
              className="mt-2 font-black leading-none"
              style={{
                fontSize: "2.75rem",
                color: currentKg !== null ? "#00d2ff" : "var(--sf-text7)",
                textShadow: currentKg !== null ? "0 0 24px rgba(0,210,255,0.25)" : "none",
              }}
            >
              {currentKg !== null ? dw(currentKg) : "—"}
            </p>

            {/* Change badge */}
            {changeKg !== null ? (
              <p
                className="mt-2 text-xs font-bold"
                style={{
                  color:
                    changeKg < 0 ? "#4ade80" :
                    changeKg > 0 ? "#f43f5e" :
                    "var(--sf-text5)",
                }}
              >
                {changeKg < 0 ? "↓ " : changeKg > 0 ? "↑ " : "→ "}
                {isImperial
                  ? `${kgToLb(Math.abs(changeKg))} lb`
                  : `${Math.abs(changeKg).toFixed(1)} kg`}
                {changeKg < 0 ? " lost" : changeKg > 0 ? " gained" : " no change"}
              </p>
            ) : logs.length === 0 && profileWtKg !== null ? (
              <p className="mt-2 text-[11px]" style={{ color: "var(--sf-text6)" }}>
                From your profile · log to start tracking
              </p>
            ) : null}
          </div>

          {/* Started / Goal row */}
          <div className="grid grid-cols-2" style={{ borderBottom: "1px solid var(--sf-border)" }}>
            <div className="px-5 py-4" style={{ borderRight: "1px solid var(--sf-border)" }}>
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sf-text6)" }}
              >
                Started
              </p>
              <p className="mt-1.5 text-lg font-black" style={{ color: "var(--sf-text1)" }}>
                {startKg !== null ? dw(startKg) : "—"}
              </p>
            </div>
            <div className="px-5 py-4">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sf-text6)" }}
              >
                Goal
              </p>
              <p className="mt-1.5 text-lg font-black" style={{ color: "var(--sf-text1)" }}>
                {goalKg !== null ? dw(goalKg) : "—"}
              </p>
            </div>
          </div>

          {/* Progress bar + remaining — only when goal is set and we have data */}
          {goalKg !== null && currentKg !== null ? (
            <div className="px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px]" style={{ color: "var(--sf-text5)" }}>
                  {remainingKg !== null && Math.abs(remainingKg) < 0.15
                    ? "Goal reached!"
                    : remainingKg !== null
                    ? `${dw(Math.abs(remainingKg))} to go`
                    : "Progress to goal"}
                </p>
                <p className="text-[11px] font-bold" style={{ color: "#00d2ff" }}>
                  {Math.round(progressPct * 100)}%
                </p>
              </div>
              <ProgressBar pct={progressPct} />
            </div>
          ) : (
            <div className="px-5 py-3.5">
              <p className="text-[11px]" style={{ color: "var(--sf-text7)" }}>
                Set a goal weight in Profile to see progress
              </p>
            </div>
          )}
        </div>

        {/* ── Log Weight form ────────────────────────────────────────────── */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--sf-border)" }}>
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sf-text6)" }}
            >
              Log Weight
            </p>
          </div>

          <div className="space-y-3 px-5 py-4">
            {/* Weight row */}
            <div
              className="flex items-center gap-2 rounded-xl px-3.5 py-3"
              style={{
                backgroundColor: "var(--sf-input)",
                border: "1px solid var(--sf-border2)",
              }}
            >
              <input
                type="number"
                inputMode="decimal"
                placeholder={isImperial ? "176" : "80.0"}
                value={logWeight}
                onChange={(e) => setLogWeight(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-sm font-bold focus:outline-none"
                style={{ color: "var(--sf-text1)" }}
                onFocus={(e) => {
                  e.currentTarget.parentElement!.style.borderColor = "rgba(0,210,255,0.4)";
                }}
                onBlur={(e) => {
                  e.currentTarget.parentElement!.style.borderColor = "var(--sf-border2)";
                }}
              />
              <span className="shrink-0 text-xs font-medium" style={{ color: "var(--sf-text5)" }}>
                {unit}
              </span>
            </div>

            {/* Date row — full width so the native calendar icon doesn't overflow */}
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              suppressHydrationWarning
              className="w-full rounded-xl px-3.5 py-3 text-sm focus:outline-none"
              style={{
                backgroundColor: "var(--sf-input)",
                border: "1px solid var(--sf-border2)",
                color: "var(--sf-text2)",
              }}
            />

            <button
              onClick={handleLog}
              disabled={!canLog}
              className="w-full rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: canLog ? "#00d2ff" : "var(--sf-border)",
                color:           canLog ? "#0a0a0a" : "var(--sf-text6)",
                cursor: canLog ? "pointer" : "default",
              }}
            >
              Log Weight
            </button>
          </div>
        </div>

        {/* ── History ────────────────────────────────────────────────────── */}
        {logs.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-7 text-center"
            style={{
              backgroundColor: "var(--sf-surface2)",
              border: "1px dashed var(--sf-border2)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--sf-text5)" }}>
              No weight logs yet
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--sf-text7)" }}>
              Log your weight above to start tracking
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl"
            style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
          >
            <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--sf-border)" }}>
              <p
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sf-text6)" }}
              >
                Recent Logs
              </p>
            </div>

            {logs.map((log, idx) => (
              <div
                key={log.id}
                className="px-5 py-4"
                style={{
                  borderBottom: idx < logs.length - 1 ? "1px solid var(--sf-border)" : "none",
                }}
              >
                {editingId === log.id ? (
                  <EditRow
                    log={log}
                    unit={unit}
                    value={editWeight}
                    onChange={setEditWeight}
                    onSave={() => handleEditSave(log)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    {/* Left: date + time */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold" style={{ color: "var(--sf-text2)" }}>
                          {formatDate(log.date)}
                        </p>
                        {idx === 0 && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{
                              backgroundColor: "rgba(0,210,255,0.1)",
                              color: "#00d2ff",
                            }}
                          >
                            latest
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px]" style={{ color: "var(--sf-text6)" }}>
                        {formatTime(log.time)}
                      </p>
                    </div>

                    {/* Right: weight value + edit/delete */}
                    <div className="flex items-center gap-3">
                      <p className="text-base font-black" style={{ color: "var(--sf-text1)" }}>
                        {dw(log.weight)}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => startEdit(log)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ color: "var(--sf-text6)" }}
                          aria-label="Edit"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ color: "var(--sf-text7)" }}
                          aria-label="Delete"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
