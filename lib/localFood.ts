import type { Lang } from "@/context/LanguageContext";

export function localName(
  item: { name: string; nameHe?: string },
  lang: Lang,
): string {
  return lang === "he" && item.nameHe ? item.nameHe : item.name;
}

export function localNote(
  item: { note: string; noteHe?: string },
  lang: Lang,
): string {
  return lang === "he" && item.noteHe ? item.noteHe : item.note;
}

export function localWarning(
  item: { warning?: string; warningHe?: string },
  lang: Lang,
): string | undefined {
  return lang === "he" && item.warningHe ? item.warningHe : item.warning;
}
