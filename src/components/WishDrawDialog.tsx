import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Wish } from "@/lib/db";
import { DIFFICULTIES, WISH_CATEGORIES, labelOf } from "@/lib/constants";
import { useAppLanguage } from "@/lib/language";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

type Phase = "shake" | "pull" | "open";
const PAPER_TONES = ["wish-note-rose", "wish-note-honey", "wish-note-sky", "wish-note-sage", "wish-note-lavender"];

/**
 * "Pull a paper from the jar": the jar wobbles, one folded slip rises out,
 * floats to the middle and unfolds into the wish. ~1.3s total.
 * A new draw runs each time the dialog opens or "try another" is pressed.
 */
export function WishDrawDialog({
  open,
  onOpenChange,
  wishes,
  showOpenList = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishes: Wish[];
  showOpenList?: boolean;
}) {
  const language = useAppLanguage();
  const [wish, setWish] = useState<Wish | null>(null);
  const [phase, setPhase] = useState<Phase>("shake");
  const [round, setRound] = useState(0);
  const [paperTone, setPaperTone] = useState<string>(PAPER_TONES[0]);
  const timers = useRef<number[]>([]);
  const lastId = useRef<string | null>(null);

  const t = {
    title: language === "vi" ? "Điều ước hôm nay là..." : language === "zh" ? "今日愿望是..." : "Today’s wish is...",
    again: language === "vi" ? "Thử điều ước khác 📜" : language === "zh" ? "换一个愿望 📜" : "Try another wish 📜",
    list: language === "vi" ? "Mở danh sách" : language === "zh" ? "打开清单" : "Open the list",
    empty: language === "vi" ? "Lọ đang trống rồi" : language === "zh" ? "许愿罐还空着" : "The jar is empty",
  };

  const clear = () => { timers.current.forEach((x) => window.clearTimeout(x)); timers.current = []; };

  const draw = () => {
    clear();
    if (wishes.length === 0) { setWish(null); setPhase("open"); return; }
    const pool = wishes.length > 1 ? wishes.filter((w) => w.id !== lastId.current) : wishes;
    const next = pool[Math.floor(Math.random() * pool.length)]!;
    lastId.current = next.id;
    setWish(next);
    setPaperTone(PAPER_TONES[Math.floor(Math.random() * PAPER_TONES.length)]!);
    setRound((r) => r + 1);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setPhase("open"); return; }
    setPhase("shake");
    playSound("swipe");
    timers.current.push(window.setTimeout(() => { setPhase("pull"); playSound("open"); }, 520));
    timers.current.push(window.setTimeout(() => { setPhase("open"); playSound("add"); }, 1050));
  };

  // Draw once per opening; closing keeps the current result untouched.
  useEffect(() => {
    if (open) draw();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const category = wish ? labelOf(WISH_CATEGORIES, wish.category, language) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-border bg-card text-center">
        <DialogTitle className="font-display text-lg">{t.title}</DialogTitle>

        <div className={cn("draw-stage", `is-${phase}`)} key={round}>
          <div className="draw-jar" aria-hidden="true">
            <span className="draw-jar-lid" />
            <span className="draw-jar-body">
              <i className="draw-jar-slip wish-note-rose" style={{ left: "18%", bottom: "14%", rotate: "-12deg" }} />
              <i className="draw-jar-slip wish-note-honey" style={{ left: "46%", bottom: "10%", rotate: "8deg" }} />
              <i className="draw-jar-slip wish-note-sky" style={{ left: "30%", bottom: "34%", rotate: "16deg" }} />
              <i className="draw-jar-slip wish-note-sage" style={{ left: "54%", bottom: "32%", rotate: "-6deg" }} />
            </span>
          </div>

          <div className={cn("draw-paper", paperTone)}>
            <div className="draw-paper-folded" aria-hidden="true">📜</div>
            <div className="draw-paper-content">
              {wish && category ? (
                <>
                  <span className="text-2xl" aria-hidden="true">{category.emoji}</span>
                  <p className="mt-1 font-display text-lg font-bold leading-snug">{wish.title}</p>
                  <p className="mt-1 text-xs opacity-75">
                    {category.label} · {labelOf(DIFFICULTIES, wish.difficulty, language).label}
                  </p>
                </>
              ) : (
                <p className="text-sm">{t.empty}</p>
              )}
            </div>
          </div>
        </div>

        <div className={cn("flex flex-col gap-2 transition-opacity duration-200", phase === "open" ? "opacity-100" : "pointer-events-none opacity-0")}>
          {showOpenList && (
            <Link to="/wishes" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="w-full rounded-full">
                <ListChecks className="size-4" /> {t.list}
              </Button>
            </Link>
          )}
          {wishes.length > 0 && (
            <Button className="rounded-full" onClick={draw}>
              {t.again}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
