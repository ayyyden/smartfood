/** Whole-number calories with locale separator (e.g. 1,240) */
export function fmtCal(n: number): string {
  return Math.round(n).toLocaleString();
}

/** Macro grams: whole number if integer, one decimal otherwise (e.g. 47 or 47.5) */
export function fmtMacro(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Pick font size class for the calorie hero based on string length */
export function calHeroSize(n: number): string {
  const len = Math.round(n).toLocaleString().length;
  if (len <= 4) return "text-[68px]";
  if (len <= 6) return "text-[52px]";
  return "text-[40px]";
}
