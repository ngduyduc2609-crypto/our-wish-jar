import { useId } from "react";
import { cn } from "@/lib/utils";

/** Bộ cảm xúc thiết kế riêng 3D kiểu Facebook — emoji vẫn là khoá lưu trong database. */
export const REACTIONS = [
  { emoji: "👍", label: { vi: "Thích", zh: "赞", en: "Like" } },
  { emoji: "❤️", label: { vi: "Yêu", zh: "爱心", en: "Love" } },
  { emoji: "😂", label: { vi: "Haha", zh: "哈哈", en: "Haha" } },
  { emoji: "😮", label: { vi: "Wow", zh: "哇", en: "Wow" } },
  { emoji: "😭", label: { vi: "Buồn", zh: "难过", en: "Sad" } },
  { emoji: "😡", label: { vi: "Phẫn nộ", zh: "生气", en: "Angry" } },
] as const;

const ALIAS: Record<string, string> = { "🤣": "😂", "🥰": "😍", "😢": "😭", "😠": "😡" };

export function reactionLabel(emoji: string, language: "vi" | "zh" | "en") {
  const found = REACTIONS.find((r) => r.emoji === (ALIAS[emoji] ?? emoji));
  return found ? found.label[language] : emoji;
}

type IconProps = { uid: string; className?: string | undefined };

function Face({ uid, from, to, children, className }: IconProps & { from: string; to: string; children?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-face`} cx="35%" cy="26%" r="95%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill={`url(#${uid}-face)`} />
      <circle cx="32" cy="32" r="28.5" fill="none" stroke="rgba(120,53,15,0.18)" strokeWidth="1.5" />
      <ellipse cx="24" cy="17" rx="11" ry="6.5" fill="rgba(255,255,255,0.35)" />
      {children}
    </svg>
  );
}

const INK = "#6b3a10";

function LikeIcon({ uid, className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-thumb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7cc8ff" />
          <stop offset="100%" stopColor="#1877d2" />
        </linearGradient>
      </defs>
      <g transform="rotate(-6 32 32)">
        <path d="M12 31h9v21h-9a4 4 0 0 1-4-4V35a4 4 0 0 1 4-4z" fill="#1462ad" />
        <path d="M25 51V30c2.5-1.2 5-4 6.4-8 1.6-4.4 2.6-8.6 2.6-11.5 0-3 1.9-5 4.4-5s4.6 2.1 4.6 5.1c0 5-1.4 9.2-3 12.4h8.5c4 0 7 3.6 6 7.6l-3.4 15.6c-.8 3.4-3.4 5.8-6.9 5.8H31c-4 0-6-2.9-6-6z" fill={`url(#${uid}-thumb)`} />
        <path d="M29 47V32.5" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function LoveIcon({ uid, className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-heart`} cx="35%" cy="28%" r="95%">
          <stop offset="0%" stopColor="#ff8d9b" />
          <stop offset="100%" stopColor="#dd1e4d" />
        </radialGradient>
      </defs>
      <path
        d="M32 55C19 44.5 8 35 8 23 8 14 15 7.5 23 7.5c4.3 0 8 2 9 5.2 1-3.2 4.7-5.2 9-5.2 8 0 15 6.5 15 15.5 0 12-11 21.5-24 32z"
        fill={`url(#${uid}-heart)`}
      />
      <ellipse cx="21.5" cy="17.5" rx="7" ry="4.5" fill="rgba(255,255,255,0.45)" />
      <path d="M42 12.5c2.8-.8 5.5 0 7 2" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function HeartEyesIcon({ uid, className }: IconProps) {
  const heart = "translate(-6,-4) scale(0.9)";
  return (
    <Face uid={uid} className={className} from="#ffe084" to="#f7a923">
      {[21, 43].map((cx) => (
        <g key={cx} transform={`translate(${cx} 26) ${heart}`} fill="#e8405c">
          <circle cx="-3.4" cy="-1.6" r="3.4" />
          <circle cx="3.4" cy="-1.6" r="3.4" />
          <path d="M-6.6 0h13.2L0 7.4z" />
        </g>
      ))}
      <path d="M21 41c4 5.5 16 5.5 21-0.5" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </Face>
  );
}

function HahaIcon({ uid, className }: IconProps) {
  return (
    <Face uid={uid} className={className} from="#ffe084" to="#f7a923">
      <path d="M15 26c2.5-3.5 8.5-3.5 11 0.5" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path d="M38 26.5c2.5-4 8.5-4 11-0.5" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path d="M18 36c1.5 12 7 17.5 14 17.5S43 48 44.5 36z" fill="#8a3a1c" />
      <path d="M23 47.5c3.5 3.4 14.5 3.4 18-0.2l-1.2 3.2c-4.5 3.6-11.5 3.6-15.6 0z" fill="#f2748c" />
    </Face>
  );
}

function WowIcon({ uid, className }: IconProps) {
  return (
    <Face uid={uid} className={className} from="#ffe084" to="#f7a923">
      <circle cx="21.5" cy="26" r="3.6" fill={INK} />
      <circle cx="42.5" cy="26" r="3.6" fill={INK} />
      <path d="M15 18.5c2.5-2 7-2.4 9.6-1" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M39.4 17.5c2.6-1.4 7.1-1 9.6 1" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <ellipse cx="32" cy="42.5" rx="6.5" ry="8" fill="#8a3a1c" />
      <ellipse cx="32" cy="45.5" rx="3.4" ry="3.6" fill="#5c2410" />
    </Face>
  );
}

function SadIcon({ uid, className }: IconProps) {
  return (
    <Face uid={uid} className={className} from="#ffe084" to="#f7a923">
      <path d="M15 28c3-3.4 8.4-3.4 11 0.4" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path d="M38 28.4c2.6-3.8 8-3.8 11-0.4" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path d="M21 47.5c3.5-6 16.5-6 20 0.4" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <path d="M48.5 33c2.6 4.4 2.6 8.6-1 8.6s-3.6-4.2-1-8.6z" fill="#57aef2" />
    </Face>
  );
}

function AngryIcon({ uid, className }: IconProps) {
  return (
    <Face uid={uid} className={className} from="#ff9a6b" to="#df3d1c">
      <path d="M14 20.5l11 4.5" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M50 20.5L39 25" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="22" cy="30" r="3.4" fill={INK} />
      <circle cx="42" cy="30" r="3.4" fill={INK} />
      <path d="M22 48c3.5-6 15.5-6 19 0.2" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </Face>
  );
}

function ThinkIcon({ uid, className }: IconProps) {
  return (
    <Face uid={uid} className={className} from="#ffe084" to="#f7a923">
      <path d="M13 19c3-3 8-3.2 10.6-1.2" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M38.4 17.8c2.6-2 7.6-1.8 10.6 1.2" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <circle cx="20.5" cy="27" r="3.2" fill={INK} />
      <circle cx="43.5" cy="27" r="3.2" fill={INK} />
      <path d="M27 44l10-2.5" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M44 41.5c3.4.4 5.6 2.6 5.6 5.6 0 3.2-2.6 5.4-6.2 5.4h-3.2c-3 0-5.2-2-5.2-4.8 0-3 2.4-5.2 5.4-5.2z" fill="rgba(120,53,15,0.18)" />
    </Face>
  );
}

export function ReactionIcon({ emoji, className }: { emoji: string; className?: string }) {
  const uid = useId();
  const resolved = ALIAS[emoji] ?? emoji;
  switch (resolved) {
    case "👍":
      return <LikeIcon uid={uid} className={className} />;
    case "❤️":
      return <LoveIcon uid={uid} className={className} />;
    case "😍":
      return <HeartEyesIcon uid={uid} className={className} />;
    case "😂":
      return <HahaIcon uid={uid} className={className} />;
    case "😮":
      return <WowIcon uid={uid} className={className} />;
    case "😭":
      return <SadIcon uid={uid} className={className} />;
    case "😡":
      return <AngryIcon uid={uid} className={className} />;
    case "🤔":
      return <ThinkIcon uid={uid} className={className} />;
    default:
      return <span className={cn("grid place-items-center leading-none", className)}>{emoji}</span>;
  }
}
