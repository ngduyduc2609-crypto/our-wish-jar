import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

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
      { title: "Thống kê chúng mình | Wish Jar" },
      {
        name: "description",
        content: "Số điều ước, món đã ăn, hoạt động đã làm và các cột mốc ngày bên nhau.",
      },
      { property: "og:title", content: "Thống kê chúng mình" },
      {
        property: "og:description",
        content: "Số điều ước, món đã ăn, hoạt động đã làm và các cột mốc ngày bên nhau.",
      },
    ],
  }),
  component: StatsPage,
});

const MILESTONES = [100, 200, 300, 365, 500, 730, 1000];

function StatsPage() {
  const { members } = useIdentity();
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
    count: wishes.filter((w) => w.category === c.value).length,
    done: wishes.filter((w) => w.category === c.value && w.completed).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Thống kê</h1>
        <p className="text-sm text-muted-foreground">Nhìn lại hành trình của hai đứa</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Ngày bên nhau" value={days} emoji="💗" />
        <Stat label="Điều ước đã hoàn thành" value={wishes.filter((w) => w.completed).length} emoji="🫙" />
        <Stat label="Món đã ăn" value={foods.filter((f) => f.tried).length} emoji="🍜" />
        <Stat label="Hoạt động đã làm" value={activities.filter((a) => a.done).length} emoji="🎡" />
        <Stat label="Kỷ niệm đã lưu" value={memories.length} emoji="📸" />
        <Stat label="Chuỗi kỷ lục" value={`${streak.best} ngày`} emoji="🔥" />
      </div>

      <section className="paper rounded-3xl p-4">
        <h2 className="font-display text-lg font-semibold">Chuỗi ngày cùng nhau</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hiện tại: <span className="font-semibold text-foreground">{streak.current} ngày</span> · Kỷ
          lục: {streak.best} ngày. Chuỗi chỉ tăng khi cả hai cùng ghi gì đó trong ngày.
        </p>
      </section>

      <section className="paper rounded-3xl p-4">
        <h2 className="font-display text-lg font-semibold">Điều ước theo nhóm</h2>
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
            <p className="text-sm text-muted-foreground">Chưa có điều ước nào.</p>
          )}
        </div>
      </section>

      <section className="paper rounded-3xl p-4">
        <h2 className="font-display text-lg font-semibold">Cột mốc</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {MILESTONES.map((m) => (
            <li key={m} className="flex items-center justify-between">
              <span>{m} ngày bên nhau</span>
              <span className={days >= m ? "text-primary" : "text-muted-foreground"}>
                {days >= m ? "đã qua ✓" : `còn ${m - days} ngày`}
              </span>
            </li>
          ))}
        </ul>
        {nextMilestone && (
          <p className="mt-3 text-sm text-muted-foreground">
            Sắp tới là mốc {nextMilestone} ngày — chuẩn bị gì chưa nè? 🎉
          </p>
        )}
      </section>

      <section className="paper rounded-3xl p-4">
        <h2 className="font-display text-lg font-semibold">Ai đề xuất nhiều hơn</h2>
        <div className="mt-3 space-y-2 text-sm">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <span>
                {member.emoji} {member.name}
              </span>
              <span className="text-muted-foreground">
                {wishes.filter((w) => w.proposed_by === member.id).length} điều ước
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        {labelOf(WISH_CATEGORIES, "other").emoji} Mọi thứ đều được lưu tự động cho cả hai.
      </p>
    </div>
  );
}

function Stat({ label, value, emoji }: { label: string; value: number | string; emoji: string }) {
  return (
    <div className="paper rounded-3xl p-4">
      <p className="text-2xl">{emoji}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
