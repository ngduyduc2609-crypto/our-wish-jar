import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImagePicker } from "@/components/ImagePicker";
import { StoredImage } from "@/components/StoredImage";
import { useIdentity } from "@/lib/identity";
import { deleteRow, fetchMemories, insertRow } from "@/lib/db";
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
  const { members, track } = useIdentity();
  const qc = useQueryClient();
  const { data: memories = [] } = useQuery({ queryKey: ["memories"], queryFn: fetchMemories });

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

      <NewMemoryDialog onDone={refresh} />

      <div className="relative space-y-4 border-l border-dashed border-border pl-5">
        {memories.map((memory) => (
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
            {memory.image_url && (
              <StoredImage
                path={memory.image_url}
                alt={memory.title}
                className="mt-3 h-44 w-full rounded-2xl"
              />
            )}
          </article>
        ))}
        {memories.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            Chưa có kỷ niệm nào. Hoàn thành một điều ước là có ngay 💗
          </p>
        )}
      </div>
    </div>
  );
}

function NewMemoryDialog({ onDone }: { onDone: () => void }) {
  const { me, track } = useIdentity();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayKey());
  const [rating, setRating] = useState(5);
  const [image, setImage] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      await insertRow("memories", {
        title: title.trim(),
        note: note.trim() || null,
        happened_on: date,
        rating,
        image_url: image,
        source_type: "manual",
        created_by: me?.id ?? null,
      });
      track("thêm kỷ niệm", title.trim());
    },
    onSuccess: () => {
      setTitle("");
      setNote("");
      setImage(null);
      setOpen(false);
      onDone();
      toast.success("Đã lưu kỷ niệm 💕");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-2xl">
          <Plus className="size-4" /> Thêm kỷ niệm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Kỷ niệm mới</DialogTitle>
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
          <ImagePicker value={image} onChange={setImage} />
          <Button
            className="w-full rounded-2xl"
            disabled={!title.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            Lưu kỷ niệm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
