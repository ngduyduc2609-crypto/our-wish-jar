import { useEffect, useState } from "react";

const STORAGE_KEY = "wish-jar-sound-enabled";
const MUSIC_KEY = "wish-jar-music-enabled";
const VOLUME_KEY = "wish-jar-music-volume";
const EVENT_NAME = "wish-jar-sound-change";
const MUSIC_EVENT = "wish-jar-music-change";
const VOLUME_EVENT = "wish-jar-volume-change";

export type SoundKind =
  | "tap"
  | "tap-soft"
  | "swipe"
  | "success"
  | "add"
  | "toggle"
  | "open"
  | "close"
  | "delete"
  | "react"
  | "sparkle"
  | "celebrate";

let audioContext: AudioContext | null = null;
let musicTimer: number | null = null;
let musicGain: GainNode | null = null;
let soundGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let lastTapIndex = -1;
let audioWarmupStarted = false;

const MUSIC_GAIN_MAX = 0.04;
const EFFECT_GAIN_MAX = 0.2;

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
}

export function isMusicEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUSIC_KEY) !== "false";
}

export function setMusicEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUSIC_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent(MUSIC_EVENT, { detail: enabled }));
  if (enabled) startMusic();
  else stopMusic();
}

export function getMusicVolume() {
  if (typeof window === "undefined") return 0.35;
  const raw = Number(window.localStorage.getItem(VOLUME_KEY));
  return Number.isFinite(raw) && raw >= 0 ? Math.min(1, raw) : 0.35;
}

function musicLevel(volume: number) {
  return Math.max(0.0001, Math.pow(Math.max(0, volume), 1.6) * MUSIC_GAIN_MAX);
}

function safeAudioTarget(value: number, minimum = 0.0001) {
  if (!Number.isFinite(value)) return minimum;
  return value > 0 ? Math.min(value, 1) : minimum;
}

export function setMusicVolume(volume: number) {
  if (typeof window === "undefined") return;
  const clamped = Math.min(1, Math.max(0, volume));
  window.localStorage.setItem(VOLUME_KEY, String(clamped));
  window.dispatchEvent(new CustomEvent(VOLUME_EVENT, { detail: clamped }));
  if (musicGain && audioContext) {
    const target = musicLevel(clamped);
    musicGain.gain.setTargetAtTime(safeAudioTarget(target), audioContext.currentTime, 0.08);
  }
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

export function useMusicVolume() {
  const [volume, setVolume] = useState(0.35);
  useEffect(() => {
    setVolume(getMusicVolume());
    const update = (e: Event) => setVolume((e as CustomEvent<number>).detail);
    window.addEventListener(VOLUME_EVENT, update);
    return () => window.removeEventListener(VOLUME_EVENT, update);
  }, []);
  return [volume, setMusicVolume] as const;
}

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (!soundGain) {
    soundGain = audioContext.createGain();
    soundGain.gain.value = 1;
    soundGain.connect(audioContext.destination);
  }
  return audioContext;
}

export async function primeAudio() {
  const context = getContext();
  if (!context) return;
  try {
    if (context.state === "suspended") await context.resume();
  } catch {
    // no-op: some browsers reject resume if the user gesture is not available yet
  }
  if (!noiseBuffer) {
    const frames = Math.floor(context.sampleRate * 0.2);
    noiseBuffer = context.createBuffer(1, frames, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / frames);
  }
  audioWarmupStarted = true;
}

export function preloadAudio() {
  if (audioWarmupStarted || typeof window === "undefined") return;
  audioWarmupStarted = true;
  void primeAudio();
}

function tone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  destination: AudioNode = context.destination,
  endFrequency?: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const safeVolume = safeAudioTarget(volume, 0.0001);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) {
    const safeEnd = Math.max(20, endFrequency);
    oscillator.frequency.exponentialRampToValueAtTime(safeEnd, start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(safeVolume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise(context: AudioContext, start: number, duration: number, volume: number) {
  if (!noiseBuffer) {
    const frames = Math.floor(context.sampleRate * 0.2);
    noiseBuffer = context.createBuffer(1, frames, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3000;
  const gain = context.createGain();
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start);
}

// thang âm ngũ cung ấm áp để mỗi lần chạm nghe khác nhau nhưng vẫn hoà hợp
const TAP_SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

export function playSound(kind: SoundKind) {
  if (!isSoundEnabled()) return;
  const context = getContext();
  if (!context) return;
  if (context.state === "suspended") {
    try {
      void context.resume();
    } catch {
      // browser may reject if startup is not user-gesture driven
    }
  }
  const now = context.currentTime;
  const output = soundGain ?? context.destination;

  if (kind === "tap" || kind === "tap-soft") {
    let index = Math.floor(Math.random() * TAP_SCALE.length);
    if (index === lastTapIndex) index = (index + 1) % TAP_SCALE.length;
    lastTapIndex = index;
    const base = TAP_SCALE[index]!;
    const level = kind === "tap" ? 0.032 : 0.02;
    tone(context, base, now, 0.055, level, "triangle", output);
    tone(context, base * 2, now + 0.01, 0.045, level * 0.4, "sine", output);
  } else if (kind === "swipe") {
    tone(context, 620, now, 0.09, 0.02, "sine", context.destination, 980);
    noise(context, now, 0.06, 0.012);
  } else if (kind === "toggle") {
    tone(context, 440, now, 0.06, 0.028, "square");
    tone(context, 880, now + 0.05, 0.08, 0.02, "triangle");
  } else if (kind === "open") {
    tone(context, 392, now, 0.12, 0.026, "sine", context.destination, 659.25);
  } else if (kind === "close") {
    tone(context, 659.25, now, 0.12, 0.022, "sine", context.destination, 349.23);
  } else if (kind === "delete") {
    tone(context, 330, now, 0.14, 0.03, "triangle", context.destination, 174.61);
  } else if (kind === "react") {
    tone(context, 880, now, 0.09, 0.03, "triangle", context.destination, 1318.5);
    tone(context, 1318.5, now + 0.07, 0.12, 0.018, "sine");
  } else if (kind === "sparkle") {
    [1318.5, 1567.98, 1975.53].forEach((freq, i) => {
      tone(context, freq, now + i * 0.05, 0.14, 0.016, "sine");
    });
  } else if (kind === "add") {
    // vui tươi kiểu Duolingo: mi - sol - đô - mi cao
    [659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      tone(context, freq, now + i * 0.075, 0.18, 0.035 - i * 0.004, "triangle");
    });
    tone(context, 1975.53, now + 0.34, 0.25, 0.012, "sine");
  } else if (kind === "celebrate") {
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((freq, i) => {
      tone(context, freq, now + i * 0.065, 0.26, 0.04 - i * 0.004, i % 2 ? "triangle" : "sine");
    });
    noise(context, now + 0.32, 0.18, 0.015);
  } else {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone(context, freq, now + i * 0.065, 0.22, 0.038 - i * 0.005, "sine");
    });
    tone(context, 1567.98, now + 0.28, 0.3, 0.014, "sine");
  }
}

/* ---------- Nhạc nền: lofi beat quán cà phê ---------- */

// Fmaj7 - Em7 - Dm7 - Cmaj7 (vòng hoà âm ấm, lặp mượt)
const CHORDS = [
  [174.61, 261.63, 329.63, 440],
  [164.81, 246.94, 329.63, 392],
  [146.83, 220, 293.66, 349.23],
  [130.81, 196, 261.63, 329.63],
];
const LEAD = [
  [523.25, 659.25, 587.33, 698.46],
  [493.88, 587.33, 659.25, 493.88],
  [587.33, 523.25, 440, 587.33],
  [523.25, 392, 440, 523.25],
];

function softKick(context: AudioContext, at: number, gainNode: AudioNode) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, at);
  osc.frequency.exponentialRampToValueAtTime(48, at + 0.16);
  gain.gain.setValueAtTime(0.9, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
  osc.connect(gain);
  gain.connect(gainNode);
  osc.start(at);
  osc.stop(at + 0.26);
}

function hat(context: AudioContext, at: number, gainNode: AudioNode, level = 0.16) {
  const frames = Math.floor(context.sampleRate * 0.05);
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 7000;
  const gain = context.createGain();
  gain.gain.value = level;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(gainNode);
  source.start(at);
}

export function startMusic() {
  if (typeof window === "undefined") return;
  if (!isMusicEnabled() || prefersReducedMotion()) return;
  if (musicTimer !== null) return;
  const context = getContext();
  if (!context) return;

  const target = safeAudioTarget(musicLevel(getMusicVolume()));
  if (!musicGain) {
    musicGain = context.createGain();
  }
  musicGain.gain.setValueAtTime(0.0001, context.currentTime);
  musicGain.gain.exponentialRampToValueAtTime(safeAudioTarget(target), context.currentTime + 3);
  const warm = context.createBiquadFilter();
  warm.type = "lowpass";
  warm.frequency.value = 2200;
  musicGain.disconnect();
  musicGain.connect(warm);
  warm.connect(context.destination);

  const beat = 0.75; // ~80bpm, nhịp lười kiểu lofi
  let bar = 0;

  const playBar = () => {
    if (!musicGain) return;
    const ctx = getContext();
    if (!ctx) return;
    const at = ctx.currentTime + 0.08;
    const chord = CHORDS[bar % CHORDS.length]!;
    const lead = LEAD[bar % LEAD.length]!;

    chord.forEach((freq, i) => {
      tone(ctx, freq, at + i * 0.02, beat * 3.6, 0.32 - i * 0.05, "sine", musicGain!);
    });

    lead.forEach((freq, i) => {
      if (Math.random() < 0.25) return; // thi thoảng nghỉ một nốt cho tự nhiên
      tone(ctx, freq, at + i * beat + (Math.random() * 0.03), 0.5, 0.2, "triangle", musicGain!);
    });

    softKick(ctx, at, musicGain);
    softKick(ctx, at + beat * 2, musicGain);
    for (let i = 0; i < 8; i += 1) {
      hat(ctx, at + i * (beat / 2), musicGain, i % 2 === 0 ? 0.12 : 0.06);
    }

    bar += 1;
  };

  playBar();
  musicTimer = window.setInterval(playBar, beat * 4 * 1000);
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
      gain.gain.cancelScheduledValues(audioContext.currentTime);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.8);
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
