import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/profile";
import { DEFAULT_PROFILE } from "@/lib/profile";

// DB row → TypeScript Profile
function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    ...DEFAULT_PROFILE,
    dateOfBirth:         (row.date_of_birth as string)  ?? "",
    gender:              (row.gender as Profile["gender"]) ?? "",
    heightCm:            row.height_cm != null ? Number(row.height_cm) : "",
    weightKg:            row.weight_kg != null ? Number(row.weight_kg) : "",
    goalWeightKg:        row.goal_weight_kg != null ? Number(row.goal_weight_kg) : "",
    unitSystem:          (row.unit_system as Profile["unitSystem"]) ?? "metric",
    goal:                (row.goal as Profile["goal"]) ?? "",
    activityLevel:       (row.activity_level as Profile["activityLevel"]) ?? "",
    calorieGoal:         row.calorie_goal != null ? Number(row.calorie_goal) : DEFAULT_PROFILE.calorieGoal,
    recommendedCalories: row.recommended_calories != null ? Number(row.recommended_calories) : null,
    calorieOverridden:   Boolean(row.calorie_overridden),
    proteinGoalG:        row.protein_goal_g != null ? Number(row.protein_goal_g) : DEFAULT_PROFILE.proteinGoalG,
    carbsGoalG:          row.carbs_goal_g != null ? Number(row.carbs_goal_g) : DEFAULT_PROFILE.carbsGoalG,
    fatGoalG:            row.fat_goal_g != null ? Number(row.fat_goal_g) : DEFAULT_PROFILE.fatGoalG,
    dietRules:           Array.isArray(row.diet_rules) ? (row.diet_rules as string[]) : [],
    foodPreferences:     (row.food_preferences as string) ?? "",
    dislikedFoods:       (row.disliked_foods as string) ?? "",
    onboardingCompleted: Boolean(row.onboarding_completed),
    tutorialCompleted:   Boolean(row.tutorial_completed),
  };
}

// TypeScript Profile → DB row
function profileToRow(userId: string, profile: Profile) {
  return {
    user_id:              userId,
    date_of_birth:        profile.dateOfBirth || null,
    gender:               profile.gender || null,
    height_cm:            profile.heightCm !== "" ? Number(profile.heightCm) : null,
    weight_kg:            profile.weightKg !== "" ? Number(profile.weightKg) : null,
    goal_weight_kg:       profile.goalWeightKg !== "" ? Number(profile.goalWeightKg) : null,
    unit_system:          profile.unitSystem,
    goal:                 profile.goal || null,
    activity_level:       profile.activityLevel || null,
    calorie_goal:         profile.calorieGoal,
    recommended_calories: profile.recommendedCalories,
    calorie_overridden:   profile.calorieOverridden,
    protein_goal_g:       profile.proteinGoalG,
    carbs_goal_g:         profile.carbsGoalG,
    fat_goal_g:           profile.fatGoalG,
    diet_rules:           profile.dietRules,
    food_preferences:     profile.foodPreferences ?? "",
    disliked_foods:       profile.dislikedFoods ?? "",
    onboarding_completed: profile.onboardingCompleted ?? false,
  };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return rowToProfile(data as Record<string, unknown>);
}

export async function upsertProfile(userId: string, profile: Profile): Promise<void> {
  const supabase = createClient();
  const row = profileToRow(userId, profile);
  const { error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "user_id" });
  if (error) {
    console.error("[upsertProfile] code:", error.code);
    console.error("[upsertProfile] message:", error.message);
    console.error("[upsertProfile] details:", error.details);
    console.error("[upsertProfile] hint:", error.hint);
    throw error;
  }
}

export async function markTutorialCompleted(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ tutorial_completed: true })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .single();
  return Boolean(data?.onboarding_completed);
}
