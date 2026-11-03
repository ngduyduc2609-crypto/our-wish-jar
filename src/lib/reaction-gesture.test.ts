import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { REACTION_HOLD_MS, shouldCancelReactionHold } from "./reaction-gesture";

describe("reaction hold", () => {
  test("opens after the requested 250ms hold", () => {
    assert.equal(REACTION_HOLD_MS, 250);
  });
  test("cancels for scrolling rather than selecting", () => {
    assert.equal(shouldCancelReactionHold({ x: 30, y: 40 }, { x: 30, y: 51 }), true);
    assert.equal(shouldCancelReactionHold({ x: 30, y: 40 }, { x: 32, y: 42 }), false);
  });
});