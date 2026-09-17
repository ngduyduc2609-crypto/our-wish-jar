import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shuffle, Star, Trash2, MapPin, Pencil } from "lucide-react";
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
import { deleteRow, fetchFoods, imageAssets, insertRow, pickRandom, updateRow, type Food, type ImageAsset } from "@/lib/db";
import { PRICE_LEVELS, todayKey } from "@/lib/constants";

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
  const { me, track } = useIdentity();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "tried">("all");
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawn, setDrawn] = useState<Food | null>(null);
  const [ratingTarget, setRatingTarget] = useState<Food | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [viewing, setViewing] = useState<Food | null>(null);

  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: fetchFoods });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["foods"] });
    void qc.invalidateQueries({ queryKey: ["memories"] });
    void qc.invalidateQueries({ queryKey: ["log"] });
    void qc.invalidateQueries({ queryKey: ["presence"] });
  };

  const triedList = useMemo(() => foods.filter((f) => f.tried), [foods]);
  const visible = tab === "all" ? foods : triedList;

  function draw() {
    setDrawn(pickRandom(foods, drawn ?? undefined));
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
          <h1 className="font-display text-2xl font-bold">Ăn gì đây ta</h1>
          <p className="text-sm text-muted-foreground">
            {foods.length} món trong danh sách · {triedList.length} món đã thử
          </p>
        </div>
        <Button className="shrink-0 rounded-full" onClick={draw} disabled={!foods.length}>
          <Shuffle className="size-4" /> Quay
        </Button>
      </div>

      <div className="flex gap-2">
        <Chip active={tab === "all"} onClick={() => setTab("all")}>
          Tất cả
        </Chip>
        <Chip active={tab === "tried"} onClick={() => setTab("tried")}>
          Đã thử
        </Chip>
      </div>

      <Button
        className="w-full rounded-2xl"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus className="size-4" /> Thêm món / quán
      </Button>

      <FoodDialog open={formOpen} onOpenChange={setFormOpen} food={editing} onDone={refresh} />

      <div className="grid gap-3">
        {visible.map((food) => {
          const mine = canManage(me, food.added_by);
          return (
            <article
              key={food.id}
              role="button"
              tabIndex={0}
              aria-label={`Xem chi tiết ${food.name}`}
              onClick={() => setViewing(food)}
              onKeyDown={(event) => {
                if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) setViewing(food);
              }}
              className="paper cursor-pointer overflow-hidden rounded-3xl"
            >
              <ImageGallery images={imageAssets(food.images, food.image_url, food.image_pos)} alt={food.name} className="h-40" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold">{food.name}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      {food.place && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" /> {food.place}
                        </span>
                      )}
                      <span>
                        · {PRICE_LEVELS.find((p) => p.value === food.price_level)?.label ?? "₫₫"}
                      </span>
                      {food.rating ? <span>· {"⭐".repeat(food.rating)}</span> : null}
                      {food.tried && <span>· đã thử</span>}
                    </p>
                    {food.note && <p className="mt-1 text-sm text-muted-foreground">{food.note}</p>}
                  </div>
                  {mine && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        aria-label="Sửa món"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditing(food);
                          setFormOpen(true);
                        }}
                        className="rounded-full border border-border p-2 text-muted-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Xoá món"
                        onClick={(event) => {
                          event.stopPropagation();
                          remove.mutate(food);
                        }}
                        className="rounded-full border border-border p-2 text-muted-foreground"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <Button
                  variant="secondary"
                  className="mt-3 w-full rounded-2xl"
                  onClick={(event) => {
                    event.stopPropagation();
                    setRatingTarget(food);
                  }}
                >
                  <Star className="size-4" />{" "}
                  {food.tried ? "Ăn lại, lưu kỷ niệm mới" : "Đã ăn rồi, lưu kỷ niệm"}
                </Button>
              </div>
            </article>
          );
        })}
        {visible.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            Chưa có món nào. Thêm món muốn thử nhé 🍜
          </p>
        )}
      </div>

      <RandomDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title="Hôm nay mình ăn..."
        emoji="🍜"
        onDrawAgain={draw}
        result={
          drawn ? (
            <div>
              <p className="font-display text-xl font-bold">{drawn.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{drawn.place ?? "Chưa ghi quán"}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Danh sách món đang trống</p>
          )
        }
      >
        {drawn && (
          <Button
            className="rounded-full"
            onClick={() => {
              setDrawOpen(false);
              setRatingTarget(drawn);
            }}
          >
            Ăn món này rồi, lưu kỷ niệm
          </Button>
        )}
      </RandomDrawDialog>

      <TriedDialog food={ratingTarget} onClose={() => setRatingTarget(null)} onDone={refresh} />

      <ContentDetailDialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing?.tried ? "Đã thử" : "Trong danh sách"}
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

function TriedDialog({
  food,
  onClose,
  onDone,
}: {
  food: Food | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { me, track } = useIdentity();
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
        images: finalImages,
        image_url: finalImages[0]?.path ?? null,
        image_pos: finalImages[0]?.position ?? "50% 50%",
      });
      await insertRow("memories", {
        title: food.name,
        note: note.trim() || food.note,
        images: finalImages,
        image_url: finalImages[0]?.path ?? null,
        image_pos: finalImages[0]?.position ?? "50% 50%",
        happened_on: todayKey(),
        rating,
        source_type: "food",
        source_id: food.id,
        created_by: me?.id ?? null,
      });
      track("ăn thử món", food.name);
    },
    onSuccess: () => {
      setNote("");
      setImages([]);
      setRating(5);
      onClose();
      onDone();
      toast.success("Đã lưu thành kỷ niệm 💕");
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
            Lưu thành kỷ niệm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
