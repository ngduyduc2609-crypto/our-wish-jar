import { useEffect, useState } from "react";

const STORAGE_KEY = "wish-jar-sound-enabled";
const EVENT_NAME = "wish-jar-sound-change";

type SoundKind = "tap" | "swipe" | "success";

let audioContext: AudioContext | null = null;

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "false";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: enabled }));
}

export function useSoundEnabled() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    const update = (event: Event) => setEnabled((event as CustomEvent<boolean>).detail);
    window.addEventListener(EVENT_NAME, update);
    return () => window.removeEventListener(EVENT_NAME, update);
  }, []);

  return [enabled, setSoundEnabled] as const;
}

function tone(context: AudioContext, frequency: number, start: number, duration: number, volume: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

export function playSound(kind: SoundKind) {
  if (!isSoundEnabled() || typeof window === "undefined") return;

  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ??= new AudioContextClass();
  const context = audioContext;
  if (context.state === "suspended") void context.resume();
  const now = context.currentTime;

  if (kind === "tap") {
    tone(context, 520, now, 0.055, 0.025);
  } else if (kind === "swipe") {
    tone(context, 660, now, 0.07, 0.022);
  } else {
    tone(context, 523, now, 0.09, 0.035);
    tone(context, 659, now + 0.07, 0.1, 0.03);
    tone(context, 784, now + 0.14, 0.14, 0.026);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}