import { useQuery } from "@tanstack/react-query";

import { computeStreak, fetchPresence, fetchStreakRestoreDays } from "./db";
import { todayKey } from "./constants";

/** Shared streak state for the top bar and Home. */
export function useStreak(memberCount: number) {
  const { data: presence = [] } = useQuery({ queryKey: ["presence"], queryFn: fetchPresence });
  const { data: restoreDays = [] } = useQuery({ queryKey: ["presence", "restores"], queryFn: fetchStreakRestoreDays });
  const restoredToday = restoreDays.includes(todayKey());
  const streak = computeStreak(presence, memberCount, restoredToday);
  const activeToday = new Set(presence.filter((p) => p.day === todayKey()).map((p) => p.member_id));
  return { ...streak, restoredToday, lit: streak.litToday || restoredToday, activeToday };
}
