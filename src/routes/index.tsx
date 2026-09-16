import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shuffle, Sparkles, UtensilsCrossed, MapPinned, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RandomDrawDialog } from "@/components/RandomDraw";
import { StoredImage } from "@/components/StoredImage";
import { useIdentity } from "@/lib/identity";
import {
  computeStreak,
  fetchActivities,
  fetchFoods,
  fetchLog,
  fetchMemories,
  fetchPresence,
  fetchWishes,
  pickRandom,
  type Activity,
  type Food,
  type Wish,
} from "@/lib/db";
import { WISH_CATEGORIES, daysTogether, formatDate, labelOf } from "@/lib/constants";

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
    ],
  }),
  component: HomePage,
});

type Draw =
  | { kind: "wish"; item: Wish | null }
  | { kind: "food"; item: Food | null }
  | { kind: "activity"; item: Activity | null };

function HomePage() {
  const { members } = useIdentity();
  const { data: wishes = [] } = useQuery({ queryKey: ["wishes"], queryFn: fetchWishes });
  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: fetchFoods });
  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: fetchActivities });
  const { data: memories = [] } = useQuery({ queryKey: ["memories"], queryFn: fetchMemories });
  const { data: log = [] } = useQuery({ queryKey: ["log"], queryFn: fetchLog });
  const { data: presence = [] } = useQuery({ queryKey: ["presence"], queryFn: fetchPresence });

  const [drawOpen, setDrawOpen] = useState(false);
  const [draw, setDraw] = useState<Draw | null>(null);

  const days = daysTogether();
  const streak = computeStreak(presence, members.length || 2);
  const pending = useMemo(() => wishes.filter((w) => !w.completed), [wishes]);
  const completed = wishes.length - pending.length;

  function drawWish() {
    setDraw({ kind: "wish", item: pickRandom(pending) });
    setDrawOpen(true);
  }
  function drawFood() {
    setDraw({ kind: "food", item: pickRandom(foods) });
    setDrawOpen(true);
  }
  function drawActivity() {
    setDraw({ kind: "activity", item: pickRandom(activities) });
    setDrawOpen(true);
  }

  function redraw() {
    if (draw?.kind === "food") drawFood();
    else if (draw?.kind === "activity") drawActivity();
    else drawWish();
  }

  const drawMeta =
    draw?.kind === "food"
      ? { title: "Hôm nay ăn gì?", emoji: "🍜" }
      : draw?.kind === "activity"
        ? { title: "Hôm nay làm gì?", emoji: "🎡" }
        : { title: "Điều ước hôm nay", emoji: "🫙" };

  return (
    <div className="space-y-4">
      <section className="paper rounded-3xl p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Chúng mình đã bên nhau</p>
        <p className="font-display text-5xl font-bold text-primary">{days}</p>
        <p className="text-sm text-muted-foreground">ngày, kể từ 22/12/2025 💗</p>
      </section>

      <section className="paper rounded-3xl p-5 text-center">
        <p className="text-5xl">🫙</p>
        <h2 className="mt-1 font-display text-xl font-bold">Lọ điều ước</h2>
        <p className="text-sm text-muted-foreground">
          {pending.length} điều ước đang chờ · {completed} đã thành hiện thực
        </p>
        <Button className="mt-3 rounded-full" onClick={drawWish} disabled={!pending.length}>
          <Sparkles className="size-4" /> Rút một điều ước
        </Button>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={drawFood}
          disabled={!foods.length}
          className="paper rounded-3xl p-4 text-left disabled:opacity-60"
        >
          <UtensilsCrossed className="size-5 text-primary" />
          <p className="mt-2 font-display font-semibold">Hôm nay ăn gì?</p>
          <p className="text-xs text-muted-foreground">{foods.length} món trong danh sách</p>
        </button>
        <button
          type="button"
          onClick={drawActivity}
          disabled={!activities.length}
          className="paper rounded-3xl p-4 text-left disabled:opacity-60"
        >
          <MapPinned className="size-5 text-primary" />
          <p className="mt-2 font-display font-semibold">Hôm nay làm gì?</p>
          <p className="text-xs text-muted-foreground">{activities.length} ý tưởng</p>
        </button>
      </div>

      <section className="paper flex items-center gap-4 rounded-3xl p-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary">
          <Flame className="size-6 text-primary" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold">
            Chuỗi {streak.current} ngày cùng nhau
          </p>
          <p className="text-xs text-muted-foreground">
            Kỷ lục {streak.best} ngày · chỉ tăng khi cả hai cùng ghé vào
          </p>
        </div>
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
            {memories.slice(0, 6).map((memory) => (
              <article key={memory.id} className="paper w-40 shrink-0 overflow-hidden rounded-3xl">
                {memory.image_url ? (
                  <StoredImage
                    path={memory.image_url}
                    alt={memory.title}
                    position={memory.image_pos}
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
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Hai đứa vừa làm gì</h2>
        <div className="paper space-y-2 rounded-3xl p-4">
          {log.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">Chưa có hoạt động nào</p>
          )}
          {log.slice(0, 8).map((entry) => (
            <div key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
              <p className="min-w-0">
                <span className="font-medium">
                  {members.find((m) => m.id === entry.member_id)?.name ?? "Ai đó"}
                </span>{" "}
                <span className="text-muted-foreground">{entry.action}</span>{" "}
                {entry.subject && <span className="text-muted-foreground">“{entry.subject}”</span>}
              </p>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatDate(entry.created_at)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <RandomDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title={drawMeta.title}
        emoji={drawMeta.emoji}
        onDrawAgain={redraw}
        result={
          draw?.item ? (
            <div>
              <p className="font-display text-xl font-bold">
                {"title" in draw.item ? draw.item.title : draw.item.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {draw.kind === "wish"
                  ? labelOf(WISH_CATEGORIES, (draw.item as Wish).category).label
                  : ((draw.item as Food | Activity).place ?? "Chưa ghi địa điểm")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Danh sách còn trống</p>
          )
        }
      >
        <Link
          to={draw?.kind === "food" ? "/food" : draw?.kind === "activity" ? "/activities" : "/wishes"}
          onClick={() => setDrawOpen(false)}
        >
          <Button variant="outline" className="rounded-full">
            <Shuffle className="size-4" /> Mở danh sách
          </Button>
        </Link>
      </RandomDrawDialog>
    </div>
  );
}
