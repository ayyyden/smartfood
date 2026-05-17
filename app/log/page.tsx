"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp, type FoodEntry } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import {
  getLocalDateKey,
  shiftDateKey,
  fetchEntriesByDateKey,
} from "@/lib/db/food-entries";
import FoodEntryCard from "@/components/FoodEntryCard";
import { fmtCal, fmtMacro } from "@/lib/format";

function formatNavLabel(dateKey: string, t: (k: string) => string, lang: string): string {
  const todayKey = getLocalDateKey();
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const locale = lang === "he" ? "he-IL" : "en-US";
  const monthDay = date.toLocaleDateString(locale, { month: "long", day: "numeric" });
  if (dateKey === todayKey) return `${t("foodLog.today")}, ${monthDay}`;
  if (dateKey === shiftDateKey(todayKey, -1)) return `${t("foodLog.yesterday")}, ${monthDay}`;
  return date.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

export default function LogPage() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const { t, lang, dir } = useLang();

  const todayKey = getLocalDateKey();
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [pastEntries, setPastEntries] = useState<FoodEntry[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);

  const isToday = selectedKey === todayKey;
  const displayEntries = isToday ? state.entries : pastEntries;

  useEffect(() => {
    if (isToday) {
      setPastEntries([]);
      return;
    }
    setLoadingPast(true);
    const key = selectedKey;
    const load = async () => {
      if (user) {
        const entries = await fetchEntriesByDateKey(user.id, key);
        setPastEntries(entries);
      } else {
        try {
          const raw = localStorage.getItem("smartfood_" + key);
          setPastEntries(raw ? (JSON.parse(raw) as FoodEntry[]) : []);
        } catch {
          setPastEntries([]);
        }
      }
      setLoadingPast(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, user?.id]);

  function handlePastDelete(id: string) {
    setPastEntries((prev) => prev.filter((e) => e.id !== id));
    dispatch({ type: "DELETE_ENTRY", payload: id });
  }

  function handlePastEdit(updated: FoodEntry) {
    setPastEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    dispatch({ type: "EDIT_ENTRY", payload: updated });
  }

  const total = {
    calories: displayEntries.reduce((s, e) => s + e.calories, 0),
    protein:  displayEntries.reduce((s, e) => s + e.protein, 0),
    carbs:    displayEntries.reduce((s, e) => s + e.carbs, 0),
    fat:      displayEntries.reduce((s, e) => s + e.fat, 0),
  };

  const canGoForward = selectedKey < todayKey;
  const label = formatNavLabel(selectedKey, t, lang);

  // In RTL, previous/next arrows are visually swapped to match reading direction
  const prevPoints = dir === "rtl" ? "9 18 15 12 9 6" : "15 18 9 12 15 6";
  const nextPoints = dir === "rtl" ? "15 18 9 12 15 6" : "9 18 15 12 9 6";

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-5">
      {/* Page title */}
      <div className="px-1 pb-4">
        <p className="text-[22px] font-black leading-tight" style={{ color: "var(--sf-text1)" }}>
          {t("foodLog.title")}
        </p>
      </div>

      {/* ── Date navigation ── */}
      <div
        className="mb-4 flex items-center justify-between rounded-2xl px-2 py-2"
        style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
      >
        {/* Previous day */}
        <button
          onClick={() => setSelectedKey((k) => shiftDateKey(k, -1))}
          aria-label={t("foodLog.prevDay")}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90"
          style={{ backgroundColor: "var(--sf-input)", color: "var(--sf-text4)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={prevPoints} />
          </svg>
        </button>

        {/* Center: label + optional Today pill */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold" style={{ color: "var(--sf-text1)" }}>
            {label}
          </p>
          {!isToday && (
            <button
              onClick={() => setSelectedKey(todayKey)}
              className="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95"
              style={{ backgroundColor: "rgba(0,210,255,0.12)", color: "#00d2ff" }}
            >
              {t("foodLog.today")}
            </button>
          )}
        </div>

        {/* Next day (disabled on today) */}
        <button
          onClick={() => { if (canGoForward) setSelectedKey((k) => shiftDateKey(k, 1)); }}
          disabled={!canGoForward}
          aria-label={t("foodLog.nextDay")}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90"
          style={{
            backgroundColor: canGoForward ? "var(--sf-input)" : "transparent",
            color: canGoForward ? "var(--sf-text4)" : "var(--sf-border2)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={nextPoints} />
          </svg>
        </button>
      </div>

      {/* Subtitle */}
      <div className="px-1 pb-3">
        <p className="text-sm" style={{ color: "var(--sf-text6)" }}>
          {loadingPast
            ? t("foodLog.loading")
            : displayEntries.length === 0
            ? isToday
              ? t("foodLog.nothingToday")
              : t("foodLog.nothingDay")
            : `${displayEntries.length} ${displayEntries.length === 1 ? t("foodLog.item") : t("foodLog.items")}`}
        </p>
      </div>

      {/* ── Content ── */}
      {loadingPast ? (
        <div className="flex flex-1 items-center justify-center">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--sf-input)", borderTopColor: "#00d2ff" }}
          />
        </div>
      ) : displayEntries.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-10 text-center"
          style={{ border: "1px dashed var(--sf-pill)", backgroundColor: "var(--sf-surface2)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--sf-text7)" }}>
            {isToday ? t("foodLog.nothingToday") : t("foodLog.nothingDay")}
          </p>
          {isToday && (
            <p className="mt-1 text-xs" style={{ color: "var(--sf-text8)" }}>
              {t("foodLog.logHint")}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayEntries.map((entry) =>
              isToday ? (
                <FoodEntryCard key={entry.id} entry={entry} />
              ) : (
                <FoodEntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handlePastDelete}
                  onEdit={handlePastEdit}
                />
              )
            )}
          </div>

          {/* Day totals */}
          <div
            className="mt-4 overflow-hidden rounded-2xl"
            style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
          >
            <div className="border-b px-5 py-3.5" style={{ borderColor: "var(--sf-border)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--sf-text7)" }}>
                {isToday ? t("foodLog.todayTotals") : t("foodLog.dayTotals")}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-2xl font-black" style={{ color: "var(--sf-text1)" }}>
                {fmtCal(total.calories)}
                <span className="ml-1 text-sm font-medium" style={{ color: "var(--sf-text6)" }}>cal</span>
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--sf-text6)" }}>
                P{" "}
                <span className="font-bold" style={{ color: "#38bdf8" }}>{fmtMacro(total.protein)}g</span>
                {"  ·  "}C{" "}
                <span className="font-bold" style={{ color: "#a78bfa" }}>{fmtMacro(total.carbs)}g</span>
                {"  ·  "}F{" "}
                <span className="font-bold" style={{ color: "#fb7185" }}>{fmtMacro(total.fat)}g</span>
              </p>
            </div>
          </div>

          <div className="h-4 shrink-0" />
        </>
      )}
    </div>
  );
}
