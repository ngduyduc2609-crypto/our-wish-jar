import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

const STREAK_LEVELS = [
  { min: 100, name: "Huyền thoại", className: "streak-flame-legendary" },
  { min: 30, name: "Rực rỡ", className: "streak-flame-bright" },
  { min: 10, name: "Ấm áp", className: "streak-flame-warm" },
  { min: 0, name: "Mới nhóm", className: "streak-flame-young" },
] as const;

export const STREAK_MILESTONES = [10, 30, 100, 365, 500, 1000] as const;

export function streakLevel(days: number) {
  return STREAK_LEVELS.find((level) => days >= level.min) ?? STREAK_LEVELS[STREAK_LEVELS.length - 1];
}

export function StreakFlame({
  days,
  lit,
  compact = false,
  className,
}: {
  days: number;
  lit: boolean;
  compact?: boolean;
  className?: string;
}) {
  const level = streakLevel(days);

  return (
    <span
      className={cn("streak-flame-wrap", compact ? "streak-flame-compact" : "streak-flame-large", className)}
      title={lit ? `Chuỗi ${days} ngày · ${level.name}` : "Hôm nay đang chờ cả hai cùng ghé"}
      aria-label={lit ? `Chuỗi ${days} ngày đang sáng, cấp ${level.name}` : `Chuỗi ${days} ngày, hôm nay chưa thắp sáng`}
    >
      <span className={cn("streak-flame", lit ? level.className : "streak-flame-cold")} aria-hidden="true">
        <Flame className="streak-flame-back" />
        <Flame className="streak-flame-front" />
        {lit && days >= 30 ? <span className="streak-flame-spark streak-flame-spark-one" /> : null}
        {lit && days >= 100 ? <span className="streak-flame-spark streak-flame-spark-two" /> : null}
      </span>
      <span className="streak-flame-count">{days}</span>
    </span>
  );
}