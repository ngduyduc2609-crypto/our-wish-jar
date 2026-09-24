import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shuffle, Sparkles, BarChart3, ChevronRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RandomDrawDialog } from "@/components/RandomDraw";
import { StoredImage } from "@/components/StoredImage";
import { useIdentity } from "@/lib/identity";
import {
  computeStreak,
  fetchMemories,
  fetchPresence,
  fetchWishes,
  pickRandom,
  imageAssets,
  type Wish,
} from "@/lib/db";
import { WISH_CATEGORIES, daysTogether, formatDate, labelOf, todayKey } from "@/lib/constants";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { StreakFlame, STREAK_MILESTONES, streakLevel } from "@/components/StreakFlame";
import { WishJarDisplay } from "@/components/WishJarDisplay";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wish List của Thu Thủy và Duy Đức" },
      {
        name: "description",
        content:
          "Lọ điều ước của hai đứa: đếm ngày bên nhau, rút điều ước, món ăn, hoạt động và kỷ niệm.",
      },
      { property: "og:title", content: "Wish List của Thu Thủy và Duy Đức" },
      {
        property: "og:description",
        content:
          "Lọ điều ước của hai đứa: đếm ngày bên nhau, rút điều ước, món ăn, hoạt động và kỷ niệm.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { members } = useIdentity();
  const { data: wishes = [] } = useQuery({ queryKey: ["wishes"], queryFn: fetchWishes });
  const { data: memories = [] } = useQuery({ queryKey: ["memories"], queryFn: fetchMemories });
  const { data: presence = [] } = useQuery({ queryKey: ["presence"], queryFn: fetchPresence });

  const [drawOpen, setDrawOpen] = useState(false);
  const [draw, setDraw] = useState<Wish | null>(null);

  const days = daysTogether();
  const streak = computeStreak(presence, members.length || 2);
  const pending = useMemo(() => wishes.filter((w) => !w.completed), [wishes]);
  const completed = wishes.length - pending.length;
  const activeToday = new Set(presence.filter((entry) => entry.day === todayKey()).map((entry) => entry.member_id));
  const streakLit = members.length >= 2 && members.every((member) => activeToday.has(member.id));
  const nextStreakMilestone = STREAK_MILESTONES.find((milestone) => milestone > streak.current);
  const flameLevel = streakLevel(streak.current);
  const [restoresLeft, setRestoresLeft] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = Number(window.localStorage.getItem("wish-jar-streak-restores"));
    return Number.isFinite(saved) && saved >= 0 ? saved : 1;
  });
  const [restoreUsed, setRestoreUsed] = useState(false);
  const effectiveStreakLit = streakLit || restoreUsed;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wish-jar-streak-restores", String(restoresLeft));
    }
  }, [restoresLeft]);

  function drawWish() {
    setDraw(pickRandom(pending));
    setDrawOpen(true);
  }

  function restoreStreak() {
    if (restoresLeft <= 0) return;
    setRestoreUsed(true);
    setRestoresLeft((current) => Math.max(0, current - 1));
  }

  return (
    <div className="space-y-4">
      <section className="paper rounded-3xl p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Chúng mình đã bên nhau</p>
        <p className="font-display text-5xl font-bold text-primary">{days}</p>
        <p className="text-sm text-muted-foreground">ngày, kể từ 22/12/2025 💗</p>
      </section>

       <section className="paper section-lift overflow-hidden rounded-3xl px-4 pb-5 pt-3 text-center">
         <WishJarDisplay wishes={pending} />
        <h2 className="mt-2 font-display text-xl font-bold">Lọ điều ước</h2>
        <p className="text-sm text-muted-foreground">
          {pending.length} điều ước đang chờ · {completed} đã thành hiện thực
        </p>
        <Button className="mt-3 rounded-full" onClick={drawWish} disabled={!pending.length}>
          <Sparkles className="size-4" /> Rút một điều ước
        </Button>
      </section>

      <section className="paper section-pop rounded-3xl p-4">
        <div className="flex items-center gap-4">
          <StreakFlame days={streak.current} lit={effectiveStreakLit} restored={restoreUsed} />
          <div className="flex-1">
            <p className="font-display text-lg font-semibold">
              Chuỗi {streak.current} ngày cùng nhau
            </p>
            <p className="text-xs text-muted-foreground">
              {effectiveStreakLit ? `Đang cháy · ${flameLevel.name}` : "Hôm nay đang chờ cả hai cùng ghé"} · Kỷ lục {streak.best} ngày
            </p>
            {nextStreakMilestone ? <p className="mt-1 text-[11px] text-primary">Còn {nextStreakMilestone - streak.current} ngày để nâng cấp ngọn lửa</p> : null}
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-2xl border border-border/80 bg-secondary/40 p-3">
          {members.map((member) => {
            const done = activeToday.has(member.id);
            return (
              <div key={member.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-2">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-card text-base">{member.emoji}</span>
                  <span className="font-medium text-foreground">{member.name}</span>
                </span>
                <span className={done ? "text-emerald-600" : "text-muted-foreground"}>
                  {done ? "✅ Đã ghé" : "⏳ Đang chờ"}
                </span>
              </div>
            );
          })}
          <p className="pt-1 text-[11px] text-muted-foreground">Cần cả hai cùng hoạt động hôm nay để tiếp tục chuỗi!</p>
        </div>

        {restoresLeft > 0 ? (
          <Button
            variant="outline"
            className="mt-3 rounded-full"
            onClick={restoreStreak}
            disabled={effectiveStreakLit}
          >
            <RotateCcw className="size-4" /> Khôi phục chuỗi ({restoresLeft})
          </Button>
        ) : (
          <p className="mt-3 text-[11px] text-muted-foreground">Đã hết lượt khôi phục tháng này.</p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Kỷ niệm gần đây</h2>
          <Link to="/memories" className="text-xs text-primary">
            Xem tất cả
          </Link>
        </div>
        {memories.length === 0 ? (
          <p className="paper rounded-3xl p-5 text-center text-sm text-muted-foreground">
            Chưa có kỷ niệm nào, mình bắt đầu nhé 💞
          </p>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {memories.slice(0, 6).map((memory) => {
              const cover = imageAssets(memory.images, memory.image_url, memory.image_pos)[0];
              return (
              <article key={memory.id} className="paper w-40 shrink-0 overflow-hidden rounded-3xl">
                {cover ? (
                  <StoredImage
                    path={cover.path}
                    alt={memory.title}
                    position={cover.position}
                    className="h-24 w-full"
                  />
                ) : (
                  <div className="grid h-24 w-full place-items-center bg-secondary text-2xl">💗</div>
                )}
                <div className="p-3">
                  <p className="line-clamp-2 font-display text-sm font-semibold">{memory.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(memory.happened_on)}
                  </p>
                </div>
              </article>
            );})}
          </div>
        )}
      </section>

      <Link to="/stats" className="paper flex items-center gap-3 rounded-3xl p-4 transition-colors hover:bg-accent">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-primary">
          <BarChart3 className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display font-semibold">Dấu ấn</span>
          <span className="block text-xs text-muted-foreground">Nhìn lại hành trình và các cột mốc</span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>

      <RandomDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title="Điều ước hôm nay"
        emoji="🫙"
        onDrawAgain={drawWish}
        result={
          draw ? (
            <div>
              <p className="font-display text-xl font-bold">{draw.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {labelOf(WISH_CATEGORIES, draw.category).label}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Danh sách còn trống</p>
          )
        }
      >
        <Link
          to="/wishes"
          onClick={() => setDrawOpen(false)}
        >
          <Button variant="outline" className="rounded-full">
            <Shuffle className="size-4" /> Mở danh sách
          </Button>
        </Link>
      </RandomDrawDialog>
      <MilestoneCelebration daysTogether={days} streak={streak.current} />
    </div>
  );
}
