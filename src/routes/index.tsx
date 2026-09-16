import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Shuffle, Sparkles, Flame, BarChart3, ChevronRight } from "lucide-react";

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

  function drawWish() {
    setDraw(pickRandom(pending));
    setDrawOpen(true);
  }

  return (
    <div className="space-y-4">
      <section className="paper rounded-3xl p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Chúng mình đã bên nhau</p>
        <p className="font-display text-5xl font-bold text-primary">{days}</p>
        <p className="text-sm text-muted-foreground">ngày, kể từ 22/12/2025 💗</p>
      </section>

       <section className="paper overflow-hidden rounded-3xl px-5 pb-5 pt-4 text-center">
         <div className="wish-jar relative mx-auto h-64 max-w-sm" aria-label="Lọ chứa những điều ước đang chờ">
           <Sparkles className="absolute left-6 top-14 size-4 text-sky-400" aria-hidden="true" />
           <Sparkles className="absolute right-5 top-5 size-5 text-sky-300" aria-hidden="true" />
           <div className="absolute left-1/2 top-2 z-20 h-8 w-36 -translate-x-1/2 rounded-xl border border-sky-200 bg-gradient-to-b from-sky-100 to-sky-200 shadow-[0_4px_15px_rgba(56,189,248,.28)]" />
           <div className="wish-jar-glass absolute inset-x-5 bottom-0 top-7 overflow-hidden rounded-b-[3.5rem] rounded-t-3xl border-2 border-sky-200/80 bg-gradient-to-b from-sky-50/80 via-sky-100/55 to-sky-200/65 shadow-inner backdrop-blur-sm">
             <div className="absolute left-4 top-5 h-32 w-3 rounded-full bg-white/70" />
             <div className="absolute inset-x-8 bottom-2 h-6 rounded-full bg-sky-300/25 blur-md" />
            <div className="absolute inset-x-5 bottom-5 flex flex-wrap-reverse items-end justify-center gap-2">
              {pending.slice(0, 8).map((wish, index) => (
                <div
                  key={wish.id}
                   style={{ animationDelay: `${index * -0.7}s` }}
                   className={`wish-note max-w-28 rounded-md border border-white/80 px-2 py-1.5 text-[10px] font-medium leading-snug shadow-sm ${
                    index % 3 === 0
                       ? "bg-pink-100"
                      : index % 3 === 1
                         ? "bg-amber-100"
                         : "bg-sky-100"
                  }`}
                >
                   <span aria-hidden="true">{labelOf(WISH_CATEGORIES, wish.category).emoji} </span>
                   <span className="line-clamp-2 inline">{wish.title}</span>
                </div>
              ))}
              {pending.length === 0 && (
                <p className="mb-10 text-sm text-muted-foreground">Lọ đang chờ điều ước mới 💗</p>
              )}
            </div>
          </div>
        </div>
        <h2 className="mt-2 font-display text-xl font-bold">Lọ điều ước</h2>
        <p className="text-sm text-muted-foreground">
          {pending.length} điều ước đang chờ · {completed} đã thành hiện thực
        </p>
        <Button className="mt-3 rounded-full" onClick={drawWish} disabled={!pending.length}>
          <Sparkles className="size-4" /> Rút một điều ước
        </Button>
      </section>

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
          <span className="block font-display font-semibold">Thống kê chúng mình</span>
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
    </div>
  );
}
