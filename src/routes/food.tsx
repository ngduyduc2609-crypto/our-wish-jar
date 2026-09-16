import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shuffle, Star, Trash2, MapPin } from "lucide-react";
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
import { deleteRow, fetchFoods, insertRow, pickRandom, updateRow, type Food } from "@/lib/db";
import { PRICE_LEVELS, todayKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
    ],
  }),
  component: FoodPage,
});

function FoodPage() {
  const { track } = useIdentity();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"want" | "tried">("want");
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawn, setDrawn] = useState<Food | null>(null);
  const [ratingTarget, setRatingTarget] = useState<Food | null>(null);

  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: fetchFoods });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["foods"] });
    void qc.invalidateQueries({ queryKey: ["memories"] });
    void qc.invalidateQueries({ queryKey: ["log"] });
    void qc.invalidateQueries({ queryKey: ["presence"] });
  };

  const wantList = useMemo(() => foods.filter((f) => !f.tried), [foods]);
  const triedList = useMemo(() => foods.filter((f) => f.tried), [foods]);
  const visible = tab === "want" ? wantList : triedList;

  function draw() {
    setDrawn(pickRandom(wantList, drawn ?? undefined));
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
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Ăn gì đây ta</h1>
          <p className="text-sm text-muted-foreground">
            {wantList.length} món muốn thử · {triedList.length} món đã thử
          </p>
        </div>
        <Button className="rounded-full" onClick={draw} disabled={!wantList.length}>
          <Shuffle className="size-4" /> Quay
        </Button>
      </div>

      <div className="flex gap-2">
        <Chip active={tab === "want"} onClick={() => setTab("want")}>
          Muốn thử
        </Chip>
        <Chip active={tab === "tried"} onClick={() => setTab("tried")}>
          Đã thử
        </Chip>
      </div>

      <NewFoodDialog onDone={refresh} />

      <div className="grid gap-3">
        {visible.map((food) => (
          <article key={food.id} className="paper overflow-hidden rounded-3xl">
            {food.image_url && <StoredImage path={food.image_url} alt={food.name} className="h-40 w-full" />}
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
                    <span>· {PRICE_LEVELS.find((p) => p.value === food.price_level)?.label ?? "₫₫"}</span>
                    {food.rating ? <span>· {"⭐".repeat(food.rating)}</span> : null}
                  </p>
                  {food.note && <p className="mt-1 text-sm text-muted-foreground">{food.note}</p>}
                </div>
                <button
                  type="button"
                  aria-label="Xoá món"
                  onClick={() => remove.mutate(food)}
                  className="rounded-full border border-border p-2 text-muted-foreground"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {!food.tried && (
                <Button
                  variant="secondary"
                  className="mt-3 w-full rounded-2xl"
                  onClick={() => setRatingTarget(food)}
                >
                  <Star className="size-4" /> Đã ăn rồi, lưu kỷ niệm
                </Button>
              )}
            </div>
          </article>
        ))}
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
            <p className="text-sm text-muted-foreground">Chưa có món nào chưa thử</p>
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
            Đã ăn món này rồi
          </Button>
        )}
      </RandomDrawDialog>

      <TriedDialog food={ratingTarget} onClose={() => setRatingTarget(null)} onDone={refresh} />
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

function NewFoodDialog({ onDone }: { onDone: () => void }) {
  const { me, track } = useIdentity();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(2);
  const [note, setNote] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      await insertRow("foods", {
        name: name.trim(),
        place: place.trim() || null,
        address: address.trim() || null,
        price_level: price,
        note: note.trim() || null,
        image_url: image,
        added_by: me?.id ?? null,
      });
      track("thêm món ăn", name.trim());
    },
    onSuccess: () => {
      setName("");
      setPlace("");
      setAddress("");
      setNote("");
      setImage(null);
      setOpen(false);
      onDone();
      toast.success("Đã thêm vào danh sách ăn uống 🍽️");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-2xl">
          <Plus className="size-4" /> Thêm món / quán
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Món mới muốn thử</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tên món / quán</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bún chả Hương Liên" />
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
  const [image, setImage] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!food) return;
      await updateRow("foods", food.id, {
        tried: true,
        tried_at: new Date().toISOString(),
        rating,
        image_url: image ?? food.image_url,
      });
      await insertRow("memories", {
        title: food.name,
        note: note.trim() || food.note,
        image_url: image ?? food.image_url,
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
      setImage(null);
      setRating(5);
      onClose();
      onDone();
      toast.success("Đã lưu thành kỷ niệm 💕");
    },
  });

  return (
    <Dialog open={!!food} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
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
          <ImagePicker value={image} onChange={setImage} />
          <Button className="w-full rounded-2xl" disabled={save.isPending} onClick={() => save.mutate()}>
            Lưu thành kỷ niệm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
