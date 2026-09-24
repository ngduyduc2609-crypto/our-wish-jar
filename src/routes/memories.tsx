import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

const SOURCE_LABEL: Record<string, string> = {
  wish: "Từ điều ước",
  food: "Từ món ăn",
  activity: "Từ hoạt động",
  manual: "Tự ghi",
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
        <h1 className="font-display text-2xl font-bold">Kỷ niệm</h1>
        <p className="text-sm text-muted-foreground">{memories.length} khoảnh khắc đã lưu</p>
      </div>

      <Button
        className="w-full rounded-2xl"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Plus className="size-4" /> Thêm kỷ niệm
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
                    {formatDate(memory.happened_on)} · {SOURCE_LABEL[memory.source_type] ?? "Tự ghi"}
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-semibold">{memory.title}</h2>
                  {memory.rating ? <p className="text-sm">{"⭐".repeat(memory.rating)}</p> : null}
                  {memory.note && <p className="mt-1 text-sm text-muted-foreground">{memory.note}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {members.find((m) => m.id === memory.created_by)?.name ?? "Chúng mình"} lưu lại
                  </p>
                </div>
                {mine && (
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      aria-label="Sửa kỷ niệm"
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
                      aria-label="Xoá kỷ niệm"
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
            Chưa có kỷ niệm nào. Hoàn thành một điều ước là có ngay 💗
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
        subtitle={viewing ? `${formatDate(viewing.happened_on)} · ${SOURCE_LABEL[viewing.source_type] ?? "Tự ghi"}` : undefined}
        images={viewing ? imageAssets(viewing.images, viewing.image_url, viewing.image_pos) : []}
      >
        {viewing?.rating ? <p>{"⭐".repeat(viewing.rating)}</p> : null}
        {viewing?.note && <p className="whitespace-pre-wrap text-muted-foreground">{viewing.note}</p>}
        {viewing && <p className="text-xs text-muted-foreground">{members.find((member) => member.id === viewing.created_by)?.name ?? "Chúng mình"} lưu lại</p>}
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
        const reason = error instanceof Error ? error.message : "Không rõ nguyên nhân";
        toast.error(`Không thể lưu kỷ niệm: ${reason}`);
        throw error;
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      onDone();
      toast.success(memory ? "Đã cập nhật 💕" : "Đã lưu kỷ niệm 💕");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{memory ? "Sửa kỷ niệm" : "Kỷ niệm mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tiêu đề</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ngày</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
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
            disabled={!title.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {memory ? "Lưu thay đổi" : "Lưu kỷ niệm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
