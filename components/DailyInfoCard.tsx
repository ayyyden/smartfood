"use client";

import { useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { fmtCal, fmtMacro, calHeroSize } from "@/lib/format";

export default function DailyInfoCard() {
  const { state } = useApp();
  const { t, lang } = useLang();
  const { entries, goals } = state;

  const eaten   = entries.reduce((s, e) => s + e.calories, 0);
  const protein = entries.reduce((s, e) => s + e.protein, 0);
  const carbs   = entries.reduce((s, e) => s + e.carbs, 0);
  const fat     = entries.reduce((s, e) => s + e.fat, 0);

  const remaining   = Math.max(goals.calories - eaten, 0);
  const progressPct = Math.min((eaten / goals.calories) * 100, 100);
  const overGoal    = eaten > goals.calories;
  const nearDone    = !overGoal && remaining > 0 && remaining < 200;

  const statusLabel = overGoal
    ? t("home.overGoal")
    : entries.length === 0
    ? t("home.notStarted")
    : nearDone
    ? t("home.almostThere")
    : t("home.onTrack");

  const statusStyle = overGoal
    ? { backgroundColor: "rgba(244,63,94,0.1)", color: "#f43f5e" }
    : nearDone
    ? { backgroundColor: "rgba(251,191,36,0.1)", color: "#fbbf24" }
    : entries.length === 0
    ? { backgroundColor: "var(--sf-border)", color: "var(--sf-text5)" }
    : { backgroundColor: "rgba(0,210,255,0.08)", color: "#00d2ff" };

  const dotStyle = overGoal
    ? { backgroundColor: "#f43f5e" }
    : nearDone
    ? { backgroundColor: "#fbbf24" }
    : entries.length === 0
    ? { backgroundColor: "var(--sf-text7)" }
    : { backgroundColor: "#00d2ff" };

  const barColor = overGoal ? "#f43f5e" : "#00d2ff";

  const locale = lang === "he" ? "he-IL" : "en-US";
  const today = new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-5">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--sf-text6)" }}
          >
            {t("home.today")}
          </p>
          <p
            suppressHydrationWarning
            className="mt-0.5 text-sm"
            style={{ color: "var(--sf-text4)" }}
          >
            {today}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={statusStyle}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={dotStyle} />
          {statusLabel}
        </span>
      </div>

      {/* ── Calorie hero ── */}
      <div className="px-5 pb-5 text-center">
        <div className="flex items-baseline justify-center gap-2 overflow-hidden">
          <span
            className={`${calHeroSize(eaten)} font-black leading-none tracking-tight`}
            style={{ color: "var(--sf-text1)" }}
          >
            {fmtCal(eaten)}
          </span>
          <span
            className="shrink-0 pb-1 text-2xl font-semibold leading-none"
            style={{ color: "var(--sf-text7)" }}
          >
            /{fmtCal(goals.calories)}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium" style={{ color: "var(--sf-text5)" }}>
          {t("home.caloriesEaten")}
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="px-5 pb-5">
        <div
          className="relative h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--sf-input)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progressPct}%`,
              backgroundColor: barColor,
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--sf-text6)" }}>
            {eaten === 0
              ? t("home.nothingLogged")
              : t("home.percentOfGoal", { pct: progressPct.toFixed(0) })}
          </span>
          <span
            className="text-xs font-bold"
            style={{ color: overGoal ? "#f43f5e" : "#00d2ff" }}
          >
            {overGoal
              ? t("home.over", { cal: fmtCal(eaten - goals.calories) })
              : t("home.calLeft", { cal: fmtCal(remaining) })}
          </span>
        </div>
      </div>

      {/* ── Macro grid ── */}
      <div className="grid grid-cols-3" style={{ gap: "1px", backgroundColor: "var(--sf-border)" }}>
        <MacroCell label={t("home.protein")} eaten={protein} goal={goals.protein} color="#38bdf8" goalLabel={t("home.ofGoal", { goal: goals.protein })} />
        <MacroCell label={t("home.carbs")}   eaten={carbs}   goal={goals.carbs}   color="#a78bfa" goalLabel={t("home.ofGoal", { goal: goals.carbs })} />
        <MacroCell label={t("home.fat")}     eaten={fat}     goal={goals.fat}     color="#fb7185" goalLabel={t("home.ofGoal", { goal: goals.fat })} />
      </div>

      {/* ── Net footer ── */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ backgroundColor: "var(--sf-surface2)" }}
      >
        <span className="text-xs" style={{ color: "var(--sf-text6)" }}>{t("home.netCalories")}</span>
        <span className="text-sm font-bold" style={{ color: "var(--sf-text1)" }}>
          {fmtCal(eaten)} cal
        </span>
      </div>
    </div>
  );
}

function MacroCell({
  label,
  eaten,
  goal,
  color,
  goalLabel,
}: {
  label: string;
  eaten: number;
  goal: number;
  color: string;
  goalLabel: string;
}) {
  const pct = goal > 0 ? Math.min((eaten / goal) * 100, 100) : 0;
  return (
    <div
      className="flex flex-col items-center px-3 py-4"
      style={{ backgroundColor: "var(--sf-surface)" }}
    >
      <p className="max-w-full truncate text-xl font-black leading-none" style={{ color }}>
        {fmtMacro(eaten)}
        <span className="text-[11px] font-medium" style={{ color: "var(--sf-text6)" }}>g</span>
      </p>
      <p className="mt-1.5 text-[11px] font-semibold" style={{ color: "var(--sf-text5)" }}>
        {label}
      </p>
      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--sf-input)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1.5 text-[10px]" style={{ color: "var(--sf-text7)" }}>
        {goalLabel}
      </p>
    </div>
  );
}
