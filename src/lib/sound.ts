import { useEffect, useState } from "react";

const STORAGE_KEY = "wish-jar-sound-enabled";
const MUSIC_KEY = "wish-jar-music-enabled";
const EVENT_NAME = "wish-jar-sound-change";
const MUSIC_EVENT = "wish-jar-music-change";

type SoundKind = "tap" | "swipe" | "success" | "add";

let audioContext: AudioContext | null = null;
let musicTimer: number | null = null;
let musicGain: GainNode | null = null;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "false";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: enabled }));
  if (!enabled) stopMusic();
  else if (isMusicEnabled()) startMusic();
}

export function isMusicEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUSIC_KEY) === "true";
}

export function setMusicEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUSIC_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent(MUSIC_EVENT, { detail: enabled }));
  if (enabled && isSoundEnabled()) startMusic();
  else stopMusic();
}

function useFlag(key: string, event: string, read: () => boolean, write: (v: boolean) => void) {
  const [enabled, setEnabled] = useState(() => false);

  useEffect(() => {
    setEnabled(read());
    const update = (e: Event) => setEnabled((e as CustomEvent<boolean>).detail);
    window.addEventListener(event, update);
    return () => window.removeEventListener(event, update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [enabled, write] as const;
}

export function useSoundEnabled() {
  return useFlag(STORAGE_KEY, EVENT_NAME, isSoundEnabled, setSoundEnabled);
}

export function useMusicEnabled() {
  return useFlag(MUSIC_KEY, MUSIC_EVENT, isMusicEnabled, setMusicEnabled);
}

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function tone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  destination: AudioNode = context.destination,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playSound(kind: SoundKind) {
  if (!isSoundEnabled()) return;
  const context = getContext();
  if (!context) return;
  const now = context.currentTime;

  if (kind === "tap") {
    tone(context, 660, now, 0.06, 0.03, "triangle");
    tone(context, 990, now + 0.012, 0.05, 0.014, "sine");
  } else if (kind === "swipe") {
    tone(context, 720, now, 0.07, 0.022, "sine");
    tone(context, 960, now + 0.03, 0.06, 0.014, "sine");
  } else if (kind === "add") {
    // vui tươi kiểu Duolingo: mi - sol - đô - mi cao
    [659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      tone(context, freq, now + i * 0.075, 0.18, 0.035 - i * 0.004, "triangle");
    });
  } else {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone(context, freq, now + i * 0.065, 0.22, 0.038 - i * 0.005, "sine");
    });
    tone(context, 1567.98, now + 0.28, 0.3, 0.014, "sine");
  }
}

const MELODY = [
  523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880, 783.99, 523.25, 698.46, 880, 698.46,
];
const BASS = [130.81, 146.83, 174.61, 196];

export function startMusic() {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled() || !isMusicEnabled() || prefersReducedMotion()) return;
  if (musicTimer !== null) return;
  const context = getContext();
  if (!context) return;

  musicGain = context.createGain();
  musicGain.gain.setValueAtTime(0.0001, context.currentTime);
  musicGain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 2);
  musicGain.connect(context.destination);

  let step = 0;
  const tick = () => {
    if (!musicGain) return;
    const ctx = getContext();
    if (!ctx) return;
    const at = ctx.currentTime + 0.05;
    const note = MELODY[step % MELODY.length]!;
    tone(ctx, note, at, 0.9, 0.5, "sine", musicGain);
    if (step % 4 === 0) {
      tone(ctx, BASS[(step / 4) % BASS.length]!, at, 1.6, 0.35, "triangle", musicGain);
    }
    step += 1;
  };

  tick();
  musicTimer = window.setInterval(tick, 620);
}

export function stopMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicGain && audioContext) {
    const gain = musicGain;
    musicGain = null;
    try {
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.8);
      window.setTimeout(() => gain.disconnect(), 1000);
    } catch {
      gain.disconnect();
    }
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
