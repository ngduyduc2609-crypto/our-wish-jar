export type PostEntity = "wish" | "food" | "activity" | "memory";

const INTERACTION_KEYS = {
  wish: { reaction: "reactions", comment: "comments" },
  food: { reaction: "food-reactions", comment: "food-comments" },
  activity: { reaction: "activity-reactions", comment: "activity-comments" },
  memory: { reaction: "memory-reactions", comment: "memory-comments" },
} as const;

export function interactionQueryKey(entity: PostEntity, action: "reaction" | "comment") {
  return [INTERACTION_KEYS[entity][action]];
}

/** Unknown notification kinds must never invalidate every query. */
export function notificationQueryKeys(kind: string): string[][] {
  if (kind === "reaction" || kind === "comment") return [interactionQueryKey("wish", kind)];
  for (const entity of ["wish", "food", "activity", "memory"] as const) {
    if (kind === `${entity}_reaction`) return [interactionQueryKey(entity, "reaction")];
    if (kind === `${entity}_comment`) return [interactionQueryKey(entity, "comment")];
  }
  const contentKeys: Record<string, string> = { wish: "wishes", food: "foods", activity: "activities", memory: "memories" };
  return contentKeys[kind] ? [[contentKeys[kind]]] : [];
}