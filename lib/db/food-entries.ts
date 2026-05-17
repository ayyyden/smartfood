import { createClient } from "@/lib/supabase/client";
import type { FoodEntry } from "@/context/AppContext";

// Returns YYYY-MM-DD in the user's LOCAL timezone, not UTC.
// This is the canonical date key used for all per-day filtering.
export function getLocalDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchTodayEntries(userId: string): Promise<FoodEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date_key", getLocalDateKey())
    .order("logged_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id:       row.id as string,
    text:     (row.original_text as string) ?? "",
    time:     (row.logged_at as string) ?? new Date().toISOString(),
    calories: Number(row.calories),
    protein:  Number(row.protein),
    carbs:    Number(row.carbs),
    fat:      Number(row.fat),
    items:    row.items ?? undefined,
  }));
}

export async function insertFoodEntry(userId: string, entry: FoodEntry): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("food_entries").insert({
    id:            entry.id,
    user_id:       userId,
    original_text: entry.text,
    logged_at:     entry.time,
    date:          entry.time.split("T")[0],
    date_key:      getLocalDateKey(),
    calories:      entry.calories,
    protein:       entry.protein,
    carbs:         entry.carbs,
    fat:           entry.fat,
    items:         entry.items ?? null,
  });
  if (error) throw error;
}

export async function updateFoodEntry(entry: FoodEntry): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("food_entries")
    .update({
      original_text: entry.text,
      calories:      entry.calories,
      protein:       entry.protein,
      carbs:         entry.carbs,
      fat:           entry.fat,
      items:         entry.items ?? null,
    })
    .eq("id", entry.id);
  if (error) throw error;
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("food_entries").delete().eq("id", id);
  if (error) throw error;
}
