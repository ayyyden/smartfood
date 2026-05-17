"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { upsertProfile } from "@/lib/db/profiles";
import {
  type Profile,
  type Gender,
  type FitnessGoal,
  type ActivityLevel,
  DEFAULT_PROFILE,
  calculateRecommended,
  deriveMacros,
  calculateAge,
  GOAL_CAL_OFFSET,
} from "@/lib/profile";
import DumbbellLogo from "@/components/DumbbellLogo";
import { useLang } from "@/context/LanguageContext";

const TOTAL_STEPS = 5;

// ─── Small helpers ────────────────────────────────────────────────────────────

function kgToLb(kg: number) { return Math.round(kg * 2.2046 * 10) / 10; }
function lbToKg(lb: number) { return Math.round((lb / 2.2046) * 10) / 10; }
function cmToIn(cm: number) { return Math.round((cm / 2.54) * 10) / 10; }
function inToCm(i: number)  { return Math.round(i * 2.54 * 10) / 10; }

function PillGroup({
  options, value, onChange,
}: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={active
              ? { backgroundColor: "rgba(0,210,255,0.12)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.35)" }
              : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)", border: "1px solid var(--sf-border2)" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiPill({
  options, value, onChange,
}: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.value);
        return (
          <button key={o.value} type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all active:scale-95"
            style={active
              ? { backgroundColor: "rgba(0,210,255,0.12)", color: "#00d2ff", border: "1px solid rgba(0,210,255,0.35)" }
              : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)", border: "1px solid var(--sf-border2)" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "var(--sf-input)",
  border: "1px solid var(--sf-border2)",
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "15px",
  color: "var(--sf-text1)",
  outline: "none",
};

function NumInput({ value, onChange, placeholder, unit }: {
  value: number | ""; onChange: (v: number | "") => void; placeholder: string; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        style={{ ...inputStyle, flex: 1 }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sf-border2)")}
      />
      {unit && <span className="text-sm w-8 shrink-0" style={{ color: "var(--sf-text4)" }}>{unit}</span>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--sf-text5)" }}>{children}</p>;
}

function getErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof e.message === "string" && e.message) parts.push(e.message);
    if (typeof e.code    === "string" && e.code)    parts.push(`code: ${e.code}`);
    if (typeof e.details === "string" && e.details) parts.push(`details: ${e.details}`);
    if (typeof e.hint    === "string" && e.hint)    parts.push(`hint: ${e.hint}`);
    return parts.join(" — ") || JSON.stringify(err);
  }
  return String(err);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { dispatch } = useApp();
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profile, setProfile] = useState<Profile>({ ...DEFAULT_PROFILE });
  const [calInput, setCalInput] = useState(String(DEFAULT_PROFILE.calorieGoal));
  const [proteinInput, setProteinInput] = useState(String(DEFAULT_PROFILE.proteinGoalG));

  const isImperial  = profile.unitSystem === "imperial";
  const rec         = calculateRecommended(profile);
  const age         = calculateAge(profile.dateOfBirth);

  useEffect(() => { setCalInput(String(profile.calorieGoal)); }, [profile.calorieGoal]);
  useEffect(() => { setProteinInput(String(profile.proteinGoalG)); }, [profile.proteinGoalG]);

  const dispHeight  = profile.heightCm    === "" ? "" : isImperial ? cmToIn(profile.heightCm)    : profile.heightCm;
  const dispWeight  = profile.weightKg    === "" ? "" : isImperial ? kgToLb(profile.weightKg)    : profile.weightKg;
  const dispGoalWt  = profile.goalWeightKg=== "" ? "" : isImperial ? kgToLb(profile.goalWeightKg): profile.goalWeightKg;

  // Option lists built from translations
  const GENDER_OPTS = [
    { value: "male",   label: t("common.gender.male") },
    { value: "female", label: t("common.gender.female") },
  ];
  const GOAL_OPTS = [
    { value: "lose",     label: t("common.goal.lose") },
    { value: "maintain", label: t("common.goal.maintain") },
    { value: "gain",     label: t("common.goal.gain") },
  ];
  const ACTIVITY_OPTS = [
    { value: "sedentary",   label: t("common.activity.sedentary") },
    { value: "light",       label: t("common.activity.light") },
    { value: "moderate",    label: t("common.activity.moderate") },
    { value: "active",      label: t("common.activity.active") },
    { value: "very_active", label: t("common.activity.very_active") },
  ];
  const DIET_OPTS = [
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
  ];

  function update(updates: Partial<Profile>) {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      const r = calculateRecommended(next);
      if (r && !next.calorieOverridden) {
        next.calorieGoal  = r.calories;
        next.proteinGoalG = r.protein;
        next.recommendedCalories = r.calories;
        const m = deriveMacros(r.calories, next.goal);
        next.carbsGoalG = m.carbs;
        next.fatGoalG   = m.fat;
      } else {
        next.recommendedCalories = r?.calories ?? null;
      }
      return next;
    });
  }

  async function finish() {
    if (!user) { setSaveError(t("onboarding.notSignedIn")); return; }
    setSaving(true);
    setSaveError("");
    try {
      await upsertProfile(user.id, { ...profile, onboardingCompleted: true });
      dispatch({
        type: "SET_GOALS",
        payload: {
          calories: profile.calorieGoal,
          protein:  profile.proteinGoalG,
          carbs:    profile.carbsGoalG,
          fat:      profile.fatGoalG,
        },
      });
      router.push("/");
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Onboarding] full error:", JSON.stringify(err, null, 2));
      }
      setSaveError(getErrorMessage(err) || "Failed to save profile. Please try again.");
      setSaving(false);
    }
  }

  const pct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--sf-bg)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-6">
        <DumbbellLogo size={28} glow={0.35} />
        <p className="text-lg font-black" style={{ color: "var(--sf-text1)" }}>Smartfood</p>
      </div>

      {/* Progress bar */}
      <div className="px-5">
        <div className="overflow-hidden rounded-full" style={{ height: "3px", backgroundColor: "var(--sf-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: "#00d2ff", boxShadow: "0 0 8px rgba(0,210,255,0.5)" }}
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--sf-text5)" }}>
          {t("onboarding.step", { step: String(step), total: String(TOTAL_STEPS) })}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* ── Step 1: Basics ── */}
        {step === 1 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>{t("onboarding.step1Title")}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>{t("onboarding.step1Subtitle")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>{t("onboarding.dateOfBirth")}</Label>
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => update({ dateOfBirth: e.target.value })}
                  style={{ ...inputStyle }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sf-border2)")}
                />
                {age && (
                  <p className="mt-1.5 text-xs" style={{ color: "var(--sf-text5)" }}>
                    {t("onboarding.age", { age: String(age) })}
                  </p>
                )}
              </div>

              <div>
                <Label>{t("onboarding.gender")}</Label>
                <PillGroup options={GENDER_OPTS} value={profile.gender} onChange={(v) => update({ gender: v as Gender })} />
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Body ── */}
        {step === 2 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>{t("onboarding.step2Title")}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>{t("onboarding.step2Subtitle")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>{t("onboarding.units")}</Label>
                <div className="flex overflow-hidden rounded-2xl" style={{ border: "1px solid var(--sf-border2)" }}>
                  <button type="button" onClick={() => update({ unitSystem: "metric" })}
                    className="flex-1 py-3 text-sm font-bold transition-colors"
                    style={!isImperial ? { backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" } : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)" }}>
                    {t("onboarding.metric")}
                  </button>
                  <button type="button" onClick={() => update({ unitSystem: "imperial" })}
                    className="flex-1 py-3 text-sm font-bold transition-colors"
                    style={isImperial ? { backgroundColor: "rgba(0,210,255,0.1)", color: "#00d2ff" } : { backgroundColor: "var(--sf-input)", color: "var(--sf-text4)" }}>
                    {t("onboarding.imperial")}
                  </button>
                </div>
              </div>

              <div>
                <Label>{t("onboarding.height")}</Label>
                <NumInput value={dispHeight} placeholder={isImperial ? "70" : "175"}
                  unit={isImperial ? "in" : "cm"}
                  onChange={(v) => update({ heightCm: v === "" ? "" : isImperial ? inToCm(v) : v })} />
              </div>

              <div>
                <Label>{t("onboarding.currentWeight")}</Label>
                <NumInput value={dispWeight} placeholder={isImperial ? "170" : "77"}
                  unit={isImperial ? "lb" : "kg"}
                  onChange={(v) => update({ weightKg: v === "" ? "" : isImperial ? lbToKg(v) : v })} />
              </div>

              <div>
                <Label>{t("onboarding.goalWeight")}</Label>
                <NumInput value={dispGoalWt} placeholder={isImperial ? "155" : "70"}
                  unit={isImperial ? "lb" : "kg"}
                  onChange={(v) => update({ goalWeightKg: v === "" ? "" : isImperial ? lbToKg(v) : v })} />
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Goal ── */}
        {step === 3 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>{t("onboarding.step3Title")}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>{t("onboarding.step3Subtitle")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>{t("onboarding.iWantTo")}</Label>
                <PillGroup options={GOAL_OPTS} value={profile.goal} onChange={(v) => update({ goal: v as FitnessGoal })} />
              </div>

              <div>
                <Label>{t("onboarding.activityLevel")}</Label>
                <PillGroup options={ACTIVITY_OPTS} value={profile.activityLevel}
                  onChange={(v) => update({ activityLevel: v as ActivityLevel })} />
                {profile.activityLevel && (
                  <p className="mt-2 text-xs" style={{ color: "var(--sf-text5)" }}>
                    {t(`common.activityDesc.${profile.activityLevel}`)}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Calorie target ── */}
        {step === 4 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>{t("onboarding.step4Title")}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>{t("onboarding.step4Subtitle")}</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}>
                {rec ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--sf-text5)" }}>
                        {t("onboarding.recommended")}
                      </p>
                      <p className="mt-0.5 text-2xl font-black" style={{ color: "#00d2ff" }}>
                        {rec.calories.toLocaleString()}
                        <span className="ml-1 text-sm font-normal" style={{ color: "var(--sf-text4)" }}>{t("onboarding.calPerDay")}</span>
                      </p>
                    </div>
                    <p className="text-right text-xs leading-snug" style={{ color: "var(--sf-text5)" }}>
                      {t("onboarding.basedOnStats")}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--sf-text4)" }}>
                    {t("onboarding.completeStats")}
                  </p>
                )}
              </div>

              <div>
                <Label>{t("onboarding.dailyCalGoal")}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={800}
                    max={8000}
                    value={calInput}
                    onChange={(e) => setCalInput(e.target.value)}
                    onBlur={() => {
                      const cal = Math.max(800, Number(calInput) || profile.calorieGoal);
                      const overridden = rec ? cal !== rec.calories : true;
                      const m = deriveMacros(cal, profile.goal);
                      setProfile((p) => ({ ...p, calorieGoal: cal, calorieOverridden: overridden, carbsGoalG: m.carbs, fatGoalG: m.fat }));
                    }}
                    style={{ ...inputStyle, flex: 1, color: "#00d2ff", fontWeight: 800 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  />
                  <span className="text-sm" style={{ color: "var(--sf-text4)" }}>cal</span>
                </div>
              </div>

              <div>
                <Label>{t("onboarding.dailyProteinGoal")}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={30}
                    value={proteinInput}
                    onChange={(e) => setProteinInput(e.target.value)}
                    onBlur={() => {
                      const protein = Math.max(30, Number(proteinInput) || profile.proteinGoalG);
                      setProfile((p) => ({ ...p, proteinGoalG: protein }));
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  />
                  <span className="text-sm" style={{ color: "var(--sf-text4)" }}>g</span>
                </div>
                {rec && (
                  <p className="mt-1.5 text-xs" style={{ color: "var(--sf-text5)" }}>
                    {t("onboarding.recommendedProtein", { g: String(rec.protein) })}
                  </p>
                )}
              </div>

              {/* Weight rate estimate */}
              {(() => {
                if (!rec || !profile.goal) return null;
                const offset = GOAL_CAL_OFFSET[profile.goal] ?? 0;
                const tdee = rec.calories - offset;
                const dailyDelta = profile.calorieGoal - tdee;
                const kgPerWeek = Math.round(dailyDelta * 7 / 7700 * 10) / 10;
                const dispChange = isImperial
                  ? Math.round(kgPerWeek * 2.2046 * 10) / 10
                  : kgPerWeek;
                const unit = isImperial ? "lb" : "kg";
                const isLoss = kgPerWeek < -0.05;
                const isGain = kgPerWeek > 0.05;
                return (
                  <div
                    className="rounded-2xl px-4 py-3.5 space-y-1"
                    style={{ backgroundColor: "var(--sf-surface)", border: "1px solid var(--sf-border2)" }}
                  >
                    {isLoss ? (
                      <p className="text-sm" style={{ color: "#4ade80" }}>
                        {t("onboarding.estimateLoss", {
                          cal: profile.calorieGoal.toLocaleString(),
                          amount: Math.abs(dispChange).toFixed(1),
                          unit,
                        })}
                      </p>
                    ) : isGain ? (
                      <p className="text-sm" style={{ color: "#fb923c" }}>
                        {t("onboarding.estimateGain", {
                          cal: profile.calorieGoal.toLocaleString(),
                          amount: dispChange.toFixed(1),
                          unit,
                        })}
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--sf-text4)" }}>
                        {t("onboarding.estimateMaintain", { cal: profile.calorieGoal.toLocaleString() })}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: "var(--sf-text5)" }}>
                      {t("onboarding.estimateNote")}
                    </p>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* ── Step 5: Food preferences ── */}
        {step === 5 && (
          <>
            <div>
              <p className="text-[24px] font-black" style={{ color: "var(--sf-text1)" }}>{t("onboarding.step5Title")}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--sf-text4)" }}>{t("onboarding.step5Subtitle")}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>{t("onboarding.dietaryRestrictions")}</Label>
                <MultiPill options={DIET_OPTS} value={profile.dietRules}
                  onChange={(v) => setProfile((p) => ({ ...p, dietRules: v }))} />
              </div>

              <div>
                <Label>{t("onboarding.foodsYouEnjoy")}</Label>
                <textarea
                  rows={2}
                  placeholder={t("onboarding.foodsEnjoyPlaceholder")}
                  value={profile.foodPreferences ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, foodPreferences: e.target.value }))}
                  style={{ ...inputStyle, resize: "none", lineHeight: "1.5" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sf-border2)")}
                />
              </div>

              <div>
                <Label>{t("onboarding.foodsYouDislike")}</Label>
                <textarea
                  rows={2}
                  placeholder={t("onboarding.foodsDislikePlaceholder")}
                  value={profile.dislikedFoods ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, dislikedFoods: e.target.value }))}
                  style={{ ...inputStyle, resize: "none", lineHeight: "1.5" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,210,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sf-border2)")}
                />
              </div>
            </div>
          </>
        )}

      </div>

      {/* Footer navigation */}
      <div className="px-5 pb-10 pt-4 space-y-3">
        {saveError && (
          <p
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(255,80,80,0.08)", color: "#ff6060", border: "1px solid rgba(255,80,80,0.2)" }}
          >
            {saveError}
          </p>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="w-full rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
          >
            {t("onboarding.continue")}
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="w-full rounded-2xl py-4 text-sm font-black transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: "#00d2ff", color: "#0a0a0a" }}
          >
            {saving ? t("onboarding.saving") : t("onboarding.getStarted")}
          </button>
        )}
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="w-full rounded-2xl py-3 text-sm font-semibold"
            style={{ color: "var(--sf-text4)" }}
          >
            {t("onboarding.back")}
          </button>
        )}
        {step < TOTAL_STEPS && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="w-full text-xs"
            style={{ color: "var(--sf-text6)" }}
          >
            {t("onboarding.skipForNow")}
          </button>
        )}
      </div>
    </div>
  );
}
