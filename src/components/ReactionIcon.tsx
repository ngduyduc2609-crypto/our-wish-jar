import { useId } from "react";
import { cn } from "@/lib/utils";

/** Bộ cảm xúc 3D tự thiết kế — emoji vẫn là khoá lưu trong database. */
export const REACTIONS = [
  { emoji: "👍", label: { vi: "Thích", zh: "赞", en: "Like" } },
  { emoji: "❤️", label: { vi: "Yêu", zh: "爱心", en: "Love" } },
  { emoji: "😂", label: { vi: "Haha", zh: "哈哈", en: "Haha" } },
  { emoji: "😮", label: { vi: "Wow", zh: "哇", en: "Wow" } },
  { emoji: "😭", label: { vi: "Buồn", zh: "难过", en: "Sad" } },
  { emoji: "😡", label: { vi: "Phẫn nộ", zh: "生气", en: "Angry" } },
] as const;

const ALIAS: Record<string, string> = { "🤣": "😂", "🥰": "❤️", "😍": "❤️", "😢": "😭", "😠": "😡", "🤔": "😮" };

export function reactionLabel(emoji: string, language: "vi" | "zh" | "en") {
  const found = REACTIONS.find((r) => r.emoji === (ALIAS[emoji] ?? emoji));
  return found ? found.label[language] : emoji;
}

type P = { u: string };
const INK = "#5a2a0a";

/** Khối cầu 3D: gradient nhiều lớp, bóng đáy, viền tối, điểm sáng gương. */
function Sphere({ u, light, mid, dark, children }: P & { light: string; mid: string; dark: string; children?: React.ReactNode }) {
  return (
    <>
      <defs>
        <radialGradient id={`${u}-b`} cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor={light} />
          <stop offset="45%" stopColor={mid} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <radialGradient id={`${u}-s`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${u}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="60" rx="17" ry="2.6" fill="#000" opacity="0.14" />
      <circle cx="32" cy="31" r="28" fill={`url(#${u}-b)`} />
      <circle cx="32" cy="31" r="28" fill={`url(#${u}-g)`} />
      <circle cx="32" cy="31" r="27.3" fill="none" stroke={dark} strokeOpacity="0.55" strokeWidth="1.4" />
      <ellipse cx="22" cy="14.5" rx="11" ry="6" fill={`url(#${u}-s)`} transform="rotate(-22 22 14.5)" />
      <circle cx="44" cy="12" r="1.8" fill="#fff" opacity="0.7" />
      {children}
    </>
  );
}

const Cheeks = () => (
  <g fill="#ff6f8a" opacity="0.38">
    <ellipse cx="15" cy="38" rx="5" ry="3" />
    <ellipse cx="49" cy="38" rx="5" ry="3" />
  </g>
);

const Eye = ({ x, y, r = 4 }: { x: number; y: number; r?: number }) => (
  <g>
    <ellipse cx={x} cy={y} rx={r * 0.85} ry={r * 1.15} fill={INK} />
    <circle cx={x - r * 0.3} cy={y - r * 0.45} r={r * 0.35} fill="#fff" />
  </g>
);

const YELLOW = { light: "#fff6b8", mid: "#ffd23f", dark: "#e88a0c" };

function Like({ u }: P) {
  return (
    <>
      <defs>
        <radialGradient id={`${u}-b`} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#8fd3ff" />
          <stop offset="50%" stopColor="#2f8bf0" />
          <stop offset="100%" stopColor="#0b4fb3" />
        </radialGradient>
        <linearGradient id={`${u}-t`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d5e8ff" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="60" rx="17" ry="2.6" fill="#000" opacity="0.14" />
      <circle cx="32" cy="31" r="28" fill={`url(#${u}-b)`} />
      <circle cx="32" cy="31" r="27.3" fill="none" stroke="#0a4296" strokeOpacity="0.5" strokeWidth="1.4" />
      <ellipse cx="22" cy="14.5" rx="10" ry="5.5" fill="#fff" opacity="0.4" transform="rotate(-22 22 14.5)" />
      <g className="rx-thumb">
        <path d="M17 30h6.5v16H17a2.5 2.5 0 0 1-2.5-2.5v-11A2.5 2.5 0 0 1 17 30z" fill="#0d3f8f" opacity="0.35" transform="translate(1 1.6)" />
        <path d="M26 46V30c2-1 4-3.4 5-6.4 1.2-3.4 1.8-6.4 1.8-8.4 0-2.3 1.4-3.7 3.3-3.7s3.5 1.6 3.5 3.9c0 3.6-1 6.6-2.2 9h6.4c3 0 5.2 2.7 4.5 5.7l-2.6 11.6c-.6 2.6-2.6 4.3-5.2 4.3H30.5c-3 0-4.5-2.1-4.5-4.5z" fill="#0d3f8f" opacity="0.35" transform="translate(1 1.6)" />
        <path d="M17 30h6.5v16H17a2.5 2.5 0 0 1-2.5-2.5v-11A2.5 2.5 0 0 1 17 30z" fill={`url(#${u}-t)`} />
        <path d="M26 46V30c2-1 4-3.4 5-6.4 1.2-3.4 1.8-6.4 1.8-8.4 0-2.3 1.4-3.7 3.3-3.7s3.5 1.6 3.5 3.9c0 3.6-1 6.6-2.2 9h6.4c3 0 5.2 2.7 4.5 5.7l-2.6 11.6c-.6 2.6-2.6 4.3-5.2 4.3H30.5c-3 0-4.5-2.1-4.5-4.5z" fill={`url(#${u}-t)`} />
      </g>
    </>
  );
}

function Love({ u }: P) {
  return (
    <>
      <defs>
        <radialGradient id={`${u}-b`} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffb3c1" />
          <stop offset="45%" stopColor="#ff3d6b" />
          <stop offset="100%" stopColor="#b80d3c" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="60" rx="15" ry="2.4" fill="#000" opacity="0.14" />
      <g className="rx-heart">
        <path d="M32 56C18.5 45.5 6 35.5 6 22.5 6 13 13.2 6 21.8 6c4.6 0 8.4 2.2 10.2 5.6C33.8 8.2 37.6 6 42.2 6 50.8 6 58 13 58 22.5 58 35.5 45.5 45.5 32 56z" fill={`url(#${u}-b)`} />
        <path d="M32 56C18.5 45.5 6 35.5 6 22.5" fill="none" stroke="#8c0a2e" strokeOpacity="0.35" strokeWidth="2" />
        <ellipse cx="19" cy="17" rx="7.5" ry="4.5" fill="#fff" opacity="0.6" transform="rotate(-30 19 17)" />
        <circle cx="44" cy="14" r="2.2" fill="#fff" opacity="0.55" />
      </g>
    </>
  );
}

function Haha({ u }: P) {
  return (
    <Sphere u={u} {...YELLOW}>
      <g className="rx-face">
        <path d="M13 25l8 3.5-8 3.5" stroke={INK} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M51 25l-8 3.5 8 3.5" stroke={INK} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M15 37c1 11 8 17 17 17s16-6 17-17z" fill="#6d1f0c" />
        <path d="M16.5 37h31l-1 4h-29z" fill="#fff" />
        <path d="M23 49c4.5 3.6 13.5 3.6 18 0-3-3.4-15-3.4-18 0z" fill="#ff6f8a" />
        <path className="rx-tear" d="M8 30c-3 4-3 8 .6 8.4 3.2.3 3.4-4 -.6-8.4z" fill="#59b8ff" />
        <path className="rx-tear rx-tear-r" d="M56 30c3 4 3 8-.6 8.4-3.2.3-3.4-4 .6-8.4z" fill="#59b8ff" />
      </g>
    </Sphere>
  );
}

function Wow({ u }: P) {
  return (
    <Sphere u={u} {...YELLOW}>
      <Cheeks />
      <g className="rx-face">
        <path d="M14 17c3-2.6 7.6-3 10.4-1.4M39.6 15.6c2.8-1.6 7.4-1.2 10.4 1.4" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <Eye x={21} y={26} r={4.6} />
        <Eye x={43} y={26} r={4.6} />
        <ellipse className="rx-mouth" cx="32" cy="44" rx="6.5" ry="8.5" fill="#6d1f0c" />
        <ellipse cx="32" cy="47.5" rx="3.6" ry="3.4" fill="#ff6f8a" />
      </g>
    </Sphere>
  );
}

function Sad({ u }: P) {
  return (
    <Sphere u={u} {...YELLOW}>
      <g className="rx-face">
        <path d="M13 22c3.4.4 7-1 9-3.6M51 22c-3.4.4-7-1-9-3.6" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <Eye x={21} y={30} r={3.8} />
        <Eye x={43} y={30} r={3.8} />
        <path d="M22 48c4-5.6 16-5.6 20 0" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path className="rx-tear" d="M19 35c-2.8 4.4-2.8 8.4.6 8.6s3.4-4 .-.6-8.6z" fill="#59b8ff" />
        <path className="rx-tear" d="M19.6 35c-2.6 4.4-2.6 8.6.8 8.6 3.4 0 3.2-4.2-.8-8.6z" fill="#59b8ff" stroke="#2f8bd8" strokeWidth="0.6" />
      </g>
    </Sphere>
  );
}

function Angry({ u }: P) {
  return (
    <>
      <defs>
        <linearGradient id={`${u}-r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff3b2f" />
          <stop offset="55%" stopColor="#ff8a3d" />
          <stop offset="100%" stopColor="#ffc93f" />
        </linearGradient>
      </defs>
      <Sphere u={u} light="#ffd27a" mid="#ff9a3c" dark="#d8411c">
        <circle className="rx-rage" cx="32" cy="31" r="28" fill={`url(#${u}-r)`} opacity="0.75" />
        <ellipse cx="22" cy="14.5" rx="10" ry="5" fill="#fff" opacity="0.35" transform="rotate(-22 22 14.5)" />
        <g className="rx-face">
          <path d="M12 21l12 5M52 21l-12 5" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
          <Eye x={22} y={31} r={3.6} />
          <Eye x={42} y={31} r={3.6} />
          <path d="M23 48c3.5-4.6 14.5-4.6 18 0" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </g>
      </Sphere>
    </>
  );
}

const ART: Record<string, (p: P) => React.ReactElement> = { "👍": Like, "❤️": Love, "😂": Haha, "😮": Wow, "😭": Sad, "😡": Angry };
const KIND: Record<string, string> = { "👍": "like", "❤️": "love", "😂": "haha", "😮": "wow", "😭": "sad", "😡": "angry" };

export function ReactionIcon({ emoji, className }: { emoji: string; className?: string }) {
  const u = useId().replace(/:/g, "");
  const resolved = ALIAS[emoji] ?? emoji;
  const Art = ART[resolved];
  if (!Art) return <span className={cn("grid place-items-center leading-none", className)}>{emoji}</span>;
  return (
    <svg viewBox="0 0 64 64" className={cn("rx-icon", `rx-${KIND[resolved]}`, className)} aria-hidden="true" overflow="visible">
      <g className="rx-body">
        <Art u={u} />
      </g>
    </svg>
  );
}
