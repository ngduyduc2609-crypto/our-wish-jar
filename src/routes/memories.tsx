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
import { ImagePicker } from "@/components/ImagePicker";
import { StoredImage } from "@/components/StoredImage";
import { useIdentity } from "@/lib/identity";
import { canManage } from "@/lib/ownership";
import { deleteRow, fetchMemories, insertRow, updateRow, type Memory } from "@/lib/db";
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
            <article key={memory.id} className="paper relative rounded-3xl p-4">
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
                      onClick={() => {
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
                      onClick={async () => {
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
              {memory.image_url && (
                <StoredImage
                  path={memory.image_url}
                  alt={memory.title}
                  position={memory.image_pos}
                  className="mt-3 h-44 w-full rounded-2xl"
                />
              )}
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
  const [image, setImage] = useState<string | null>(null);
  const [imagePos, setImagePos] = useState("50% 50%");

  useEffect(() => {
    if (!open) return;
    setTitle(memory?.title ?? "");
    setNote(memory?.note ?? "");
    setDate(memory?.happened_on ?? todayKey());
    setRating(memory?.rating ?? 5);
    setImage(memory?.image_url ?? null);
    setImagePos(memory?.image_pos ?? "50% 50%");
  }, [open, memory]);

  const save = useMutation({
    mutationFn: async () => {
      const values = {
        title: title.trim(),
        note: note.trim() || null,
        happened_on: date,
        rating,
        image_url: image,
        image_pos: imagePos,
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
          <ImagePicker
            value={image}
            onChange={setImage}
            position={imagePos}
            onPositionChange={setImagePos}
          />
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
