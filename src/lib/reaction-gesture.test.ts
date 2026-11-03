import { describe, expect, test } from "bun:test";
import { REACTION_HOLD_MS, shouldCancelReactionHold } from "./reaction-gesture";

describe("reaction hold", () => {
  test("opens after the requested 250ms hold", () => {
    expect(REACTION_HOLD_MS).toBe(250);
  });
  test("cancels for scrolling rather than selecting", () => {
    expect(shouldCancelReactionHold({ x: 30, y: 40 }, { x: 30, y: 51 })).toBe(true);
    expect(shouldCancelReactionHold({ x: 30, y: 40 }, { x: 32, y: 42 })).toBe(false);
  });
});