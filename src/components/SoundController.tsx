import { useEffect } from "react";

import { isMusicEnabled, isSoundEnabled, playSound, startMusic } from "@/lib/sound";

export function SoundController() {
  useEffect(() => {
    const handlePointerUp = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, a, [role='button'], [role='menuitem'], [role='checkbox']");
      if (!control || control.getAttribute("aria-disabled") === "true" || control.hasAttribute("disabled")) return;
      playSound("tap");
    };

    const handleFirstGesture = () => {
      if (isSoundEnabled() && isMusicEnabled()) startMusic();
    };

    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointerdown", handleFirstGesture, { once: true });

    const observer = new MutationObserver((records) => {
      const hasSuccess = records.some((record) =>
        Array.from(record.addedNodes).some(
          (node) =>
            node instanceof Element &&
            (node.matches('[data-sonner-toast][data-type="success"]') ||
              node.querySelector('[data-sonner-toast][data-type="success"]')),
        ),
      );
      if (hasSuccess) playSound("add");
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointerdown", handleFirstGesture);
      observer.disconnect();
    };
  }, []);

  return null;
}
