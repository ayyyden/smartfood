import { createClient } from "@/lib/supabase/client";
import type { WeightLog } from "@/lib/weightLogs";

export async function fetchWeightLogs(userId: string): Promise<WeightLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id:        row.id as string,
    weight:    Number(row.weight_kg),
    date:      row.date as string,
    time:      row.time as string,
    createdAt: row.created_at as string,
  }));
}

export async function insertWeightLog(userId: string, log: WeightLog): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("weight_logs").insert({
    id:        log.id,
    user_id:   userId,
    weight_kg: log.weight,
    date:      log.date,
    time:      log.time,
    created_at: log.createdAt,
  });
  if (error) throw error;
}

export async function updateWeightLog(log: WeightLog): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("weight_logs")
    .update({ weight_kg: log.weight, date: log.date, time: log.time })
    .eq("id", log.id);
  if (error) throw error;
}

export async function deleteWeightLog(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw error;
}
