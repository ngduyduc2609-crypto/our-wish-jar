/** Layout coordinates of the visible area above a mobile keyboard. */
export function commentViewport(layoutHeight: number, visibleHeight: number, offsetTop = 0) {
  const height = Math.min(layoutHeight, Math.max(0, visibleHeight));
  const bottom = Math.max(0, layoutHeight - height - Math.max(0, offsetTop));
  return { height: Math.min(layoutHeight * 0.75, Math.max(0, height - 12)), bottom };
}