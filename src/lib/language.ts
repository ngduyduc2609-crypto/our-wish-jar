export type AppLanguage = "vi" | "en" | "zh";

export const LANGUAGE_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
] as const;

export const NAV_LABELS = {
  home: { vi: "Nhà", en: "Home", zh: "首页" },
  wishes: { vi: "Điều ước", en: "Wishes", zh: "心愿" },
  food: { vi: "Ăn gì", en: "Food", zh: "美食" },
  activities: { vi: "Làm gì", en: "Activities", zh: "活动" },
  memories: { vi: "Kỷ niệm", en: "Memories", zh: "回忆" },
} as const;

export function isAppLanguage(value: string | null): value is AppLanguage {
  return value === "vi" || value === "en" || value === "zh";
}

export function getLanguageStorageKey() {
  if (typeof window === "undefined") return "wish-jar-language:guest";
  const email = (window.localStorage.getItem("wishjar_user_email") ?? "").trim().toLowerCase();
  return email ? `wish-jar-language:${email}` : "wish-jar-language:guest";
}

export function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "vi";
  const saved = window.localStorage.getItem(getLanguageStorageKey());
  return isAppLanguage(saved) ? saved : "vi";
}

export function notifyLanguageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wishjar-language-change"));
  }
}

export function applyLanguage(language: AppLanguage) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.dataset.lang = language;
  notifyLanguageChange();
}
