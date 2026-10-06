import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, MoreHorizontal, Pencil, Plus, Shuffle, Trash2, MapPin, Check } from "lucide-react";

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
  fetchActivities,
  fetchActivityComments,
  fetchActivityReactions,
  insertEntityComment,
  insertRow,
  imageAssets,
  pickRandom,
  toggleEntityReaction,
  updateRow,
  type Activity,
  type ImageAsset,
} from "@/lib/db";
import { ACTIVITY_CATEGORIES, ACTIVITY_TAGS, REACTIONS, labelOf } from "@/lib/constants";
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
  const { me, members, track } = useIdentity();
  const language = useAppLanguage();
  const copy = {
    title: language === "vi" ? "Làm gì hôm nay" : language === "zh" ? "今天做什么" : "What to do today",
    subtitle: language === "vi" ? "ý tưởng" : language === "zh" ? "个想法" : "ideas",
    doneText: language === "vi" ? "đã làm" : language === "zh" ? "已完成" : "done",
    all: language === "vi" ? "Tất cả" : language === "zh" ? "全部" : "All",
    doneTab: language === "vi" ? "Đã làm" : language === "zh" ? "已完成" : "Done",
    mood: language === "vi" ? "Mọi tâm trạng" : language === "zh" ? "所有心情" : "All moods",
    add: language === "vi" ? "Thêm hoạt động" : language === "zh" ? "添加活动" : "Add activity",
    draw: language === "vi" ? "Quay" : language === "zh" ? "随机" : "Draw",
    empty: language === "vi" ? "Chưa có hoạt động nào. Thêm một ý tưởng nhé ✨" : language === "zh" ? "还没有活动，添加一个想法吧 ✨" : "No activities yet. Add an idea ✨",
    randomTitle: language === "vi" ? "Làm gì hôm nay…" : language === "zh" ? "今天做什么…" : "What shall we do today…",
    randomEmpty: language === "vi" ? "Không có hoạt động nào hợp bộ lọc" : language === "zh" ? "没有符合筛选条件的活动" : "No activities match the filter",
    markDone: language === "vi" ? "Đánh dấu đã làm" : language === "zh" ? "标记已完成" : "Mark as done",
    detailDone: language === "vi" ? " · Đã làm" : language === "zh" ? " · 已完成" : " · Done",
  } as const;
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "done">("all");
  const [filter, setFilter] = useState<string | null>(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawToken, setDrawToken] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [viewing, setViewing] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: fetchActivities });
  const { data: activityReactions = [] } = useQuery({ queryKey: ["activity-reactions"], queryFn: fetchActivityReactions });
  const { data: activityComments = [] } = useQuery({ queryKey: ["activity-comments"], queryFn: fetchActivityComments });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["activities"] });
    void qc.invalidateQueries({ queryKey: ["activity-reactions"] });
    void qc.invalidateQueries({ queryKey: ["activity-comments"] });
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
    setDrawToken((t) => t + 1);
    setDrawOpen(true);
  }

  const complete = useMutation({
    mutationFn: async (activity: Activity) => {
      await updateRow("activities", activity.id, {
        done: !activity.done,
        done_at: activity.done ? null : new Date().toISOString(),
      });
      track(activity.done ? "mở lại hoạt động" : "hoàn thành hoạt động", activity.name);
    },
    onSuccess: (_d, activity) => {
      refresh();
      if (!activity.done) toast.success("Đã đánh dấu hoạt động hoàn thành ✨");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">
            {activities.length} {copy.subtitle} · {done.length} {copy.doneText}
          </p>
        </div>
        <Button className="rounded-full" onClick={draw} disabled={!pool.length}>
          <Shuffle className="size-4" /> {copy.draw}
        </Button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={!filter} onClick={() => setFilter(null)}>
          {copy.mood}
        </Chip>
        {ACTIVITY_TAGS.map((t) => {
          const tag = labelOf(ACTIVITY_TAGS, t.value, language);
          return (
            <Chip key={t.value} active={filter === t.value} onClick={() => setFilter(t.value)}>
              {tag.label}
            </Chip>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Chip active={tab === "all"} onClick={() => setTab("all")}>
          {copy.all}
        </Chip>
        <Chip active={tab === "done"} onClick={() => setTab("done")}>
          {copy.doneTab}
        </Chip>
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

      <div className="grid gap-3">
        {visible.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            reactions={activityReactions.filter((r) => r.activity_id === activity.id)}
            comments={activityComments.filter((c) => c.activity_id === activity.id)}
            memberName={(id: string | null) => members.find((m) => m.id === id)?.name ?? "Ai đó"}
            onChanged={refresh}
            onEdit={() => {
              setEditing(activity);
              setDialogOpen(true);
            }}
            onComplete={() => complete.mutate(activity)}
            onView={() => setViewing(activity)}
          />
        ))}
        {visible.length === 0 && (
          <p className="paper rounded-3xl p-6 text-center text-sm text-muted-foreground">
            {copy.empty}
          </p>
        )}
      </div>

      <ActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activity={editing}
        onDone={refresh}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name ?? "mục"}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          void (async () => {
            await deleteRow("activities", deleteTarget.id);
            track("xoá hoạt động", deleteTarget.name);
            refresh();
          })();
          setDeleteTarget(null);
        }}
      />

      <ShuffleDrawDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        title={copy.randomTitle}
        emoji="✨"
        items={pool}
        drawToken={drawToken}
        getKey={(a) => a.id}
        againLabel={language === "vi" ? "Hoạt động khác 🎈" : language === "zh" ? "换个活动 🎈" : "Another activity 🎈"}
        emptyLabel={copy.randomEmpty}
        renderItem={(a) => (
          <div>
            <p className="font-display text-xl font-bold">{a.name}</p>
            {a.place ? <p className="mt-1 text-sm text-muted-foreground">📍 {a.place}</p> : null}
            {a.note ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.note}</p> : null}
          </div>
        )}
        actions={(a) =>
          a.done ? null : (
            <Button
              className="rounded-full"
              onClick={() => {
                complete.mutate(a);
                setDrawOpen(false);
              }}
            >
              {copy.markDone}
            </Button>
          )
        }
      />

      <ContentDetailDialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing ? `${labelOf(ACTIVITY_CATEGORIES, viewing.category, language).emoji} ${labelOf(ACTIVITY_CATEGORIES, viewing.category, language).label}${viewing.done ? copy.detailDone : ""}` : undefined}
        images={viewing ? imageAssets(viewing.images, viewing.image_url, viewing.image_pos) : []}
      >
        {viewing?.place && <p className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{viewing.place}</p>}
        {viewing && viewing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {viewing.tags.map((tag) => <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{labelOf(ACTIVITY_TAGS, tag, language).label}</span>)}
          </div>
        )}
        {viewing?.note && <p className="whitespace-pre-wrap text-muted-foreground">{viewing.note}</p>}
      </ContentDetailDialog>
    </div>
  );
}

function ActivityCard({
  activity,
  reactions,
  comments,
  memberName,
  onChanged,
  onEdit,
  onComplete,
  onView,
}: {
  activity: Activity;
  reactions: { id: string; emoji: string; member_id: string }[];
  comments: { id: string; member_id: string; content: string; created_at: string }[];
  memberName: (id: string | null) => string;
  onChanged: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onView: () => void;
}) {
  const { me, track } = useIdentity();
  const language = useAppLanguage();
  const category = labelOf(ACTIVITY_CATEGORIES, activity.category, language);
  const mine = canManage(me, activity.added_by);
  const [openComments, setOpenComments] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [hoveredReactionIndex, setHoveredReactionIndex] = useState<number | null>(null);
  const longPressRef = useRef<number | null>(null);
  const reactionBarRef = useRef<HTMLDivElement | null>(null);
  const reactionMeta = ["👍", "❤️", "😂", "😮", "😢", "😡"] as const;
  const myReaction = me ? reactions.find((r) => r.member_id === me.id) : null;
  const reactionCount = reactions.length;
  const noSelectStyle = { userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" } as const;

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "U";

  const clearLongPress = () => {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleReactionMove = (event: { clientX: number; currentTarget: HTMLDivElement }) => {
    if (!reactionBarRef.current) return;
    const rect = reactionBarRef.current.getBoundingClientRect();
    const offset = event.clientX - rect.left;
    const percent = Math.min(Math.max(offset / rect.width, 0), 1);
    const index = Math.min(reactionMeta.length - 1, Math.max(0, Math.floor(percent * reactionMeta.length)));
    setHoveredReactionIndex(index);
  };

  const handleReactionRelease = () => {
    if (hoveredReactionIndex !== null) {
      void react(reactionMeta[hoveredReactionIndex]);
    }
    setReactionOpen(false);
    setHoveredReactionIndex(null);
  };

  async function react(emoji: string) {
    if (!me) return;
    const added = await toggleEntityReaction("activity", activity.id, me.id, emoji);
    if (added) track("thả cảm xúc " + emoji, activity.name);
    onChanged();
  }

  async function sendComment() {
    if (!me || !draft.trim()) return;
    await insertEntityComment("activity", activity.id, me.id, draft.trim());
    track("bình luận", activity.name);
    setDraft("");
    onChanged();
  }

  async function remove() {
    await deleteRow("activities", activity.id);
    track("xoá hoạt động", activity.name);
    onChanged();
    toast.success(language === "zh" ? "已删除" : language === "en" ? "Deleted" : "Đã xoá");
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết ${activity.name}`}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) onView();
      }}
      className="paper cursor-pointer overflow-hidden rounded-[28px]"
    >
      <ImageGallery images={imageAssets(activity.images, activity.image_url, activity.image_pos)} alt={activity.name} className="h-40 rounded-none" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{category.emoji} {category.label}</p>
            <h2 className="mt-0.5 font-display text-lg font-semibold">{activity.name}</h2>
            {activity.place && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {activity.place}
              </p>
            )}
            {activity.note && <p className="mt-1 text-sm text-muted-foreground">{activity.note}</p>}
            <div className="mt-2 flex flex-wrap gap-1">
              {activity.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                  {labelOf(ACTIVITY_TAGS, tag, language).label}
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
                onComplete();
              }}
              className={cn(
                "grid size-9 place-items-center rounded-full border transition-colors",
                activity.done ? "border-primary bg-primary text-primary-foreground" : "border-border",
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
                    onEdit();
                  }}
                  className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Xoá hoạt động"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTarget(activity);
                  }}
                  className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-muted/30 pt-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (me && !myReaction) {
                    void react("❤️");
                  }
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  if (window.matchMedia?.("(pointer: coarse)")?.matches) {
                    clearLongPress();
                    longPressRef.current = window.setTimeout(() => {
                      setReactionOpen(true);
                    }, 260);
                  }
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  clearLongPress();
                }}
                onPointerLeave={(event) => {
                  event.stopPropagation();
                  clearLongPress();
                }}
                onMouseEnter={() => setReactionOpen(true)}
                onMouseLeave={() => setReactionOpen(false)}
                style={noSelectStyle}
                className={cn(
                  "select-none rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ease-out active:scale-[0.98]",
                  myReaction ? "border-primary/40 bg-primary/5 text-primary" : "border-border bg-card/80 text-muted-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-sm">{myReaction ? myReaction.emoji : "🤍"}</span>
                  <span>{reactionCount}</span>
                </span>
              </button>

              {reactionOpen && (
                <div
                  ref={reactionBarRef}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerMove={handleReactionMove}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                    handleReactionRelease();
                  }}
                  onPointerLeave={(event) => {
                    event.stopPropagation();
                    handleReactionRelease();
                  }}
                  className="absolute bottom-full left-0 z-20 mb-2 flex items-center gap-1 rounded-full border border-border/40 bg-white/95 px-1.5 py-1 shadow-xl backdrop-blur-md dark:bg-card/95"
                >
                  {reactionMeta.map((emoji, index) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`Thả cảm xúc ${emoji}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void react(emoji);
                        setReactionOpen(false);
                      }}
                      onPointerEnter={() => setHoveredReactionIndex(index)}
                      onPointerMove={handleReactionMove}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        handleReactionRelease();
                      }}
                      style={noSelectStyle}
                      className={cn(
                        "select-none rounded-full p-1 text-lg transition-all duration-150 ease-out",
                        hoveredReactionIndex === index && "scale-150",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpenComments((v) => !v);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              style={noSelectStyle}
              className="select-none rounded-full border border-border bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-150 active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="size-3.5" />
                <span>{comments.length}</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onComplete();
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              style={noSelectStyle}
              className={cn(
                "select-none grid size-9 place-items-center rounded-full border transition-all duration-150 active:scale-[0.98]",
                activity.done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/80 text-muted-foreground",
              )}
            >
              <Check className="size-4" />
            </button>

            {mine && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Cài đặt"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  style={noSelectStyle}
                  className="select-none grid size-8 place-items-center rounded-full border border-border bg-card/80 text-muted-foreground transition-all duration-150 active:scale-[0.98]"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-32 rounded-2xl border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen(false);
                        onEdit();
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-secondary"
                    >
                      <Pencil className="size-3.5" /> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen(false);
                        setDeleteTarget(activity);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-destructive hover:bg-secondary"
                    >
                      <Trash2 className="size-3.5" /> Xoá
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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

        {openComments && (
          <div className="mt-3 rounded-[22px] border border-border bg-secondary/40 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{language === "zh" ? "评论" : language === "en" ? "Comments" : "Bình luận"}</p>
              <span className="rounded-full bg-card/80 px-2 py-0.5 text-[11px] text-muted-foreground">{comments.length}</span>
            </div>
            <div className="max-h-56 space-y-2 overflow-auto pr-1">
              {comments.length === 0 ? (
                <p className="rounded-[18px] bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                  {language === "zh" ? "还没有评论" : language === "en" ? "No comments yet" : "Chưa có bình luận nào"}
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 rounded-[18px] bg-background/70 p-2">
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/25 to-secondary text-[10px] font-semibold text-foreground">
                      {initials(memberName(c.member_id))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground">{memberName(c.member_id)}</p>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={language === "zh" ? "说点什么..." : language === "en" ? "Say something..." : "Nhắn gì đó..."} className="flex-1 rounded-full" />
              <Button className="rounded-full" onClick={() => void sendComment()} disabled={!draft.trim()}>
                {language === "zh" ? "发送" : language === "en" ? "Send" : "Gửi"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
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
  const language = useAppLanguage();
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
              {ACTIVITY_CATEGORIES.map((c) => {
                const item = labelOf(ACTIVITY_CATEGORIES, c.value, language);
                return (
                  <Chip
                    key={c.value}
                    active={category === c.value}
                    onClick={() => setCategory(c.value)}
                  >
                    {item.emoji} {item.label}
                  </Chip>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tâm trạng phù hợp</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TAGS.map((t) => {
                const item = labelOf(ACTIVITY_TAGS, t.value, language);
                return (
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
                    {item.label}
                  </Chip>
                );
              })}
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
