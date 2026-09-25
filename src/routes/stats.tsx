import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ChevronLeft, Flame, Gift, Heart, ImageIcon, UtensilsCrossed } from "lucide-react";

import { useAppLanguage } from "@/lib/language";

import { useIdentity } from "@/lib/identity";
import {
  computeStreak,
  fetchActivities,
  fetchFoods,
  fetchMemories,
  fetchPresence,
  fetchWishes,
} from "@/lib/db";
import { WISH_CATEGORIES, daysTogether, labelOf } from "@/lib/constants";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Dấu ấn | Wish Jar" },
      {
        name: "description",
        content: "Số điều ước, món đã ăn, hoạt động đã làm và các cột mốc ngày bên nhau.",
      },
      { property: "og:title", content: "Dấu ấn" },
      {
        property: "og:description",
        content: "Số điều ước, món đã ăn, hoạt động đã làm và các cột mốc ngày bên nhau.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatsPage,
});

const MILESTONES = [100, 200, 300, 365, 500, 730, 1000];

function StatsPage() {
  const { members } = useIdentity();
  const language = useAppLanguage();
  const copy = {
    back: language === "zh" ? "返回首页" : language === "en" ? "Back to home" : "Quay lại trang Nhà",
    title: language === "zh" ? "足迹" : language === "en" ? "Trace" : "Dấu ấn",
    subtitle: language === "zh" ? "回顾两人的旅程" : language === "en" ? "Look back at our journey" : "Nhìn lại hành trình của hai đứa",
    stats: {
      days: language === "zh" ? "在一起的日子" : language === "en" ? "Days together" : "Ngày bên nhau",
      wishes: language === "zh" ? "已完成的愿望" : language === "en" ? "Wishes completed" : "Điều ước đã hoàn thành",
      foods: language === "zh" ? "已吃过的美食" : language === "en" ? "Foods tried" : "Món đã ăn",
      activities: language === "zh" ? "已完成的活动" : language === "en" ? "Activities done" : "Hoạt động đã làm",
      memories: language === "zh" ? "已保存的回忆" : language === "en" ? "Memories saved" : "Kỷ niệm đã lưu",
      streak: language === "zh" ? "最高连击" : language === "en" ? "Best streak" : "Chuỗi kỷ lục",
    },
    streakTitle: language === "zh" ? "一起的连击" : language === "en" ? "Streak together" : "Chuỗi ngày cùng nhau",
    streakDesc: language === "zh" ? "目前：" : language === "en" ? "Current: " : "Hiện tại: ",
    wishesByGroup: language === "zh" ? "按分组的愿望" : language === "en" ? "Wishes by group" : "Điều ước theo nhóm",
    noWishes: language === "zh" ? "还没有愿望。" : language === "en" ? "No wishes yet." : "Chưa có điều ước nào.",
    milestones: language === "zh" ? "里程碑" : language === "en" ? "Milestones" : "Cột mốc",
    proposer: language === "zh" ? "谁提议得更多" : language === "en" ? "Who proposes more" : "Ai đề xuất nhiều hơn",
    autoSaved: language === "zh" ? "所有内容都会自动保存给两个人。" : language === "en" ? "Everything is saved automatically for both of us." : "Mọi thứ đều được lưu tự động cho cả hai.",
  } as const;
  const { data: wishes = [] } = useQuery({ queryKey: ["wishes"], queryFn: fetchWishes });
  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: fetchFoods });
  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: fetchActivities });
  const { data: memories = [] } = useQuery({ queryKey: ["memories"], queryFn: fetchMemories });
  const { data: presence = [] } = useQuery({ queryKey: ["presence"], queryFn: fetchPresence });

  const streak = computeStreak(presence, members.length || 2);
  const days = daysTogether();
  const nextMilestone = MILESTONES.find((m) => m > days);

  const byCategory = WISH_CATEGORIES.map((c) => ({
    ...c,
    label: labelOf(WISH_CATEGORIES, c.value, language).label,
    emoji: labelOf(WISH_CATEGORIES, c.value, language).emoji,
    count: wishes.filter((w) => w.category === c.value).length,
    done: wishes.filter((w) => w.category === c.value && w.completed).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/" aria-label={copy.back} className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label={copy.stats.days} value={days} icon={<Heart className="size-4" />} />
        <Stat label={copy.stats.wishes} value={wishes.filter((w) => w.completed).length} icon={<Gift className="size-4" />} />
        <Stat label={copy.stats.foods} value={foods.filter((f) => f.tried).length} icon={<UtensilsCrossed className="size-4" />} />
        <Stat label={copy.stats.activities} value={activities.filter((a) => a.done).length} icon={<Activity className="size-4" />} />
        <Stat label={copy.stats.memories} value={memories.length} icon={<ImageIcon className="size-4" />} />
        <Stat label={copy.stats.streak} value={language === "zh" ? `${streak.best} 天` : language === "en" ? `${streak.best} days` : `${streak.best} ngày`} icon={<Flame className="size-4" />} />
      </div>

      <section className="paper rounded-3xl p-4">
        <h2 className="font-display text-lg font-semibold">{copy.streakTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.streakDesc}
          <span className="font-semibold text-foreground">{streak.current} {language === "zh" ? "天" : language === "en" ? "days" : "ngày"}</span> · {language === "zh" ? "最高记录" : language === "en" ? "Best" : "Kỷ lục"}: {streak.best} {language === "zh" ? "天" : language === "en" ? "days" : "ngày"}. {language === "zh" ? "只有双方都记录过当天，连击才会增加。" : language === "en" ? "The streak only increases when both of you log something on the same day." : "Chuỗi chỉ tăng khi cả hai cùng ghi gì đó trong ngày."}
        </p>
      </section>

      <section className="paper rounded-3xl p-4">
        <h2 className="font-display text-lg font-semibold">{copy.wishesByGroup}</h2>
        <div className="mt-3 space-y-2">
          {byCategory.map((c) => (
            <div key={c.value}>
              <div className="flex justify-between text-sm">
                <span>
                  {c.emoji} {c.label}
                </span>
                <span className="text-muted-foreground">
                  {c.done}/{c.count}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${c.count ? (c.done / c.count) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
          {byCategory.length === 0 && (
            <p className="text-sm text-muted-foreground">{copy.noWishes}</p>
          )}
        </div>
      </section>

      <section className="paper rounded-3xl p-4">
        <h2 className="font-display text-lg font-semibold">{copy.milestones}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {MILESTONES.map((m) => (
            <li key={m} className="flex items-center justify-between">
              <span>{m} {language === "zh" ? "天在一起" : language === "en" ? "days together" : "ngày bên nhau"}</span>
              <span className={days >= m ? "text-primary" : "text-muted-foreground"}>
                {days >= m ? (language === "zh" ? "已达成 ✓" : language === "en" ? "passed ✓" : "đã qua ✓") : (language === "zh" ? `还差 ${m - days} 天` : language === "en" ? `${m - days} days left` : `còn ${m - days} ngày`)}
              </span>
            </li>
          ))}
        </ul>
        {nextMilestone && (
          <p className="mt-3 text-sm text-muted-foreground">
            {language === "zh" ? `即将到来 ${nextMilestone} 天里程碑 — 还准备好了吗？ 🎉` : language === "en" ? `Next up is ${nextMilestone} days — ready for it? 🎉` : `Sắp tới là mốc ${nextMilestone} ngày — chuẩn bị gì chưa nè? 🎉`}
          </p>
        )}
      </section>

      <section className="paper rounded-3xl p-4">
        <h2 className="font-display text-lg font-semibold">{copy.proposer}</h2>
        <div className="mt-3 space-y-2 text-sm">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <span>
                {member.emoji} {member.name}
              </span>
              <span className="text-muted-foreground">
                {wishes.filter((w) => w.proposed_by === member.id).length} {language === "zh" ? "个愿望" : language === "en" ? "wishes" : "điều ước"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        {labelOf(WISH_CATEGORIES, "other").emoji} {copy.autoSaved}
      </p>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="paper rounded-3xl p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-primary/8 text-primary ring-1 ring-primary/10">
          {icon}
        </span>
      </div>
      <p className="font-display text-3xl font-black leading-none text-foreground">{value}</p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/85">{label}</p>
    </div>
  );
}
