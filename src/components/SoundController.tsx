import { useEffect } from "react";

import {
  isMusicEnabled,
  playSound,
  preloadAudio,
  primeAudio,
  startMusic,
  type SoundKind,
} from "@/lib/sound";

function kindFor(control: Element): SoundKind {
  const label = `${control.getAttribute("aria-label") ?? ""} ${control.textContent ?? ""}`.toLowerCase();
  if (control.getAttribute("role") === "checkbox" || control.getAttribute("role") === "switch") return "toggle";
  if (control.hasAttribute("data-state") && control.getAttribute("role") === "menuitem") return "tap-soft";
  if (/xoá|xóa|huỷ|hủy|delete/.test(label)) return "delete";
  if (/đóng|close/.test(label)) return "close";
  if (/thêm|lưu|tạo|save/.test(label)) return "open";
  if (/❤️|😍|😂|🤔|👍/.test(label)) return "react";
  if (/rút|random|quay/.test(label)) return "sparkle";
  if (control.tagName === "A") return "tap-soft";
  return "tap";
}

function safePrimeAudio() {
  preloadAudio();
  void primeAudio().catch(() => undefined);
}

function safeStartMusic() {
  try {
    if (isMusicEnabled()) startMusic();
  } catch {
    // noop: browser can reject AudioContext startup in some environments
  }
}

export function SoundController() {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, a, [role='button'], [role='menuitem'], [role='checkbox'], [role='switch'], [role='tab']");
      if (!control || control.getAttribute("aria-disabled") === "true" || control.hasAttribute("disabled")) return;
      safePrimeAudio();
      try {
        playSound(kindFor(control));
      } catch {
        // noop: never let audio errors crash the app
      }
      safeStartMusic();
    };

    const handleFirstGesture = () => {
      safePrimeAudio();
      safeStartMusic();
    };

    document.addEventListener("pointerdown", handlePointerDown, { capture: true });
    document.addEventListener("pointerdown", handleFirstGesture, { once: true });

    safeStartMusic();

    const observer = new MutationObserver((records) => {
      const hasSuccess = records.some((record) =>
        Array.from(record.addedNodes).some(
          (node) =>
            node instanceof Element &&
            (node.matches('[data-sonner-toast][data-type="success"]') ||
              node.querySelector('[data-sonner-toast][data-type="success"]')),
        ),
      );
      if (hasSuccess) {
        try {
          playSound("add");
        } catch {
          // noop
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      document.removeEventListener("pointerdown", handleFirstGesture);
      observer.disconnect();
    };
  }, []);

  return null;
}
