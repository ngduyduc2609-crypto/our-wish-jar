export const COMMENT_MENU_W = 220;
const GAP = 8;
const EDGE = 8;

/** Place the action menu below the held comment (above when no room). When neither side fits, the lifted comment shifts so comment and menu never overlap. */
export function commentMenuPosition(bubble: { top: number; bottom: number; left: number }, area: { width: number; height: number }, menuHeight: number) {
  const h = bubble.bottom - bubble.top;
  const menuLeft = Math.max(EDGE, Math.min(bubble.left, area.width - COMMENT_MENU_W - EDGE));
  if (bubble.bottom + GAP + menuHeight <= area.height - EDGE) return { bubbleTop: bubble.top, menuTop: bubble.bottom + GAP, menuLeft, above: false };
  if (bubble.top - GAP - menuHeight >= EDGE) return { bubbleTop: bubble.top, menuTop: bubble.top - GAP - menuHeight, menuLeft, above: true };
  const bubbleTop = Math.max(EDGE, area.height - EDGE - menuHeight - GAP - h);
  return { bubbleTop, menuTop: bubbleTop + h + GAP, menuLeft, above: false };
}
