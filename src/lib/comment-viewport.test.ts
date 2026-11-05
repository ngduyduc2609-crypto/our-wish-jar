import { test } from "node:test";
import { strict as assert } from "node:assert";
import { commentViewport } from "./comment-viewport";

test("reply composer stays inside the visible area above a mobile keyboard", () => {
  const area = commentViewport(844, 390);
  assert.deepEqual(area, { height: 378, bottom: 454 });
  assert.equal(844 - area.bottom, 390);
  assert.equal(844 - area.bottom - area.height, 12);
});
test("accounts for Safari panning the visible viewport during input focus", () => {
  assert.deepEqual(commentViewport(844, 390, 30), { height: 378, bottom: 424 });
});
test("restores normal sheet size when the keyboard closes", () => {
  assert.deepEqual(commentViewport(844, 844), { height: 633, bottom: 0 });
});