import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Copy, Edit3, Heart, MessageCircle, Reply, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { ReactionIcon, REACTIONS, reactionLabel } from "@/components/ReactionIcon";
import { useIdentity } from "@/lib/identity";
import { useAppLanguage } from "@/lib/language";
import { deleteRow, insertEntityComment, toggleEntityReaction, uniqueMemberReactions, updateRow } from "@/lib/db";
import { cn } from "@/lib/utils";
import { commentMenuPosition } from "@/lib/comment-menu";
import { COMMENT_HOLD_MS, REACTION_HOLD_MS, shouldCancelReactionHold } from "@/lib/reaction-gesture";
import { groupCommentThreads } from "@/lib/comment-threads";
import { useCommentViewport } from "@/hooks/use-comment-viewport";

type Reaction = { id: string; emoji: string; member_id: string };
type Comment = { id: string; member_id: string; content: string; created_at: string; parent_id?: string | null };

const PICKER_W = 312;
const PICKER_H = 60;

export function PostInteractions({ entity, targetId, title, reactions, comments, memberName, onChanged }: {
  entity: "wish" | "food" | "activity" | "memory"; targetId: string; title: string;
  reactions: Reaction[]; comments: Comment[]; memberName: (id: string | null) => string; onChanged: () => void;
}) {
  const { me, members, track } = useIdentity();
  const language = useAppLanguage();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const viewportArea = useCommentViewport(sheet);
  const [peopleSheet, setPeopleSheet] = useState(false);
  const [peopleFilter, setPeopleFilter] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);
  const [above, setAbove] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localComments, setLocalComments] = useState(comments);
  const [draft, setDraft] = useState("");
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [commentActionsFor, setCommentActionsFor] = useState<string | null>(null);
  const [holdingComment, setHoldingComment] = useState<string | null>(null);
  const [actionsClosing, setActionsClosing] = useState(false);
  const closeActions = () => { if (!commentActionsFor || actionsClosing) return; setActionsClosing(true); setTimeout(() => { setCommentActionsFor(null); setActionsClosing(false); }, 180); };
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [reacting, setReacting] = useState(false);
  const [sending, setSending] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);
  const suppressClick = useRef(false);
  const selected = useRef<number | null>(null);
  const busy = useRef(false);
  const sendBusy = useRef(false);
  const composer = useRef<HTMLInputElement>(null);
  const commentHold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commentStart = useRef<{ x: number; y: number } | null>(null);
  const commentHeld = useRef(false);
  const copy = language === "vi" ? {
    heart: "Cảm xúc",
    comments: "Bình luận",
    input: "Viết bình luận…",
    send: "Gửi",
    empty: "Chưa có bình luận nào",
    close: "Đóng",
    error: "Không thể lưu. Vui lòng thử lại.",
    login: "Vui lòng đăng nhập để tương tác.",
    reply: "Phản hồi",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    copy: "Sao chép",
    save: "Lưu",
    cancel: "Hủy",
    deleted: "Đã xóa bình luận",
    copied: "Đã sao chép",
    replying: "Đang trả lời",
    mine: "Cảm xúc của bạn",
  } : language === "zh" ? {
    heart: "表情",
    comments: "评论",
    input: "写评论…",
    send: "发送",
    empty: "还没有评论",
    close: "关闭",
    error: "无法保存，请重试。",
    login: "请先登录。",
    reply: "回复",
    edit: "编辑",
    delete: "删除",
    copy: "复制",
    save: "保存",
    cancel: "取消",
    deleted: "评论已删除",
    copied: "已复制",
    replying: "正在回复",
    mine: "你的表情",
  } : {
    heart: "React",
    comments: "Comments",
    input: "Write a comment…",
    send: "Send",
    empty: "No comments yet",
    close: "Close",
    error: "Could not save. Please try again.",
    login: "Please sign in first.",
    reply: "Reply",
    edit: "Edit",
    delete: "Delete",
    copy: "Copy",
    save: "Save",
    cancel: "Cancel",
    deleted: "Comment deleted",
    copied: "Copied",
    replying: "Replying to",
    mine: "Your reaction",
  };

  useEffect(() => { if (!busy.current) setLocalReactions(reactions); }, [reactions]);
  useEffect(() => { if (!sendBusy.current) setLocalComments(comments); }, [comments]);

  const clearHold = () => { if (hold.current) clearTimeout(hold.current); hold.current = null; };
  const clearClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const close = () => { setOpen(false); setHovered(null); selected.current = null; };

  useEffect(() => () => { clearHold(); clearClose(); if (commentHold.current) clearTimeout(commentHold.current); }, []);
  useEffect(() => {
    if (!sheet) {
      setCommentActionsFor(null);
      if (commentHold.current) clearTimeout(commentHold.current);
    }
  }, [sheet]);

  const show = () => {
    clearClose();
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(PICKER_W, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8));
    const fitsAbove = rect.top > PICKER_H + 26;
    setAbove(fitsAbove);
    setPosition({ left, top: fitsAbove ? rect.top - PICKER_H - 14 : rect.bottom + 14 });
    setOpen(true);
  };

  const chooseAt = (x: number, y: number) => {
    const options = picker.current?.querySelectorAll<HTMLElement>("[data-reaction-index]");
    let index: number | null = null;
    options?.forEach((option, i) => { const r = option.getBoundingClientRect(); if (x >= r.left - 4 && x <= r.right + 4 && y >= r.top - 12 && y <= r.bottom + 12) index = i; });
    selected.current = index;
    setHovered(index);
  };

  const startCommentAction = (commentId: string, x: number, y: number) => {
    stopCommentAction();
    commentHeld.current = false;
    commentStart.current = { x, y };
    setHoldingComment(commentId);
    commentHold.current = setTimeout(() => {
      commentHeld.current = true;
      setHoldingComment(null);
      setActionsClosing(false);
      try { navigator.vibrate?.(12); } catch { /* unsupported */ }
      setCommentActionsFor(commentId);
    }, COMMENT_HOLD_MS);
  };

  const stopCommentAction = () => {
    if (commentHold.current) clearTimeout(commentHold.current);
    commentHold.current = null;
    commentStart.current = null;
    setHoldingComment(null);
  };

  const replyToComment = (comment: Comment) => {
    setReplyTarget(comment);
    setDraft("");
    setCommentActionsFor(null);
    setSheet(true);
    composer.current?.focus({ preventScroll: true });
  };

  const deleteComment = async (commentId: string) => {
    try {
      await deleteRow(`${entity}_comments`, commentId);
      setLocalComments((rows) => rows.filter((comment) => comment.id !== commentId).map((comment) => comment.parent_id === commentId ? { ...comment, parent_id: null } : comment));
      setReplyTarget((target) => target?.id === commentId ? null : target);
      setCommentActionsFor(null);
      toast.success(copy.deleted);
      onChanged();
    } catch {
      toast.error(copy.error);
    }
  };

  const editComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditDraft(comment.content);
    setCommentActionsFor(null);
  };

  const saveEditedComment = async (commentId: string) => {
    const content = editDraft.trim();
    if (!content) return;
    try {
      const updated = await updateRow<Comment>(`${entity}_comments`, commentId, { content });
      setLocalComments((rows) => rows.map((row) => row.id === commentId ? { ...row, content: updated.content } : row));
      setEditingCommentId(null);
      setEditDraft("");
      onChanged();
    } catch {
      toast.error(copy.error);
    }
  };

  const copyCommentContent = async (comment: Comment) => {
    try {
      await navigator.clipboard.writeText(comment.content);
      toast.success(copy.copied);
      setCommentActionsFor(null);
    } catch {
      toast.error(copy.error);
    }
  };

  async function react(emoji: string) {
    if (!me) { toast.error(copy.login); return; }
    if (busy.current) return;
    busy.current = true; setReacting(true);
    const previous = localReactions;
    const mine = previous.find((r) => r.member_id === me.id);
    const next = previous.filter((r) => r.member_id !== me.id);
    if (mine?.emoji !== emoji) next.push({ id: `optimistic-${me.id}`, member_id: me.id, emoji });
    setLocalReactions(next);
    if (mine?.emoji !== emoji) setBurst((value) => value + 1);
    try {
      const added = await toggleEntityReaction(entity, targetId, me.id, emoji);
      if (added) void track("thả cảm xúc " + emoji, title);
    } catch { setLocalReactions(previous); toast.error(copy.error); }
    finally { busy.current = false; setReacting(false); onChanged(); }
  }

  async function send() {
    const content = draft.trim();
    if (!me || !content || sendBusy.current) return;
    sendBusy.current = true; setSending(true);
    try {
      const body = content;
      const comment = await insertEntityComment(entity, targetId, me.id, body, replyTarget?.id ?? null);
      setLocalComments((rows) => [...rows, comment]);
      setDraft("");
      setReplyTarget(null);
      void track("bình luận", title);
    } catch { toast.error(copy.error); }
    finally { sendBusy.current = false; setSending(false); onChanged(); }
  }

  const finishHeld = () => {
    clearHold();
    touchStart.current = null;
    if (!held.current) return;
    held.current = false;
    const index = selected.current;
    close();
    const reaction = index === null ? undefined : REACTIONS[index];
    if (reaction) void react(reaction.emoji);
  };

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (e.target instanceof Node && !picker.current?.contains(e.target) && !button.current?.contains(e.target)) close(); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { close(); button.current?.focus(); } };
    const move = (e: TouchEvent) => { if (!held.current) return; e.preventDefault(); const t = e.touches[0]; if (t) chooseAt(t.clientX, t.clientY); };
    const end = finishHeld;
    const cancel = () => { held.current = false; close(); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", cancel);
    window.addEventListener("resize", cancel);
    const scroll = () => { if (!held.current) close(); };
    window.addEventListener("scroll", scroll, true);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); document.removeEventListener("touchmove", move); document.removeEventListener("touchend", end); document.removeEventListener("touchcancel", cancel); window.removeEventListener("resize", cancel); window.removeEventListener("scroll", scroll, true); };
  });

  const unique = uniqueMemberReactions(localReactions);
  const mine = unique.find((r) => r.member_id === me?.id);
  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 24 };
  const actionComment = localComments.find((comment) => comment.id === commentActionsFor);
  const [focusRect, setFocusRect] = useState<{ top: number; left: number; width: number; bubbleTop: number; menuTop: number; menuLeft: number; above: boolean } | null>(null);
  const actionCount = actionComment ? (me?.id === actionComment.member_id ? 4 : 2) : 0;
  useLayoutEffect(() => {
    if (!commentActionsFor) { setFocusRect(null); return; }
    const bubble = document.getElementById(`comment-bubble-${commentActionsFor}`);
    const sheetEl = bubble?.closest(".post-comment-sheet");
    if (!bubble || !sheetEl) { setFocusRect(null); return; }
    const b = bubble.getBoundingClientRect(); const r = sheetEl.getBoundingClientRect();
    const place = commentMenuPosition({ top: b.top - r.top, bottom: b.bottom - r.top, left: b.left - r.left }, { width: r.width, height: r.height }, actionCount * 44 + 14 + 2);
    setFocusRect({ top: b.top - r.top, left: b.left - r.left, width: b.width, ...place });
  }, [commentActionsFor, actionCount]);
  useEffect(() => {
    if (!commentActionsFor) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); closeActions(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  return <div className="post-interactions mt-3 border-t border-border pt-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="sm" disabled={unique.length === 0} className={cn("post-reaction-summary h-8 gap-1.5 rounded-full px-1.5 text-[11px] text-muted-foreground", unique.length === 0 && "invisible")} onClick={() => { close(); setPeopleFilter(null); setPeopleSheet(true); }} aria-label={`${unique.length} ${copy.heart} · ${language === "vi" ? "Xem ai đã thả cảm xúc" : language === "zh" ? "查看表情成员" : "See who reacted"}`}>
        {unique.length > 0 && <span className="flex -space-x-1.5">{[...new Set(unique.map((r) => r.emoji))].slice(0, 3).map((emoji) => <span key={emoji} className="grid size-[18px] place-items-center rounded-full bg-card ring-1 ring-card"><ReactionIcon emoji={emoji} className="size-[15px]" /></span>)}</span>}
        {unique.length > 0 && <span className="font-medium">{unique.length}</span>}
      </Button>

      <div className="flex items-center gap-1">
        <Button ref={button} variant="ghost" size="sm" disabled={reacting} className={cn("post-reaction-trigger h-8 min-w-0 touch-pan-y gap-1.5 rounded-full px-2.5 py-1 text-muted-foreground", mine && "text-primary")} aria-expanded={open} aria-haspopup="dialog" aria-label={copy.heart} title={mine ? copy.mine : undefined}
          onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } close(); void react(mine?.emoji ?? "❤️"); }}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") show(); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") closeTimer.current = setTimeout(close, 120); }}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { const t = e.touches[0]; if (!t) return; suppressClick.current = false; touchStart.current = { x: t.clientX, y: t.clientY }; clearHold(); hold.current = setTimeout(() => { held.current = true; suppressClick.current = true; selected.current = null; setHovered(null); show(); }, REACTION_HOLD_MS); }}
          onTouchMove={(e) => { const t = e.touches[0]; const start = touchStart.current; if (!held.current && t && start && shouldCancelReactionHold(start, { x: t.clientX, y: t.clientY })) { clearHold(); suppressClick.current = true; } }}
          onTouchEnd={finishHeld}
          onTouchCancel={() => { clearHold(); held.current = false; close(); }}
          onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); show(); requestAnimationFrame(() => picker.current?.querySelector<HTMLButtonElement>("button")?.focus()); } }}>
          <span className="relative grid size-5 place-items-center">
            <motion.span key={burst} initial={burst && !reduced ? { scale: 0.55, rotate: -15 } : false} animate={{ scale: 1, rotate: 0 }} transition={spring}>
              {mine ? <ReactionIcon emoji={mine.emoji} className="size-5" /> : <Heart className="size-[15px] text-muted-foreground" />}
            </motion.span>
            {burst > 0 && mine && !reduced && <span key={`burst-${burst}`} className="reaction-sparkles" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</span>}
          </span>
          {!mine && <span className="text-[11px] font-medium">{copy.heart}</span>}
        </Button>

        <Button variant="ghost" size="sm" className="h-8 min-w-0 touch-pan-y gap-1.5 rounded-full px-2.5 py-1 text-muted-foreground" onClick={() => { close(); setSheet(true); }} aria-label={copy.comments}>
          <MessageCircle className="size-[15px]" />
          <span className="text-[11px] font-medium">{localComments.length > 0 ? localComments.length : copy.comments}</span>
        </Button>
      </div>
    </div>

    {typeof document !== "undefined" && createPortal(<AnimatePresence>{open && <motion.div ref={picker} role="dialog" aria-label={copy.heart} className="post-reaction-popover fixed z-[90] flex h-[60px] w-[312px] max-w-[calc(100vw-16px)] items-center justify-evenly rounded-full border border-border bg-popover p-1.5" style={position} initial={{ opacity: 0, y: reduced ? 0 : above ? 12 : -12, scale: reduced ? 1 : 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduced ? 0 : above ? 8 : -8, scale: reduced ? 1 : 0.92, transition: { duration: reduced ? 0 : 0.16 } }} transition={spring} onClick={(e) => e.stopPropagation()} onPointerEnter={clearClose} onPointerLeave={(e) => { if (e.pointerType === "mouse") closeTimer.current = setTimeout(close, 160); }}>
      {REACTIONS.map((reaction, index) => (
        <motion.div key={reaction.emoji} className="relative" initial={{ opacity: 0, y: reduced ? 0 : above ? 10 : -10, scale: reduced ? 1 : 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...spring, delay: reduced ? 0 : index * 0.024 }}>
          <AnimatePresence>{hovered === index && <motion.span className="reaction-focus-label absolute bottom-full left-1/2 mb-5 whitespace-nowrap rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background" initial={{ opacity: 0, x: "-50%", y: reduced ? 0 : 4 }} animate={{ opacity: 1, x: "-50%", y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>{reaction.label[language]}</motion.span>}</AnimatePresence>
          <motion.div animate={{ scale: hovered === index && !reduced ? 1.45 : 1, y: hovered === index && !reduced ? -9 : 0, x: hovered !== null && hovered !== index && !reduced ? (index < hovered ? -2 : 2) : 0 }} transition={spring}>
            <Button data-reaction-index={index} variant="ghost" size="icon" className={cn("reaction-option size-10 rounded-full p-0", hovered === index && "reaction-option-focused")} aria-label={`${copy.heart} ${reaction.label[language]}`} aria-pressed={mine?.emoji === reaction.emoji}
              onPointerEnter={() => { selected.current = index; setHovered(index); }} onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const buttons = picker.current?.querySelectorAll<HTMLButtonElement>("[data-reaction-index]"); buttons?.[(index + (e.key === "ArrowRight" ? 1 : -1) + REACTIONS.length) % REACTIONS.length]?.focus(); } }}
              onClick={() => { if (held.current) return; suppressClick.current = true; close(); void react(reaction.emoji); }}>
              <ReactionIcon emoji={reaction.emoji} className="reaction-art size-9" />
            </Button>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>}</AnimatePresence>, document.body)}

    <Drawer open={peopleSheet} onOpenChange={setPeopleSheet} shouldScaleBackground={false}>
      <DrawerContent className="post-comment-sheet mx-auto max-h-[70svh] max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0"><DrawerTitle>{copy.heart} · {unique.length}</DrawerTitle><DrawerDescription className="truncate">{title}</DrawerDescription></div>
          <DrawerClose asChild><Button variant="ghost" size="icon" aria-label={copy.close}><X /></Button></DrawerClose>
        </div>
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-4 py-2">
          <Button variant={peopleFilter === null ? "secondary" : "ghost"} size="sm" aria-pressed={peopleFilter === null} onClick={() => setPeopleFilter(null)}>{language === "vi" ? "Tất cả" : language === "zh" ? "全部" : "All"} · {unique.length}</Button>
          {[...new Set(unique.map((r) => r.emoji))].map((emoji) => <Button key={emoji} variant={peopleFilter === emoji ? "secondary" : "ghost"} size="sm" aria-label={reactionLabel(emoji, language)} aria-pressed={peopleFilter === emoji} onClick={() => setPeopleFilter(emoji)}><ReactionIcon emoji={emoji} className="size-5" />{unique.filter((r) => r.emoji === emoji).length}</Button>)}
        </div>
        <div className="post-comment-scroll overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
          {unique.filter((r) => peopleFilter === null || r.emoji === peopleFilter).map((r) => <div key={r.member_id} className="flex items-center gap-3 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-medium">{memberName(r.member_id).split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span>
            <span className="min-w-0 flex-1 break-words text-sm font-semibold">{memberName(r.member_id)}</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground"><span>{reactionLabel(r.emoji, language)}</span><ReactionIcon emoji={r.emoji} className="size-8" /></span>
          </div>)}
        </div>
      </DrawerContent>
    </Drawer>

    <Drawer open={sheet} onOpenChange={setSheet} shouldScaleBackground={false} repositionInputs={false}>
      <DrawerContent style={viewportArea} className="post-comment-sheet post-comment-keyboard-sheet mx-auto h-[75dvh] max-w-lg rounded-t-3xl" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0"><DrawerTitle>{copy.comments} · {localComments.length}</DrawerTitle><DrawerDescription className="mt-1 truncate">{title}</DrawerDescription></div>
          <DrawerClose asChild><Button variant="ghost" size="icon" aria-label={copy.close}><X /></Button></DrawerClose>
        </div>

        <div className="post-comment-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4" onScroll={() => { stopCommentAction(); if (commentActionsFor) closeActions(); }}>
          {localComments.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">{copy.empty}</p> : groupCommentThreads(localComments).map((thread) => <div key={thread.root.id} className="comment-thread">{[thread.root, ...thread.replies].map((c, index) => {
            const selectedComment = commentActionsFor === c.id;
            return <div key={c.id} data-parent-id={c.parent_id ?? undefined} className={cn("relative flex items-start gap-2.5", index > 0 && "comment-thread-reply")}>
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-medium shadow-sm ring-1 ring-border/60" aria-label={memberName(c.member_id)}>{members.find((m) => m.id === c.member_id)?.emoji ?? memberName(c.member_id).split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}</span>
              <div className="relative min-w-0 flex-1">
                <div id={`comment-bubble-${c.id}`} data-vaul-no-drag className={cn("relative inline-block max-w-full rounded-[18px] bg-muted px-3 py-2 shadow-sm", selectedComment && "opacity-0", holdingComment === c.id && "comment-holding")}
                  onContextMenu={(e) => { e.preventDefault(); stopCommentAction(); setActionsClosing(false); setCommentActionsFor(c.id); }}
                  onPointerDown={(e) => { e.stopPropagation(); if (!e.isPrimary || e.button !== 0 || (e.target instanceof Element && e.target.closest("button,input,textarea"))) return; startCommentAction(c.id, e.clientX, e.clientY); }}
                  onPointerMove={(e) => { const start = commentStart.current; if (start && shouldCancelReactionHold(start, { x: e.clientX, y: e.clientY })) stopCommentAction(); }}
                  onPointerUp={(e) => { e.stopPropagation(); stopCommentAction(); }} onPointerCancel={stopCommentAction} onPointerLeave={stopCommentAction}
                  onClickCapture={(e) => { if (commentHeld.current) { e.preventDefault(); e.stopPropagation(); commentHeld.current = false; } }}>
                  <p className="text-[11px] font-semibold text-foreground/80">{memberName(c.member_id)}</p>
                  {editingCommentId === c.id ? (
                    <div className="mt-2 space-y-2">
                      <Input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="w-full min-w-0 rounded-full text-base md:text-sm" aria-label={copy.edit} />
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>{copy.cancel}</Button>
                        <Button type="button" size="sm" onClick={() => void saveEditedComment(c.id)}>{copy.save}</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{c.content}</p>
                  )}

                </div>

                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <time>{new Date(c.created_at).toLocaleString(language === "vi" ? "vi-VN" : language === "zh" ? "zh-CN" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
                  <Button variant="ghost" size="sm" type="button" className="h-auto px-1 py-0 text-[10px] font-medium" onClick={() => replyToComment(c)}>{copy.reply}</Button>
                </div>
              </div>
            </div>;
          })}</div>)}
        </div>

        {actionComment && <div className={cn("comment-actions-layer absolute inset-0 z-[70]", actionsClosing && "is-closing")}>
          <div className="post-sheet-overlay absolute inset-0" onClick={closeActions} onContextMenu={(e) => e.preventDefault()} />
          {focusRect && <div className={cn("comment-focus-stack absolute inset-x-0 z-[2] flex gap-2 overflow-y-auto overscroll-contain", focusRect.above ? "flex-col-reverse" : "flex-col")} style={{ top: Math.max(8, focusRect.above ? focusRect.menuTop : focusRect.bubbleTop), maxHeight: "calc(100% - 16px)" }} onClick={(e) => { if (e.target === e.currentTarget) closeActions(); }}>
            <div className="comment-focus-bubble comment-lifted pointer-events-none relative shrink-0 overflow-hidden rounded-[18px] bg-muted px-3 py-2" style={{ marginLeft: focusRect.left, width: focusRect.width }}><p className="text-[11px] font-semibold text-foreground/80">{memberName(actionComment.member_id)}</p><p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{actionComment.content}</p></div>
            <div data-vaul-no-drag role="menu" aria-label={copy.comments} className={cn("comment-action-panel relative flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl", focusRect.above && "is-above")} style={{ marginLeft: focusRect.menuLeft }}>
              <Button role="menuitem" variant="ghost" className="comment-menu-item h-11 w-full shrink-0 justify-start gap-3 rounded-xl" onClick={() => replyToComment(actionComment)}><Reply className="size-4" />{copy.reply}</Button>
              {me?.id === actionComment.member_id && <><Button role="menuitem" variant="ghost" className="comment-menu-item h-11 w-full shrink-0 justify-start gap-3 rounded-xl" onClick={() => editComment(actionComment)}><Edit3 className="size-4" />{copy.edit}</Button><Button role="menuitem" variant="ghost" className="comment-menu-item h-11 w-full shrink-0 justify-start gap-3 rounded-xl text-destructive" onClick={() => void deleteComment(actionComment.id)}><Trash2 className="size-4" />{copy.delete}</Button></>}
              <Button role="menuitem" variant="ghost" className="comment-menu-item h-11 w-full shrink-0 justify-start gap-3 rounded-xl" onClick={() => void copyCommentContent(actionComment)}><Copy className="size-4" />{copy.copy}</Button>
            </div>
          </div>}
        </div>}

        <form data-vaul-no-drag className="post-comment-composer grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border px-3 pt-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          {replyTarget && (
            <div className="col-span-2 grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs text-muted-foreground" role="status">
              <Reply className="size-3 shrink-0" /><span className="min-w-0 flex-1 break-words">{copy.replying} {memberName(replyTarget.member_id)}</span>
              <Button variant="ghost" size="icon" type="button" className="size-8 shrink-0" aria-label={copy.cancel} onClick={() => { setReplyTarget(null); composer.current?.focus({ preventScroll: true }); }}><X className="size-3.5" /></Button>
            </div>
          )}
          <Input ref={composer} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={me ? (replyTarget ? `${copy.reply}…` : copy.input) : copy.login} aria-label={copy.input} disabled={!me || sending} className="h-11 min-w-0 rounded-full text-base md:text-sm" />
          <Button type="submit" size="icon" disabled={!me || !draft.trim() || sending} aria-label={copy.send} className="size-11 shrink-0 rounded-full"><Send /></Button>
        </form>
      </DrawerContent>
    </Drawer>
  </div>;
}
