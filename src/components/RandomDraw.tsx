import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

/**
 * Card-shuffle picker: items flick through one card, slow down and settle on a
 * random one. A new draw only happens when `drawToken` changes, so closing and
 * reopening never re-randomizes by itself.
 */
export function ShuffleDrawDialog<T>({
  open,
  onOpenChange,
  title,
  emoji,
  items,
  drawToken,
  getKey,
  renderItem,
  againLabel,
  emptyLabel,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  emoji: string;
  items: T[];
  drawToken: number;
  getKey: (item: T) => string;
  renderItem: (item: T, settled: boolean) => ReactNode;
  againLabel: string;
  emptyLabel: string;
  actions?: (item: T) => ReactNode;
}) {
  const [shown, setShown] = useState<T | null>(null);
  const [tick, setTick] = useState(0);
  const [settled, setSettled] = useState(false);
  const timers = useRef<number[]>([]);
  const lastKey = useRef<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const run = () => {
    clear();
    const list = itemsRef.current;
    if (list.length === 0) { setShown(null); setSettled(true); return; }
    const pool = list.length > 1 ? list.filter((i) => getKey(i) !== lastKey.current) : list;
    const final = pool[Math.floor(Math.random() * pool.length)]!;
    lastKey.current = getKey(final);
    setSettled(false);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const steps = reduced || list.length === 1 ? 0 : 9;
    let at = 0;
    let prev: T | null = null;
    for (let i = 0; i < steps; i += 1) {
      at += 80 + i * i * 4.5; // slower rotation, more deliberate spin and settle
      const others = list.filter((x) => x !== prev && x !== final);
      const pick = others.length ? others[Math.floor(Math.random() * others.length)]! : final;
      prev = pick;
      timers.current.push(window.setTimeout(() => { setShown(pick); setTick((t) => t + 1); playSound("tap-soft"); }, at));
    }
    at += steps ? 420 : 0;
    timers.current.push(window.setTimeout(() => { setShown(final); setTick((t) => t + 1); setSettled(true); playSound("sparkle"); }, at));
  };

  useEffect(() => {
    if (drawToken > 0) run();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawToken]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-border bg-card text-center">
        <DialogTitle className="font-display text-lg">{title}</DialogTitle>
        <div className="shuffle-stage">
          <span className={cn("shuffle-emoji", !settled && "is-busy")} aria-hidden="true">{emoji}</span>
          <div className="shuffle-deck" aria-live="polite">
            <span className="shuffle-card-back shuffle-card-back-two" aria-hidden="true" />
            <span className="shuffle-card-back" aria-hidden="true" />
            <div key={tick} className={cn("shuffle-card", settled ? "is-settled" : "is-flicking")}>
              {shown ? renderItem(shown, settled) : <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
            </div>
          </div>
        </div>
        <div className={cn("flex flex-col gap-2 transition-opacity duration-200", settled ? "opacity-100" : "pointer-events-none opacity-0")}>
          {shown && actions?.(shown)}
          {items.length > 0 && (
            <Button variant="outline" className="rounded-full" onClick={run}>
              {againLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
