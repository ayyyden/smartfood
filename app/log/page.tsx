"use client";

import { useApp } from "@/context/AppContext";
import FoodEntryCard from "@/components/FoodEntryCard";
import { fmtCal, fmtMacro } from "@/lib/format";

export default function LogPage() {
  const { state } = useApp();
  const { entries } = state;

  const total = {
    calories: entries.reduce((s, e) => s + e.calories, 0),
    protein:  entries.reduce((s, e) => s + e.protein, 0),
    carbs:    entries.reduce((s, e) => s + e.carbs, 0),
    fat:      entries.reduce((s, e) => s + e.fat, 0),
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-5">
      {/* Header */}
      <div className="px-1 pb-4">
        <p className="text-[22px] font-black leading-tight" style={{ color: "var(--sf-text1)" }}>
          Food Log
        </p>
        <p className="mt-0.5 text-sm" style={{ color: "var(--sf-text6)" }}>
          {entries.length === 0
            ? "Nothing logged today"
            : `${entries.length} item${entries.length === 1 ? "" : "s"} today`}
        </p>
      </div>

      {entries.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-10 text-center"
          style={{ border: "1px dashed var(--sf-pill)", backgroundColor: "var(--sf-surface2)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--sf-text7)" }}>
            Nothing logged today
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--sf-text8)" }}>
            Go to Home and use the chat to log your meals
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {entries.map((entry) => (
              <FoodEntryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Daily totals */}
          <div
            className="mt-4 overflow-hidden rounded-2xl"
            style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
          >
            <div
              className="border-b px-5 py-3.5"
              style={{ borderColor: "var(--sf-border)" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--sf-text7)" }}
              >
                Today&apos;s totals
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-2xl font-black" style={{ color: "var(--sf-text1)" }}>
                {fmtCal(total.calories)}
                <span className="ml-1 text-sm font-medium" style={{ color: "var(--sf-text6)" }}>
                  cal
                </span>
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
