import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Sparkles } from "lucide-react";

import type { Wish } from "@/lib/db";
import { WISH_CATEGORIES, labelOf } from "@/lib/constants";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const NOTE_COLORS = ["wish-note-rose", "wish-note-honey", "wish-note-sky", "wish-note-sage", "wish-note-lavender"];

type NoteLayout = { x: number; y: number; w: number; h: number; rotate: number; z: number };

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random, natural placement inside the jar body (percent of the inner zone).
 * Best-candidate sampling keeps notes spread out; papers settle toward the bottom
 * and every note stays fully inside the glass with a safety margin.
 */
function layoutNotes(ids: string[], shuffleSeed: number): NoteLayout[] {
  const n = ids.length;
  if (n === 0) return [];
  const rand = mulberry32(hashSeed(ids.join("|")) + shuffleSeed * 7919 + 17);

  const scale = n <= 4 ? 1 : n <= 8 ? 0.86 : n <= 14 ? 0.74 : n <= 24 ? 0.62 : n <= 40 ? 0.52 : 0.44;
  // Fill area: more notes use more of the jar height.
  const top = n <= 4 ? 42 : n <= 10 ? 30 : n <= 20 ? 20 : 10;
  const bottom = 96;
  const placed: NoteLayout[] = [];

  for (let i = 0; i < n; i += 1) {
    const w = 40 * scale * (0.85 + rand() * 0.3);
    const h = 24 * scale * (0.85 + rand() * 0.3);
    const minX = 4 + w / 2;
    const maxX = 96 - w / 2;
    const minY = top + h / 2;
    const maxY = bottom - h / 2;

    let best = { x: 50, y: maxY, score: -Infinity };
    for (let k = 0; k < 14; k += 1) {
      // bias toward the bottom (papers settle by gravity)
      const x = minX + rand() * Math.max(0, maxX - minX);
      const y = maxY - Math.pow(rand(), 1.6) * Math.max(0, maxY - minY);
      let nearest = Infinity;
      for (const p of placed) {
        const dx = (p.x - x) / ((p.w + w) / 2);
        const dy = (p.y - y) / ((p.h + h) / 2);
        nearest = Math.min(nearest, Math.hypot(dx, dy));
      }
      const score = nearest + (y - minY) / 400;
      if (score > best.score) best = { x, y, score };
    }
    placed.push({ x: best.x, y: best.y, w, h, rotate: -10 + rand() * 20, z: 2 + Math.floor(best.y) });
  }
  return placed;
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
  const visible = useMemo(() => wishes.filter((wish) => !wish.completed), [wishes]);
  const ids = useMemo(() => visible.map((wish) => wish.id), [visible]);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [jolt, setJolt] = useState(false);
  const drag = useRef({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, dir: 0, lastShuffle: 0, moved: false, pointerId: -1 });
  const language = typeof document !== "undefined" ? (document.documentElement.dataset.lang as "vi" | "en" | "zh" | undefined) ?? "vi" : "vi";

  const layout = useMemo(() => layoutNotes(ids, shuffleSeed), [ids, shuffleSeed]);

  const shuffle = useCallback(() => {
    setShuffleSeed((s) => s + 1);
    setJolt(true);
    window.setTimeout(() => setJolt(false), 260);
    playSound("swipe");
  }, []);

  // Shake triggered from outside (e.g. random-draw button)
  useEffect(() => {
    if (externalShaking) shuffle();
  }, [externalShaking, shuffle]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, dir: 0, lastShuffle: 0, moved: false, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    setTilt({ x: Math.max(-40, Math.min(40, dx * 0.45)), y: Math.max(-28, Math.min(28, dy * 0.35)) });

    const stepX = e.clientX - d.lastX;
    const stepY = e.clientY - d.lastY;
    const main = Math.abs(stepX) >= Math.abs(stepY) ? stepX : stepY;
    if (Math.abs(main) > 4) {
      const dir = Math.sign(main);
      const now = performance.now();
      if (d.dir !== 0 && dir !== d.dir && now - d.lastShuffle > 170) {
        d.lastShuffle = now;
        shuffle();
      }
      d.dir = dir;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    }
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    setTilt({ x: 0, y: 0 });
    if (!d.moved && visible.length > 0) shuffle();
  };

  const sceneStyle = {
    "--jar-tx": `${tilt.x}px`,
    "--jar-ty": `${tilt.y}px`,
    "--jar-rot": `${tilt.x * 0.22}deg`,
  } as CSSProperties;

  return (
    <div
      className={cn("wish-jar-scene wish-jar-interactive", dragging && "is-dragging", jolt && "is-jolting")}
      style={sceneStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="img"
      aria-label={language === "zh" ? `装着 ${visible.length} 个等待中的愿望` : language === "en" ? `Jar holding ${visible.length} wishes waiting` : `Lọ chứa ${visible.length} điều ước đang chờ`}
    >
      <div className="wish-jar-body">
        <div className="wish-jar-neck" aria-hidden="true">
          <span className="wish-jar-ribbon" />
        </div>

        <div className="wish-jar-shell">
          <div className="wish-jar-glass-shine" aria-hidden="true" />
          <div className="wish-jar-glass-highlight" aria-hidden="true" />

          <div className="wish-jar-particles" aria-hidden="true">
            {jarParticles.map((particle, index) => (
              <span
                key={index}
                className="wish-jar-particle"
                style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size, animationDelay: particle.delay }}
              />
            ))}
          </div>

          <div className="wish-jar-safe-zone">
            {visible.map((wish, index) => {
              const category = labelOf(WISH_CATEGORIES, wish.category);
              const l = layout[index];
              if (!l) return null;
              const seed = hashSeed(wish.id);
              const style = {
                left: `${l.x}%`,
                top: `${l.y}%`,
                width: `${l.w}%`,
                height: `${l.h}%`,
                zIndex: l.z,
                "--note-rotate": `${l.rotate}deg`,
                "--note-delay": `${-((seed % 800) / 100)}s`,
                "--note-duration": `${5 + (seed % 400) / 100}s`,
                "--note-lag": `${(seed % 9) * 18}ms`,
              } as CSSProperties;
              return (
                <div key={wish.id} style={style} className={cn("jar-paper", NOTE_COLORS[seed % NOTE_COLORS.length])} title={wish.title}>
                  <div className="jar-paper-inner">
                    <span className="jar-paper-icon" aria-hidden="true">{category.emoji}</span>
                    <span className="jar-paper-title">{wish.title}</span>
                  </div>
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
