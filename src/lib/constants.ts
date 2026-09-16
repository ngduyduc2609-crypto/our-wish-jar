export const START_DATE = new Date(2025, 11, 22); // 22/12/2025

export const WISH_CATEGORIES = [
  { value: "travel", label: "Du lịch", emoji: "✈️" },
  { value: "food", label: "Ăn uống", emoji: "🍜" },
  { value: "experience", label: "Trải nghiệm", emoji: "🎡" },
  { value: "learn", label: "Học điều mới", emoji: "📚" },
  { value: "shopping", label: "Mua sắm", emoji: "🛍️" },
  { value: "other", label: "Khác", emoji: "🌈" },
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: "Dễ thôi", emoji: "🍀" },
  { value: "medium", label: "Vừa vừa", emoji: "🌤️" },
  { value: "hard", label: "Khó đấy", emoji: "🔥" },
] as const;

export const REACTIONS = ["❤️", "😍", "😂", "🤔", "👍"] as const;

export const ACTIVITY_CATEGORIES = [
  { value: "cafe", label: "Cafe", emoji: "☕" },
  { value: "cinema", label: "Rạp phim", emoji: "🎬" },
  { value: "workshop", label: "Workshop", emoji: "🎨" },
  { value: "picnic", label: "Picnic", emoji: "🧺" },
  { value: "walk", label: "Dạo phố", emoji: "🚶" },
  { value: "other", label: "Khác", emoji: "✨" },
] as const;

export const ACTIVITY_TAGS = [
  { value: "chill", label: "Chill" },
  { value: "date", label: "Hẹn hò" },
  { value: "cheap", label: "Tiết kiệm" },
  { value: "fun", label: "Vui" },
  { value: "night", label: "Buổi tối" },
] as const;

export const PRICE_LEVELS = [
  { value: 1, label: "₫" },
  { value: 2, label: "₫₫" },
  { value: 3, label: "₫₫₫" },
];

export function labelOf(
  list: readonly { value: string; label: string; emoji?: string }[],
  value: string,
) {
  return list.find((item) => item.value === value) ?? list[list.length - 1]!;
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
