import { useState, useCallback, useEffect, type CSSProperties } from "react";
import { Sparkles } from "lucide-react";

import type { Wish } from "@/lib/db";
import { WISH_CATEGORIES, labelOf } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NOTE_COLORS = ["wish-note-rose", "wish-note-honey", "wish-note-sky", "wish-note-sage", "wish-note-lavender"];

type NoteStyle = CSSProperties & {
  "--note-x": string;
  "--note-y": string;
  "--note-width": string;
  "--note-height": string;
  "--note-rotate": string;
  "--note-delay": string;
  "--note-duration": string;
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFrom(seed: number, salt: number) {
  const value = Math.sin(seed * 0.0001 + salt * 91.731) * 43758.5453;
  return value - Math.floor(value);
}

function noteStyle(id: string, index: number, total: number, shuffleSeed: number): NoteStyle {
  const seed = hashSeed(id) + shuffleSeed;
  const n = Math.max(1, total);
  
  // Adaptive scaling based on count to prevent massive clutter
  const scale = n <= 5 ? 1.05 : n <= 12 ? 0.9 : n <= 25 ? 0.75 : n <= 50 ? 0.62 : 0.52;
  
  const r = 0.85 + randomFrom(seed, 1) * 0.3;
  const width = Math.min(48, 42 * scale * r);
  const height = 20 * scale * (0.9 + randomFrom(seed, 2) * 0.2);

  // Staggered layout logic
  const perRow = n <= 6 ? 2 : n <= 15 ? 3 : n <= 30 ? 4 : 5;
  const row = Math.floor(index / perRow);
  const col = index % perRow;
  const rowCount = Math.ceil(n / perRow);
  const inRow = Math.min(perRow, n - row * perRow);

  // Vertical distribution from bottom up
  const yBase = 82;
  const yGap = Math.min(10, 35 / rowCount);
  const yJitter = (randomFrom(seed, 3) - 0.5) * 8;
  const y = yBase - (row * yGap) - yJitter;

  // Horizontal distribution with inward curve awareness
  const jarCurve = Math.pow(Math.abs((y - 50) / 40), 2) * 12;
  const minX = 12 + jarCurve + (width / 2);
  const maxX = 88 - jarCurve - (width / 2);
  
  const t = inRow <= 1 ? 0.5 : col / (inRow - 1);
  const xJitter = (randomFrom(seed, 4) - 0.5) * 6;
  let x = minX + (maxX - minX) * t + xJitter;
  x = Math.max(minX, Math.min(maxX, x));

  const rotate = -12 + randomFrom(seed, 5) * 24;

  return {
    "--note-x": `${x}%`,
    "--note-y": `${y}%`,
    "--note-width": `${width}%`,
    "--note-height": `${height}%`,
    "--note-rotate": `${rotate}deg`,
    "--note-delay": `${-(randomFrom(seed, 6) * 8)}s`,
    "--note-duration": `${6 + randomFrom(seed, 7) * 4}s`,
    zIndex: 2 + index,
  };
}

const jarParticles = [
  { left: "26%", top: "42%", size: "6px", delay: "0s" },
  { left: "42%", top: "35%", size: "4px", delay: "1.2s" },
  { left: "58%", top: "45%", size: "5px", delay: "2.1s" },
  { left: "71%", top: "38%", size: "6px", delay: "0.7s" },
  { left: "33%", top: "58%", size: "5px", delay: "1.8s" },
  { left: "76%", top: "60%", size: "4px", delay: "2.7s" },
];

export function WishJarDisplay({ wishes, isShaking: externalShaking = false }: { wishes: Wish[]; isShaking?: boolean }) {
  const [internalShaking, setInternalShaking] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const visible = wishes.filter((wish) => !wish.completed);
  const language = typeof window !== "undefined" ? (document.documentElement.dataset.lang as "vi" | "en" | "zh" | undefined) ?? "vi" : "vi";

  const handleShuffle = useCallback(() => {
    if (internalShaking || visible.length === 0) return;
    setInternalShaking(true);
    setTimeout(() => {
      setShuffleSeed(s => s + 1);
      setInternalShaking(false);
    }, 800);
  }, [internalShaking, visible.length]);

  const shaking = externalShaking || internalShaking;

  return (
    <div 
      className={cn("wish-jar-scene", shaking && "jar-shaking")} 
      onClick={handleShuffle}
      aria-label={language === "zh" ? `装着 ${visible.length} 个等待中的愿望` : language === "en" ? `Jar holding ${visible.length} wishes waiting` : `Lọ chứa ${visible.length} điều ước đang chờ`}
    >
      <div className="wish-jar-neck" aria-hidden="true">
        <span className="wish-jar-ribbon" />
      </div>

      <div className="wish-jar-shell">
        <div className="wish-jar-glass-shine" aria-hidden="true" />
        <div className="wish-jar-glass-highlight" aria-hidden="true" />
        <div className="wish-jar-waterline" aria-hidden="true" />

        <div className="wish-jar-particles" aria-hidden="true">
          {jarParticles.map((particle, index) => (
            <span
              key={`${particle.left}-${particle.top}-${index}`}
              className="wish-jar-particle"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                animationDelay: particle.delay,
              }}
            />
          ))}
        </div>

        <div className="wish-jar-safe-zone">
          {visible.map((wish, index) => {
            const category = labelOf(WISH_CATEGORIES, wish.category);
            return (
              <div
                key={`${wish.id}-${shuffleSeed}`}
                style={noteStyle(wish.id, index, visible.length, shuffleSeed)}
                className={cn(
                  "wish-note wish-note-paper", 
                  NOTE_COLORS[index % NOTE_COLORS.length],
                  shaking && "wish-note-shuffling"
                )}
                title={wish.title}
              >
                <span className="wish-note-icon" aria-hidden="true">{category.emoji}</span>
                <span className="wish-note-title">{wish.title}</span>
              </div>
            );
          })}

          {visible.length === 0 ? (
            <div className="wish-jar-empty">
              <span>💌</span>
              <p>{language === "zh" ? "等待新的愿望进入" : language === "en" ? "The jar is waiting for a new wish" : "Lọ đang chờ điều ước mới"}</p>
            </div>
          ) : null}
        </div>

        <div className="wish-jar-base-glow" aria-hidden="true" />
      </div>

      <span className="wish-jar-spark wish-jar-spark-left" aria-hidden="true">
        <Sparkles />
      </span>
      <span className="wish-jar-spark wish-jar-spark-right" aria-hidden="true">
        <Sparkles />
      </span>
    </div>
  );
}
