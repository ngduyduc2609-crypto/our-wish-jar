import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
import { useIdentity } from "@/lib/identity";
import { canManage } from "@/lib/ownership";
import { deleteRow, fetchMemories, imageAssets, insertRow, updateRow, type Memory, type ImageAsset } from "@/lib/db";
import { formatDate, todayKey } from "@/lib/constants";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [viewing, setViewing] = useState<Memory | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["memories"] });
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
        {memories.map((memory) => {
          const mine = canManage(me, memory.created_by);
          return (
            <article
              key={memory.id}
              role="button"
              tabIndex={0}
              aria-label={`Xem chi tiết ${memory.title}`}
              onClick={() => setViewing(memory)}
              onKeyDown={(event) => {
                if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) setViewing(memory);
              }}
              className="paper relative cursor-pointer rounded-3xl p-4"
            >
              <span className="absolute -left-[26px] top-6 size-3 rounded-full bg-primary" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(memory.happened_on)} · {SOURCE_LABEL[memory.source_type]?.[language] ?? SOURCE_LABEL.manual[language]}
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-semibold">{memory.title}</h2>
                  {memory.rating ? <p className="text-sm">{"⭐".repeat(memory.rating)}</p> : null}
                  {memory.note && <p className="mt-1 text-sm text-muted-foreground">{memory.note}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {members.find((m) => m.id === memory.created_by)?.name ?? (language === "zh" ? "我们" : language === "en" ? "We" : "Chúng mình")} {copy.saved}
                  </p>
                </div>
                {mine && (
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      aria-label={copy.edit}
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditing(memory);
                        setDialogOpen(true);
                      }}
                      className="rounded-full border border-border p-2 text-muted-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={copy.delete}
                      onClick={async (event) => {
                        event.stopPropagation();
                        await deleteRow("memories", memory.id);
                        track("xoá kỷ niệm", memory.title);
                        refresh();
                      }}
                      className="rounded-full border border-border p-2 text-muted-foreground"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <ImageGallery images={imageAssets(memory.images, memory.image_url, memory.image_pos)} alt={memory.title} className="mt-3 rounded-2xl" />
            </article>
          );
        })}
        {memories.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            {copy.empty}
          </p>
        )}
      </div>

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
        subtitle={viewing ? `${formatDate(viewing.happened_on)} · ${SOURCE_LABEL[viewing.source_type]?.[language] ?? SOURCE_LABEL.manual[language]}` : undefined}
        images={viewing ? imageAssets(viewing.images, viewing.image_url, viewing.image_pos) : []}
      >
        {viewing?.rating ? <p>{"⭐".repeat(viewing.rating)}</p> : null}
        {viewing?.note && <p className="whitespace-pre-wrap text-muted-foreground">{viewing.note}</p>}
        {viewing && <p className="text-xs text-muted-foreground">{members.find((member) => member.id === viewing.created_by)?.name ?? (language === "zh" ? "我们" : language === "en" ? "We" : "Chúng mình")} {copy.saved}</p>}
      </ContentDetailDialog>
    </div>
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
