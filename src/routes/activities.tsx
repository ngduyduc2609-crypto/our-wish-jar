import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shuffle, Trash2, MapPin, Check, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MultiImagePicker } from "@/components/MultiImagePicker";
import { ImageGallery } from "@/components/ImageGallery";
import { ContentDetailDialog } from "@/components/ContentDetailDialog";
import { RandomDrawDialog } from "@/components/RandomDraw";
import { Chip } from "@/components/Chip";
import { useIdentity } from "@/lib/identity";
import { canManage } from "@/lib/ownership";
import {
  deleteRow,
  fetchActivities,
  insertRow,
  imageAssets,
  pickRandom,
  updateRow,
  type Activity,
  type ImageAsset,
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const { me, track } = useIdentity();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "done">("all");
  const [filter, setFilter] = useState<string | null>(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawn, setDrawn] = useState<Activity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [viewing, setViewing] = useState<Activity | null>(null);

  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: fetchActivities });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["activities"] });
    void qc.invalidateQueries({ queryKey: ["memories"] });
    void qc.invalidateQueries({ queryKey: ["log"] });
    void qc.invalidateQueries({ queryKey: ["presence"] });
  };

  const done = useMemo(() => activities.filter((a) => a.done), [activities]);
  const visible = tab === "all" ? activities : done;

  const pool = useMemo(
    () => activities.filter((a) => !filter || a.tags.includes(filter)),
    [activities, filter],
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
          image_pos: activity.image_pos ?? "50% 50%",
          happened_on: todayKey(),
          source_type: "activity",
          source_id: activity.id,
          created_by: me?.id ?? null,
          images: imageAssets(activity.images, activity.image_url, activity.image_pos),
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
            {activities.length} ý tưởng · {done.length} đã làm
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
        <Chip active={tab === "all"} onClick={() => setTab("all")}>
          Tất cả
        </Chip>
        <Chip active={tab === "done"} onClick={() => setTab("done")}>
          Đã làm
        </Chip>
      </div>

      <Button
        className="w-full rounded-2xl"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Plus className="size-4" /> Thêm hoạt động
      </Button>

      <div className="grid gap-3">
        {visible.map((activity) => {
          const category = labelOf(ACTIVITY_CATEGORIES, activity.category);
          const mine = canManage(me, activity.added_by);
          return (
            <article
              key={activity.id}
              role="button"
              tabIndex={0}
              aria-label={`Xem chi tiết ${activity.name}`}
              onClick={() => setViewing(activity)}
              onKeyDown={(event) => {
                if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) setViewing(activity);
              }}
              className="paper cursor-pointer overflow-hidden rounded-3xl"
            >
              <ImageGallery images={imageAssets(activity.images, activity.image_url, activity.image_pos)} alt={activity.name} className="h-40" />
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
                      onClick={(event) => {
                        event.stopPropagation();
                        complete.mutate(activity);
                      }}
                      className={cn(
                        "grid size-9 place-items-center rounded-full border transition-colors",
                        activity.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      <Check className="size-4" />
                    </button>
                    {mine && (
                      <>
                        <button
                          type="button"
                          aria-label="Sửa hoạt động"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditing(activity);
                            setDialogOpen(true);
                          }}
                          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Xoá hoạt động"
                          onClick={async (event) => {
                            event.stopPropagation();
                            await deleteRow("activities", activity.id);
                            track("xoá hoạt động", activity.name);
                            refresh();
                          }}
                          className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
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

      <ActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activity={editing}
        onDone={refresh}
      />

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
              <p className="mt-1 text-sm text-muted-foreground">
                {drawn.place ?? "Chưa ghi địa điểm"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có hoạt động nào hợp bộ lọc</p>
          )
        }
      >
        {drawn && !drawn.done && (
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

      <ContentDetailDialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing ? `${labelOf(ACTIVITY_CATEGORIES, viewing.category).emoji} ${labelOf(ACTIVITY_CATEGORIES, viewing.category).label}${viewing.done ? " · Đã làm" : ""}` : undefined}
        images={viewing ? imageAssets(viewing.images, viewing.image_url, viewing.image_pos) : []}
      >
        {viewing?.place && <p className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{viewing.place}</p>}
        {viewing && viewing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {viewing.tags.map((tag) => <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{ACTIVITY_TAGS.find((item) => item.value === tag)?.label ?? tag}</span>)}
          </div>
        )}
        {viewing?.note && <p className="whitespace-pre-wrap text-muted-foreground">{viewing.note}</p>}
      </ContentDetailDialog>
    </div>
  );
}

function ActivityDialog({
  open,
  onOpenChange,
  activity,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  onDone: () => void;
}) {
  const { me, track } = useIdentity();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("cafe");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(activity?.name ?? "");
    setCategory(activity?.category ?? "cafe");
    setPlace(activity?.place ?? "");
    setNote(activity?.note ?? "");
    setTags(activity?.tags ?? []);
    setImages(imageAssets(activity?.images, activity?.image_url, activity?.image_pos));
  }, [open, activity]);

  const save = useMutation({
    mutationFn: async () => {
      const values = {
        name: name.trim(),
        category,
        place: place.trim() || null,
        note: note.trim() || null,
        tags,
        images,
        image_url: images[0]?.path ?? null,
        image_pos: images[0]?.position ?? "50% 50%",
      };
      if (activity) {
        await updateRow("activities", activity.id, values);
        track("sửa hoạt động", values.name);
      } else {
        await insertRow("activities", { ...values, added_by: me?.id ?? null });
        track("thêm hoạt động", values.name);
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      onDone();
      toast.success(activity ? "Đã cập nhật 🎈" : "Đã thêm hoạt động 🎈");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {activity ? "Sửa hoạt động" : "Hoạt động mới"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tên hoạt động</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cafe sách cuối tuần"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nhóm</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_CATEGORIES.map((c) => (
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
            <Label>Tâm trạng phù hợp</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TAGS.map((t) => (
                <Chip
                  key={t.value}
                  active={tags.includes(t.value)}
                  onClick={() =>
                    setTags((prev) =>
                      prev.includes(t.value)
                        ? prev.filter((x) => x !== t.value)
                        : [...prev, t.value],
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
          <MultiImagePicker value={images} onChange={setImages} />
          <Button
            className="w-full rounded-2xl"
            disabled={!name.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {activity ? "Lưu thay đổi" : "Lưu lại"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
