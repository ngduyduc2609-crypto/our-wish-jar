import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";

import type { Wish } from "@/lib/db";
import { WISH_CATEGORIES, labelOf } from "@/lib/constants";

const NOTE_COLORS = ["wish-note-rose", "wish-note-honey", "wish-note-sky", "wish-note-sage"];

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

// Horizontal paper strips piled in the curved bottom (50%–80% of the jar interior).
function noteStyle(id: string, index: number, total: number): NoteStyle {
  const seed = hashSeed(id);
  const n = Math.max(1, total);
  const perRow = n <= 4 ? 2 : n <= 9 ? 3 : n <= 20 ? 4 : 5;
  const rows = Math.ceil(n / perRow);
  const row = Math.floor(index / perRow); // 0 = bottom row
  const inRow = Math.min(perRow, n - row * perRow);
  const col = index % perRow;
  const scale = n <= 4 ? 1 : n <= 9 ? 0.9 : n <= 20 ? 0.78 : n <= 40 ? 0.66 : 0.56;

  const r = 0.8 + randomFrom(seed, 1) * 0.4; // 80–120% size
  const width = Math.min(46, 38 * scale * r); // % of zone width
  const height = 19 * scale * (0.85 + randomFrom(seed, 2) * 0.3); // % of zone height

  const yBottom = 77 - height / 2;
  const yTop = 44 + height / 2;
  const step = rows > 1 ? Math.min(height * 0.9, (yBottom - yTop) / (rows - 1)) : 0;
  const y = yBottom - row * step + (randomFrom(seed, 3) - 0.5) * height * 0.3;

  // bottom of the jar curves inward: lower rows get a narrower span
  const inset = Math.max(4, 14 - row * 4);
  const minX = inset + width / 2;
  const maxX = 100 - inset - width / 2;
  const t = inRow === 1 ? 0.5 : col / (inRow - 1);
  const jitter = (randomFrom(seed, 4) - 0.5) * width * 0.25;
  const x = maxX > minX ? Math.min(maxX, Math.max(minX, minX + (maxX - minX) * t + jitter)) : 50;

  const rotate = -10 + randomFrom(seed, 5) * 20;

  return {
    "--note-x": `${x}%`,
    "--note-y": `${y}%`,
    "--note-width": `${width}%`,
    "--note-height": `${height}%`,
    "--note-rotate": `${rotate}deg`,
    "--note-delay": `${-(randomFrom(seed, 6) * 7)}s`,
    "--note-duration": `${5 + randomFrom(seed, 7) * 3}s`,
    zIndex: 2 + (index % 2 === 0 ? index : n - index),
    fontSize: `${Math.max(0.6, scale)}em`,
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
  const visible = [...wishes.filter((wish) => !wish.completed)];
  const language = typeof window !== "undefined" ? (document.documentElement.dataset.lang as "vi" | "en" | "zh" | undefined) ?? "vi" : "vi";

  return (
    <div className="wish-jar-scene" aria-label={language === "zh" ? `装着 ${visible.length} 个等待中的愿望` : language === "en" ? `Jar holding ${visible.length} wishes waiting` : `Lọ chứa ${visible.length} điều ước đang chờ`}>
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