"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import DumbbellLogo from "@/components/DumbbellLogo";
import { fetchProfile, upsertProfile } from "@/lib/db/profiles";
import {
  type Profile,
  type Gender,
  type FitnessGoal,
  type ActivityLevel,
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  calculateRecommended,
  deriveMacros,
  calculateAge,
} from "@/lib/profile";
import { useLang } from "@/context/LanguageContext";

// ─── Unit conversion helpers ──────────────────────────────────────────────────

function kgToLb(kg: number): number { return Math.round(kg * 2.2046 * 10) / 10; }
function lbToKg(lb: number): number { return Math.round((lb / 2.2046) * 10) / 10; }
function cmToIn(cm: number): number { return Math.round((cm / 2.54) * 10) / 10; }
function inToCm(i: number):  number { return Math.round(i * 2.54 * 10) / 10; }

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
    >
      <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--sf-pill)" }}>
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--sf-text6)" }}
        >
          {title}
        </p>
      </div>
      <div className="space-y-4 px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold" style={{ color: "var(--sf-text5)" }}>{label}</p>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
  unit,
  min = 0,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder: string;
  unit?: string;
  min?: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <input
        type="number"
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm focus:outline-none"
        style={{
          backgroundColor: "var(--sf-input)",
          border: "1px solid var(--sf-border2)",
          color: "var(--sf-text2)",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,210,255,0.06)"; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--sf-border2)"; e.currentTarget.style.boxShadow = "none"; }}
      />
      {unit && <span className="w-10 shrink-0 text-sm" style={{ color: "var(--sf-text5)" }}>{unit}</span>}
    </div>
  );
}

function PillGroup({
  options, value, onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className="rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-95"
            style={active
              ? { backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.3)" }
              : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)", border: "1px solid var(--sf-border2)" }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiPillGroup({
  options, value, onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button key={opt.value} type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== opt.value) : [...value, opt.value])}
            className="rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-95"
            style={active
              ? { backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.3)" }
              : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)", border: "1px solid var(--sf-border2)" }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Option lists (built inside ProfilePage using t()) ────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { dispatch } = useApp();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();

  const GENDER_OPTIONS = [
    { value: "male",   label: t("common.gender.male") },
    { value: "female", label: t("common.gender.female") },
  ];
  const GOAL_OPTIONS = [
    { value: "lose",     label: t("common.goal.lose") },
    { value: "maintain", label: t("common.goal.maintain") },
    { value: "gain",     label: t("common.goal.gain") },
  ];
  const ACTIVITY_OPTIONS = [
    { value: "sedentary",   label: t("common.activity.sedentary") },
    { value: "light",       label: t("common.activity.light") },
    { value: "moderate",    label: t("common.activity.moderate") },
    { value: "active",      label: t("common.activity.active") },
    { value: "very_active", label: t("common.activity.very_active") },
  ];
  const DIET_OPTIONS = [
    { value: "vegetarian",   label: t("common.diet.vegetarian") },
    { value: "vegan",        label: t("common.diet.vegan") },
    { value: "kosher",       label: t("common.diet.kosher") },
    { value: "halal",        label: t("common.diet.halal") },
    { value: "gluten_free",  label: t("common.diet.gluten_free") },
    { value: "dairy_free",   label: t("common.diet.dairy_free") },
    { value: "nut_free",     label: t("common.diet.nut_free") },
    { value: "low_carb",     label: t("common.diet.low_carb") },
    { value: "keto",         label: t("common.diet.keto") },
    { value: "paleo",        label: t("common.diet.paleo") },
    { value: "no_pork",      label: t("common.diet.no_pork") },
    { value: "no_shellfish", label: t("common.diet.no_shellfish") },
    { value: "no_eggs",      label: t("common.diet.no_eggs") },
    { value: "no_fish",      label: t("common.diet.no_fish") },
  ];
  const DIET_LABEL: Record<string, string> = Object.fromEntries(
    DIET_OPTIONS.map((o) => [o.value, o.label]),
  );

  const [profile, setProfile]               = useState<Profile>(DEFAULT_PROFILE);
  const [viewMode, setViewMode]             = useState<"form" | "summary">("form");
  const [hasExistingProfile, setHasExisting] = useState(false);
  const [dataLoaded, setDataLoaded]         = useState(false);

  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve before fetching
    async function loadData() {
      let saved: Profile | null = null;
      if (user) {
        saved = await fetchProfile(user.id);
      }
      if (!saved) saved = loadProfile();
      setProfile(saved);
      if (saved.dateOfBirth || saved.onboardingCompleted) {
        setViewMode("summary");
        setHasExisting(true);
      }
      setDataLoaded(true);
    }
    loadData();
  }, [user, authLoading]);

  const isImperial    = profile.unitSystem === "imperial";
  const recommendation = calculateRecommended(profile);
  const age            = calculateAge(profile.dateOfBirth);

  const dispHeight = profile.heightCm    === "" ? "" : isImperial ? cmToIn(profile.heightCm)    : profile.heightCm;
  const dispWeight = profile.weightKg    === "" ? "" : isImperial ? kgToLb(profile.weightKg)    : profile.weightKg;
  const dispGoalWt = profile.goalWeightKg=== "" ? "" : isImperial ? kgToLb(profile.goalWeightKg): profile.goalWeightKg;

  function updateProfile(updates: Partial<Profile>) {
    setProfile((prev) => {
      const next: Profile = { ...prev, ...updates };
      const rec = calculateRecommended(next);
      if (rec !== null) {
        next.recommendedCalories = rec.calories;
        if (!next.calorieOverridden) {
          next.calorieGoal  = rec.calories;
          next.proteinGoalG = rec.protein;
          const macros = deriveMacros(rec.calories, next.goal);
          next.carbsGoalG = macros.carbs;
          next.fatGoalG   = macros.fat;
        }
      } else {
        next.recommendedCalories = null;
      }
      return next;
    });
  }

  function handleCalorieChange(cal: number | "") {
    if (cal === "") return;
    setProfile((prev) => {
      const overridden = recommendation ? cal !== recommendation.calories : true;
      const macros = deriveMacros(cal, prev.goal);
      return { ...prev, calorieGoal: cal, calorieOverridden: overridden, carbsGoalG: macros.carbs, fatGoalG: macros.fat };
    });
  }

  function resetToRecommended() {
    if (!recommendation) return;
    const macros = deriveMacros(recommendation.calories, profile.goal);
    setProfile((prev) => ({
      ...prev,
      calorieGoal:       recommendation.calories,
      proteinGoalG:      recommendation.protein,
      carbsGoalG:        macros.carbs,
      fatGoalG:          macros.fat,
      calorieOverridden: false,
    }));
  }

  function handleHeightChange(val: number | "") {
    updateProfile({ heightCm: val === "" ? "" : isImperial ? inToCm(val) : val });
  }
  function handleWeightChange(val: number | "") {
    updateProfile({ weightKg: val === "" ? "" : isImperial ? lbToKg(val) : val });
  }
  function handleGoalWeightChange(val: number | "") {
    updateProfile({ goalWeightKg: val === "" ? "" : isImperial ? lbToKg(val) : val });
  }

  async function handleSave() {
    saveProfile(profile);
    if (user) {
      await upsertProfile(user.id, { ...profile, onboardingCompleted: true });
    }
    dispatch({
      type: "SET_GOALS",
      payload: { calories: profile.calorieGoal, protein: profile.proteinGoalG, carbs: profile.carbsGoalG, fat: profile.fatGoalG },
    });
    setHasExisting(true);
    setViewMode("summary");
  }

  async function handleCancel() {
    let saved: Profile | null = null;
    if (user) saved = await fetchProfile(user.id);
    if (!saved) saved = loadProfile();
    setProfile(saved);
    setViewMode("summary");
  }

  const isOverridden =
    profile.calorieOverridden &&
    recommendation !== null &&
    profile.calorieGoal !== recommendation.calories;

  // ── Loading state — never flash the empty form before data arrives ────────
  if (!dataLoaded) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <DumbbellLogo size={32} glow={0.3} />
        <p className="text-sm" style={{ color: "var(--sf-text5)" }}>{t("profile.loading")}</p>
      </div>
    );
  }

  // ── Summary / Account view ────────────────────────────────────────────────
  if (viewMode === "summary") {
    const goalLabel =
      profile.goal === "lose"     ? t("common.goal.lose") :
      profile.goal === "gain"     ? t("common.goal.gain") :
      profile.goal === "maintain" ? t("common.goal.maintain") : "—";
    const genderLabel =
      profile.gender === "male"   ? t("common.gender.male") :
      profile.gender === "female" ? t("common.gender.female") : "";

    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

          <div className="px-1">
            <p className="text-[22px] font-black leading-tight" style={{ color: "var(--sf-text1)" }}>
              {t("profile.title")}
            </p>
            <p className="mt-0.5 text-sm" style={{ color: "var(--sf-text6)" }}>{t("profile.subtitle")}</p>
          </div>

          {/* Account card */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-pill)" }}
          >
            {/* Avatar + identity */}
            <div
              className="flex flex-col items-center py-8"
              style={{ borderBottom: "1px solid var(--sf-pill)" }}
            >
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--sf-input)" }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--sf-text7)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </div>
              {(genderLabel || age) && (
                <p className="mt-3 text-sm font-medium" style={{ color: "var(--sf-text4)" }}>
                  {[genderLabel, age ? t("profile.years", { age: String(age) }) : ""].filter(Boolean).join(" · ")}
                </p>
              )}
              {profile.goal && (
                <p className="mt-1 text-xs font-semibold" style={{ color: "var(--sf-text6)" }}>
                  {goalLabel}
                </p>
              )}
            </div>

            {/* Stats rows */}
            <div>
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--sf-border)" }}
              >
                <p className="text-sm" style={{ color: "var(--sf-text5)" }}>{t("profile.dailyCalories")}</p>
                <p className="text-lg font-black" style={{ color: "#00d2ff" }}>
                  {profile.calorieGoal.toLocaleString()}
                  <span className="ml-1 text-xs font-normal" style={{ color: "var(--sf-text6)" }}>cal</span>
                </p>
              </div>

              {profile.weightKg !== "" && (
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid var(--sf-border)" }}
                >
                  <p className="text-sm" style={{ color: "var(--sf-text5)" }}>{t("profile.weight")}</p>
                  <p className="text-sm font-bold" style={{ color: "var(--sf-text1)" }}>
                    {isImperial ? `${kgToLb(profile.weightKg as number)} lb` : `${profile.weightKg} kg`}
                  </p>
                </div>
              )}

              {profile.heightCm !== "" && (
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: profile.dietRules.length > 0 ? "1px solid var(--sf-border)" : "none" }}
                >
                  <p className="text-sm" style={{ color: "var(--sf-text5)" }}>{t("profile.height")}</p>
                  <p className="text-sm font-bold" style={{ color: "var(--sf-text1)" }}>
                    {isImperial ? `${cmToIn(profile.heightCm as number)} in` : `${profile.heightCm} cm`}
                  </p>
                </div>
              )}

              {profile.dietRules.length > 0 && (
                <div className="px-5 py-4">
                  <p className="mb-2.5 text-sm" style={{ color: "var(--sf-text5)" }}>
                    {t("profile.dietaryRestrictions")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.dietRules.map((rule) => (
                      <span
                        key={rule}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: "rgba(0,210,255,0.08)", color: "#00d2ff" }}
                      >
                        {DIET_LABEL[rule] ?? rule}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setViewMode("form")}
            className="w-full rounded-2xl py-4 text-sm font-bold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "var(--sf-surface)",
              color: "var(--sf-text4)",
              border: "1px solid var(--sf-pill)",
            }}
          >
            {t("profile.editButton")}
          </button>

          <div className="h-8 shrink-0" />
        </div>
      </div>
    );
  }

  // ── Form / Edit view ──────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between px-1">
          <div>
            <p className="text-[22px] font-black leading-tight" style={{ color: "var(--sf-text1)" }}>
              {t("profile.title")}
            </p>
            <p className="mt-0.5 text-sm" style={{ color: "var(--sf-text6)" }}>
              {t("profile.editSubtitle")}
            </p>
          </div>
          {hasExistingProfile && (
            <button
              type="button"
              onClick={handleCancel}
              className="mt-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all active:scale-95"
              style={{
                color: "var(--sf-text5)",
                backgroundColor: "var(--sf-surface)",
                border: "1px solid var(--sf-pill)",
              }}
            >
              {t("profile.cancel")}
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <SectionCard title={t("profile.sectionBody")}>

          {/* Unit toggle */}
          <Field label={t("profile.units")}>
            <div
              className="flex overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--sf-border2)" }}
            >
              <button
                type="button"
                onClick={() => updateProfile({ unitSystem: "metric" })}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                style={!isImperial
                  ? { backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" }
                  : { backgroundColor: "var(--sf-input)", color: "var(--sf-text5)" }}
              >
                {t("profile.metric")}
              </button>
              <button
                type="button"
                onClick={() => updateProfile({ unitSystem: "imperial" })}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                style={isImperial
                  ? { backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" }
                  : { backgroundColor: "var(--sf-input)", color: "var(--sf-text5)" }}
              >
                {t("profile.imperial")}
              </button>
            </div>
          </Field>

          {/* Date of birth */}
          <Field label={t("profile.dateOfBirth")}>
            <input
              type="date"
              value={profile.dateOfBirth}
              min="1920-01-01"
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => updateProfile({ dateOfBirth: e.target.value })}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{
                backgroundColor: "var(--sf-input)",
                border: "1px solid var(--sf-border2)",
                color: profile.dateOfBirth ? "var(--sf-text2)" : "var(--sf-text5)",
              } as React.CSSProperties}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,210,255,0.06)"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--sf-border2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            {age !== null && (
              <p className="text-xs" style={{ color: "var(--sf-text6)" }}>
                {t("profile.age")}: <span className="font-semibold" style={{ color: "var(--sf-text1)" }}>{age}</span>
              </p>
            )}
          </Field>

          {/* Gender */}
          <Field label={t("profile.gender")}>
            <PillGroup options={GENDER_OPTIONS} value={profile.gender}
              onChange={(v) => updateProfile({ gender: v as Gender })} />
          </Field>

          {/* Height + Weight */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("profile.height")}>
              <NumInput value={dispHeight} onChange={handleHeightChange}
                placeholder={isImperial ? "69" : "175"} unit={isImperial ? "in" : "cm"} min={1} />
            </Field>
            <Field label={t("profile.weight")}>
              <NumInput value={dispWeight} onChange={handleWeightChange}
                placeholder={isImperial ? "176" : "80"} unit={isImperial ? "lb" : "kg"} min={1} />
            </Field>
          </div>

          {/* Goal weight */}
          <Field label={t("profile.goalWeight")}>
            <NumInput value={dispGoalWt} onChange={handleGoalWeightChange}
              placeholder={isImperial ? "165" : "75"} unit={isImperial ? "lb" : "kg"} min={1} />
          </Field>
        </SectionCard>

        {/* ── Goal ── */}
        <SectionCard title={t("profile.sectionGoal")}>
          <Field label={t("profile.iWantTo")}>
            <PillGroup options={GOAL_OPTIONS} value={profile.goal}
              onChange={(v) => updateProfile({ goal: v as FitnessGoal })} />
          </Field>
          <Field label={t("profile.activityLevel")}>
            <PillGroup options={ACTIVITY_OPTIONS} value={profile.activityLevel}
              onChange={(v) => updateProfile({ activityLevel: v as ActivityLevel })} />
            {profile.activityLevel && (
              <p className="pt-0.5 text-xs" style={{ color: "var(--sf-text6)" }}>
                {t(`common.activityDesc.${profile.activityLevel}`)}
              </p>
            )}
          </Field>
        </SectionCard>

        {/* ── Daily calorie target ── */}
        <SectionCard title={t("profile.sectionCalTarget")}>

          {/* Recommendation banner */}
          <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "var(--sf-border)" }}>
            {recommendation ? (
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--sf-text6)" }}
                  >
                    {t("profile.recommended")}
                  </p>
                  <p className="mt-0.5 text-lg font-black" style={{ color: "var(--sf-text1)" }}>
                    {recommendation.calories.toLocaleString()}
                    <span className="ml-1 text-sm font-medium" style={{ color: "var(--sf-text6)" }}>{t("profile.calPerDay")}</span>
                  </p>
                </div>
                <p className="text-right text-[11px] leading-snug" style={{ color: "var(--sf-text6)" }}>
                  {t("profile.basedOnStats")}
                </p>
              </div>
            ) : (
              <p className="text-xs leading-snug" style={{ color: "var(--sf-text6)" }}>
                {t("profile.completeMeasurements")}
              </p>
            )}
          </div>

          {/* Calorie input */}
          <Field label={t("profile.yourDailyGoal")}>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 min-w-0 items-center gap-2">
                <input
                  type="number"
                  min={800}
                  max={8000}
                  value={profile.calorieGoal}
                  onChange={(e) => handleCalorieChange(Number(e.target.value))}
                  className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none"
                  style={{
                    backgroundColor: "var(--sf-input)",
                    border: "1px solid var(--sf-border2)",
                    color: "#00d2ff",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,210,255,0.06)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--sf-border2)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <span className="shrink-0 text-sm" style={{ color: "var(--sf-text5)" }}>cal</span>
              </div>
              {isOverridden && (
                <button
                  type="button"
                  onClick={resetToRecommended}
                  className="shrink-0 rounded-xl px-3 py-3 text-xs font-semibold transition-colors active:scale-95"
                  style={{
                    backgroundColor: "var(--sf-input)",
                    color: "var(--sf-text5)",
                    border: "1px solid var(--sf-border2)",
                  }}
                >
                  {t("profile.reset")}
                </button>
              )}
            </div>
            {isOverridden && (
              <p className="text-[11px]" style={{ color: "var(--sf-text5)" }}>
                {t("profile.customDiffers", { cal: String(recommendation?.calories.toLocaleString()) })}
              </p>
            )}
          </Field>
        </SectionCard>

        {/* ── Dietary restrictions ── */}
        <SectionCard title={t("profile.dietaryRestrictions")}>
          <MultiPillGroup
            options={DIET_OPTIONS}
            value={profile.dietRules}
            onChange={(v) => setProfile((p) => ({ ...p, dietRules: v }))}
          />
        </SectionCard>

        {/* ── Save button ── */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl py-4 text-sm font-bold transition-all active:scale-[0.98]"
          style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
        >
          {t("profile.saveButton")}
        </button>

        <div className="h-8 shrink-0" />
      </div>
    </div>
  );
}
