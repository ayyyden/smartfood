// ─── Types ───────────────────────────────────────────────────────────────────

export type Gender        = "male" | "female" | "other"; // "other" kept for old saved data
export type FitnessGoal   = "lose" | "maintain" | "gain";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type UnitSystem    = "metric" | "imperial";

export type Profile = {
  // Body (always stored in metric internally)
  dateOfBirth:  string;        // "YYYY-MM-DD"
  gender:       Gender | "";
  heightCm:     number | "";
  weightKg:     number | "";
  goalWeightKg: number | "";
  unitSystem:   UnitSystem;

  // Fitness
  goal:          FitnessGoal | "";
  activityLevel: ActivityLevel | "";

  // Calorie targets
  calorieGoal:         number;
  recommendedCalories: number | null;
  calorieOverridden:   boolean;
  proteinGoalG:        number; // auto-calculated, used by DailyInfoCard
  carbsGoalG:          number; // auto-calculated, used by DailyInfoCard
  fatGoalG:            number; // auto-calculated, used by DailyInfoCard

  // Dietary restrictions (multi-select values)
  dietRules: string[];

  // Extended profile (stored in Supabase)
  foodPreferences?: string;
  dislikedFoods?: string;
  onboardingCompleted?: boolean;
  tutorialCompleted?: boolean;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_PROFILE: Profile = {
  dateOfBirth:  "",
  gender:       "",
  heightCm:     "",
  weightKg:     "",
  goalWeightKg: "",
  unitSystem:   "metric",
  goal:          "",
  activityLevel: "",
  calorieGoal:         1850,
  recommendedCalories: null,
  calorieOverridden:   false,
  proteinGoalG: 140,
  carbsGoalG:   200,
  fatGoalG:     55,
  dietRules:    [],
  tutorialCompleted: false,
};

// ─── Age from date of birth ───────────────────────────────────────────────────

export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const PROFILE_KEY = "smartfood_profile";

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const saved = JSON.parse(raw) as Record<string, unknown>;
    // Backwards compat: dietRules was a string, now string[]
    if (typeof saved.dietRules === "string") {
      saved.dietRules = saved.dietRules ? [saved.dietRules] : [];
    }
    return { ...DEFAULT_PROFILE, ...(saved as Partial<Profile>) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn("[storage] Failed to save profile:", err);
  }
}

// ─── Calorie recommendation (Mifflin-St Jeor + TDEE) ─────────────────────────

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT: Record<FitnessGoal, number> = {
  lose:     -500,
  maintain:    0,
  gain:      300,
};

// Exported so onboarding can compute TDEE from a recommendation
export const GOAL_CAL_OFFSET: Partial<Record<string, number>> = {
  lose: -500, maintain: 0, gain: 300,
};

const PROTEIN_RATIO: Record<FitnessGoal, number> = {
  lose:     2.0,
  maintain: 1.6,
  gain:     2.2,
};

export type Recommendation = {
  calories: number;
  protein:  number;
};

export function calculateRecommended(p: Profile): Recommendation | null {
  const age = calculateAge(p.dateOfBirth);
  if (!age || !p.gender || !p.heightCm || !p.weightKg || !p.goal || !p.activityLevel) {
    return null;
  }

  const w = Number(p.weightKg);
  const h = Number(p.heightCm);

  // Mifflin-St Jeor BMR
  const bmrMale   = 10 * w + 6.25 * h - 5 * age + 5;
  const bmrFemale = 10 * w + 6.25 * h - 5 * age - 161;
  const bmr =
    p.gender === "male"   ? bmrMale :
    p.gender === "female" ? bmrFemale :
    (bmrMale + bmrFemale) / 2;

  const tdee     = bmr * ACTIVITY_MULTIPLIER[p.activityLevel as ActivityLevel];
  const calories = Math.max(Math.round(tdee + GOAL_ADJUSTMENT[p.goal as FitnessGoal]), 1200);
  const protein  = Math.max(Math.round(w * PROTEIN_RATIO[p.goal as FitnessGoal]), 50);

  return { calories, protein };
}

export function deriveMacros(calories: number, goal: FitnessGoal | ""): { carbs: number; fat: number } {
  const carbsPct = goal === "gain" ? 0.50 : goal === "lose" ? 0.40 : 0.45;
  const fatPct   = 0.25;
  return {
    carbs: Math.round((calories * carbsPct) / 4),
    fat:   Math.round((calories * fatPct)   / 9),
  };
}
