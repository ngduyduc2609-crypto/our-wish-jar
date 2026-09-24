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

function readCurrentUserIdentity() {
  if (typeof window === "undefined") return null;

  const email = (window.localStorage.getItem("wishjar_user_email") ?? "").trim().toLowerCase();
  const name = window.localStorage.getItem("wishjar_user_name")?.trim() ||
    (email.includes("duc") ? "Duy Đức" : email.includes("thuy") || email.includes("thu") ? "Thu Thủy" : "Chúng mình");

  if (!email) return null;

  return { email, name };
}

function isValidUuid(value: unknown) {
  if (typeof value !== "string") return false;
  const candidate = value.trim();
  return /^[0-9a-fA-F-]{36}$/.test(candidate);
}

function normalizeMemberId(value: unknown) {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate === "null" || candidate === "undefined") return null;
  return isValidUuid(candidate) ? candidate : null;
}

async function getFallbackMemberId() {
  try {
    const members = await fetchMembers();
    const identity = readCurrentUserIdentity();

    if (identity) {
      const direct = await resolveMemberIdForEmail(identity.email);
      if (direct) return direct;
    }

    return members[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function resolveMemberIdForEmail(email?: string | null) {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return null;

  const members = await fetchMembers();
  const directMatch = members.find((member) => {
    const target = member.name.toLowerCase();
    if (normalized.includes("duc")) return target.includes("duy");
    if (normalized.includes("thu") || normalized.includes("thuy")) return target.includes("thu") || target.includes("thuy");
    return false;
  });

  return directMatch?.id ?? null;
}

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

function sanitizePayload(table: string, values: Record<string, unknown>, memberId: string | null) {
  const resolvedValues = { ...values };

  const validMemberId = normalizeMemberId(memberId) ?? normalizeMemberId(resolvedValues.user_id);
  if (validMemberId) {
    resolvedValues.user_id = validMemberId;
  } else if (resolvedValues.user_id == null || resolvedValues.user_id === "" || resolvedValues.user_id === "null") {
    resolvedValues.user_id = null;
  }

  if (table === "activities" || table === "memories" || table === "foods" || table === "wishes") {
    const ownerId = normalizeMemberId(resolvedValues.user_id) ?? validMemberId ?? normalizeMemberId(resolvedValues.created_by) ?? normalizeMemberId(resolvedValues.added_by) ?? normalizeMemberId(resolvedValues.proposed_by);
    if (ownerId) {
      resolvedValues.user_id = ownerId;
    }
  }

  if (table === "wishes") {
    const safeCategory = String(resolvedValues.category ?? "experience").trim() || "experience";
    const safeDifficulty = String(resolvedValues.difficulty ?? "medium").trim() || "medium";
    const safeTitle = String(resolvedValues.title ?? "").trim();
    const safeNote = resolvedValues.note == null ? null : String(resolvedValues.note).trim() || null;

    if (!safeTitle) throw new Error("Vui lòng nhập tiêu đề điều ước.");
    if (!safeCategory) throw new Error("Vui lòng chọn loại điều ước hợp lệ.");
    if (!safeDifficulty) throw new Error("Vui lòng chọn độ khó hợp lệ.");

    resolvedValues.title = safeTitle;
    resolvedValues.note = safeNote;
    resolvedValues.category = safeCategory;
    resolvedValues.difficulty = safeDifficulty;
    resolvedValues.completed = Boolean(resolvedValues.completed ?? false);
    resolvedValues.deadline = resolvedValues.deadline ?? null;
    resolvedValues.images = Array.isArray(resolvedValues.images) ? resolvedValues.images : [];

    const validProposedBy = normalizeMemberId(resolvedValues.proposed_by) ?? validMemberId;
    resolvedValues.proposed_by = validProposedBy ?? null;
  }

  if (table === "memories") {
    const safeTitle = String(resolvedValues.title ?? "").trim();
    if (!safeTitle) throw new Error("Vui lòng nhập tiêu đề kỷ niệm.");

    resolvedValues.title = safeTitle;
    resolvedValues.images = Array.isArray(resolvedValues.images) ? resolvedValues.images : [];
    const memoryImage = typeof resolvedValues.image_url === "string" && resolvedValues.image_url.trim() ? resolvedValues.image_url.trim() : null;
    resolvedValues.image_url = memoryImage ?? (Array.isArray(resolvedValues.images) && resolvedValues.images[0]?.path ? resolvedValues.images[0].path : null);
    resolvedValues.image_pos = resolvedValues.image_pos ?? "50% 50%";

    const validCreatedBy = normalizeMemberId(resolvedValues.created_by) ?? validMemberId;
    resolvedValues.created_by = validCreatedBy ?? null;
  }

  if (table === "activities") {
    const safeName = String(resolvedValues.name ?? "").trim();
    if (!safeName) throw new Error("Vui lòng nhập tên hoạt động.");
    resolvedValues.name = safeName;
    resolvedValues.images = Array.isArray(resolvedValues.images) ? resolvedValues.images : [];
    const activityImage = typeof resolvedValues.image_url === "string" && resolvedValues.image_url.trim() ? resolvedValues.image_url.trim() : null;
    resolvedValues.image_url = activityImage ?? (Array.isArray(resolvedValues.images) && resolvedValues.images[0]?.path ? resolvedValues.images[0].path : null);
    resolvedValues.image_pos = resolvedValues.image_pos ?? "50% 50%";

    const validAddedBy = normalizeMemberId(resolvedValues.added_by) ?? validMemberId;
    resolvedValues.added_by = validAddedBy ?? null;
  }

  if (table === "foods") {
    const safeName = String(resolvedValues.name ?? "").trim();
    if (!safeName) throw new Error("Vui lòng nhập tên món ăn.");
    resolvedValues.name = safeName;
    resolvedValues.images = Array.isArray(resolvedValues.images) ? resolvedValues.images : [];
    const foodImage = typeof resolvedValues.image_url === "string" && resolvedValues.image_url.trim() ? resolvedValues.image_url.trim() : null;
    resolvedValues.image_url = foodImage ?? (Array.isArray(resolvedValues.images) && resolvedValues.images[0]?.path ? resolvedValues.images[0].path : null);
    resolvedValues.image_pos = resolvedValues.image_pos ?? "50% 50%";

    const validAddedBy = normalizeMemberId(resolvedValues.added_by) ?? validMemberId;
    resolvedValues.added_by = validAddedBy ?? null;
  }

  if (table === "wish_comments") {
    const content = String(resolvedValues.content ?? "").trim();
    if (!content) throw new Error("Nội dung bình luận không được để trống.");
    resolvedValues.content = content;
  }

  return resolvedValues;
}

export async function insertRow<T>(table: string, values: Record<string, unknown>) {
  const identity = readCurrentUserIdentity();
  const memberId = identity ? await resolveMemberIdForEmail(identity.email) : null;
  const fallbackMemberId = memberId ?? (await getFallbackMemberId());
  const resolvedValues = sanitizePayload(table, values, fallbackMemberId);

  try {
    const { data, error } = await db.from(table).insert(resolvedValues).select().single();
    if (error) throw error;
    return data as T;
  } catch (error) {
    console.error(`Insert ${table} error:`, error);
    throw error;
  }
}

export async function updateRow<T>(table: string, id: string, values: Record<string, unknown>) {
  const identity = readCurrentUserIdentity();
  const memberId = identity ? await resolveMemberIdForEmail(identity.email) : null;
  const fallbackMemberId = memberId ?? (await getFallbackMemberId());
  const resolvedValues = sanitizePayload(table, values, fallbackMemberId);

  try {
    const { data, error } = await db.from(table).update(resolvedValues).eq("id", id).select().single();
    if (error) throw error;
    return data as T;
  } catch (error) {
    console.error(`Update ${table} error:`, error);
    throw error;
  }
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

async function safeFileDataUrl(file: File) {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Không chuyển đổi được ảnh sang preview"));
      reader.readAsDataURL(file);
    });
    if (dataUrl) return dataUrl;
  } catch {
    // noop
  }

  const SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#fdf2ff"/>
          <stop offset="100%" stop-color="#dfeeff"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#g)"/>
      <circle cx="600" cy="420" r="170" fill="rgba(255,255,255,0.45)"/>
      <path d="M410 560 C490 500, 720 500, 790 560 L790 660 L410 660 Z" fill="rgba(255,255,255,0.55)"/>
      <text x="600" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" fill="#6f6aa7">Ảnh đẹp</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(SVG)}`;
}

export async function uploadImage(file: File) {
  const prepared = await prepareImage(file);
  const ext = prepared.type === "image/webp" ? "webp" : prepared.type === "image/png" ? "png" : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const storageAvailable = Boolean(supabase?.storage && typeof supabase.storage?.from === "function");

  if (!storageAvailable) {
    return safeFileDataUrl(prepared);
  }

  try {
    const { error } = await supabase.storage.from("media").upload(path, prepared, {
      upsert: false,
      contentType: prepared.type,
      cacheControl: "31536000",
    });
    if (error) throw error;
    return path;
  } catch (error) {
    const detail = error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message) : String(error);
    console.warn("[uploadImage] Storage upload failed, falling back to safe data URL preview.", detail);
    return safeFileDataUrl(prepared);
  }
}

async function prepareImage(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 450_000) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const type = file.type === "image/png" ? "image/png" : "image/webp";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.8));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${type === "image/webp" ? "webp" : "png"}`, {
      type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export async function signedUrl(path: string) {
  if (!path || path.startsWith("data:")) return path;

  try {
    const storageAvailable = Boolean(supabase?.storage && typeof supabase.storage?.from === "function");
    if (!storageAvailable) return path;

    const { data, error } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24);
    if (error) {
      console.warn("[signedUrl] Could not create signed URL, returning original path.", error.message ?? error);
      return path;
    }
    return data?.signedUrl ?? path;
  } catch (error) {
    console.warn("[signedUrl] Unexpected error.", error);
    return path;
  }
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
