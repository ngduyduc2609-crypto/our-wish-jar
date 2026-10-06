import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, MoreHorizontal, Pencil, Plus, Shuffle, Star, Trash2, MapPin } from "lucide-react";

import { useAppLanguage } from "@/lib/language";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MultiImagePicker } from "@/components/MultiImagePicker";
import { ImageGallery } from "@/components/ImageGallery";
import { ContentDetailDialog } from "@/components/ContentDetailDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ShuffleDrawDialog } from "@/components/RandomDraw";
import { Chip } from "@/components/Chip";
import { useIdentity } from "@/lib/identity";
import { canManage } from "@/lib/ownership";
import {
  deleteRow,
  fetchFoodComments,
  fetchFoodReactions,
  fetchFoods,
  imageAssets,
  insertEntityComment,
  insertRow,
  pickRandom,
  toggleEntityReaction,
  updateRow,
  type Food,
  type ImageAsset,
} from "@/lib/db";
import { PRICE_LEVELS, REACTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/food")({
  head: () => ({
    meta: [
      { title: "Hôm nay ăn gì? | Wish Jar" },
      {
        name: "description",
        content: "Danh sách quán ăn và món muốn thử của Thu Thủy và Duy Đức, có quay ngẫu nhiên.",
      },
      { property: "og:title", content: "Hôm nay ăn gì?" },
      {
        property: "og:description",
        content: "Danh sách quán ăn và món muốn thử của Thu Thủy và Duy Đức.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FoodPage,
});

function FoodPage() {
  const { me, members, track } = useIdentity();
  const language = useAppLanguage();
  const copy = {
    title: language === "vi" ? "Ăn gì đây ta" : language === "zh" ? "今天吃什么" : "What’s for food?",
    subtitle: language === "vi" ? "món trong danh sách" : language === "zh" ? "个在清单里" : "items in the list",
    tried: language === "vi" ? "món đã thử" : language === "zh" ? "个已尝试" : "tried items",
    all: language === "vi" ? "Tất cả" : language === "zh" ? "全部" : "All",
    triedTab: language === "vi" ? "Đã thử" : language === "zh" ? "已尝试" : "Tried",
    add: language === "vi" ? "Thêm món / quán" : language === "zh" ? "添加美食" : "Add place / dish",
    draw: language === "vi" ? "Quay" : language === "zh" ? "抽奖" : "Draw",
    update: language === "vi" ? "Cập nhật đánh giá" : language === "zh" ? "更新评价" : "Update rating",
    mark: language === "vi" ? "Đã ăn rồi" : language === "zh" ? "已吃过" : "Already tried",
    empty: language === "vi" ? "Chưa có món nào. Thêm món muốn thử nhé 🍜" : language === "zh" ? "还没有美食，添加一个想尝试的吧 🍜" : "No dishes yet. Add one you want to try 🍜",
    randomTitle: language === "vi" ? "Hôm nay mình ăn..." : language === "zh" ? "今天吃什么..." : "What should we eat today...",
    randomEmpty: language === "vi" ? "Danh sách món đang trống" : language === "zh" ? "清单里还没有内容" : "The list is empty",
    markEaten: language === "vi" ? "Đánh dấu đã ăn" : language === "zh" ? "标记已吃过" : "Mark as eaten",
    detailTried: language === "vi" ? "Đã thử" : language === "zh" ? "已尝试" : "Tried",
    detailList: language === "vi" ? "Trong danh sách" : language === "zh" ? "在清单中" : "In list",
  } as const;
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "tried">("all");
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawToken, setDrawToken] = useState(0);
  const [ratingTarget, setRatingTarget] = useState<Food | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [viewing, setViewing] = useState<Food | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);

  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: fetchFoods });
  const { data: foodReactions = [] } = useQuery({ queryKey: ["food-reactions"], queryFn: fetchFoodReactions });
  const { data: foodComments = [] } = useQuery({ queryKey: ["food-comments"], queryFn: fetchFoodComments });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["foods"] });
    void qc.invalidateQueries({ queryKey: ["food-reactions"] });
    void qc.invalidateQueries({ queryKey: ["food-comments"] });
    void qc.invalidateQueries({ queryKey: ["memories"] });
    void qc.invalidateQueries({ queryKey: ["log"] });
    void qc.invalidateQueries({ queryKey: ["presence"] });
  };

  const triedList = useMemo(() => foods.filter((f) => f.tried), [foods]);
  const visible = tab === "all" ? foods : triedList;

  function draw() {
    setDrawToken((t) => t + 1);
    setDrawOpen(true);
  }

  const remove = useMutation({
    mutationFn: async (food: Food) => {
      await deleteRow("foods", food.id);
      track("xoá món", food.name);
    },
    onSuccess: refresh,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">
            {foods.length} {copy.subtitle} · {triedList.length} {copy.tried}
          </p>
        </div>
        <Button className="shrink-0 rounded-full" onClick={draw} disabled={!foods.length}>
          <Shuffle className="size-4" /> {copy.draw}
        </Button>
      </div>

      <div className="flex gap-2">
        <Chip active={tab === "all"} onClick={() => setTab("all")}>
          {copy.all}
        </Chip>
        <Chip active={tab === "tried"} onClick={() => setTab("tried")}>
          {copy.triedTab}
        </Chip>
      </div>

      <Button
        className="w-full rounded-2xl"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus className="size-4" /> {copy.add}
      </Button>

      <FoodDialog open={formOpen} onOpenChange={setFormOpen} food={editing} onDone={refresh} />

      <div className="grid gap-3">
        {visible.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            reactions={foodReactions.filter((r) => r.food_id === food.id)}
            comments={foodComments.filter((c) => c.food_id === food.id)}
            memberName={(id: string | null) => members.find((m) => m.id === id)?.name ?? "Ai đó"}
            onChanged={refresh}
            onEdit={() => {
              setEditing(food);
              setFormOpen(true);
            }}
            onMarkTried={() => setRatingTarget(food)}
            onView={() => setViewing(food)}
          />
        ))}
        {visible.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            {copy.empty}
          </p>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name ?? "mục"}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          void remove.mutate(deleteTarget);
          setDeleteTarget(null);
        }}
      />

      <ShuffleDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title={copy.randomTitle}
        emoji="🍜"
        items={foods}
        drawToken={drawToken}
        getKey={(f) => f.id}
        againLabel={language === "vi" ? "Đổi món 🍜" : language === "zh" ? "换一道 🍜" : "Another dish 🍜"}
        emptyLabel={copy.randomEmpty}
        renderItem={(f) => (
          <div>
            <p className="font-display text-xl font-bold">{f.name}</p>
            {f.place ? <p className="mt-1 text-sm text-muted-foreground">📍 {f.place}</p> : null}
            {f.note ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{f.note}</p> : null}
          </div>
        )}
        actions={(f) => (
          <Button
            className="rounded-full"
            onClick={() => {
              setDrawOpen(false);
              setRatingTarget(f);
            }}
          >
            {copy.markEaten}
          </Button>
        )}
      />

      <TriedDialog food={ratingTarget} onClose={() => setRatingTarget(null)} onDone={refresh} />

      <ContentDetailDialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing?.tried ? copy.detailTried : copy.detailList}
        images={viewing ? imageAssets(viewing.images, viewing.image_url, viewing.image_pos) : []}
      >
        {viewing?.place && <p className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{viewing.place}</p>}
        {viewing?.address && <p className="text-muted-foreground">{viewing.address}</p>}
        {viewing && (
          <p>{PRICE_LEVELS.find((price) => price.value === viewing.price_level)?.label ?? "₫₫"}{viewing.rating ? ` · ${"⭐".repeat(viewing.rating)}` : ""}</p>
        )}
        {viewing?.note && <p className="whitespace-pre-wrap text-muted-foreground">{viewing.note}</p>}
      </ContentDetailDialog>
    </div>
  );
}

function FoodDialog({
  open,
  onOpenChange,
  food,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food: Food | null;
  onDone: () => void;
}) {
  const { me, track } = useIdentity();
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(2);
  const [note, setNote] = useState("");
  const [images, setImages] = useState<ImageAsset[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(food?.name ?? "");
    setPlace(food?.place ?? "");
    setAddress(food?.address ?? "");
    setPrice(food?.price_level ?? 2);
    setNote(food?.note ?? "");
    setImages(imageAssets(food?.images, food?.image_url, food?.image_pos));
  }, [open, food]);

  const save = useMutation({
    mutationFn: async () => {
      const values = {
        name: name.trim(),
        place: place.trim() || null,
        address: address.trim() || null,
        price_level: price,
        note: note.trim() || null,
        images,
        image_url: images[0]?.path ?? null,
        image_pos: images[0]?.position ?? "50% 50%",
      };
      if (food) {
        await updateRow("foods", food.id, values);
        track("sửa món ăn", values.name);
      } else {
        await insertRow("foods", { ...values, added_by: me?.id ?? null });
        track("thêm món ăn", values.name);
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      onDone();
      toast.success(food ? "Đã cập nhật 🍽️" : "Đã thêm vào danh sách ăn uống 🍽️");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{food ? "Sửa món" : "Món mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tên món / quán</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bún chả Hương Liên"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quán</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Địa chỉ</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mức giá</Label>
            <div className="flex gap-2">
              {PRICE_LEVELS.map((p) => (
                <Chip key={p.value} active={price === p.value} onClick={() => setPrice(p.value)}>
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <MultiImagePicker value={images} onChange={setImages} />
          <Button
            className="w-full rounded-2xl"
            disabled={!name.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {food ? "Lưu thay đổi" : "Lưu lại"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FoodCard({
  food,
  reactions,
  comments,
  memberName,
  onChanged,
  onEdit,
  onMarkTried,
  onView,
}: {
  food: Food;
  reactions: { id: string; emoji: string; member_id: string }[];
  comments: { id: string; member_id: string; content: string; created_at: string }[];
  memberName: (id: string | null) => string;
  onChanged: () => void;
  onEdit: () => void;
  onMarkTried: () => void;
  onView: () => void;
}) {
  const { me, track } = useIdentity();
  const language = useAppLanguage();
  const copy = {
    send: language === "zh" ? "发送" : language === "en" ? "Send" : "Gửi",
    commentPlaceholder: language === "zh" ? "说点什么..." : language === "en" ? "Say something..." : "Nhắn gì đó...",
    deleted: language === "zh" ? "已删除" : language === "en" ? "Deleted" : "Đã xoá",
  } as const;
  const [openComments, setOpenComments] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);
  const [hoveredReactionIndex, setHoveredReactionIndex] = useState<number | null>(null);
  const longPressRef = useRef<number | null>(null);
  const reactionBarRef = useRef<HTMLDivElement | null>(null);
  const mine = canManage(me, food.added_by);
  const reactionMeta = ["👍", "❤️", "😂", "😮", "😢", "😡"] as const;
  const myReaction = me ? reactions.find((r) => r.member_id === me.id) : null;
  const reactionCount = reactions.length;
  const noSelectStyle = { userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" } as const;

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "U";

  const clearLongPress = () => {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleReactionMove = (event: { clientX: number; currentTarget: HTMLDivElement }) => {
    if (!reactionBarRef.current) return;
    const rect = reactionBarRef.current.getBoundingClientRect();
    const offset = event.clientX - rect.left;
    const percent = Math.min(Math.max(offset / rect.width, 0), 1);
    const index = Math.min(reactionMeta.length - 1, Math.max(0, Math.floor(percent * reactionMeta.length)));
    setHoveredReactionIndex(index);
  };

  const handleReactionRelease = () => {
    if (hoveredReactionIndex !== null) {
      void react(reactionMeta[hoveredReactionIndex]);
    }
    setReactionOpen(false);
    setHoveredReactionIndex(null);
  };

  async function react(emoji: string) {
    if (!me) return;
    const added = await toggleEntityReaction("food", food.id, me.id, emoji);
    if (added) track("thả cảm xúc " + emoji, food.name);
    onChanged();
  }

  async function sendComment() {
    if (!me || !draft.trim()) return;
    await insertEntityComment("food", food.id, me.id, draft.trim());
    track("bình luận", food.name);
    setDraft("");
    onChanged();
  }

  async function remove() {
    await deleteRow("foods", food.id);
    track("xoá món", food.name);
    onChanged();
    toast.success(copy.deleted);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết ${food.name}`}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) {
          onView();
        }
      }}
      className="paper cursor-pointer overflow-hidden rounded-[28px]"
    >
      <ImageGallery images={imageAssets(food.images, food.image_url, food.image_pos)} alt={food.name} className="h-40 rounded-none" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">{food.name}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {food.place && <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {food.place}</span>}
              <span>· {PRICE_LEVELS.find((p) => p.value === food.price_level)?.label ?? "₫₫"}</span>
              {food.rating ? <span>· {"⭐".repeat(food.rating)}</span> : null}
              {food.tried && <span>· đã thử</span>}
            </p>
            {food.note && <p className="mt-1 text-sm text-muted-foreground">{food.note}</p>}
          </div>
          {mine && (
            <div className="flex shrink-0 flex-col gap-2">
              <button type="button" aria-label="Sửa món" onClick={onEdit} className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground">
                <Pencil className="size-4" />
              </button>
              <button type="button" aria-label="Xoá món" onClick={() => setDeleteTarget(food)} className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground">
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-muted/30 pt-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (me && !myReaction) {
                    void react("❤️");
                  }
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  if (window.matchMedia?.("(pointer: coarse)")?.matches) {
                    clearLongPress();
                    longPressRef.current = window.setTimeout(() => {
                      setReactionOpen(true);
                    }, 260);
                  }
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  clearLongPress();
                }}
                onPointerLeave={(event) => {
                  event.stopPropagation();
                  clearLongPress();
                }}
                onMouseEnter={() => setReactionOpen(true)}
                onMouseLeave={() => setReactionOpen(false)}
                style={noSelectStyle}
                className={cn(
                  "select-none rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ease-out active:scale-[0.98]",
                  myReaction ? "border-primary/40 bg-primary/5 text-primary" : "border-border bg-card/80 text-muted-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-sm">{myReaction ? myReaction.emoji : "🤍"}</span>
                  <span>{reactionCount}</span>
                </span>
              </button>

              {reactionOpen && (
                <div
                  ref={reactionBarRef}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerMove={handleReactionMove}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                    handleReactionRelease();
                  }}
                  onPointerLeave={(event) => {
                    event.stopPropagation();
                    handleReactionRelease();
                  }}
                  className="absolute bottom-full left-0 z-20 mb-2 flex items-center gap-1 rounded-full border border-border/40 bg-white/95 px-1.5 py-1 shadow-xl backdrop-blur-md dark:bg-card/95"
                >
                  {reactionMeta.map((emoji, index) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`Thả cảm xúc ${emoji}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void react(emoji);
                        setReactionOpen(false);
                      }}
                      onPointerEnter={() => setHoveredReactionIndex(index)}
                      onPointerMove={handleReactionMove}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        handleReactionRelease();
                      }}
                      style={noSelectStyle}
                      className={cn(
                        "select-none rounded-full p-1 text-lg transition-all duration-150 ease-out",
                        hoveredReactionIndex === index && "scale-150",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpenComments((v) => !v);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              style={noSelectStyle}
              className="select-none rounded-full border border-border bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-150 active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="size-3.5" />
                <span>{comments.length}</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMarkTried();
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              style={noSelectStyle}
              className="select-none rounded-full border border-border bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-150 active:scale-[0.98]"
            >
              {food.tried ? "Cập nhật" : "Đánh dấu"}
            </button>

            {mine && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Cài đặt"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  style={noSelectStyle}
                  className="select-none grid size-8 place-items-center rounded-full border border-border bg-card/80 text-muted-foreground transition-all duration-150 active:scale-[0.98]"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-32 rounded-2xl border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen(false);
                        onEdit();
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-secondary"
                    >
                      <Pencil className="size-3.5" /> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen(false);
                        setDeleteTarget(food);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-destructive hover:bg-secondary"
                    >
                      <Trash2 className="size-3.5" /> Xoá
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          itemName={deleteTarget?.name ?? "mục"}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={() => {
            if (!deleteTarget) return;
            void remove();
            setDeleteTarget(null);
          }}
        />

        {openComments && (
          <div className="mt-3 rounded-[22px] border border-border bg-secondary/40 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{language === "zh" ? "评论" : language === "en" ? "Comments" : "Bình luận"}</p>
              <span className="rounded-full bg-card/80 px-2 py-0.5 text-[11px] text-muted-foreground">{comments.length}</span>
            </div>
            <div className="max-h-56 space-y-2 overflow-auto pr-1">
              {comments.length === 0 ? (
                <p className="rounded-[18px] bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                  {language === "zh" ? "还没有评论" : language === "en" ? "No comments yet" : "Chưa có bình luận nào"}
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 rounded-[18px] bg-background/70 p-2">
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/25 to-secondary text-[10px] font-semibold text-foreground">
                      {initials(memberName(c.member_id))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground">{memberName(c.member_id)}</p>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={copy.commentPlaceholder} className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm outline-none" />
              <Button className="rounded-full" onClick={() => void sendComment()} disabled={!draft.trim()}>
                {copy.send}
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function TriedDialog({
  food,
  onClose,
  onDone,
}: {
  food: Food | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { track } = useIdentity();
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  const [images, setImages] = useState<ImageAsset[]>([]);

  const save = useMutation({
    mutationFn: async () => {
      if (!food) return;
      const finalImages = images.length ? images : imageAssets(food.images, food.image_url, food.image_pos);
      await updateRow("foods", food.id, {
        tried: true,
        tried_at: new Date().toISOString(),
        rating,
        note: note.trim() || food.note,
        images: finalImages,
        image_url: finalImages[0]?.path ?? null,
        image_pos: finalImages[0]?.position ?? "50% 50%",
      });
      track("ăn thử món", food.name);
    },
    onSuccess: () => {
      setNote("");
      setImages([]);
      setRating(5);
      onClose();
      onDone();
      toast.success("Đã lưu đánh giá món ăn 🍜");
    },
  });

  return (
    <Dialog open={!!food} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85svh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{food?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Chấm điểm</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="text-2xl">
                  {n <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Cảm nhận</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <MultiImagePicker value={images} onChange={setImages} />
          <Button
            className="w-full rounded-2xl"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            Lưu đánh giá
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
