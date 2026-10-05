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
  const seed = hashSeed(id) + shuffleSeed * 7919;
  const n = Math.max(1, total);
  // Grid of cells inside the jar body; each wish gets its own cell (shuffled order).
  const cols = n <= 2 ? n : n <= 6 ? 2 : n <= 12 ? 3 : n <= 24 ? 4 : 5;
  const rows = Math.ceil(n / cols);
  const order = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => randomFrom(a + 1, shuffleSeed + 3) - randomFrom(b + 1, shuffleSeed + 3),
  );
  const cell = order[index] ?? index;
  const row = Math.floor(cell / cols);
  const inRow = Math.min(cols, n - row * cols);
  const col = cell % cols;

  const top = rows <= 3 ? 40 : 14;
  const bottom = 90;
  const cellH = (bottom - top) / rows;
  const inset = 6 + Math.abs(row - (rows - 1) / 2) * 0; // jar body is straight
  const cellW = (100 - inset * 2) / inRow;

  const width = Math.min(46, cellW * 0.86);
  const height = Math.min(22, cellH * 0.82);
  const x = inset + cellW * (col + 0.5) + (randomFrom(seed, 4) - 0.5) * cellW * 0.1;
  const y = bottom - cellH * (row + 0.5) + (randomFrom(seed, 3) - 0.5) * cellH * 0.12;
  const rotate = -7 + randomFrom(seed, 5) * 14;

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
      {visible.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleShuffle(); }}
          className="absolute bottom-1 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground shadow-md"
        >
          {language === "en" ? "Shake jar ✨" : language === "zh" ? "摇一摇 ✨" : "Lắc lọ ✨"}
        </button>
      )}
    </div>
  );
}
