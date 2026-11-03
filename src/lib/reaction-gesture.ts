export const REACTION_HOLD_MS = 250;
export const REACTION_SCROLL_SLOP = 10;

export function shouldCancelReactionHold(start: { x: number; y: number }, current: { x: number; y: number }) {
  return Math.hypot(current.x - start.x, current.y - start.y) > REACTION_SCROLL_SLOP;
}