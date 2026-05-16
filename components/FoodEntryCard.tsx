"use client";

import { useState } from "react";
import { useApp, type FoodEntry } from "@/context/AppContext";
import type { FoodItem, NutritionSource } from "@/lib/types";
import { fmtCal, fmtMacro } from "@/lib/format";

type NumericKey = "calories" | "protein" | "carbs" | "fat";

const MACRO_FIELDS: Array<{ key: NumericKey; label: string }> = [
  { key: "calories", label: "Cal" },
  { key: "protein", label: "Protein" },
  { key: "carbs", label: "Carbs" },
  { key: "fat", label: "Fat" },
];

// ── Source badge ──────────────────────────────────────────

const SOURCE_CONFIG: Record<
  NutritionSource,
  { label: string; color: string; bg: string }
> = {
  usda:     { label: "USDA",     color: "#00d2ff", bg: "rgba(0,210,255,0.08)"   },
  ai:       { label: "AI est.",  color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
  mock:     { label: "Mock",     color: "var(--sf-text5)", bg: "var(--sf-input)"},
  manual:   { label: "Manual",   color: "#fb923c", bg: "rgba(251,146,60,0.08)"  },
  built_in: { label: "Built-in", color: "#4ade80", bg: "rgba(74,222,128,0.08)"  },
};

function SourceBadge({ source }: { source?: NutritionSource }) {
  const cfg = SOURCE_CONFIG[source ?? "ai"];
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ── Item row (inside details) ─────────────────────────────

function ItemRow({ item }: { item: FoodItem }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ backgroundColor: "var(--sf-border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className="truncate text-[13px] font-medium capitalize"
            style={{ color: "var(--sf-text1)" }}
          >
            {item.name}
          </p>
          {typeof item.grams === "number" && (
            <span className="shrink-0 text-[11px]" style={{ color: "var(--sf-text5)" }}>
              {item.grams}g
            </span>
          )}
        </div>
        <SourceBadge source={item.source} />
      </div>

      <p className="mt-1 text-[11px]" style={{ color: "var(--sf-text6)" }}>
        {fmtCal(item.calories)} cal{"  "}
        P{" "}
        <span style={{ color: "#38bdf8" }}>{fmtMacro(item.protein)}g</span>
        {"  "}C{" "}
        <span style={{ color: "#a78bfa" }}>{fmtMacro(item.carbs)}g</span>
        {"  "}F{" "}
        <span style={{ color: "#fb7185" }}>{fmtMacro(item.fat)}g</span>
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function FoodEntryCard({ entry }: { entry: FoodEntry }) {
  const { dispatch } = useApp();
  const [editing, setEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [draft, setDraft] = useState<FoodEntry>(entry);

  const time = new Date(entry.time).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const hasItems = Array.isArray(entry.items) && entry.items.length > 0;

  function handleDelete() {
    dispatch({ type: "DELETE_ENTRY", payload: entry.id });
  }

  function handleSave() {
    dispatch({ type: "EDIT_ENTRY", payload: draft });
    setEditing(false);
  }

  function handleCancel() {
    setDraft(entry);
    setEditing(false);
  }

  // ── Edit view ──
  if (editing) {
    return (
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
      >
        <textarea
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-xl p-3 text-sm focus:outline-none transition-colors"
          style={{
            backgroundColor: "var(--sf-input)",
            border: "1px solid var(--sf-border2)",
            color: "var(--sf-text2)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--sf-border2)"; }}
        />

        <div className="grid grid-cols-4 gap-2">
          {MACRO_FIELDS.map(({ key, label }) => (
            <div key={key} className="text-center">
              <input
                type="number"
                min={0}
                value={draft[key]}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    [key]: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-full rounded-xl p-2 text-center text-sm font-bold focus:outline-none transition-colors"
                style={{
                  backgroundColor: "var(--sf-input)",
                  border: "1px solid var(--sf-border2)",
                  color: "var(--sf-text2)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--sf-border2)"; }}
              />
              <p className="mt-1.5 text-[10px] font-semibold" style={{ color: "var(--sf-text6)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--sf-input)", color: "var(--sf-text4)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Normal view ──
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
    >
      {/* Top row: time + action buttons */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium" style={{ color: "var(--sf-text6)" }}>{time}</p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit entry"
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--sf-text7)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sf-text3)"; e.currentTarget.style.backgroundColor = "var(--sf-input)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sf-text7)"; e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            aria-label="Delete entry"
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "rgba(244,63,94,0.3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f43f5e"; e.currentTarget.style.backgroundColor = "rgba(244,63,94,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(244,63,94,0.3)"; e.currentTarget.style.backgroundColor = "transparent"; }}
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

      {/* Meal description */}
      <p className="line-clamp-2 text-sm font-medium leading-snug" style={{ color: "var(--sf-text2)" }}>
        {entry.text}
      </p>

      {/* Calories */}
      <p className="mt-3 text-2xl font-black leading-none" style={{ color: "var(--sf-text1)" }}>
        {fmtCal(entry.calories)}
        <span className="ml-1 text-sm font-medium" style={{ color: "var(--sf-text6)" }}>cal</span>
      </p>

      {/* Macros */}
      <p className="mt-1.5 text-xs" style={{ color: "var(--sf-text6)" }}>
        P{" "}
        <span className="font-bold" style={{ color: "#38bdf8" }}>{fmtMacro(entry.protein)}g</span>
        {"  ·  "}C{" "}
        <span className="font-bold" style={{ color: "#a78bfa" }}>{fmtMacro(entry.carbs)}g</span>
        {"  ·  "}F{" "}
        <span className="font-bold" style={{ color: "#fb7185" }}>{fmtMacro(entry.fat)}g</span>
      </p>

      {/* ── Details toggle ── */}
      {hasItems && (
        <div className="mt-3">
          <div style={{ height: "1px", backgroundColor: "var(--sf-input)" }} />

          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex w-full items-center justify-between pt-2.5"
            style={{ color: "var(--sf-text6)" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {entry.items!.length} item{entry.items!.length !== 1 ? "s" : ""}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: showDetails ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showDetails && (
            <div className="mt-2 space-y-1.5">
              {entry.items!.map((item, i) => (
                <ItemRow key={i} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
