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
    const observer = new MutationObserver((records) => {
      const hasSuccess = records.some((record) =>
        Array.from(record.addedNodes).some(
          (node) =>
            node instanceof Element &&
            (node.matches('[data-sonner-toast][data-type="success"]') ||
              node.querySelector('[data-sonner-toast][data-type="success"]')),
        ),
      );
      if (hasSuccess) playSound("success");
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("pointerup", handlePointerUp);
      observer.disconnect();
    };
  }, []);

  return null;
}