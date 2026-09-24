import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";

import type { Wish } from "@/lib/db";
import { WISH_CATEGORIES, labelOf } from "@/lib/constants";

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

function noteStyle(id: string, index: number, total: number): NoteStyle {
  const seed = hashSeed(id);
  const count = Math.max(1, total);
  const width = 92 + randomFrom(seed, 1) * 28;
  const height = 42 + randomFrom(seed, 2) * 12;

  let x: number;
  let y: number;

  if (count <= 3) {
    const spread = count === 1 ? 0 : count === 2 ? 18 : 24;
    x = 50 + (index - (count - 1) / 2) * spread;
    y = 68 + (index % 2 === 0 ? -4 : 6);
  } else if (count <= 6) {
    const cols = 3;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const rowOffset = row === 0 ? 0 : row === 1 ? 10 : 18;
    const xBase = 20 + col * 28 + (randomFrom(seed, 3) - 0.5) * 10;
    x = xBase;
    y = 62 + rowOffset + (index % 2 === 0 ? 2 : -2);
  } else {
    const spread = 16 + randomFrom(seed, 4) * 8;
    const arc = (Math.PI * 2 * index) / count;
    x = 50 + Math.cos(arc) * spread;
    y = 66 + Math.sin(arc) * 12 + (index % 2 === 0 ? 3 : -3);
  }

  const safeX = Math.min(82, Math.max(18, x));
  const safeY = Math.min(82, Math.max(58, y));
  const rotate = -8 + randomFrom(seed, 5) * 16;

  return {
    "--note-x": `${safeX}%`,
    "--note-y": `${safeY}%`,
    "--note-width": `${width}px`,
    "--note-height": `${height}px`,
    "--note-rotate": `${rotate}deg`,
    "--note-delay": `${-(randomFrom(seed, 6) * 7)}s`,
    "--note-duration": `${5 + randomFrom(seed, 7) * 3}s`,
    zIndex: 2 + Math.floor(randomFrom(seed, 8) * 12),
  };
}

const jarParticles = [
  { left: "26%", top: "40%", size: "6px", delay: "0s" },
  { left: "42%", top: "32%", size: "4px", delay: "1.2s" },
  { left: "58%", top: "42%", size: "5px", delay: "2.1s" },
  { left: "71%", top: "35%", size: "6px", delay: "0.7s" },
  { left: "33%", top: "54%", size: "5px", delay: "1.8s" },
  { left: "76%", top: "56%", size: "4px", delay: "2.7s" },
];

export function WishJarDisplay({ wishes }: { wishes: Wish[] }) {
  const visible = wishes;

  return (
    <div className="wish-jar-scene" aria-label={`Lọ chứa ${wishes.length} điều ước đang chờ`}>
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
                key={wish.id}
                style={noteStyle(wish.id, index, visible.length)}
                className={`wish-note wish-note-paper ${NOTE_COLORS[index % NOTE_COLORS.length]}`}
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
              <p>Lọ đang chờ điều ước mới</p>
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