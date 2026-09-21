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
  const width = 45 + randomFrom(seed, 1) * 22;
  const height = 31 + randomFrom(seed, 2) * 17;
  const rows = Math.min(6, Math.max(1, Math.ceil(total / 7)));
  const row = index % rows;
  const lane = Math.floor(index / rows);
  const yBase = rows === 1 ? 62 : 10 + row * (62 / (rows - 1));
  const y = Math.min(73, Math.max(7, yBase + (randomFrom(seed, 3) - 0.5) * 12));
  const bottomTaper = Math.max(0, (y - 55) / 18);
  const sideInset = 4 + bottomTaper * 7;
  const usableX = 100 - sideInset * 2;
  const distributed = ((lane * 37 + row * 19) % 100) / 100;
  const x = sideInset + ((distributed * 0.65 + randomFrom(seed, 4) * 0.35) % 1) * usableX;

  return {
    "--note-x": `${x}%`,
    "--note-y": `${y}%`,
    "--note-width": `${width}px`,
    "--note-height": `${height}px`,
    "--note-rotate": `${-11 + randomFrom(seed, 5) * 22}deg`,
    "--note-delay": `${-(randomFrom(seed, 6) * 6)}s`,
    "--note-duration": `${5 + randomFrom(seed, 7) * 3}s`,
    zIndex: 2 + Math.floor(randomFrom(seed, 8) * 12),
  };
}

export function WishJarDisplay({ wishes }: { wishes: Wish[] }) {
  const visible = wishes.slice(0, 42);

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