import { test } from "node:test";
import { strict as assert } from "node:assert";
import { interactionQueryKey, notificationQueryKeys } from "./interaction-cache";

test("a reaction refreshes only its entity reactions, never comments or the parent list", () => {
  assert.deepEqual(interactionQueryKey("wish", "reaction"), ["reactions"]);
  assert.deepEqual(interactionQueryKey("food", "reaction"), ["food-reactions"]);
  assert.deepEqual(interactionQueryKey("activity", "reaction"), ["activity-reactions"]);
  assert.deepEqual(interactionQueryKey("memory", "reaction"), ["memory-reactions"]);
});
test("comment notifications refresh only their matching comment list", () => {
  assert.deepEqual(notificationQueryKeys("comment"), [["comments"]]);
  assert.deepEqual(notificationQueryKeys("food_comment"), [["food-comments"]]);
  assert.deepEqual(notificationQueryKeys("activity_comment"), [["activity-comments"]]);
  assert.deepEqual(notificationQueryKeys("memory_comment"), [["memory-comments"]]);
});
test("new content and unknown notifications never cause global refetches", () => {
  assert.deepEqual(notificationQueryKeys("wish"), [["wishes"]]);
  assert.deepEqual(notificationQueryKeys("unrecognized"), []);
});