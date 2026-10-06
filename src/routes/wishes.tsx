import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, MoreHorizontal, Plus, Check, Trash2, Shuffle, Pencil } from "lucide-react";
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
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { WishDrawDialog } from "@/components/WishDrawDialog";
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
import { useAppLanguage } from "@/lib/language";

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
  const language = useAppLanguage();
  const copy = {
    title: language === "zh" ? "许愿罐" : language === "en" ? "Wish Jar" : "Lọ điều ước",
    pending: language === "zh" ? "个待完成" : language === "en" ? "wishes waiting" : "điều còn chờ",
    done: language === "zh" ? "已完成" : language === "en" ? "done" : "đã xong",
    all: language === "vi" ? "Tất cả" : language === "zh" ? "全部" : "All",
    waiting: language === "vi" ? "Đang chờ" : language === "zh" ? "待完成" : "Waiting",
    completed: language === "vi" ? "Đã hoàn thành" : language === "zh" ? "已完成" : "Completed",
    add: language === "vi" ? "Thêm điều ước" : language === "zh" ? "添加愿望" : "Add wish",
    draw: language === "zh" ? "抽取" : language === "en" ? "Draw" : "Rút",
    empty: language === "vi" ? "Chưa có điều ước nào ở đây. Thêm một điều đi nào ✨" : language === "zh" ? "这里还没有愿望，添加一个吧 ✨" : "No wishes here yet. Add one ✨",
    drawTitle: language === "vi" ? "Điều ước hôm nay là..." : language === "zh" ? "今日愿望是..." : "Today’s wish is...",
    emptyJar: language === "vi" ? "Lọ đang trống rồi" : language === "zh" ? "许愿罐还空着" : "The jar is empty",
    unknown: language === "zh" ? "某人" : language === "en" ? "Someone" : "Ai đó",
    deleted: language === "zh" ? "已删除" : language === "en" ? "Deleted" : "Đã xoá",
  } as const;
  const qc = useQueryClient();
  const [category, setCategory] = useState<string>("all");
  const [showDone, setShowDone] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
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
    if (!pending.length) return;
    setDrawOpen(true);
    track("rút điều ước");
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
          <h1 className="font-display text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} {copy.pending} · {wishes.length - pending.length} {copy.done}
          </p>
        </div>
        <Button
          variant="secondary"
          className="wish-card-pill shrink-0 border border-white/70 bg-white/70 px-4 py-2 shadow-[0_10px_18px_-10px_rgba(15,23,42,0.18)]"
          onClick={draw}
          disabled={!pending.length}
        >
          <Shuffle className="size-4" /> {copy.draw}
        </Button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          {copy.all}
        </Chip>
        {WISH_CATEGORIES.map((c) => {
          const item = labelOf(WISH_CATEGORIES, c.value, language);
          return (
            <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
              {item.emoji} {item.label}
            </Chip>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Chip active={!showDone} onClick={() => setShowDone(false)}>
          {copy.waiting}
        </Chip>
        <Chip active={showDone} onClick={() => setShowDone(true)}>
          {copy.completed}
        </Chip>
      </div>

      <Button
        className="wish-card-pill w-full border border-white/80 bg-primary text-primary-foreground shadow-[0_12px_22px_-10px_rgba(146,116,180,0.34)]"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus className="size-4" /> {copy.add}
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
            {copy.empty}
          </p>
        )}
      </div>

      <WishDrawDialog open={drawOpen} onOpenChange={setDrawOpen} wishes={pending} showOpenList={false} />
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
  const language = useAppLanguage();
  const copy = {
    edit: language === "zh" ? "编辑愿望" : language === "en" ? "Edit wish" : "Sửa điều ước",
    new: language === "zh" ? "新愿望" : language === "en" ? "New wish" : "Điều ước mới",
    want: language === "zh" ? "我想..." : language === "en" ? "I want..." : "Mình muốn...",
    note: language === "zh" ? "备注" : language === "en" ? "Note" : "Ghi chú",
    category: language === "zh" ? "类别" : language === "en" ? "Category" : "Nhóm",
    difficulty: language === "zh" ? "难度" : language === "en" ? "Difficulty" : "Độ khó",
    deadline: language === "zh" ? "希望在此之前完成" : language === "en" ? "Goal date" : "Mong hoàn thành trước",
    save: language === "zh" ? "保存修改" : language === "en" ? "Save changes" : "Lưu thay đổi",
    add: language === "zh" ? "放进许愿罐" : language === "en" ? "Add to jar" : "Bỏ vào lọ",
    placeholder: language === "zh" ? "去大理看海" : language === "en" ? "Take a trip to the coast" : "Đi Đà Lạt ngắm thông",
    error: language === "zh" ? "无法保存愿望" : language === "en" ? "Could not save wish" : "Không thể lưu điều ước",
    successUpdate: language === "zh" ? "愿望已更新 ✨" : language === "en" ? "Wish updated ✨" : "Đã cập nhật điều ước ✨",
    successCreate: language === "zh" ? "已放进许愿罐 🫙" : language === "en" ? "Added to the jar 🫙" : "Đã bỏ vào lọ điều ước 🫙",
  } as const;
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
            {wish ? copy.edit : copy.new}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{copy.want}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={copy.placeholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.note}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.category}</Label>
            <div className="flex flex-wrap gap-2">
              {WISH_CATEGORIES.map((c) => {
                const item = labelOf(WISH_CATEGORIES, c.value, language);
                return (
                  <Chip
                    key={c.value}
                    active={category === c.value}
                    onClick={() => setCategory(c.value)}
                  >
                    {item.emoji} {item.label}
                  </Chip>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{copy.difficulty}</Label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => {
                const item = labelOf(DIFFICULTIES, d.value, language);
                return (
                  <Chip
                    key={d.value}
                    active={difficulty === d.value}
                    onClick={() => setDifficulty(d.value)}
                  >
                    {item.emoji} {item.label}
                  </Chip>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{copy.deadline}</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <MultiImagePicker value={images} onChange={setImages} />
          <Button
            className="w-full rounded-2xl"
            disabled={!title.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {wish ? copy.save : copy.add}
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
  const language = useAppLanguage();
  const copy = {
    before: language === "zh" ? "之前" : language === "en" ? "before" : "trước",
    proposed: language === "zh" ? "提出了这个愿望" : language === "en" ? "proposed" : "đề xuất",
    markDone: language === "zh" ? "标记已完成" : language === "en" ? "Mark complete" : "Đánh dấu hoàn thành",
    deleted: language === "zh" ? "已删除" : language === "en" ? "Deleted" : "Đã xoá",
    send: language === "zh" ? "发送" : language === "en" ? "Send" : "Gửi",
    commentPlaceholder: language === "zh" ? "说点什么..." : language === "en" ? "Say something..." : "Nhắn gì đó...",
  } as const;
  const [openComments, setOpenComments] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Wish | null>(null);
  const [hoveredReactionIndex, setHoveredReactionIndex] = useState<number | null>(null);
  const longPressRef = useRef<number | null>(null);
  const reactionBarRef = useRef<HTMLDivElement | null>(null);
  const category = labelOf(WISH_CATEGORIES, wish.category, language);
  const difficulty = labelOf(DIFFICULTIES, wish.difficulty, language);
  const mine = canManage(me, wish.proposed_by);
  const reactionMeta = ["👍", "❤️", "😂", "😮", "😢", "😡"] as const;
  const dedupedReactions = uniqueMemberReactions(reactions);
  const myReaction = me ? dedupedReactions.find((r) => r.member_id === me.id) : null;
  const reactionCount = dedupedReactions.length;
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
    toast.success(copy.deleted);
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
            {wish.deadline && <span>· {copy.before} {formatDate(wish.deadline)}</span>}
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
            {memberName(wish.proposed_by)} {copy.proposed}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleComplete}
          aria-label={copy.markDone}
          className={cn(
            "wish-card-button grid size-9 shrink-0 place-items-center border transition-colors",
            wish.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/80",
          )}
        >
          <Check className="size-4" />
        </button>
      </div>

      <div
        className="mt-4 flex items-center justify-between gap-2 border-t border-muted/30 pt-2"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative" onClick={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (me && !myReaction) {
                  void react("❤️");
                }
              }}
              onTouchStart={(event) => event.stopPropagation()}
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
                {myReaction ? <span className="text-sm">{myReaction.emoji}</span> : <Heart className="h-4 w-4 text-muted-foreground stroke-[1.75]" />}
                <span>{reactionCount}</span>
              </span>
            </button>

            {reactionOpen && (
              <div
                ref={reactionBarRef}
                onClick={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
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
                    onTouchStart={(event) => event.stopPropagation()}
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
            onTouchStart={(event) => event.stopPropagation()}
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleComplete();
            }}
            onTouchStart={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            style={noSelectStyle}
            className={cn(
              "select-none rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.98]",
              wish.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/80 text-muted-foreground",
            )}
          >
            {wish.completed ? "✓" : "☆"} {wish.completed ? (language === "zh" ? "已完成" : language === "en" ? "Done" : "Đã xong") : (language === "zh" ? "标记" : language === "en" ? "Mark" : "Đánh dấu")}
          </button>

          {mine && (
            <div className="relative" onClick={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-label={language === "zh" ? "设置" : language === "en" ? "Settings" : "Cài đặt"}
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                onTouchStart={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                style={noSelectStyle}
                className="select-none grid size-8 place-items-center rounded-full border border-border bg-card/80 text-muted-foreground transition-all duration-150 active:scale-[0.98]"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-32 rounded-2xl border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-sm" onClick={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen(false);
                      onEdit();
                    }}
                    onTouchStart={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-secondary"
                  >
                    <Pencil className="size-3.5" /> {language === "zh" ? "编辑" : language === "en" ? "Edit" : "Sửa"}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuOpen(false);
                      setDeleteTarget(wish);
                    }}
                    onTouchStart={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-destructive hover:bg-secondary"
                  >
                    <Trash2 className="size-3.5" /> {language === "zh" ? "删除" : language === "en" ? "Delete" : "Xoá"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title ?? "mục"}
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
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={copy.commentPlaceholder}
              className="flex-1 rounded-full"
            />
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
