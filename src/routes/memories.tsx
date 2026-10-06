import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";

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
import { useIdentity } from "@/lib/identity";
import { canManage } from "@/lib/ownership";
import {
  deleteRow,
  fetchMemories,
  fetchMemoryComments,
  fetchMemoryReactions,
  imageAssets,
  insertEntityComment,
  insertRow,
  toggleEntityReaction,
  updateRow,
  type Memory,
  type ImageAsset,
} from "@/lib/db";
import { REACTIONS, formatDate, todayKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<string, Record<"vi" | "en" | "zh", string>> = {
  wish: { vi: "Từ điều ước", en: "From a wish", zh: "来自愿望" },
  food: { vi: "Từ món ăn", en: "From food", zh: "来自美食" },
  activity: { vi: "Từ hoạt động", en: "From activity", zh: "来自活动" },
  manual: { vi: "Tự ghi", en: "Written by us", zh: "手写" },
};

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "Kỷ niệm của chúng mình | Wish Jar" },
      {
        name: "description",
        content: "Dòng thời gian kỷ niệm của Thu Thủy và Duy Đức với ảnh và cảm nhận.",
      },
      { property: "og:title", content: "Kỷ niệm của chúng mình" },
      {
        property: "og:description",
        content: "Dòng thời gian kỷ niệm của Thu Thủy và Duy Đức với ảnh và cảm nhận.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const { me, members, track } = useIdentity();
  const language = useAppLanguage();
  const copy = {
    title: language === "vi" ? "Kỷ niệm" : language === "zh" ? "回忆" : "Memories",
    subtitle: language === "vi" ? "khoảnh khắc đã lưu" : language === "zh" ? "个已保存的瞬间" : "moments saved",
    add: language === "vi" ? "Thêm kỷ niệm" : language === "zh" ? "添加回忆" : "Add memory",
    empty: language === "vi" ? "Chưa có kỷ niệm nào. Hoàn thành một điều ước là có ngay 💗" : language === "zh" ? "还没有回忆，完成一个愿望就可记录 💗" : "No memories yet. Complete a wish and it will appear 💗",
    saved: language === "zh" ? "保存了" : language === "en" ? "saved" : "lưu lại",
    edit: language === "zh" ? "编辑回忆" : language === "en" ? "Edit memory" : "Sửa kỷ niệm",
    delete: language === "zh" ? "删除回忆" : language === "en" ? "Delete memory" : "Xoá kỷ niệm",
    new: language === "zh" ? "新回忆" : language === "en" ? "New memory" : "Kỷ niệm mới",
    titleLabel: language === "zh" ? "标题" : language === "en" ? "Title" : "Tiêu đề",
    dateLabel: language === "zh" ? "日期" : language === "en" ? "Date" : "Ngày",
    ratingLabel: language === "zh" ? "评分" : language === "en" ? "Rating" : "Chấm điểm",
    noteLabel: language === "zh" ? "感受" : language === "en" ? "Note" : "Cảm nhận",
    saveChanges: language === "zh" ? "保存修改" : language === "en" ? "Save changes" : "Lưu thay đổi",
    saveMemory: language === "zh" ? "保存回忆" : language === "en" ? "Save memory" : "Lưu kỷ niệm",
    updateSuccess: language === "zh" ? "已更新 💕" : language === "en" ? "Updated 💕" : "Đã cập nhật 💕",
    createSuccess: language === "zh" ? "已保存回忆 💕" : language === "en" ? "Saved memory 💕" : "Đã lưu kỷ niệm 💕",
  } as const;
  const qc = useQueryClient();
  const { data: memories = [] } = useQuery({ queryKey: ["memories"], queryFn: fetchMemories });
  const { data: memoryReactions = [] } = useQuery({ queryKey: ["memory-reactions"], queryFn: fetchMemoryReactions });
  const { data: memoryComments = [] } = useQuery({ queryKey: ["memory-comments"], queryFn: fetchMemoryComments });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [viewing, setViewing] = useState<Memory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["memories"] });
    void qc.invalidateQueries({ queryKey: ["memory-reactions"] });
    void qc.invalidateQueries({ queryKey: ["memory-comments"] });
    void qc.invalidateQueries({ queryKey: ["log"] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{memories.length} {copy.subtitle}</p>
      </div>

      <Button
        className="w-full rounded-2xl"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Plus className="size-4" /> {copy.add}
      </Button>

      <div className="relative space-y-4 border-l border-dashed border-border pl-5">
        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            reactions={memoryReactions.filter((r) => r.memory_id === memory.id)}
            comments={memoryComments.filter((c) => c.memory_id === memory.id)}
            memberName={(id: string | null) => members.find((m) => m.id === id)?.name ?? (language === "zh" ? "我们" : language === "en" ? "We" : "Chúng mình")}
            onChanged={refresh}
            onEdit={() => {
              setEditing(memory);
              setDialogOpen(true);
            }}
            onView={() => setViewing(memory)}
          />
        ))}
        {memories.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            {copy.empty}
          </p>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title ?? "mục"}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          void (async () => {
            await deleteRow("memories", deleteTarget.id);
            track("xoá kỷ niệm", deleteTarget.title);
            refresh();
          })();
          setDeleteTarget(null);
        }}
      />

      <MemoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memory={editing}
        onDone={refresh}
      />

      <ContentDetailDialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.title ?? ""}
        subtitle={viewing ? `${formatDate(viewing.happened_on)} · ${SOURCE_LABEL[viewing.source_type]?.[language] ?? SOURCE_LABEL["manual"]?.[language]}` : undefined}
        images={viewing ? imageAssets(viewing.images, viewing.image_url, viewing.image_pos) : []}
      >
        {viewing?.rating ? <p>{"⭐".repeat(viewing.rating)}</p> : null}
        {viewing?.note && <p className="whitespace-pre-wrap text-muted-foreground">{viewing.note}</p>}
        {viewing && <p className="text-xs text-muted-foreground">{members.find((member) => member.id === viewing.created_by)?.name ?? (language === "zh" ? "我们" : language === "en" ? "We" : "Chúng mình")} {copy.saved}</p>}
      </ContentDetailDialog>
    </div>
  );
}

function MemoryCard({
  memory,
  reactions,
  comments,
  memberName,
  onChanged,
  onEdit,
  onView,
}: {
  memory: Memory;
  reactions: { id: string; emoji: string; member_id: string }[];
  comments: { id: string; member_id: string; content: string; created_at: string }[];
  memberName: (id: string | null) => string;
  onChanged: () => void;
  onEdit: () => void;
  onView: () => void;
}) {
  const { me, track } = useIdentity();
  const language = useAppLanguage();
  const [openComments, setOpenComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);
  const mine = canManage(me, memory.created_by);

  async function react(emoji: string) {
    if (!me) return;
    const added = await toggleEntityReaction("memory", memory.id, me.id, emoji);
    if (added) track("thả cảm xúc " + emoji, memory.title);
    onChanged();
  }

  async function sendComment() {
    if (!me || !draft.trim()) return;
    await insertEntityComment("memory", memory.id, me.id, draft.trim());
    track("bình luận", memory.title);
    setDraft("");
    onChanged();
  }

  async function remove() {
    await deleteRow("memories", memory.id);
    track("xoá kỷ niệm", memory.title);
    onChanged();
    toast.success(language === "zh" ? "已删除" : language === "en" ? "Deleted" : "Đã xoá");
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết ${memory.title}`}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) onView();
      }}
      className="paper relative cursor-pointer rounded-3xl p-4"
    >
      <span className="absolute -left-[26px] top-6 size-3 rounded-full bg-primary" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">
            {formatDate(memory.happened_on)} · {SOURCE_LABEL[memory.source_type]?.[language] ?? SOURCE_LABEL["manual"]?.[language]}
          </p>
          <h2 className="mt-0.5 font-display text-lg font-semibold">{memory.title}</h2>
          {memory.rating ? <p className="text-sm">{"⭐".repeat(memory.rating)}</p> : null}
          {memory.note && <p className="mt-1 text-sm text-muted-foreground">{memory.note}</p>}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {memberName(memory.created_by)} {language === "zh" ? "保存了" : language === "en" ? "saved" : "lưu lại"}
          </p>
        </div>
        {mine && (
          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              aria-label={language === "zh" ? "编辑回忆" : language === "en" ? "Edit memory" : "Sửa kỷ niệm"}
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              aria-label={language === "zh" ? "删除回忆" : language === "en" ? "Delete memory" : "Xoá kỷ niệm"}
              onClick={(event) => {
                event.stopPropagation();
                setDeleteTarget(memory);
              }}
              className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {REACTIONS.map((emoji) => {
          const list = reactions.filter((r) => r.emoji === emoji);
          const reacted = me ? list.some((r) => r.member_id === me.id) : false;
          return (
            <button
              key={emoji}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void react(emoji);
              }}
              className={cn(
                "border px-2.5 py-1 text-xs transition-colors",
                reacted ? "border-primary bg-accent shadow-[0_8px_18px_-10px_rgba(146,116,180,0.32)]" : "border-border bg-card/80",
              )}
            >
              {emoji} {list.length > 0 && list.length}
            </button>
          );
        })}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpenComments((v) => !v);
          }}
          className="ml-auto flex items-center gap-1 border border-border bg-card/80 px-2.5 py-1 text-xs text-muted-foreground"
        >
          <MessageCircle className="size-3.5" /> {comments.length}
        </button>
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
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-secondary px-3 py-2 text-sm">
              <span className="font-medium">{memberName(c.member_id)}: </span>
              {c.content}
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={language === "zh" ? "说点什么..." : language === "en" ? "Say something..." : "Nhắn gì đó..."} className="rounded-2xl" />
            <Button className="rounded-full" onClick={() => void sendComment()} disabled={!draft.trim()}>
              {language === "zh" ? "发送" : language === "en" ? "Send" : "Gửi"}
            </Button>
          </div>
        </div>
      )}

      <ImageGallery images={imageAssets(memory.images, memory.image_url, memory.image_pos)} alt={memory.title} className="mt-3 rounded-2xl" />
    </article>
  );
}

function MemoryDialog({
  open,
  onOpenChange,
  memory,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
  onDone: () => void;
}) {
  const { me, track } = useIdentity();
  const language = useAppLanguage();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayKey());
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<ImageAsset[]>([]);

  useEffect(() => {
    if (!open) return;
    setTitle(memory?.title ?? "");
    setNote(memory?.note ?? "");
    setDate(memory?.happened_on ?? todayKey());
    setRating(memory?.rating ?? 5);
    setImages(imageAssets(memory?.images, memory?.image_url, memory?.image_pos));
  }, [open, memory]);

  const dialogCopy = {
    edit: language === "zh" ? "编辑回忆" : language === "en" ? "Edit memory" : "Sửa kỷ niệm",
    new: language === "zh" ? "新回忆" : language === "en" ? "New memory" : "Kỷ niệm mới",
    titleLabel: language === "zh" ? "标题" : language === "en" ? "Title" : "Tiêu đề",
    dateLabel: language === "zh" ? "日期" : language === "en" ? "Date" : "Ngày",
    ratingLabel: language === "zh" ? "评分" : language === "en" ? "Rating" : "Chấm điểm",
    noteLabel: language === "zh" ? "感受" : language === "en" ? "Note" : "Cảm nhận",
    saveChanges: language === "zh" ? "保存修改" : language === "en" ? "Save changes" : "Lưu thay đổi",
    saveMemory: language === "zh" ? "保存回忆" : language === "en" ? "Save memory" : "Lưu kỷ niệm",
    updateSuccess: language === "zh" ? "已更新 💕" : language === "en" ? "Updated 💕" : "Đã cập nhật 💕",
    createSuccess: language === "zh" ? "已保存回忆 💕" : language === "en" ? "Saved memory 💕" : "Đã lưu kỷ niệm 💕",
  } as const;

  const save = useMutation({
    mutationFn: async () => {
      try {
        const values = {
          title: title.trim(),
          note: note.trim() || null,
          happened_on: date,
          rating,
          images,
          image_url: images[0]?.path ?? null,
          image_pos: images[0]?.position ?? "50% 50%",
        };
        if (memory) {
          await updateRow("memories", memory.id, values);
          track("sửa kỷ niệm", values.title);
        } else {
          await insertRow("memories", {
            ...values,
            source_type: "manual",
            created_by: me?.id ?? null,
          });
          track("thêm kỷ niệm", values.title);
        }
      } catch (error) {
        console.error("Insert memory error:", error);
        const reason = error instanceof Error ? error.message : language === "zh" ? "原因不明" : language === "en" ? "Unknown reason" : "Không rõ nguyên nhân";
        toast.error(language === "zh" ? `无法保存回忆：${reason}` : language === "en" ? `Could not save memory: ${reason}` : `Không thể lưu kỷ niệm: ${reason}`);
        throw error;
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      onDone();
      toast.success(memory ? dialogCopy.updateSuccess : dialogCopy.createSuccess);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{memory ? dialogCopy.edit : dialogCopy.new}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{dialogCopy.titleLabel}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{dialogCopy.dateLabel}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{dialogCopy.ratingLabel}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="text-2xl">
                  {n <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{dialogCopy.noteLabel}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <MultiImagePicker value={images} onChange={setImages} />
          <Button
            className="w-full rounded-2xl"
            disabled={!title.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {memory ? dialogCopy.saveChanges : dialogCopy.saveMemory}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
