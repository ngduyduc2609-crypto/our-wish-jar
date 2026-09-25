import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

export function RandomDrawDialog({
  open,
  onOpenChange,
  title,
  emoji,
  result,
  onDrawAgain,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  emoji: string;
  result: ReactNode;
  onDrawAgain: () => void;
  children?: ReactNode;
}) {
  const [spinning, setSpinning] = useState(true);
  const language = useAppLanguage();
  const drawAgainLabel =
    language === "vi" ? "Rút lại 🎲" : language === "zh" ? "再抽一次 🎲" : "Draw again 🎲";
  const shakingLabel =
    language === "vi" ? "Đang lắc lọ..." : language === "zh" ? "正在摇罐..." : "Shaking the jar...";

  useEffect(() => {
    if (!open) return;
    setSpinning(true);
    const t = setTimeout(() => setSpinning(false), 900);
    return () => clearTimeout(t);
  }, [open, result]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-border bg-card text-center">
        <DialogTitle className="font-display text-lg">{title}</DialogTitle>
        <div
          className={cn(
            "mx-auto text-6xl transition-transform duration-500",
            spinning ? "animate-bounce" : "scale-110",
          )}
        >
          {emoji}
        </div>
        <div className={cn("min-h-16 transition-opacity", spinning ? "opacity-30" : "opacity-100")}>
          {spinning ? <p className="text-sm text-muted-foreground">{shakingLabel}</p> : result}
        </div>
        {!spinning && children}
        <Button variant="secondary" className="rounded-full" onClick={onDrawAgain}>
          {drawAgainLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
