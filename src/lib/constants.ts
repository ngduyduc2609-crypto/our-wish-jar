export const START_DATE = new Date(2025, 11, 22); // 22/12/2025

type AppLanguage = "vi" | "en" | "zh";
type LocalizedText = string | Partial<Record<AppLanguage, string>>;

function localizeText(value: LocalizedText, language: AppLanguage = "vi") {
  if (typeof value === "string") return value;
  return value[language] ?? value.vi ?? value.en ?? value.zh ?? "";
}

export const WISH_CATEGORIES = [
  { value: "travel", label: { vi: "Du lịch", en: "Travel", zh: "旅游" }, emoji: "✈️" },
  { value: "food", label: { vi: "Ăn uống", en: "Food & Drink", zh: "餐饮" }, emoji: "🍜" },
  { value: "experience", label: { vi: "Trải nghiệm", en: "Experience", zh: "体验" }, emoji: "🎡" },
  { value: "learn", label: { vi: "Học điều mới", en: "Learn something new", zh: "学新事物" }, emoji: "📚" },
  { value: "shopping", label: { vi: "Mua sắm", en: "Shopping", zh: "购物" }, emoji: "🛍️" },
  { value: "other", label: { vi: "Khác", en: "Other", zh: "其它" }, emoji: "🌈" },
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: { vi: "Dễ thôi", en: "Easy", zh: "容易" }, emoji: "🍀" },
  { value: "medium", label: { vi: "Vừa vừa", en: "Medium", zh: "适中" }, emoji: "🌤️" },
  { value: "hard", label: { vi: "Khó đấy", en: "Challenging", zh: "有挑战" }, emoji: "🔥" },
] as const;

export const REACTIONS = ["❤️", "😍", "😂", "🤔", "👍"] as const;

export const ACTIVITY_CATEGORIES = [
  { value: "cafe", label: { vi: "Cafe", en: "Cafe", zh: "咖啡" }, emoji: "☕" },
  { value: "cinema", label: { vi: "Rạp phim", en: "Cinema", zh: "电影" }, emoji: "🎬" },
  { value: "workshop", label: { vi: "Workshop", en: "Workshop", zh: "工作坊" }, emoji: "🎨" },
  { value: "picnic", label: { vi: "Picnic", en: "Picnic", zh: "野餐" }, emoji: "🧺" },
  { value: "walk", label: { vi: "Dạo phố", en: "Walk", zh: "散步" }, emoji: "🚶" },
  { value: "other", label: { vi: "Khác", en: "Other", zh: "其它" }, emoji: "✨" },
] as const;

export const ACTIVITY_TAGS = [
  { value: "chill", label: { vi: "Chill", en: "Chill", zh: "放松" } },
  { value: "date", label: { vi: "Hẹn hò", en: "Dating", zh: "约会" } },
  { value: "cheap", label: { vi: "Tiết kiệm", en: "Budget", zh: "省钱" } },
  { value: "fun", label: { vi: "Vui", en: "Fun", zh: "欢乐" } },
  { value: "night", label: { vi: "Buổi tối", en: "Evening", zh: "晚间" } },
] as const;

export const PRICE_LEVELS = [
  { value: 1, label: "₫" },
  { value: 2, label: "₫₫" },
  { value: 3, label: "₫₫₫" },
];

export function labelOf(
  list: readonly { value: string; label: LocalizedText; emoji?: string }[],
  value: string,
  language: AppLanguage = "vi",
) {
  const item = list.find((entry) => entry.value === value) ?? list[list.length - 1]!;
  return { ...item, label: localizeText(item.label, language) };
}

export function daysTogether(now: Date = new Date()) {
  const a = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}

export function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function todayKey(now: Date = new Date()) {
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}
