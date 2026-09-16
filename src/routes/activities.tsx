import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shuffle, Trash2, MapPin, Check } from "lucide-react";
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
import { RandomDrawDialog } from "@/components/RandomDraw";
import { useIdentity } from "@/lib/identity";
import {
  deleteRow,
  fetchActivities,
  insertRow,
  pickRandom,
  updateRow,
  type Activity,
} from "@/lib/db";
import { ACTIVITY_CATEGORIES, ACTIVITY_TAGS, labelOf, todayKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activities")({
  head: () => ({
    meta: [
      { title: "Hôm nay làm gì? | Wish Jar" },
      {
        name: "description",
        content: "Địa điểm và hoạt động của Thu Thủy và Duy Đức, quay ngẫu nhiên theo tâm trạng.",
      },
      { property: "og:title", content: "Hôm nay làm gì?" },
      {
        property: "og:description",
        content: "Địa điểm và hoạt động của Thu Thủy và Duy Đức, quay ngẫu nhiên theo tâm trạng.",
      },
    ],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const { me, track } = useIdentity();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [filter, setFilter] = useState<string | null>(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawn, setDrawn] = useState<Activity | null>(null);

  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: fetchActivities });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["activities"] });
    void qc.invalidateQueries({ queryKey: ["memories"] });
    void qc.invalidateQueries({ queryKey: ["log"] });
    void qc.invalidateQueries({ queryKey: ["presence"] });
  };

  const todo = useMemo(() => activities.filter((a) => !a.done), [activities]);
  const done = useMemo(() => activities.filter((a) => a.done), [activities]);
  const visible = tab === "todo" ? todo : done;

  const pool = useMemo(
    () => todo.filter((a) => !filter || a.tags.includes(filter)),
    [todo, filter],
  );

  function draw() {
    setDrawn(pickRandom(pool, drawn ?? undefined));
    setDrawOpen(true);
  }

  const complete = useMutation({
    mutationFn: async (activity: Activity) => {
      await updateRow("activities", activity.id, {
        done: !activity.done,
        done_at: activity.done ? null : new Date().toISOString(),
      });
      if (!activity.done) {
        await insertRow("memories", {
          title: activity.name,
          note: activity.note,
          image_url: activity.image_url,
          happened_on: todayKey(),
          source_type: "activity",
          source_id: activity.id,
          created_by: me?.id ?? null,
        });
      }
      track(activity.done ? "mở lại hoạt động" : "hoàn thành hoạt động", activity.name);
    },
    onSuccess: (_d, activity) => {
      refresh();
      if (!activity.done) toast.success("Thêm một kỷ niệm mới 💞");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Làm gì hôm nay</h1>
          <p className="text-sm text-muted-foreground">
            {todo.length} ý tưởng chờ · {done.length} đã làm
          </p>
        </div>
        <Button className="rounded-full" onClick={draw} disabled={!pool.length}>
          <Shuffle className="size-4" /> Quay
        </Button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!filter} onClick={() => setFilter(null)}>
          Mọi tâm trạng
        </Chip>
        {ACTIVITY_TAGS.map((t) => (
          <Chip key={t.value} active={filter === t.value} onClick={() => setFilter(t.value)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2">
        <Chip active={tab === "todo"} onClick={() => setTab("todo")}>
          Muốn làm
        </Chip>
        <Chip active={tab === "done"} onClick={() => setTab("done")}>
          Đã làm
        </Chip>
      </div>

      <NewActivityDialog onDone={refresh} />

      <div className="grid gap-3">
        {visible.map((activity) => {
          const category = labelOf(ACTIVITY_CATEGORIES, activity.category);
          return (
            <article key={activity.id} className="paper overflow-hidden rounded-3xl">
              {activity.image_url && (
                <StoredImage path={activity.image_url} alt={activity.name} className="h-40 w-full" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {category.emoji} {category.label}
                    </p>
                    <h2 className="mt-0.5 font-display text-lg font-semibold">{activity.name}</h2>
                    {activity.place && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {activity.place}
                      </p>
                    )}
                    {activity.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{activity.note}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {activity.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                        >
                          {ACTIVITY_TAGS.find((t) => t.value === tag)?.label ?? tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      aria-label="Đánh dấu đã làm"
                      onClick={() => complete.mutate(activity)}
                      className={cn(
                        "grid size-9 place-items-center rounded-full border transition-colors",
                        activity.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Xoá hoạt động"
                      onClick={async () => {
                        await deleteRow("activities", activity.id);
                        track("xoá hoạt động", activity.name);
                        refresh();
                      }}
                      className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {visible.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            Chưa có hoạt động nào. Thêm một ý tưởng nhé ✨
          </p>
        )}
      </div>

      <RandomDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title="Hôm nay mình đi..."
        emoji="🎡"
        onDrawAgain={draw}
        result={
          drawn ? (
            <div>
              <p className="font-display text-xl font-bold">{drawn.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{drawn.place ?? "Chưa ghi địa điểm"}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có hoạt động nào hợp bộ lọc</p>
          )
        }
      >
        {drawn && (
          <Button
            className="rounded-full"
            onClick={() => {
              complete.mutate(drawn);
              setDrawOpen(false);
            }}
          >
            Đã làm rồi, lưu kỷ niệm
          </Button>
        )}
      </RandomDrawDialog>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function NewActivityDialog({ onDone }: { onDone: () => void }) {
  const { me, track } = useIdentity();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("cafe");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      await insertRow("activities", {
        name: name.trim(),
        category,
        place: place.trim() || null,
        note: note.trim() || null,
        tags,
        image_url: image,
        added_by: me?.id ?? null,
      });
      track("thêm hoạt động", name.trim());
    },
    onSuccess: () => {
      setName("");
      setPlace("");
      setNote("");
      setTags([]);
      setImage(null);
      setOpen(false);
      onDone();
      toast.success("Đã thêm hoạt động 🎈");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-2xl">
          <Plus className="size-4" /> Thêm hoạt động
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Hoạt động mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tên hoạt động</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cafe sách cuối tuần" />
          </div>
          <div className="space-y-1.5">
            <Label>Nhóm</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_CATEGORIES.map((c) => (
                <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tâm trạng phù hợp</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TAGS.map((t) => (
                <Chip
                  key={t.value}
                  active={tags.includes(t.value)}
                  onClick={() =>
                    setTags((prev) =>
                      prev.includes(t.value) ? prev.filter((x) => x !== t.value) : [...prev, t.value],
                    )
                  }
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Địa điểm</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <ImagePicker value={image} onChange={setImage} />
          <Button
            className="w-full rounded-2xl"
            disabled={!name.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            Lưu lại
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
