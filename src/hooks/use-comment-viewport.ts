import { useEffect, useState } from "react";
import { commentViewport } from "@/lib/comment-viewport";

export function useCommentViewport(open: boolean) {
  const [area, setArea] = useState<ReturnType<typeof commentViewport> | null>(null);
  useEffect(() => {
    if (!open) { setArea(null); return; }
    const viewport = window.visualViewport;
    const update = () => setArea(commentViewport(window.innerHeight, viewport?.height ?? window.innerHeight, viewport?.offsetTop ?? 0));
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [open]);
  return area ?? undefined;
}