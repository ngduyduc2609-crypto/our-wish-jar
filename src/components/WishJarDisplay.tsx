import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";

import type { Wish } from "@/lib/db";
import { WISH_CATEGORIES, labelOf } from "@/lib/constants";

const NOTE_COLORS = ["wish-note-rose", "wish-note-honey", "wish-note-sky", "wish-note-sage"];

type NoteStyle = CSSProperties & {
  "--note-x": string;
  "--note-y": string;
  "--note-width": string;
  "--note-rotate": string;
  "--note-delay": string;
  "--note-duration": string;
};

function noteStyle(index: number, total: number): NoteStyle {
  const columns = 7;
  const row = Math.floor(index / columns);
  const column = index % columns;
  const rows = Math.max(1, Math.ceil(Math.min(total, 42) / columns));
  const offset = row % 2 === 0 ? 2 : -1;
  const x = 9 + column * 12.7 + offset + ((index * 7) % 5);
  const bottom = 7 + row * Math.min(15, 68 / rows) + ((index * 11) % 5);

  return {
    "--note-x": `${Math.min(x, 83)}%`,
    "--note-y": `${Math.min(bottom, 72)}%`,
    "--note-width": `${48 + ((index * 13) % 30)}px`,
    "--note-rotate": `${-9 + ((index * 17) % 19)}deg`,
    "--note-delay": `${-((index * 0.37) % 5.5)}s`,
    "--note-duration": `${4.8 + (index % 7) * 0.42}s`,
    zIndex: row + 2,
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
                style={noteStyle(index, visible.length)}
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