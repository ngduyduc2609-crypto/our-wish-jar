import { PostInteractions } from "@/components/PostInteractions";
import { PostActionsMenu } from "@/components/PostActionsMenu";
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Pencil, Plus, Shuffle, Star, Trash2, MapPin } from "lucide-react";

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
import { ShuffleDrawDialog } from "@/components/RandomDraw";
import { Chip } from "@/components/Chip";
import { useIdentity } from "@/lib/identity";
import { canManage } from "@/lib/ownership";
import {
  deleteRow,
  fetchFoodComments,
  fetchFoodReactions,
  fetchFoods,
  imageAssets,
  insertEntityComment,
  insertRow,
  pickRandom,
  toggleEntityReaction,
  uniqueMemberReactions,
  updateRow,
  type Food,
  type ImageAsset,
} from "@/lib/db";
import { PRICE_LEVELS, REACTIONS } from "@/lib/constants";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FoodPage,
});

function FoodPage() {
  const { me, members, track } = useIdentity();
  const language = useAppLanguage();
  const copy = {
    title: language === "vi" ? "Ăn gì đây ta" : language === "zh" ? "今天吃什么" : "What’s for food?",
    subtitle: language === "vi" ? "món trong danh sách" : language === "zh" ? "个在清单里" : "items in the list",
    tried: language === "vi" ? "món đã thử" : language === "zh" ? "个已尝试" : "tried items",
    all: language === "vi" ? "Tất cả" : language === "zh" ? "全部" : "All",
    triedTab: language === "vi" ? "Đã thử" : language === "zh" ? "已尝试" : "Tried",
    add: language === "vi" ? "Thêm món / quán" : language === "zh" ? "添加美食" : "Add place / dish",
    draw: language === "vi" ? "Quay" : language === "zh" ? "抽奖" : "Draw",
    update: language === "vi" ? "Cập nhật đánh giá" : language === "zh" ? "更新评价" : "Update rating",
    mark: language === "vi" ? "Đã ăn rồi" : language === "zh" ? "已吃过" : "Already tried",
    empty: language === "vi" ? "Chưa có món nào. Thêm món muốn thử nhé 🍜" : language === "zh" ? "还没有美食，添加一个想尝试的吧 🍜" : "No dishes yet. Add one you want to try 🍜",
    randomTitle: language === "vi" ? "Hôm nay mình ăn..." : language === "zh" ? "今天吃什么..." : "What should we eat today...",
    randomEmpty: language === "vi" ? "Danh sách món đang trống" : language === "zh" ? "清单里还没有内容" : "The list is empty",
    markEaten: language === "vi" ? "Đánh dấu đã ăn" : language === "zh" ? "标记已吃过" : "Mark as eaten",
    detailTried: language === "vi" ? "Đã thử" : language === "zh" ? "已尝试" : "Tried",
    detailList: language === "vi" ? "Trong danh sách" : language === "zh" ? "在清单中" : "In list",
  } as const;
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "tried">("all");
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawToken, setDrawToken] = useState(0);
  const [ratingTarget, setRatingTarget] = useState<Food | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [viewing, setViewing] = useState<Food | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);

  const { data: foods = [] } = useQuery({ queryKey: ["foods"], queryFn: fetchFoods });
  const { data: foodReactions = [] } = useQuery({ queryKey: ["food-reactions"], queryFn: fetchFoodReactions });
  const { data: foodComments = [] } = useQuery({ queryKey: ["food-comments"], queryFn: fetchFoodComments });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["foods"] });
    void qc.invalidateQueries({ queryKey: ["food-reactions"] });
    void qc.invalidateQueries({ queryKey: ["food-comments"] });
    void qc.invalidateQueries({ queryKey: ["memories"] });
    void qc.invalidateQueries({ queryKey: ["log"] });
    void qc.invalidateQueries({ queryKey: ["presence"] });
  };

  const triedList = useMemo(() => foods.filter((f) => f.tried), [foods]);
  const visible = tab === "all" ? foods : triedList;

  function draw() {
    setDrawToken((t) => t + 1);
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
          <h1 className="font-display text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">
            {foods.length} {copy.subtitle} · {triedList.length} {copy.tried}
          </p>
        </div>
        <Button className="shrink-0 rounded-full" onClick={draw} disabled={!foods.length}>
          <Shuffle className="size-4" /> {copy.draw}
        </Button>
      </div>

      <div className="flex gap-2">
        <Chip active={tab === "all"} onClick={() => setTab("all")}>
          {copy.all}
        </Chip>
        <Chip active={tab === "tried"} onClick={() => setTab("tried")}>
          {copy.triedTab}
        </Chip>
      </div>

      <Button
        className="w-full rounded-2xl"
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      >
        <Plus className="size-4" /> {copy.add}
      </Button>

      <FoodDialog open={formOpen} onOpenChange={setFormOpen} food={editing} onDone={refresh} />

      <div className="grid gap-3">
        {visible.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            reactions={foodReactions.filter((r) => r.food_id === food.id)}
            comments={foodComments.filter((c) => c.food_id === food.id)}
            memberName={(id: string | null) => members.find((m) => m.id === id)?.name ?? "Ai đó"}
            onChanged={refresh}
            onEdit={() => {
              setEditing(food);
              setFormOpen(true);
            }}
            onMarkTried={() => setRatingTarget(food)}
            onView={() => setViewing(food)}
          />
        ))}
        {visible.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            {copy.empty}
          </p>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name ?? "mục"}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          void remove.mutate(deleteTarget);
          setDeleteTarget(null);
        }}
      />

      <ShuffleDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title={copy.randomTitle}
        emoji="🍜"
        items={foods}
        drawToken={drawToken}
        getKey={(f) => f.id}
        againLabel={language === "vi" ? "Đổi món 🍜" : language === "zh" ? "换一道 🍜" : "Another dish 🍜"}
        emptyLabel={copy.randomEmpty}
        renderItem={(f) => (
          <div>
            <p className="font-display text-xl font-bold">{f.name}</p>
            {f.place ? <p className="mt-1 text-sm text-muted-foreground">📍 {f.place}</p> : null}
            {f.note ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{f.note}</p> : null}
          </div>
        )}
        actions={(f) => (
          <Button
            className="rounded-full"
            onClick={() => {
              setDrawOpen(false);
              setRatingTarget(f);
            }}
          >
            {copy.markEaten}
          </Button>
        )}
      />

      <TriedDialog food={ratingTarget} onClose={() => setRatingTarget(null)} onDone={refresh} />

      <ContentDetailDialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing?.tried ? copy.detailTried : copy.detailList}
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

  const language = useAppLanguage();
  const copy = {
    editTitle: language === "zh" ? "编辑美食" : language === "en" ? "Edit food" : "Sửa món",
    addTitle: language === "zh" ? "新美食" : language === "en" ? "New food" : "Món mới",
    nameLabel: language === "zh" ? "美食/店铺名" : language === "en" ? "Dish / place name" : "Tên món / quán",
    placeLabel: language === "zh" ? "店名" : language === "en" ? "Place" : "Quán",
    addressLabel: language === "zh" ? "地址" : language === "en" ? "Address" : "Địa chỉ",
    priceLabel: language === "zh" ? "价位" : language === "en" ? "Price" : "Mức giá",
    noteLabel: language === "zh" ? "备注" : language === "en" ? "Note" : "Ghi chú",
    saveChanges: language === "zh" ? "保存修改" : language === "en" ? "Save changes" : "Lưu thay đổi",
    saveAdd: language === "zh" ? "保存" : language === "en" ? "Save" : "Lưu lại",
    updateSuccess: language === "zh" ? "已更新 🍽️" : language === "en" ? "Updated 🍽️" : "Đã cập nhật 🍽️",
    createSuccess: language === "zh" ? "已加入美食清单 🍽️" : language === "en" ? "Added to the food list 🍽️" : "Đã thêm vào danh sách ăn uống 🍽️",
  } as const;

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
      toast.success(food ? copy.updateSuccess : copy.createSuccess);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{food ? copy.editTitle : copy.addTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{copy.nameLabel}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "zh" ? "扬州炒饭" : language === "en" ? "Bun cha Huong Lien" : "Bún chả Hương Liên"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.placeLabel}</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.addressLabel}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.priceLabel}</Label>
            <div className="flex gap-2">
              {PRICE_LEVELS.map((p) => (
                <Chip key={p.value} active={price === p.value} onClick={() => setPrice(p.value)}>
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{copy.noteLabel}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <MultiImagePicker value={images} onChange={setImages} />
          <Button
            className="w-full rounded-2xl"
            disabled={!name.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {food ? copy.saveChanges : copy.saveAdd}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FoodCard({
  food,
  reactions,
  comments,
  memberName,
  onChanged,
  onEdit,
  onMarkTried,
  onView,
}: {
  food: Food;
  reactions: { id: string; emoji: string; member_id: string }[];
  comments: { id: string; member_id: string; content: string; created_at: string }[];
  memberName: (id: string | null) => string;
  onChanged: () => void;
  onEdit: () => void;
  onMarkTried: () => void;
  onView: () => void;
}) {
  const { me, track } = useIdentity();
  const language = useAppLanguage();
  const copy = {
    send: language === "zh" ? "发送" : language === "en" ? "Send" : "Gửi",
    commentPlaceholder: language === "zh" ? "说点什么..." : language === "en" ? "Say something..." : "Nhắn gì đó...",
    deleted: language === "zh" ? "已删除" : language === "en" ? "Deleted" : "Đã xoá",
  } as const;
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);
  const mine = canManage(me, food.added_by);

  async function remove() {
    await deleteRow("foods", food.id);
    track("xoá món", food.name);
    onChanged();
    toast.success(copy.deleted);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết ${food.name}`}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) {
          onView();
        }
      }}
      className="paper cursor-pointer overflow-hidden rounded-[28px]"
    >
      <ImageGallery images={imageAssets(food.images, food.image_url, food.image_pos)} alt={food.name} className="h-40 rounded-none" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">{food.name}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {food.place && <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {food.place}</span>}
              <span>· {PRICE_LEVELS.find((p) => p.value === food.price_level)?.label ?? "₫₫"}</span>
              {food.rating ? <span>· {"⭐".repeat(food.rating)}</span> : null}
              {food.tried && <span>· đã thử</span>}
            </p>
            {food.note && <p className="mt-1 text-sm text-muted-foreground">{food.note}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1"><Button variant="ghost" size="icon" aria-label={food.tried ? "Cập nhật đánh giá" : "Đánh dấu đã thử"} onClick={(event) => { event.stopPropagation(); onMarkTried(); }}><Star /></Button>
          {mine && <PostActionsMenu onEdit={onEdit} onDelete={() => setDeleteTarget(food)} />}
          </div>
        </div>

        <PostInteractions entity="food" targetId={food.id} title={food.name} reactions={reactions} comments={comments} memberName={memberName} onChanged={onChanged} />

      <ConfirmDeleteDialog
          open={!!deleteTarget}
          itemName={deleteTarget?.name ?? "mục"}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={() => {
            if (!deleteTarget) return;
            void remove();
            setDeleteTarget(null);
          }}
        />
      </div>
    </article>
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
  const { track } = useIdentity();
  const language = useAppLanguage();
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  const [images, setImages] = useState<ImageAsset[]>([]);

  const copy = {
    ratingLabel: language === "zh" ? "评分" : language === "en" ? "Rating" : "Chấm điểm",
    noteLabel: language === "zh" ? "感受" : language === "en" ? "Note" : "Cảm nhận",
    save: language === "zh" ? "保存评价" : language === "en" ? "Save rating" : "Lưu đánh giá",
    success: language === "zh" ? "已保存评价 🍜" : language === "en" ? "Saved review 🍜" : "Đã lưu đánh giá món ăn 🍜",
  } as const;

  const save = useMutation({
    mutationFn: async () => {
      if (!food) return;
      const finalImages = images.length ? images : imageAssets(food.images, food.image_url, food.image_pos);
      await updateRow("foods", food.id, {
        tried: true,
        tried_at: new Date().toISOString(),
        rating,
        note: note.trim() || food.note,
        images: finalImages,
        image_url: finalImages[0]?.path ?? null,
        image_pos: finalImages[0]?.position ?? "50% 50%",
      });
      track("ăn thử món", food.name);
    },
    onSuccess: () => {
      setNote("");
      setImages([]);
      setRating(5);
      onClose();
      onDone();
      toast.success(copy.success);
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
            <Label>{copy.ratingLabel}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="text-2xl">
                  {n <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{copy.noteLabel}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <MultiImagePicker value={images} onChange={setImages} />
          <Button
            className="w-full rounded-2xl"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {copy.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
