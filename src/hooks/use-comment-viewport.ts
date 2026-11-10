import { useEffect, useState } from "react";
import { commentViewport } from "@/lib/comment-viewport";

export function useCommentViewport(open: boolean) {
  const [area, setArea] = useState<ReturnType<typeof commentViewport> | null>(null);
  useEffect(() => {
    if (!open) { setArea(null); return; }
    const viewport = window.visualViewport;
    let frame: number | null = null;
    const update = () => {
      const next = commentViewport(window.innerHeight, viewport?.height ?? window.innerHeight, viewport?.offsetTop ?? 0);
      setArea((current) => current?.height === next.height && current.bottom === next.bottom ? current : next);
    };
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => { frame = null; update(); });
    };
    update();
    viewport?.addEventListener("resize", scheduleUpdate);
    viewport?.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", scheduleUpdate);
      viewport?.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [open]);
  return area ?? undefined;
}