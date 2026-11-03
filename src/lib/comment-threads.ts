export type ThreadComment = { id: string; parent_id?: string | null; created_at: string };

/** Facebook-style root threads; deeper replies retain their parent but share one readable indent. */
export function groupCommentThreads<T extends ThreadComment>(comments: T[]) {
  const ordered = [...comments].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const ids = new Set(ordered.map((c) => c.id));
  const children = new Map<string, T[]>();
  const roots: T[] = [];
  for (const comment of ordered) {
    if (!comment.parent_id || !ids.has(comment.parent_id) || comment.parent_id === comment.id) roots.push(comment);
    else children.set(comment.parent_id, [...(children.get(comment.parent_id) ?? []), comment]);
  }
  const seen = new Set<string>();
  const collect = (id: string): T[] => {
    const replies: T[] = [];
    for (const child of children.get(id) ?? []) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      replies.push(child, ...collect(child.id));
    }
    return replies;
  };
  const threads: { root: T; replies: T[] }[] = [];
  for (const root of [...roots, ...ordered]) {
    if (seen.has(root.id)) continue;
    seen.add(root.id);
    threads.push({ root, replies: collect(root.id) });
  }
  return threads;
}