import { test } from "node:test";
import { strict as assert } from "node:assert";
import { commentMenuPosition } from "./comment-menu";
import { COMMENT_HOLD_MS } from "./reaction-gesture";

test("comment hold opens between 350 and 450ms", () => { assert.ok(COMMENT_HOLD_MS >= 350 && COMMENT_HOLD_MS <= 450); });
test("menu opens directly below the comment when there is room", () => {
  assert.deepEqual(commentMenuPosition({ top: 100, bottom: 160, left: 50 }, { width: 390, height: 700 }, 188), { menuTop: 168, menuLeft: 50, above: false });
});
test("menu flips above a comment near the bottom", () => {
  assert.deepEqual(commentMenuPosition({ top: 560, bottom: 620, left: 50 }, { width: 390, height: 700 }, 188), { menuTop: 364, menuLeft: 50, above: true });
});
test("menu stays inside the screen edge", () => {
  assert.equal(commentMenuPosition({ top: 100, bottom: 160, left: 300 }, { width: 390, height: 700 }, 100).menuLeft, 162);
});
