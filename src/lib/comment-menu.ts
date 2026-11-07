export const COMMENT_MENU_W = 220;
const GAP = 8;
const EDGE = 8;

/** Place the comment action menu beside the selected bubble: below by default, flipped above when there is no room, clamped inside the sheet. */
export function commentMenuPosition(bubble: { top: number; bottom: number; left: number }, area: { width: number; height: number }, menuHeight: number) {
  const fitsBelow = bubble.bottom + GAP + menuHeight <= area.height - EDGE;
  const fitsAbove = bubble.top - GAP - menuHeight >= EDGE;
  const above = !fitsBelow && fitsAbove;
  const raw = above ? bubble.top - GAP - menuHeight : bubble.bottom + GAP;
  const menuTop = Math.max(EDGE, Math.min(raw, area.height - menuHeight - EDGE));
  const menuLeft = Math.max(EDGE, Math.min(bubble.left, area.width - COMMENT_MENU_W - EDGE));
  return { menuTop, menuLeft, above };
}
