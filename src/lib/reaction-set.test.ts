import { test } from "node:test";
import { strict as assert } from "node:assert";
import { REACTIONS, reactionLabel } from "../components/ReactionIcon";

test("offers exactly the six requested reactions", () => {
  assert.deepEqual(REACTIONS.map((r) => r.emoji), ["👍", "❤️", "😂", "😮", "😭", "😡"]);
});
test("existing angry reactions still resolve after the icon key update", () => {
  assert.equal(reactionLabel("😠", "vi"), reactionLabel("😡", "vi"));
});