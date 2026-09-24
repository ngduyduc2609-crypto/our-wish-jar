import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageCircle, Check, Trash2, Shuffle, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/Chip";
import { RandomDrawDialog } from "@/components/RandomDraw";
import { MultiImagePicker } from "@/components/MultiImagePicker";
import { ImageGallery } from "@/components/ImageGallery";
import { useIdentity } from "@/lib/identity";
import { canManage } from "@/lib/ownership";
import {
  deleteRow,
  fetchComments,
  fetchReactions,
  fetchWishes,
  insertRow,
  toggleReaction,
  updateRow,
  pickRandom,
  type Wish,
  type ImageAsset,
} from "@/lib/db";
import {
  DIFFICULTIES,
  REACTIONS,
  WISH_CATEGORIES,
  formatDate,
  labelOf,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wishes")({
  head: () => ({
    meta: [
      { title: "Điều ước của chúng mình | Wish Jar" },
      {
        name: "description",
        content: "Danh sách điều ước của Thu Thủy và Duy Đức, có thả cảm xúc và bình luận.",
      },
      { property: "og:title", content: "Điều ước của chúng mình" },
      {
        property: "og:description",
        content: "Danh sách điều ước của Thu Thủy và Duy Đức, có thả cảm xúc và bình luận.",
      },
    ],
  }),
  component: WishesPage,
});

function WishesPage() {
  const { me, members, track } = useIdentity();
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("all");
  const [showDone, setShowDone] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawn, setDrawn] = useState<Wish | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Wish | null>(null);

  const { data: wishes = [] } = useQuery({ queryKey: ["wishes"], queryFn: fetchWishes });
  const { data: reactions = [] } = useQuery({ queryKey: ["reactions"], queryFn: fetchReactions });
  const { data: comments = [] } = useQuery({ queryKey: ["comments"], queryFn: fetchComments });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["wishes"] });
    void qc.invalidateQueries({ queryKey: ["reactions"] });
    void qc.invalidateQueries({ queryKey: ["comments"] });
    void qc.invalidateQueries({ queryKey: ["log"] });
    void qc.invalidateQueries({ queryKey: ["presence"] });
  };

  const visible = useMemo(
    () =>
      wishes.filter(
        (w) => w.completed === showDone && (category === "all" || w.category === category),
      ),
    [wishes, showDone, category],
  );

  const pending = wishes.filter((w) => !w.completed);

  function draw() {
    const next = pickRandom(pending, drawn ?? undefined);
    setDrawn(next);
    setDrawOpen(true);
  }

  const completeWish = useMutation({
    mutationFn: async (wish: Wish) => {
      await updateRow("wishes", wish.id, {
        completed: !wish.completed,
        completed_at: wish.completed ? null : new Date().toISOString(),
      });
      track(wish.completed ? "mở lại điều ước" : "hoàn thành điều ước", wish.title);
    },
    onSuccess: (_d, wish) => {
      refresh();
      toast.success(wish.completed ? "Đã mở lại điều ước" : "Điều ước đã hoàn thành 🎉");
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">Lọ điều ước</h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} điều còn chờ · {wishes.length - pending.length} đã xong
          </p>
        </div>
        <Button
          variant="secondary"
          className="wish-card-pill shrink-0 border border-white/70 bg-white/70 px-4 py-2 shadow-[0_10px_18px_-10px_rgba(15,23,42,0.18)]"
          onClick={draw}
          disabled={!pending.length}
        >
          <Shuffle className="size-4" /> Rút
        </Button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          Tất cả
        </Chip>
        {WISH_CATEGORIES.map((c) => (
          <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2">
        <Chip active={!showDone} onClick={() => setShowDone(false)}>
          Đang chờ
        </Chip>
        <Chip active={showDone} onClick={() => setShowDone(true)}>
          Đã hoàn thành
        </Chip>
      </div>

      <Button
        className="wish-card-pill w-full border border-white/80 bg-primary text-primary-foreground shadow-[0_12px_22px_-10px_rgba(146,116,180,0.34)]"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus className="size-4" /> Thêm điều ước
      </Button>

      <WishDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        wish={editing}
        onDone={refresh}
      />

      <div className="space-y-3">
        {visible.map((wish) => (
          <WishCard
            key={wish.id}
            wish={wish}
            reactions={reactions.filter((r) => r.wish_id === wish.id)}
            comments={comments.filter((c) => c.wish_id === wish.id)}
            memberName={(id: string | null) => members.find((m) => m.id === id)?.name ?? "Ai đó"}
            onChanged={refresh}
            onEdit={() => {
              setEditing(wish);
              setFormOpen(true);
            }}
            onToggleComplete={() => completeWish.mutate(wish)}
          />
        ))}
        {visible.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            Chưa có điều ước nào ở đây. Thêm một điều đi nào ✨
          </p>
        )}
      </div>

      <RandomDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title="Điều ước hôm nay là..."
        emoji="🫙"
        onDrawAgain={draw}
        result={
          drawn ? (
            <div>
              <p className="font-display text-xl font-bold">{drawn.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {labelOf(WISH_CATEGORIES, drawn.category).label} ·{" "}
                {labelOf(DIFFICULTIES, drawn.difficulty).label}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Lọ đang trống rồi</p>
          )
        }
      />
    </div>
  );
}

function WishDialog({
  open,
  onOpenChange,
  wish,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wish: Wish | null;
  onDone: () => void;
}) {
  const { me, track } = useIdentity();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<string>("experience");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [deadline, setDeadline] = useState("");
  const [images, setImages] = useState<ImageAsset[]>([]);

  useEffect(() => {
    if (!open) return;
    setTitle(wish?.title ?? "");
    setNote(wish?.note ?? "");
    setCategory(wish?.category ?? "experience");
    setDifficulty(wish?.difficulty ?? "medium");
    setDeadline(wish?.deadline ?? "");
    setImages(wish?.images ?? []);
  }, [open, wish]);

  const save = useMutation({
    mutationFn: async () => {
      try {
        const values = {
          title: title.trim(),
          note: note.trim() || null,
          category,
          difficulty,
          deadline: deadline || null,
          images,
        };
        if (wish) {
          await updateRow("wishes", wish.id, values);
          track("sửa điều ước", values.title);
        } else {
          await insertRow("wishes", { ...values, proposed_by: me?.id ?? null });
          track("thêm điều ước", values.title);
        }
      } catch (error) {
        console.error("Insert wish error:", error);
        const reason = error instanceof Error ? error.message : "Không rõ nguyên nhân";
        toast.error(`Không thể lưu điều ước: ${reason}`);
        throw error;
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      onDone();
      toast.success(wish ? "Đã cập nhật điều ước ✨" : "Đã bỏ vào lọ điều ước 🫙");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {wish ? "Sửa điều ước" : "Điều ước mới"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Mình muốn...</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Đi Đà Lạt ngắm thông"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Nhóm</Label>
            <div className="flex flex-wrap gap-2">
              {WISH_CATEGORIES.map((c) => (
                <Chip
                  key={c.value}
                  active={category === c.value}
                  onClick={() => setCategory(c.value)}
                >
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Độ khó</Label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <Chip
                  key={d.value}
                  active={difficulty === d.value}
                  onClick={() => setDifficulty(d.value)}
                >
                  {d.emoji} {d.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mong hoàn thành trước</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <MultiImagePicker value={images} onChange={setImages} />
          <Button
            className="w-full rounded-2xl"
            disabled={!title.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {wish ? "Lưu thay đổi" : "Bỏ vào lọ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WishCard({
  wish,
  reactions,
  comments,
  memberName,
  onChanged,
  onEdit,
  onToggleComplete,
}: {
  wish: Wish;
  reactions: { id: string; emoji: string; member_id: string }[];
  comments: { id: string; member_id: string; content: string; created_at: string }[];
  memberName: (id: string | null) => string;
  onChanged: () => void;
  onEdit: () => void;
  onToggleComplete: () => void;
}) {
  const { me, track } = useIdentity();
  const [openComments, setOpenComments] = useState(false);
  const [draft, setDraft] = useState("");
  const category = labelOf(WISH_CATEGORIES, wish.category);
  const difficulty = labelOf(DIFFICULTIES, wish.difficulty);
  const mine = canManage(me, wish.proposed_by);

  async function react(emoji: string) {
    if (!me) return;
    const added = await toggleReaction(wish.id, me.id, emoji);
    if (added) track("thả cảm xúc " + emoji, wish.title);
    onChanged();
  }

  async function sendComment() {
    if (!me || !draft.trim()) return;
    await insertRow("wish_comments", {
      wish_id: wish.id,
      member_id: me.id,
      content: draft.trim(),
    });
    track("bình luận", wish.title);
    setDraft("");
    onChanged();
  }

  async function remove() {
    await deleteRow("wishes", wish.id);
    track("xoá điều ước", wish.title);
    onChanged();
    toast.success("Đã xoá");
  }

  return (
    <article className="wish-card-soft overflow-hidden">
      <ImageGallery images={wish.images ?? []} alt={wish.title} />
      <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="secondary" className="rounded-full">
              {category.emoji} {category.label}
            </Badge>
            <span>
              {difficulty.emoji} {difficulty.label}
            </span>
            {wish.deadline && <span>· trước {formatDate(wish.deadline)}</span>}
          </div>
          <h2
            className={cn(
              "mt-1.5 font-display text-lg font-semibold",
              wish.completed && "line-through opacity-60",
            )}
          >
            {wish.title}
          </h2>
          {wish.note && <p className="mt-1 text-sm text-muted-foreground">{wish.note}</p>}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {memberName(wish.proposed_by)} đề xuất
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleComplete}
          aria-label="Đánh dấu hoàn thành"
          className={cn(
            "wish-card-button grid size-9 shrink-0 place-items-center border transition-colors",
            wish.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/80",
          )}
        >
          <Check className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {REACTIONS.map((emoji) => {
          const list = reactions.filter((r) => r.emoji === emoji);
          const reacted = me ? list.some((r) => r.member_id === me.id) : false;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => void react(emoji)}
              className={cn(
                "wish-card-button border px-2.5 py-1 text-xs transition-colors",
                reacted ? "border-primary bg-accent shadow-[0_8px_18px_-10px_rgba(146,116,180,0.32)]" : "border-border bg-card/80",
              )}
            >
              {emoji} {list.length > 0 && list.length}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpenComments((v) => !v)}
          className="wish-card-button ml-auto flex items-center gap-1 border border-border bg-card/80 px-2.5 py-1 text-xs text-muted-foreground"
        >
          <MessageCircle className="size-3.5" /> {comments.length}
        </button>
        {mine && (
          <>
            <button
              type="button"
              onClick={onEdit}
              aria-label="Sửa điều ước"
              className="wish-card-button border border-border bg-card/80 px-2 py-1 text-muted-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              aria-label="Xoá điều ước"
              className="wish-card-button border border-border bg-card/80 px-2 py-1 text-muted-foreground"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        )}
      </div>

      {openComments && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-secondary px-3 py-2 text-sm">
              <span className="font-medium">{memberName(c.member_id)}: </span>
              {c.content}
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhắn gì đó..."
              className="rounded-2xl"
            />
            <Button
              className="wish-card-pill rounded-full"
              onClick={() => void sendComment()}
              disabled={!draft.trim()}
            >
              Gửi
            </Button>
          </div>
        </div>
      )}
      </div>
    </article>
  );
}
