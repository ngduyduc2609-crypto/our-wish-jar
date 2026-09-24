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

function noteStyle(id: string, index: number, total: number): NoteStyle {
  const seed = hashSeed(id);
  const count = Math.max(1, total);
  const densityScale = count > 20 ? 0.8 : count > 10 ? 0.9 : 1;
  const width = (44 + randomFrom(seed, 1) * 22) * densityScale;
  const height = (30 + randomFrom(seed, 2) * 17) * densityScale;

  const cols = count <= 4 ? 2 : count <= 8 ? 3 : count <= 14 ? 4 : count <= 22 ? 5 : 6;
  const rows = Math.max(2, Math.ceil(count / cols));
  const col = index % cols;
  const row = Math.floor(index / cols) % rows;

  const colSpan = 100 / cols;
  const x = 12 + col * colSpan + colSpan * (0.18 + randomFrom(seed, 4) * 0.64);
  const y = 18 + row * (52 / Math.max(1, rows - 1)) + (randomFrom(seed, 3) - 0.5) * 12;

  const safeX = Math.min(88, Math.max(12, x));
  const safeY = Math.min(84, Math.max(16, y));

  return {
    "--note-x": `${safeX}%`,
    "--note-y": `${safeY}%`,
    "--note-width": `${width}px`,
    "--note-height": `${height}px`,
    "--note-rotate": `${-15 + randomFrom(seed, 5) * 30}deg`,
    "--note-delay": `${-(randomFrom(seed, 6) * 6)}s`,
    "--note-duration": `${5 + randomFrom(seed, 7) * 3}s`,
    zIndex: 2 + Math.floor(randomFrom(seed, 8) * 12),
  };
}

export function WishJarDisplay({ wishes }: { wishes: Wish[] }) {
  const visible = wishes.slice(0, 48);

  return (
    <div className="wish-jar-scene" aria-label={`Lọ chứa ${wishes.length} điều ước đang chờ`}>
      <span className="wish-jar-spark wish-jar-spark-left" aria-hidden="true">
        <Sparkles />
      </span>
      <span className="wish-jar-spark wish-jar-spark-right" aria-hidden="true">
        <Sparkles />
      </span>

      <div className="wish-jar-lid" aria-hidden="true">
        <span />
      </div>

      <div className="wish-jar-shell">
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

        <div className="wish-jar-glass-shine" aria-hidden="true" />
        <div className="wish-jar-glass-rim" aria-hidden="true" />
        <div className="wish-jar-glass-base" aria-hidden="true" />
      </div>

      {wishes.length > visible.length ? (
        <span className="wish-jar-more">+{wishes.length - visible.length}</span>
      ) : null}
    </div>
  );
}