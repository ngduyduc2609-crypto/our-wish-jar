import { supabase } from "@/integrations/supabase/client";
import { todayKey } from "./constants";

export type Member = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  user_id: string | null;
};

export type ImageAsset = { path: string; position: string };

export type Wish = {
  id: string;
  title: string;
  note: string | null;
  category: string;
  difficulty: string;
  deadline: string | null;
  proposed_by: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  images: ImageAsset[];
};

export type WishReaction = {
  id: string;
  wish_id: string;
  member_id: string;
  emoji: string;
};

export type WishComment = {
  id: string;
  wish_id: string;
  member_id: string;
  content: string;
  created_at: string;
};

export type Food = {
  id: string;
  name: string;
  place: string | null;
  address: string | null;
  price_level: number;
  rating: number | null;
  image_url: string | null;
  image_pos: string | null;

  note: string | null;
  tried: boolean;
  tried_at: string | null;
  added_by: string | null;
  created_at: string;
  images: ImageAsset[];
};

export type Activity = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  place: string | null;
  note: string | null;
  image_url: string | null;
  image_pos: string | null;

  done: boolean;
  done_at: string | null;
  added_by: string | null;
  created_at: string;
  images: ImageAsset[];
};

export type Memory = {
  id: string;
  title: string;
  note: string | null;
  image_url: string | null;
  image_pos: string | null;

  happened_on: string;
  rating: number | null;
  source_type: string;
  source_id: string | null;
  created_by: string | null;
  created_at: string;
  images: ImageAsset[];
};

export type LogEntry = {
  id: string;
  member_id: string | null;
  action: string;
  subject: string | null;
  created_at: string;
};

export type Presence = { member_id: string; day: string };

const db = supabase as unknown as {
  from: (table: string) => any;
  storage: typeof supabase.storage;
};

async function rows<T>(promise: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const { data, error } = await promise;
  if (error) throw error;
  return (data ?? []) as T[];
}

export const fetchMembers = () =>
  rows<Member>(db.from("members").select("*").order("created_at"));

export const fetchWishes = () =>
  rows<Wish>(db.from("wishes").select("*").order("created_at", { ascending: false }));

export const fetchReactions = () => rows<WishReaction>(db.from("wish_reactions").select("*"));

export const fetchComments = () =>
  rows<WishComment>(db.from("wish_comments").select("*").order("created_at"));

export const fetchFoods = () =>
  rows<Food>(db.from("foods").select("*").order("created_at", { ascending: false }));

export const fetchActivities = () =>
  rows<Activity>(db.from("activities").select("*").order("created_at", { ascending: false }));

export const fetchMemories = () =>
  rows<Memory>(db.from("memories").select("*").order("happened_on", { ascending: false }));

export const fetchLog = () =>
  rows<LogEntry>(
    db.from("activity_log").select("*").order("created_at", { ascending: false }).limit(25),
  );

export const fetchPresence = () => rows<Presence>(db.from("daily_presence").select("*"));

export async function insertRow<T>(table: string, values: Record<string, unknown>) {
  const { data, error } = await db.from(table).insert(values).select().single();
  if (error) throw error;
  return data as T;
}

export async function updateRow<T>(table: string, id: string, values: Record<string, unknown>) {
  const { data, error } = await db.from(table).update(values).eq("id", id).select().single();
  if (error) throw error;
  return data as T;
}

export async function deleteRow(table: string, id: string) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function logAction(memberId: string, action: string, subject?: string | null) {
  await db.from("activity_log").insert({ member_id: memberId, action, subject: subject ?? null });
  await db
    .from("daily_presence")
    .upsert({ member_id: memberId, day: todayKey() }, { onConflict: "member_id,day" });
}

export async function toggleReaction(wishId: string, memberId: string, emoji: string) {
  const { data } = await db
    .from("wish_reactions")
    .select("id")
    .eq("wish_id", wishId)
    .eq("member_id", memberId)
    .eq("emoji", emoji)
    .maybeSingle();
  if (data?.id) {
    await db.from("wish_reactions").delete().eq("id", data.id);
    return false;
  }
  const { error } = await db
    .from("wish_reactions")
    .insert({ wish_id: wishId, member_id: memberId, emoji });
  if (error) throw error;
  return true;
}

export async function uploadImage(file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function signedUrl(path: string) {
  const { data, error } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24);
  if (error) throw error;
  return data.signedUrl;
}

export function imageAssets(images: ImageAsset[] | null | undefined, legacyPath?: string | null, legacyPosition?: string | null) {
  if (Array.isArray(images) && images.length > 0) return images;
  return legacyPath ? [{ path: legacyPath, position: legacyPosition ?? "50% 50%" }] : [];
}

/** Số ngày liên tiếp gần nhất mà CẢ HAI người đều có hoạt động. */
export function computeStreak(presence: Presence[], memberCount: number) {
  const byDay = new Map<string, Set<string>>();
  for (const p of presence) {
    if (!byDay.has(p.day)) byDay.set(p.day, new Set());
    byDay.get(p.day)!.add(p.member_id);
  }
  const fullDays = new Set(
    [...byDay.entries()].filter(([, s]) => s.size >= Math.max(2, memberCount)).map(([d]) => d),
  );

  const sorted = [...fullDays].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    if (prev && dayDiff(prev, day) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = day;
  }

  let current = 0;
  const cursor = new Date();
  if (!fullDays.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (fullDays.has(todayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, best };
}

function dayDiff(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function pickRandom<T>(items: T[], exclude?: T): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0]!;
  let choice = items[Math.floor(Math.random() * items.length)]!;
  let guard = 0;
  while (exclude !== undefined && choice === exclude && guard < 10) {
    choice = items[Math.floor(Math.random() * items.length)]!;
    guard += 1;
  }
  return choice;
}
