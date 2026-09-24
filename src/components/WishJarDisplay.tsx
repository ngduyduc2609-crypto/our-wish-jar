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
  const width = 68 + randomFrom(seed, 1) * 24;
  const height = 52 + randomFrom(seed, 2) * 16;

  let x: number;
  let y: number;

  if (count > 18) {
    const angle = (Math.PI * 2 * index) / count + randomFrom(seed, 6) * 1.4;
    const radiusX = 14 + randomFrom(seed, 7) * 18;
    const radiusY = 10 + randomFrom(seed, 8) * 12;
    x = 50 + Math.cos(angle) * radiusX;
    y = 64 + Math.sin(angle) * radiusY + (index % 2 === 0 ? 4 : -2);
  } else {
    const cols = count <= 3 ? 2 : count <= 6 ? 3 : count <= 12 ? 4 : 5;
    const rows = Math.max(2, Math.ceil(count / cols));
    const col = index % cols;
    const row = Math.floor(index / cols) % rows;
    const offsetX = (randomFrom(seed, 3) - 0.5) * 12;
    const offsetY = (randomFrom(seed, 4) - 0.5) * 10;
    const colGap = count <= 3 ? 22 : count <= 6 ? 18 : 16;
    const rowGap = count <= 3 ? 18 : 14;

    x = 20 + col * colGap + offsetX + (count <= 3 ? 12 : 0);
    y = 60 + row * rowGap + offsetY + (index % 2 === 0 ? 4 : -3);
  }

  const safeX = Math.min(82, Math.max(18, x));
  const safeY = Math.min(84, Math.max(56, y));
  const rotate = -18 + randomFrom(seed, 5) * 36;

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
  const visible = wishes.slice(0, 48);

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

      {wishes.length > visible.length ? (
        <span className="wish-jar-more">+{wishes.length - visible.length}</span>
      ) : null}
    </div>
  );
}