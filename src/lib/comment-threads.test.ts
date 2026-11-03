import { test } from "node:test";
import { strict as assert } from "node:assert";
import { groupCommentThreads } from "./comment-threads";

test("replies remain under their actual parent instead of becoming root comments", () => {
  const comments = [
    { id: "parent", parent_id: null, created_at: "2026-11-03T01:00:00Z" },
    { id: "other", parent_id: null, created_at: "2026-11-03T02:00:00Z" },
    { id: "reply", parent_id: "parent", created_at: "2026-11-03T03:00:00Z" },
    { id: "nested", parent_id: "reply", created_at: "2026-11-03T04:00:00Z" },
  ];
  const threads = groupCommentThreads(comments);
  assert.deepEqual(threads.map((t) => t.root.id), ["parent", "other"]);
  assert.deepEqual(threads[0]?.replies.map((c) => c.id), ["reply", "nested"]);
});

test("a deleted parent does not hide remaining replies", () => {
  assert.equal(groupCommentThreads([{ id: "reply", parent_id: "deleted", created_at: "2026-11-03" }])[0]?.root.id, "reply");
});

test("cycles cannot duplicate or hide comments", () => {
  const threads = groupCommentThreads([
    { id: "a", parent_id: "b", created_at: "2026-11-03" },
    { id: "b", parent_id: "a", created_at: "2026-11-03" },
  ]);
  assert.deepEqual(threads.flatMap((t) => [t.root.id, ...t.replies.map((c) => c.id)]), ["a", "b"]);
});