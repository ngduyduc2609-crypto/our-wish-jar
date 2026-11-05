import { useId } from "react";
import { cn } from "@/lib/utils";

/** Native emoji values are persistence keys only; all visible art is custom. */
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
  return REACTIONS.find((r) => r.emoji === (ALIAS[emoji] ?? emoji))?.label[language] ?? emoji;
}
const KIND: Record<string, string> = { "👍": "like", "❤️": "love", "😂": "haha", "😮": "wow", "😭": "sad", "😡": "angry" };
const INK = "var(--rx-ink)";
const WHITE = "var(--rx-white)";
const MOUTH = "var(--rx-mouth)";

function Eye({ x, y, size = 3.5 }: { x: number; y: number; size?: number }) {
  return <g><ellipse cx={x} cy={y} rx={size * .82} ry={size} fill={INK} /><ellipse cx={x - .7} cy={y - 1.2} rx={size * .24} ry={size * .3} fill={WHITE} opacity=".82" /></g>;
}
function Cheeks() {
  return <g fill="var(--rx-cheek)" opacity=".22"><ellipse cx="15.5" cy="37" rx="4.5" ry="2.5" /><ellipse cx="48.5" cy="37" rx="4.5" ry="2.5" /></g>;
}

export function ReactionIcon({ emoji, className }: { emoji: string; className?: string }) {
  const u = useId().replace(/:/g, "");
  const resolved = ALIAS[emoji] ?? emoji;
  const kind = KIND[resolved];
  if (!kind) return <span className={cn("grid place-items-center leading-none", className)}>{emoji}</span>;
  const palette = kind === "like" ? "blue" : kind === "love" ? "pink" : kind === "angry" ? "red" : "yellow";
  const heart = "M32 55C28 52 6.5 38.4 6.5 23.5C6.5 14.6 12.5 8 21 8C25.7 8 29.6 10.4 32 14.2C34.4 10.4 38.3 8 43 8C51.5 8 57.5 14.6 57.5 23.5C57.5 38.4 36 52 32 55Z";
  const hand = "M25 43.5V30.6C28.4 28.3 31.7 23 32.7 17.2C33.1 14.8 33.1 12.4 35 12.4C37.9 12.4 39.6 15 39.1 19.2C38.8 21.8 37.7 24.7 36.8 26.7H43.7C47 26.7 48.2 29.1 47.6 31.7L45.6 41.5C45 44.5 43.5 46.2 40.6 46.2H29C26.5 46.2 25 45.5 25 43.5Z";
  return <svg viewBox="0 0 64 64" className={cn("rx-icon", `rx-${kind}`, className)} aria-hidden="true" overflow="visible">
    <defs>
      <radialGradient id={`${u}-base`} cx="35%" cy="24%" r="82%">
        <stop offset="0" stopColor={`var(--rx-${palette}-light)`} />
        <stop offset=".5" stopColor={`var(--rx-${palette}-mid)`} />
        <stop offset="1" stopColor={`var(--rx-${palette}-edge)`} />
      </radialGradient>
      <radialGradient id={`${u}-glow`} cx="50%" cy="50%" r="50%"><stop stopColor={WHITE} stopOpacity=".7" /><stop offset="1" stopColor={WHITE} stopOpacity="0" /></radialGradient>
      <linearGradient id={`${u}-hand`} x1=".1" y1="0" x2=".8" y2="1"><stop stopColor={WHITE} /><stop offset="1" stopColor="var(--rx-hand-edge)" /></linearGradient>
      <linearGradient id={`${u}-water`} x1="0" y1="0" x2="1" y2=".3"><stop stopColor="var(--rx-tear-light)" /><stop offset=".5" stopColor="var(--rx-tear-mid)" /><stop offset="1" stopColor="var(--rx-tear-edge)" /></linearGradient>
    </defs>
    <g className="rx-body">
      <ellipse cx="32" cy="59.5" rx={kind === "love" ? 13 : 17} ry="2" fill="var(--rx-shadow)" opacity=".055" />
      {kind === "love" ? <g className="rx-heart">
        <path d={heart} fill={`url(#${u}-base)`} />
        <ellipse cx="19.5" cy="17" rx="9" ry="6" fill={`url(#${u}-glow)`} transform="rotate(-30 19.5 17)" />
        <ellipse cx="44.5" cy="16.5" rx="5" ry="4" fill={`url(#${u}-glow)`} opacity=".6" />
        <path d="M12 29C15 38 24 46 31 50" fill="none" stroke={WHITE} strokeWidth="1.3" strokeLinecap="round" opacity=".22" />
      </g> : <>
        <circle cx="32" cy="31" r="27.5" fill={`url(#${u}-base)`} />
        <ellipse cx="24" cy="15" rx="16" ry="10" fill={`url(#${u}-glow)`} transform="rotate(-20 24 15)" opacity=".72" />
        <path d="M13 43C17 50 24 54 32 54C40 54 47 50 51 43" stroke={WHITE} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity={kind === "angry" ? ".1" : ".24"} />
        {kind === "like" && <g className="rx-thumb">
          <path d={hand} fill="var(--rx-blue-edge)" opacity=".2" transform="translate(.4 1.2)" />
          <rect x="15.5" y="30" width="7" height="16" rx="2.2" fill={`url(#${u}-hand)`} />
          <path d={hand} fill={`url(#${u}-hand)`} />
          <path d="M39 31H45M38.5 35.4H44M38 39.8H43" stroke="var(--rx-blue-mid)" strokeWidth=".65" strokeLinecap="round" opacity=".3" fill="none" />
          <path d="M28 31.5C31.9 27 34.4 22.8 35 17" stroke={WHITE} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".8" />
        </g>}
        {kind === "haha" && <g className="rx-face">
          <Cheeks />
          <path d="M14 29C16.7 25.4 20.6 25.4 23.3 29M40.7 29C43.4 25.4 47.3 25.4 50 29" stroke={INK} strokeWidth="2.9" strokeLinecap="round" fill="none" />
          <path d="M16 36C16.8 46.7 23.2 52 32 52C40.8 52 47.2 46.7 48 36C39 38 25 38 16 36Z" fill={MOUTH} />
          <path d="M17.5 36.6C25 38 39 38 46.5 36.6L45 41C37 42.4 27 42.4 19 41Z" fill={WHITE} />
          <path d="M23 48C27 44 37 44 41 48C35 51 29 51 23 48Z" fill="var(--rx-cheek)" />
          <path className="rx-tear" d="M10 28C8.5 30.4 7 33 7.4 35C7.8 37.4 11.3 38 12.1 35.5C12.8 33.8 11.3 30.8 10 28Z" fill={`url(#${u}-water)`} />
          <path className="rx-tear rx-tear-r" d="M54 28C55.5 30.4 57 33 56.6 35C56.2 37.4 52.7 38 51.9 35.5C51.2 33.8 52.7 30.8 54 28Z" fill={`url(#${u}-water)`} />
        </g>}
        {kind === "wow" && <><Cheeks /><g className="rx-face">
          <path d="M15 18C17.6 15.6 21.4 15.4 24 17M40 17C42.6 15.4 46.4 15.6 49 18" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
          <Eye x={21} y={27} size={4.3} /><Eye x={43} y={27} size={4.3} />
          <g className="rx-mouth"><ellipse cx="32" cy="43" rx="6.4" ry="8" fill={MOUTH} /><ellipse cx="32" cy="47" rx="3.2" ry="2.3" fill="var(--rx-cheek)" /></g>
        </g></>}
        {kind === "sad" && <g className="rx-face">
          <path d="M15 18C18 18 20.8 16.6 23 14.5M41 14.5C43.2 16.6 46 18 49 18" stroke={INK} strokeWidth="2.1" strokeLinecap="round" fill="none" />
          <path d="M23.5 45.5C23.5 39.7 27.1 36.7 32 36.7C36.9 36.7 40.5 39.7 40.5 45.5C40.5 48.6 38.6 50 36 49.6H28C25.4 50 23.5 48.6 23.5 45.5Z" fill={MOUTH} />
          <path d="M27 47C29.5 44.7 34.5 44.7 37 47" stroke="var(--rx-cheek)" strokeWidth="2.2" strokeLinecap="round" />
          <g className="rx-stream"><path d="M14.2 28H20.5C19.8 36 21.3 48.5 18.7 53.2C17.6 55.2 14.9 54.5 14.3 52.5C12.7 46 14.7 35.7 14.2 28Z" fill={`url(#${u}-water)`} /><path d="M15.9 32C15.6 38 15.1 44.5 15.7 49" stroke={WHITE} strokeWidth="1" strokeLinecap="round" fill="none" opacity=".6" /></g>
          <g className="rx-stream rx-stream-r"><path d="M43.5 28H49.8C49.3 35.7 51.3 46 49.7 52.5C49.1 54.5 46.4 55.2 45.3 53.2C42.7 48.5 44.2 36 43.5 28Z" fill={`url(#${u}-water)`} /><path d="M45.2 32C44.9 38 44.8 44.5 45.7 49" stroke={WHITE} strokeWidth="1" strokeLinecap="round" fill="none" opacity=".6" /></g>
          <path d="M13.5 26C16 28.5 20.1 28.7 23.5 26.5M40.5 26.5C43.9 28.7 48 28.5 50.5 26" stroke={INK} strokeWidth="2.7" strokeLinecap="round" fill="none" />
        </g>}
        {kind === "angry" && <g className="rx-face">
          <path d="M14 22C17 23 20.5 24.6 24 25.6M40 25.6C43.5 24.6 47 23 50 22" stroke={INK} strokeWidth="2.7" strokeLinecap="round" fill="none" />
          <Eye x={22} y={31} size={3.2} /><Eye x={42} y={31} size={3.2} />
          <path d="M24 46C28 42.5 36 42.5 40 46" stroke={INK} strokeWidth="2.7" strokeLinecap="round" fill="none" />
        </g>}
      </>}
    </g>
  </svg>;
}
