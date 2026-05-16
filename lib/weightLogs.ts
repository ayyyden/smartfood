export type WeightLog = {
  id:        string;
  weight:    number;   // always stored in kg
  date:      string;   // YYYY-MM-DD
  time:      string;   // HH:MM
  createdAt: string;   // ISO
};

const STORAGE_KEY = "smartfood_weight_logs";

export function loadWeightLogs(): WeightLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WeightLog[];
  } catch {
    return [];
  }
}

export function saveWeightLogs(logs: WeightLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {}
}

export function createWeightLog(weightKg: number, date: string, time: string): WeightLog {
  return {
    id:        crypto.randomUUID(),
    weight:    weightKg,
    date,
    time,
    createdAt: new Date().toISOString(),
  };
}

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.2046 * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.2046) * 10) / 10;
}
