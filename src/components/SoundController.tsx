import { useEffect } from "react";

import { playSound } from "@/lib/sound";

export function SoundController() {
  useEffect(() => {
    const handlePointerUp = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, a, [role='button'], [role='menuitem'], [role='checkbox']");
      if (!control || control.getAttribute("aria-disabled") === "true" || control.hasAttribute("disabled")) return;
      playSound("tap");
    };

    document.addEventListener("pointerup", handlePointerUp);
    return () => document.removeEventListener("pointerup", handlePointerUp);
  }, []);

  return null;
}