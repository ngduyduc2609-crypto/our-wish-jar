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
  const densityScale = count > 20 ? 0.78 : count > 10 ? 0.88 : 1;
  const width = (42 + randomFrom(seed, 1) * 18) * densityScale;
  const height = (28 + randomFrom(seed, 2) * 15) * densityScale;

  let x: number;
  let y: number;

  if (count > 20) {
    const angle = (Math.PI * 2 * index) / count + randomFrom(seed, 6) * 1.4;
    const radiusX = 12 + randomFrom(seed, 7) * 20;
    const radiusY = 10 + randomFrom(seed, 8) * 18;
    x = 50 + Math.cos(angle) * radiusX;
    y = 50 + Math.sin(angle) * radiusY + ((index % 2 === 0 ? 1 : -1) * (6 + randomFrom(seed, 9) * 8));
  } else {
    const cols = count <= 4 ? 2 : count <= 8 ? 3 : count <= 14 ? 4 : count <= 22 ? 5 : 6;
    const rows = Math.max(2, Math.ceil(count / cols));
    const col = index % cols;
    const row = Math.floor(index / cols) % rows;
    const colGap = count > 12 ? 18 : 22;
    const rowGap = count > 12 ? 16 : 20;

    x = 18 + col * colGap + (randomFrom(seed, 3) - 0.5) * 10 + (count <= 4 ? 14 : 0);
    y = 20 + row * rowGap + (randomFrom(seed, 4) - 0.5) * 12;
  }

  const safeX = Math.min(84, Math.max(16, x));
  const safeY = Math.min(72, Math.max(28, y));
  const rotate = -15 + randomFrom(seed, 5) * 30;

  return {
    "--note-x": `${safeX}%`,
    "--note-y": `${safeY}%`,
    "--note-width": `${width}px`,
    "--note-height": `${height}px`,
    "--note-rotate": `${rotate}deg`,
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