import { useEffect, useMemo, useState } from "react";
import { PartyPopper, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { playSound } from "@/lib/sound";

const LOVE_MILESTONES = [100, 200, 300, 365, 500, 730, 1000] as const;
const STREAK_MILESTONES = [10, 30, 100, 365, 500, 1000] as const;

type Celebration = { key: string; title: string; message: string };

export function MilestoneCelebration({ daysTogether, streak }: { daysTogether: number; streak: number }) {
  const celebration = useMemo<Celebration | null>(() => {
    if ((STREAK_MILESTONES as readonly number[]).includes(streak)) {
      return {
        key: `streak-${streak}`,
        title: `Chúc mừng chuỗi ${streak}!`,
        message: "Ngọn lửa của hai đứa vừa được nâng cấp rồi 🔥",
      };
    }
    if ((LOVE_MILESTONES as readonly number[]).includes(daysTogether)) {
      return {
        key: `love-${daysTogether}`,
        title: `${daysTogether} ngày bên nhau!`,
        message: "Thêm một dấu ấn thật đẹp của Thu Thủy và Duy Đức 💗",
      };
    }
    return null;
  }, [daysTogether, streak]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!celebration || typeof window === "undefined") return;
    const storageKey = `wish-jar-celebrated-${celebration.key}`;
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "true");
    setOpen(true);
    playSound("celebrate");
  }, [celebration]);

  if (!celebration) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="milestone-dialog w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-3xl border-primary/30 text-center">
        <div className="milestone-burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className="relative mx-auto grid size-20 place-items-center rounded-full bg-secondary">
          <PartyPopper className="size-10 text-primary" />
          <Sparkles className="absolute -right-2 -top-2 size-6 text-honey" />
        </div>
        <DialogTitle className="relative font-display text-2xl">{celebration.title}</DialogTitle>
        <DialogDescription className="relative">{celebration.message}</DialogDescription>
        <Button className="relative mt-2 w-full rounded-2xl" onClick={() => setOpen(false)}>
          Tuyệt quá!
        </Button>
      </DialogContent>
    </Dialog>
  );
}