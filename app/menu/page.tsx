"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { loadProfile, DEFAULT_PROFILE } from "@/lib/profile";
import type { Profile } from "@/lib/profile";
import { useLang } from "@/context/LanguageContext";
import { localName, localNote, localWarning } from "@/lib/localFood";
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

// ─── Food row ─────────────────────────────────────────────────────────────────

function FoodRow({
  item,
  onDelete,
}: {
  item: FoodOption;
  onDelete?: () => void;
}) {
  const { lang } = useLang();
  const warning = localWarning(item, lang);
  return (
    <div
      className="flex items-center gap-2 py-2"
      style={{ borderBottom: "1px solid var(--sf-border)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold leading-snug" style={{ color: "var(--sf-text1)" }}>
          {localName(item, lang)}
        </p>
        <p
          className="text-[11px] leading-tight"
          style={{ color: warning ? "#fbbf24" : "var(--sf-text5)" }}
        >
          {item.portion}
          {warning ? ` · ⚠ ${warning}` : ""}
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
  const { t, lang } = useLang();
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
          {t("menu.noOptions")}
        </p>
      ) : chips ? (
        <div className="flex flex-wrap gap-1.5 pb-2">
          {items.map((item) => (
            <span
              key={item.name}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ backgroundColor: "var(--sf-pill)", color: item.calories > 0 ? "var(--sf-text3)" : "var(--sf-text4)" }}
            >
              {localName(item, lang)}
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
              {t("menu.moreItems", { count: String(hiddenCount) })}
            </button>
          )}
          {showAll && hiddenCount > 0 && (
            <button
              className="mt-2 text-xs font-semibold"
              style={{ color: "var(--sf-text6)" }}
              onClick={() => setShowAll(false)}
            >
              {t("menu.showLess")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add food form ────────────────────────────────────────────────────────────

type LookupMatch = {
  fdcId:       number;
  description: string;
  dataType:    string;
  cal100:      number;
  protein100:  number;
  carbs100:    number;
  fat100:      number;
};

function AddFoodForm({
  tierLabel,
  color,
  onAdd,
}: {
  tierLabel: string;
  color: string;
  onAdd: (food: FoodOption) => void;
}) {
  const { t } = useLang();
  const [open,        setOpen]        = useState(false);
  const [name,        setName]        = useState("");
  const [loading,     setLoading]     = useState(false);
  const [results,     setResults]     = useState<LookupMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showManual,  setShowManual]  = useState(false);

  const [mPortion, setMPortion] = useState("");
  const [mCal,     setMCal]     = useState("");
  const [mPro,     setMPro]     = useState("");

  async function handleLookup() {
    if (!name.trim()) return;
    setLoading(true);
    setResults([]);
    setHasSearched(false);
    setShowManual(false);
    try {
      const res  = await fetch(`/api/lookup-food?name=${encodeURIComponent(name.trim())}`);
      const data = await res.json() as { found: boolean; matches?: LookupMatch[] };
      setResults(data.found && data.matches ? data.matches : []);
    } catch {
      setResults([]);
    }
    setHasSearched(true);
    setLoading(false);
  }

  function handleSelect(match: LookupMatch) {
    onAdd({
      name:     match.description,
      portion:  "100g",
      calories: match.cal100,
      protein:  match.protein100,
      contains: [],
    });
    reset();
  }

  function reset() {
    setOpen(false);
    setName("");
    setResults([]);
    setHasSearched(false);
    setShowManual(false);
    setMPortion(""); setMCal(""); setMPro("");
  }

  const mCalNum      = parseFloat(mCal) || 0;
  const canManualAdd = name.trim() !== "" && mCalNum > 0;

  function handleManualAdd() {
    if (!canManualAdd) return;
    onAdd({
      name:     name.trim(),
      portion:  mPortion.trim() || "1 serving",
      calories: mCalNum,
      protein:  parseFloat(mPro) || 0,
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
        {t("menu.addFood")}
      </button>
    );
  }

  return (
    <div
      className="mt-3 space-y-3 rounded-xl px-4 py-3"
      style={{ backgroundColor: "var(--sf-surface3)", border: "1px solid var(--sf-border2)" }}
    >
      {/* Name + lookup */}
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
          {t("menu.foodName")}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t("menu.foodNamePlaceholder")}
            value={name}
            onChange={(e) => { setName(e.target.value); setResults([]); setHasSearched(false); setShowManual(false); }}
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
            className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-colors"
            style={{
              backgroundColor: name.trim() ? `${color}18` : "var(--sf-border)",
              color: name.trim() ? color : "var(--sf-text7)",
            }}
          >
            {loading ? "…" : t("menu.lookUp")}
          </button>
        </div>
      </div>

      {/* Results list */}
      {loading && (
        <p className="text-center text-xs" style={{ color: "var(--sf-text6)" }}>{t("menu.searching")}</p>
      )}

      {!loading && hasSearched && results.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
            {t("menu.tapResult")}
          </p>
          {results.map((match) => (
            <button
              key={match.fdcId}
              onClick={() => handleSelect(match)}
              className="w-full rounded-xl px-3 py-2.5 text-left transition-opacity active:opacity-60"
              style={{
                backgroundColor: "var(--sf-surface)",
                border: "1px solid var(--sf-border2)",
              }}
            >
              <p className="text-xs font-bold leading-snug" style={{ color: "var(--sf-text1)" }}>
                {match.description}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--sf-text5)" }}>
                <span style={{ color: "#00d2ff" }}>{match.cal100} cal</span>
                {" · P "}
                <span style={{ color: "#38bdf8" }}>{match.protein100}g</span>
                {" · C "}
                <span style={{ color: "#a78bfa" }}>{match.carbs100}g</span>
                {" · F "}
                <span style={{ color: "#fb7185" }}>{match.fat100}g</span>
                <span style={{ color: "var(--sf-text7)" }}> / 100g</span>
              </p>
              <span
                className="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: "var(--sf-border)", color: "var(--sf-text7)" }}
              >
                {match.dataType}
              </span>
            </button>
          ))}
          {!showManual && (
            <button
              onClick={() => setShowManual(true)}
              className="pt-0.5 text-[11px]"
              style={{ color: "var(--sf-text6)" }}
            >
              {t("menu.noneManually")}
            </button>
          )}
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--sf-border)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--sf-text4)" }}>
            {t("menu.noResults", { name })}
          </p>
          {!showManual && (
            <button
              onClick={() => setShowManual(true)}
              className="mt-1 text-[11px] font-bold"
              style={{ color }}
            >
              {t("menu.enterManually")}
            </button>
          )}
        </div>
      )}

      {/* Manual entry fallback */}
      {showManual && (
        <div
          className="space-y-2 rounded-xl px-3 py-3"
          style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text6)" }}>
            {t("menu.manualEntry")}
          </p>
          <input
            type="text"
            placeholder={t("menu.portionPlaceholder")}
            value={mPortion}
            onChange={(e) => setMPortion(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none"
            style={{
              backgroundColor: "var(--sf-surface3)",
              border: "1px solid var(--sf-border2)",
              color: "var(--sf-text1)",
            }}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1 text-[10px]" style={{ color: "var(--sf-text6)" }}>{t("menu.caloriesRequired")}</p>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 250"
                value={mCal}
                onChange={(e) => setMCal(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                style={{
                  backgroundColor: "var(--sf-surface3)",
                  border: mCalNum > 0 ? `1px solid ${color}55` : "1px solid var(--sf-border2)",
                  color: "var(--sf-text1)",
                }}
              />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[10px]" style={{ color: "var(--sf-text6)" }}>{t("menu.proteinG")}</p>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 26"
                value={mPro}
                onChange={(e) => setMPro(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                style={{
                  backgroundColor: "var(--sf-surface3)",
                  border: "1px solid var(--sf-border2)",
                  color: "var(--sf-text1)",
                }}
              />
            </div>
          </div>
          <button
            onClick={handleManualAdd}
            disabled={!canManualAdd}
            className="w-full rounded-xl py-2 text-xs font-bold"
            style={{
              backgroundColor: canManualAdd ? `${color}22` : "var(--sf-border)",
              color: canManualAdd ? color : "var(--sf-text7)",
            }}
          >
            {t("menu.addTo", { tier: tierLabel })}
          </button>
        </div>
      )}

      {/* Cancel */}
      <button
        onClick={reset}
        className="w-full rounded-xl py-2 text-xs font-bold"
        style={{ backgroundColor: "var(--sf-border)", color: "var(--sf-text5)" }}
      >
        {t("menu.cancel")}
      </button>
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
  const { t, lang } = useLang();

  const TIER_CONFIG: {
    tier: MealTier;
    label: string;
    meals: string;
    slotIdx: number;
    color: string;
  }[] = [
    { tier: "snack", label: t("menu.lightSnack"), meals: t("menu.meals1and5"), slotIdx: 0, color: "#a78bfa" },
    { tier: "small", label: t("menu.smallMeal"),  meals: t("menu.meals2and4"), slotIdx: 1, color: "#38bdf8" },
    { tier: "main",  label: t("menu.mainLunch"),  meals: t("menu.meal3"),      slotIdx: 2, color: "#00d2ff" },
  ];

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
  const activeCfg  = TIER_CONFIG.find((cfg) => cfg.tier === activeTier)!;
  const activeSlot = MEAL_SLOTS[activeCfg.slotIdx];
  const { min: calMin, max: calMax } = getMealCalRange(goals.calories, activeSlot);
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
              {t("menu.title")}
            </p>
            <p className="text-xs" style={{ color: "var(--sf-text6)" }}>
              {t("menu.subtitle")}
            </p>
          </div>
          {profile.dietRules.length > 0 && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: "rgba(167,139,250,0.1)", color: "#a78bfa" }}
            >
              {t("menu.filtersOn", { count: String(profile.dietRules.length), s: profile.dietRules.length > 1 ? "s" : "" })}
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
              {t("menu.goal")}
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
              {t("menu.leftToday")}
            </p>
            <p className="text-base font-black" style={{ color: overGoal ? "#f43f5e" : "#00d2ff" }}>
              {overGoal ? t("menu.over") : calLeft}
              <span className="text-xs font-medium" style={{ color: "var(--sf-text6)" }}> cal</span>
            </p>
          </div>
          <div className="mx-4 h-7 w-px" style={{ backgroundColor: "var(--sf-pill)" }} />
          <div className="flex-1 text-right">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sf-text6)" }}
            >
              {t("menu.proteinLeft")}
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
                {activeCfg.meals} · {t("menu.pickOne")}
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
              placeholder={t("menu.hideFoods")}
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
            <FoodSection title={t("menu.protein")}    color="#38bdf8" items={getFiltered(foods.protein)} />
            <FoodSection title={t("menu.carbs")}      color="#a78bfa" items={getFiltered(foods.carbs)}   />
            <FoodSection title={t("menu.vegetables")} color="#4ade80" items={getFiltered(foods.veggies)} chips />

            {customFoods[activeTier].length > 0 && (
              <div className="pt-3" style={{ borderTop: "1px solid var(--sf-border)" }}>
                <p
                  className="mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "#fb923c" }}
                >
                  {t("menu.custom")}
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
              color={activeCfg.color}
              onAdd={handleAddCustom}
            />
          </div>
        </div>

        {/* ── Sauces & Seasonings ── */}
        <CollapsibleCard
          title={t("menu.sauces")}
          subtitle={t("menu.saucesSubtitle")}
          isOpen={openSauces}
          onToggle={() => setOpenSauces((v) => !v)}
        >
          <div className="px-5 pt-3 pb-4">
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#4ade80" }}
            >
              {t("menu.useFreely")}
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SAUCES_FREE.map((s) => (
                <span
                  key={s.name}
                  className="rounded-full px-2.5 py-1 text-[11px]"
                  style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text3)" }}
                >
                  {localName(s, lang)}
                </span>
              ))}
            </div>
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#fbbf24" }}
            >
              {t("menu.countThese")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SAUCES_CAREFUL.map((s) => (
                <span
                  key={s.name}
                  className="rounded-full px-2.5 py-1 text-[11px]"
                  style={{ backgroundColor: "var(--sf-pill)", color: "var(--sf-text3)" }}
                >
                  {localName(s, lang)}
                </span>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* ── Watch List ── */}
        <CollapsibleCard
          title={t("menu.watchList")}
          subtitle={t("menu.watchListSubtitle")}
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
                <p className="text-xs font-bold" style={{ color: "var(--sf-text1)" }}>{localName(w, lang)}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--sf-text4)" }}>
                  {localNote(w, lang)}
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
