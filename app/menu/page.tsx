"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { loadProfile, DEFAULT_PROFILE } from "@/lib/profile";
import type { Profile } from "@/lib/profile";
import {
  MEAL_SLOTS,
  TIER_FOODS,
  getMealCalRange,
  filterByDiet,
  filterByDisliked,
  WARNING_FOODS,
  SAUCES_FREE,
  SAUCES_CAREFUL,
  type FoodOption,
  type MealTier,
} from "@/lib/menuData";

// ─── Custom food storage ──────────────────────────────────────────────────────

const CUSTOM_KEY = "smartfood_custom_foods";
type CustomFoods = Record<MealTier, FoodOption[]>;

function loadCustomFoods(): CustomFoods {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return { snack: [], small: [], main: [] };
    return JSON.parse(raw) as CustomFoods;
  } catch {
    return { snack: [], small: [], main: [] };
  }
}

function saveCustomFoods(foods: CustomFoods): void {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(foods)); } catch {}
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SHOW_LIMIT = 5;

function parseExcludes(input: string): string[] {
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

const TIER_CONFIG: {
  tier: MealTier;
  label: string;
  meals: string;
  slotIdx: number;
  color: string;
}[] = [
  { tier: "snack", label: "Light Snack", meals: "Meals 1 & 5", slotIdx: 0, color: "#a78bfa" },
  { tier: "small", label: "Small Meal",  meals: "Meals 2 & 4", slotIdx: 1, color: "#38bdf8" },
  { tier: "main",  label: "Main Lunch",  meals: "Meal 3",       slotIdx: 2, color: "#00d2ff" },
];

// ─── Food row ─────────────────────────────────────────────────────────────────

function FoodRow({
  item,
  onDelete,
}: {
  item: FoodOption;
  onDelete?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 py-2"
      style={{ borderBottom: "1px solid var(--sf-border)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold leading-snug" style={{ color: "var(--sf-text1)" }}>
          {item.name}
        </p>
        <p
          className="text-[11px] leading-tight"
          style={{ color: item.warning ? "#fbbf24" : "var(--sf-text5)" }}
        >
          {item.portion}
          {item.warning ? ` · ⚠ ${item.warning}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="tabular-nums text-sm font-bold" style={{ color: "var(--sf-text1)" }}>
          {item.calories}
        </span>
        <span className="text-[10px]" style={{ color: "var(--sf-text6)" }}>cal</span>
        {item.protein > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: "rgba(56,189,248,0.1)", color: "#38bdf8" }}
          >
            {item.protein}g
          </span>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: "rgba(244,63,94,0.1)", color: "#f43f5e" }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Food section with show-more ──────────────────────────────────────────────

function FoodSection({
  title,
  color,
  items,
  chips = false,
}: {
  title: string;
  color: string;
  items: FoodOption[];
  chips?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, SHOW_LIMIT);
  const hiddenCount = items.length - SHOW_LIMIT;

  return (
    <div className="pt-3" style={{ borderTop: "1px solid var(--sf-border)" }}>
      <p
        className="mb-1.5 text-[10px] font-bold uppercase tracking-widest"
        style={{ color }}
      >
        {title}
      </p>
      {items.length === 0 ? (
        <p className="pb-2 text-xs" style={{ color: "var(--sf-text7)" }}>
          No options match your current filters.
        </p>
      ) : chips ? (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {items.map((item) => (
            <span
              key={item.name}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: "var(--sf-pill)", color: item.calories > 0 ? "var(--sf-text3)" : "var(--sf-text4)" }}
            >
              {item.name}
              {item.calories > 0 ? ` · ${item.calories}` : ""}
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-1">
          {visible.map((item) => <FoodRow key={item.name} item={item} />)}
          {!showAll && hiddenCount > 0 && (
            <button
              className="mt-2 text-xs font-semibold"
              style={{ color }}
              onClick={() => setShowAll(true)}
            >
              + {hiddenCount} more
            </button>
          )}
          {showAll && hiddenCount > 0 && (
            <button
              className="mt-2 text-xs font-semibold"
              style={{ color: "var(--sf-text6)" }}
              onClick={() => setShowAll(false)}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add food form ────────────────────────────────────────────────────────────

function AddFoodForm({
  tierLabel,
  calTarget,
  color,
  onAdd,
}: {
  tierLabel: string;
  calTarget: number;
  color: string;
  onAdd: (food: FoodOption) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState("");
  const [portion, setPortion]   = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein]   = useState("");
  const [carbs, setCarbs]       = useState("");
  const [fat, setFat]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [lookupLabel, setLabel] = useState<string | null>(null);
  const [lookupMiss,  setMiss]  = useState(false);

  async function handleLookup() {
    if (!name.trim()) return;
    setLoading(true);
    setLabel(null);
    setMiss(false);
    try {
      const res  = await fetch(`/api/lookup-food?name=${encodeURIComponent(name.trim())}`);
      const data = (await res.json()) as
        | { found: true; label: string; cal100: number; protein100: number; carbs100: number; fat100: number }
        | { found: false };

      if (data.found && data.cal100 > 0) {
        // Convert per-100g values to a calTarget-sized portion
        const portionG = Math.round(calTarget / (data.cal100 / 100));
        setPortion(`${portionG}g`);
        setCalories(String(Math.round(data.cal100     * portionG / 100)));
        setProtein( String(Math.round(data.protein100 * portionG / 100)));
        setCarbs(   String(Math.round(data.carbs100   * portionG / 100)));
        setFat(     String(Math.round(data.fat100     * portionG / 100)));
        setLabel(data.label);
      } else {
        setMiss(true);
      }
    } catch {
      setMiss(true);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setOpen(false);
    setName("");
    setPortion("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setLabel(null);
    setMiss(false);
  }

  const calNum  = parseFloat(calories) || 0;
  const proNum  = parseFloat(protein)  || 0;
  const carbNum = parseFloat(carbs)    || 0;
  const fatNum  = parseFloat(fat)      || 0;
  const canAdd  = name.trim() !== "" && calNum > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({
      name:     name.trim(),
      portion:  portion.trim() || "1 serving",
      calories: calNum,
      protein:  proNum,
      contains: [],
    });
    reset();
  }

  if (!open) {
    return (
      <button
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold"
        style={{ border: `1px dashed ${color}44`, color: `${color}88` }}
        onClick={() => setOpen(true)}
      >
        + Add a food to this meal
      </button>
    );
  }

  return (
    <div
      className="mt-3 space-y-2.5 rounded-xl px-4 py-3"
      style={{ backgroundColor: "var(--sf-surface3)", border: "1px solid var(--sf-border2)" }}
    >
      {/* Name + lookup */}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
          Food name <span style={{ color }}>*</span>
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. steak, salmon, rice..."
            value={name}
            onChange={(e) => { setName(e.target.value); setLabel(null); setMiss(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            autoFocus
            className="min-w-0 flex-1 rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              backgroundColor: "var(--sf-surface)",
              border: "1px solid var(--sf-border2)",
              color: "var(--sf-text1)",
            }}
          />
          <button
            onClick={handleLookup}
            disabled={loading || !name.trim()}
            className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold"
            style={{
              backgroundColor: name.trim() ? `${color}18` : "var(--sf-border)",
              color: name.trim() ? color : "var(--sf-text7)",
            }}
          >
            {loading ? "…" : "Look up"}
          </button>
        </div>
        {lookupLabel && (
          <p className="mt-1.5 text-[11px] font-semibold" style={{ color: "#4ade80" }}>
            ✓ Auto-filled from {lookupLabel}
          </p>
        )}
        {lookupMiss && (
          <p className="mt-1.5 text-[11px]" style={{ color: "var(--sf-text6)" }}>
            Not found — enter values manually below.
          </p>
        )}
      </div>

      {/* Portion label (optional) */}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
          Portion{" "}
          <span className="normal-case font-normal tracking-normal" style={{ color: "var(--sf-text7)" }}>
            (optional)
          </span>
        </p>
        <input
          type="text"
          placeholder="e.g. 200g, 1 cup, 1 serving"
          value={portion}
          onChange={(e) => setPortion(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-xs outline-none"
          style={{
            backgroundColor: "var(--sf-surface)",
            border: "1px solid var(--sf-border2)",
            color: "var(--sf-text1)",
          }}
        />
      </div>

      {/* Macros — calories required, rest optional */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            Calories <span style={{ color }}>*</span>
          </p>
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 250"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              backgroundColor: "var(--sf-surface)",
              border: calNum > 0 ? `1px solid ${color}66` : "1px solid var(--sf-border2)",
              color: "var(--sf-text1)",
            }}
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            Protein (g)
          </p>
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g. 26"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              backgroundColor: "var(--sf-surface)",
              border: "1px solid var(--sf-border2)",
              color: "var(--sf-text1)",
            }}
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            Carbs (g)
          </p>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              backgroundColor: "var(--sf-surface)",
              border: "1px solid var(--sf-border2)",
              color: "var(--sf-text1)",
            }}
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            Fat (g)
          </p>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              backgroundColor: "var(--sf-surface)",
              border: "1px solid var(--sf-border2)",
              color: "var(--sf-text1)",
            }}
          />
        </div>
      </div>

      {/* Preview */}
      {calNum > 0 && (
        <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: `${color}0d` }}>
          <p className="text-xs font-bold" style={{ color }}>
            {portion.trim() || "1 serving"} — {calNum} cal
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--sf-text3)" }}>
            P {proNum}g
            {carbNum > 0 ? ` · C ${carbNum}g` : ""}
            {fatNum  > 0 ? ` · F ${fatNum}g`  : ""}
          </p>
        </div>
      )}

      {/* Hint when name is entered but calories missing */}
      {!canAdd && name.trim() !== "" && calNum === 0 && (
        <p className="text-[10px]" style={{ color: "var(--sf-text7)" }}>
          Enter calories to enable adding.
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={reset}
          className="flex-1 rounded-xl py-2 text-xs font-bold"
          style={{ backgroundColor: "var(--sf-border)", color: "var(--sf-text5)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex-1 rounded-xl py-2 text-xs font-bold"
          style={{
            backgroundColor: canAdd ? `${color}22` : "var(--sf-border)",
            color: canAdd ? color : "var(--sf-text7)",
          }}
        >
          Add to {tierLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Collapsible card ─────────────────────────────────────────────────────────

function CollapsibleCard({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
    >
      <button
        className="flex w-full items-center justify-between px-5 py-3.5"
        onClick={onToggle}
      >
        <div className="text-left">
          <p className="text-sm font-bold" style={{ color: "var(--sf-text1)" }}>{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--sf-text5)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]"
          style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text5)" }}
        >
          {isOpen ? "▲" : "▼"}
        </span>
      </button>
      {isOpen && (
        <div style={{ borderTop: "1px solid var(--sf-border)" }}>{children}</div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const { state } = useApp();
  const { entries, goals } = state;

  const [profile, setProfile]       = useState<Profile>(DEFAULT_PROFILE);
  const [customFoods, setCustom]    = useState<CustomFoods>({ snack: [], small: [], main: [] });
  const [activeTier, setActiveTier] = useState<MealTier>("snack");
  const [excludeInput, setExclude]  = useState("");
  const [openSauces, setOpenSauces] = useState(false);
  const [openWarnings, setOpenWarn] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setCustom(loadCustomFoods());
  }, []);

  const eaten        = entries.reduce((s, e) => s + e.calories, 0);
  const proteinEaten = entries.reduce((s, e) => s + e.protein, 0);
  const calLeft      = Math.max(goals.calories - eaten, 0);
  const proteinLeft  = Math.max(goals.protein - proteinEaten, 0);
  const overGoal     = eaten > goals.calories;

  const excludes   = parseExcludes(excludeInput);
  const activeCfg  = TIER_CONFIG.find((t) => t.tier === activeTier)!;
  const activeSlot = MEAL_SLOTS[activeCfg.slotIdx];
  const { min: calMin, max: calMax } = getMealCalRange(goals.calories, activeSlot);
  const calTarget  = Math.round((calMin + calMax) / 2);
  const foods      = TIER_FOODS[activeTier];

  function getFiltered(options: FoodOption[]): FoodOption[] {
    return filterByDisliked(filterByDiet(options, profile.dietRules), excludes);
  }

  function handleAddCustom(food: FoodOption) {
    const updated = {
      ...customFoods,
      [activeTier]: [...customFoods[activeTier], food],
    };
    setCustom(updated);
    saveCustomFoods(updated);
  }

  function handleDeleteCustom(tier: MealTier, idx: number) {
    const updated = {
      ...customFoods,
      [tier]: customFoods[tier].filter((_, i) => i !== idx),
    };
    setCustom(updated);
    saveCustomFoods(updated);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* ── Header ── */}
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="text-[22px] font-black leading-tight" style={{ color: "var(--sf-text1)" }}>
              Mix &amp; Match
            </p>
            <p className="text-xs" style={{ color: "var(--sf-text6)" }}>
              Pick one per group per meal
            </p>
          </div>
          {profile.dietRules.length > 0 && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: "rgba(167,139,250,0.1)", color: "#a78bfa" }}
            >
              {profile.dietRules.length} filter{profile.dietRules.length > 1 ? "s" : ""} on
            </span>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div
          className="flex items-center rounded-2xl px-5 py-3"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
        >
          <div className="flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sf-text6)" }}
            >
              Goal
            </p>
            <p className="text-base font-black" style={{ color: "var(--sf-text1)" }}>
              {goals.calories}
              <span className="text-xs font-medium" style={{ color: "var(--sf-text6)" }}> cal</span>
            </p>
          </div>
          <div className="mx-4 h-7 w-px" style={{ backgroundColor: "var(--sf-pill)" }} />
          <div className="flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sf-text6)" }}
            >
              Left today
            </p>
            <p className="text-base font-black" style={{ color: overGoal ? "#f43f5e" : "#00d2ff" }}>
              {overGoal ? "Over!" : calLeft}
              <span className="text-xs font-medium" style={{ color: "var(--sf-text6)" }}> cal</span>
            </p>
          </div>
          <div className="mx-4 h-7 w-px" style={{ backgroundColor: "var(--sf-pill)" }} />
          <div className="flex-1 text-right">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sf-text6)" }}
            >
              Protein left
            </p>
            <p className="text-base font-black" style={{ color: "#38bdf8" }}>
              {proteinLeft}
              <span className="text-xs font-medium" style={{ color: "var(--sf-text6)" }}>g</span>
            </p>
          </div>
        </div>

        {/* ── Meal type tabs ── */}
        <div
          className="flex overflow-hidden rounded-2xl"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
        >
          {TIER_CONFIG.map((cfg, i) => {
            const isActive = cfg.tier === activeTier;
            return (
              <button
                key={cfg.tier}
                className="flex flex-1 flex-col items-center px-2 py-3"
                style={{
                  backgroundColor: isActive ? `${cfg.color}15` : "transparent",
                  borderRight: i < 2 ? "1px solid var(--sf-pill)" : undefined,
                }}
                onClick={() => setActiveTier(cfg.tier)}
              >
                <span
                  className="text-[11px] font-bold"
                  style={{ color: isActive ? cfg.color : "var(--sf-text5)" }}
                >
                  {cfg.label}
                </span>
                <span
                  className="mt-0.5 text-[10px]"
                  style={{ color: isActive ? `${cfg.color}aa` : "var(--sf-text7)" }}
                >
                  {cfg.meals}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Active tier card ── */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
        >
          {/* Tier header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ backgroundColor: `${activeCfg.color}0d` }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: activeCfg.color }}>
                {activeCfg.label}
              </p>
              <p className="text-[11px]" style={{ color: "var(--sf-text5)" }}>
                {activeCfg.meals} · pick one from each group
              </p>
            </div>
            <span
              className="rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text3)" }}
            >
              {calMin}–{calMax} cal
            </span>
          </div>

          {/* Smart box */}
          <div className="px-5 pt-3 pb-2" style={{ borderTop: "1px solid var(--sf-border)" }}>
            <input
              type="text"
              placeholder="Hide foods... e.g. salmon, tofu"
              value={excludeInput}
              onChange={(e) => setExclude(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-xs outline-none"
              style={{
                backgroundColor: "var(--sf-surface3)",
                border: "1px solid var(--sf-border2)",
                color: "var(--sf-text1)",
              }}
            />
            {excludes.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {excludes.map((ex) => (
                  <span
                    key={ex}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: "rgba(244,63,94,0.1)", color: "#f43f5e" }}
                  >
                    − {ex}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Food groups + custom */}
          <div key={activeTier} className="px-5 pb-4">
            <FoodSection title="Protein"    color="#38bdf8" items={getFiltered(foods.protein)} />
            <FoodSection title="Carbs"      color="#a78bfa" items={getFiltered(foods.carbs)}   />
            <FoodSection title="Vegetables" color="#4ade80" items={getFiltered(foods.veggies)} chips />

            {customFoods[activeTier].length > 0 && (
              <div className="pt-3" style={{ borderTop: "1px solid var(--sf-border)" }}>
                <p
                  className="mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "#fb923c" }}
                >
                  Custom
                </p>
                {customFoods[activeTier].map((item, idx) => (
                  <FoodRow
                    key={`custom-${idx}`}
                    item={item}
                    onDelete={() => handleDeleteCustom(activeTier, idx)}
                  />
                ))}
              </div>
            )}

            <AddFoodForm
              tierLabel={activeCfg.label}
              calTarget={calTarget}
              color={activeCfg.color}
              onAdd={handleAddCustom}
            />
          </div>
        </div>

        {/* ── Sauces & Seasonings ── */}
        <CollapsibleCard
          title="Sauces & Seasonings"
          subtitle="Free vs. count these"
          isOpen={openSauces}
          onToggle={() => setOpenSauces((v) => !v)}
        >
          <div className="px-5 pt-3 pb-4">
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#4ade80" }}
            >
              Use freely
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SAUCES_FREE.map((s) => (
                <span
                  key={s}
                  className="rounded-full px-2.5 py-1 text-[11px]"
                  style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text3)" }}
                >
                  {s}
                </span>
              ))}
            </div>
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#fbbf24" }}
            >
              Count these
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SAUCES_CAREFUL.map((s) => (
                <span
                  key={s}
                  className="rounded-full px-2.5 py-1 text-[11px]"
                  style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text3)" }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* ── Watch List ── */}
        <CollapsibleCard
          title="Watch List"
          subtitle="High-calorie foods — measure carefully"
          isOpen={openWarnings}
          onToggle={() => setOpenWarn((v) => !v)}
        >
          <div className="grid grid-cols-2 gap-2 px-5 pt-3 pb-4">
            {WARNING_FOODS.map((w) => (
              <div
                key={w.name}
                className="rounded-xl px-3 py-2"
                style={{ backgroundColor: "var(--sf-border)" }}
              >
                <p className="text-xs font-bold" style={{ color: "var(--sf-text1)" }}>{w.name}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--sf-text4)" }}>
                  {w.note}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        <div className="h-4 shrink-0" />
      </div>
    </div>
  );
}
