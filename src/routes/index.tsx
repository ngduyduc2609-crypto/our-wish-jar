import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shuffle, Sparkles, BarChart3, ChevronRight, RotateCcw } from "lucide-react";

import { useAppLanguage } from "@/lib/language";

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
  const language = useAppLanguage();
  const copy = {
    together: language === "vi" ? "Chúng mình đã bên nhau" : language === "zh" ? "我们在一起已经" : "We’ve been together",
    jar: language === "vi" ? "Lọ điều ước" : language === "zh" ? "许愿罐" : "Wish Jar",
    waiting: language === "vi" ? "điều ước đang chờ" : language === "zh" ? "个愿望在等候" : "wishes waiting",
    completed: language === "vi" ? "đã thành hiện thực" : language === "zh" ? "已实现" : "already come true",
    draw: language === "vi" ? "Rút một điều ước" : language === "zh" ? "抽取一个愿望" : "Draw a wish",
    recent: language === "vi" ? "Kỷ niệm gần đây" : language === "zh" ? "最近的回忆" : "Recent memories",
    all: language === "vi" ? "Xem tất cả" : language === "zh" ? "查看全部" : "View all",
    empty: language === "vi" ? "Chưa có kỷ niệm nào, mình bắt đầu nhé 💞" : language === "zh" ? "还没有回忆，开始记录吧 💞" : "No memories yet, let’s start 💞",
    trace: language === "vi" ? "Dấu ấn" : language === "zh" ? "足迹" : "Trace",
    traceDesc: language === "vi" ? "Nhìn lại hành trình và các cột mốc" : language === "zh" ? "回顾旅程和里程碑" : "Look back at the journey and milestones",
    today: language === "vi" ? "Điều ước hôm nay" : language === "zh" ? "今日愿望" : "Today’s wish",
    openList: language === "vi" ? "Mở danh sách" : language === "zh" ? "打开列表" : "Open list",
    todayStatus: language === "vi" ? "Hôm nay đang chờ cả hai cùng ghé" : language === "zh" ? "今天还在等我们一起来了" : "Waiting for both of us to check in today",
    streak: language === "vi" ? "Chuỗi" : language === "zh" ? "连续" : "Streak",
    streakDays: language === "vi" ? "ngày cùng nhau" : language === "zh" ? "天在一起" : "days together",
    daysLabel: language === "vi" ? "ngày, kể từ 22/12/2025 💗" : language === "zh" ? "天，从 2025/12/22 开始 💗" : "days, since 22/12/2025 💗",
    restore: language === "vi" ? "Khôi phục chuỗi" : language === "zh" ? "恢复连击" : "Restore streak",
    restoreDone: language === "vi" ? "Đã hết lượt khôi phục tháng này." : language === "zh" ? "本月恢复次数已用完。" : "No restores left this month.",
    doneMarker: language === "vi" ? "✅ Đã ghé" : language === "zh" ? "✅ 已打卡" : "✅ Checked in",
    pendingMarker: language === "vi" ? "⏳ Đang chờ" : language === "zh" ? "⏳ 等待中" : "⏳ Waiting",
    needBoth: language === "vi" ? "Cần cả hai cùng hoạt động hôm nay để tiếp tục chuỗi!" : language === "zh" ? "今天需要两人都动起来才能继续连击！" : "Both of us need to be active today to keep the streak going!",
  } as const;
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
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{copy.together}</p>
        <p className="font-display text-5xl font-bold text-primary">{days}</p>
        <p className="text-sm text-muted-foreground">{days} {copy.daysLabel}</p>
      </section>

       <section className="paper section-lift overflow-hidden rounded-3xl px-4 pb-5 pt-3 text-center">
         <WishJarDisplay wishes={pending} />
        <h2 className="mt-2 font-display text-xl font-bold">{copy.jar}</h2>
        <p className="text-sm text-muted-foreground">
          {pending.length} {copy.waiting} · {completed} {copy.completed}
        </p>
        <Button className="mt-3 rounded-full" onClick={drawWish} disabled={!pending.length}>
          <Sparkles className="size-4" /> {copy.draw}
        </Button>
      </section>

      <section className="paper section-pop rounded-3xl p-4">
        <div className="flex items-center gap-4">
          <StreakFlame days={streak.current} lit={effectiveStreakLit} restored={restoreUsed} />
          <div className="flex-1">
            <p className="font-display text-lg font-semibold">
              {copy.streak} {streak.current} {copy.streakDays}
            </p>
            <p className="text-xs text-muted-foreground">
              {effectiveStreakLit ? `🔥 ${flameLevel.name}` : copy.todayStatus} · {language === "vi" ? `Kỷ lục ${streak.best} ngày` : language === "zh" ? `记录 ${streak.best} 天` : `Record ${streak.best} days`}
            </p>
            {nextStreakMilestone ? <p className="mt-1 text-[11px] text-primary">{language === "vi" ? `Còn ${nextStreakMilestone - streak.current} ngày để nâng cấp ngọn lửa` : language === "zh" ? `还差 ${nextStreakMilestone - streak.current} 天即可升级火焰` : `${nextStreakMilestone - streak.current} days left to level up the flame`}</p> : null}
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
                  {done ? copy.doneMarker : copy.pendingMarker}
                </span>
              </div>
            );
          })}
          <p className="pt-1 text-[11px] text-muted-foreground">{copy.needBoth}</p>
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
          <h2 className="font-display text-lg font-bold">{copy.recent}</h2>
          <Link to="/memories" className="text-xs text-primary">
            {copy.all}
          </Link>
        </div>
        {memories.length === 0 ? (
          <p className="paper rounded-3xl p-5 text-center text-sm text-muted-foreground">
            {copy.empty}
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
          <span className="block font-display font-semibold">{copy.trace}</span>
          <span className="block text-xs text-muted-foreground">{copy.traceDesc}</span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>

      <RandomDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title={copy.today}
        emoji="🫙"
        onDrawAgain={drawWish}
        result={
          draw ? (
            <div>
              <p className="font-display text-xl font-bold">{draw.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {labelOf(WISH_CATEGORIES, draw.category, language).label}
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
            <Shuffle className="size-4" /> {copy.openList}
          </Button>
        </Link>
      </RandomDrawDialog>
      <MilestoneCelebration daysTogether={days} streak={streak.current} />
    </div>
  );
}
