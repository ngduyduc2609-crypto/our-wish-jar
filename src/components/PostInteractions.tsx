import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Copy, Edit3, Heart, MessageCircle, Reply, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { useIdentity } from "@/lib/identity";
import { useAppLanguage } from "@/lib/language";
import { deleteRow, insertEntityComment, toggleEntityReaction, uniqueMemberReactions, updateRow } from "@/lib/db";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "🤣", "😮", "😭", "😠", "👍"] as const;
type Reaction = { id: string; emoji: string; member_id: string };
type Comment = { id: string; member_id: string; content: string; created_at: string };

export function PostInteractions({ entity, targetId, title, reactions, comments, memberName, onChanged }: {
  entity: "wish" | "food" | "activity" | "memory"; targetId: string; title: string;
  reactions: Reaction[]; comments: Comment[]; memberName: (id: string | null) => string; onChanged: () => void;
}) {
  const { me, members, track } = useIdentity();
  const language = useAppLanguage();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localComments, setLocalComments] = useState(comments);
  const [draft, setDraft] = useState("");
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [commentActionsFor, setCommentActionsFor] = useState<string | null>(null);
  const [commentReactions, setCommentReactions] = useState<Record<string, string>>({});
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
  const copy = language === "vi" ? {
    heart: "Cảm xúc",
    comments: "Bình luận",
    input: "Viết bình luận…",
    send: "Gửi",
    empty: "Chưa có bình luận",
    close: "Đóng",
    error: "Không thể lưu. Vui lòng thử lại.",
    login: "Vui lòng đăng nhập để tương tác.",
    reply: "Phản hồi",
    reactToComment: "Thả cảm xúc",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    copy: "Sao chép",
    save: "Lưu",
    cancel: "Hủy",
    deleted: "Đã xóa bình luận",
    copied: "Đã sao chép"
  } : language === "zh" ? {
    heart: "反应",
    comments: "评论",
    input: "写评论…",
    send: "发送",
    empty: "还没有评论",
    close: "关闭",
    error: "无法保存，请重试。",
    login: "请先登录。",
    reply: "回复",
    reactToComment: "添加反应",
    edit: "编辑",
    delete: "删除",
    copy: "复制",
    save: "保存",
    cancel: "取消",
    deleted: "评论已删除",
    copied: "已复制"
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
    reactToComment: "React",
    edit: "Edit",
    delete: "Delete",
    copy: "Copy",
    save: "Save",
    cancel: "Cancel",
    deleted: "Comment deleted",
    copied: "Copied"
  };

  useEffect(() => { if (!busy.current) setLocalReactions(reactions); }, [reactions]);
  useEffect(() => { if (!sendBusy.current) setLocalComments(comments); }, [comments]);

  const clearHold = () => { if (hold.current) clearTimeout(hold.current); hold.current = null; };
  const clearClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const close = () => { setOpen(false); setHovered(null); selected.current = null; };

  useEffect(() => () => { clearHold(); clearClose(); }, []);

  const show = () => {
    clearClose();
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 276)), top: Math.max(8, rect.top - 74) });
    setOpen(true);
  };

  const chooseAt = (x: number, y: number) => {
    const options = picker.current?.querySelectorAll<HTMLElement>("[data-reaction-index]");
    let index: number | null = null;
    options?.forEach((option, i) => { const r = option.getBoundingClientRect(); if (x >= r.left - 3 && x <= r.right + 3 && y >= r.top - 15 && y <= r.bottom + 15) index = i; });
    selected.current = index;
    setHovered(index);
  };

  const startCommentAction = (commentId: string) => {
    clearHold();
    hold.current = setTimeout(() => {
      setCommentActionsFor(commentId);
    }, 350);
  };

  const stopCommentAction = () => { clearHold(); };

  const replyToComment = (comment: Comment) => {
    const name = memberName(comment.member_id);
    setReplyTarget(comment);
    setDraft(`@${name} `);
    setCommentActionsFor(null);
    setSheet(true);
  };

  const reactToComment = (commentId: string, emoji: string) => {
    setCommentReactions((prev) => ({ ...prev, [commentId]: emoji }));
    setCommentActionsFor(null);
  };

  const deleteComment = async (commentId: string) => {
    try {
      await deleteRow(`${entity}_comments`, commentId);
      setLocalComments((rows) => rows.filter((comment) => comment.id !== commentId));
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
      const finalContent = replyTarget ? `${content}` : content;
      const comment = await insertEntityComment(entity, targetId, me.id, finalContent);
      setLocalComments((rows) => [...rows, comment]);
      setDraft("");
      setReplyTarget(null);
      void track("bình luận", title);
    } catch { toast.error(copy.error); }
    finally { sendBusy.current = false; setSending(false); onChanged(); }
  }

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (e.target instanceof Node && !picker.current?.contains(e.target) && !button.current?.contains(e.target)) close(); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { close(); button.current?.focus(); } };
    const move = (e: TouchEvent) => { if (!held.current) return; e.preventDefault(); const t = e.touches[0]; if (t) chooseAt(t.clientX, t.clientY); };
    const end = () => { if (!held.current) return; held.current = false; const index = selected.current; close(); if (index !== null) void react(EMOJIS[index] ?? "❤️"); };
    const cancel = () => { held.current = false; close(); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", cancel);
    window.addEventListener("resize", cancel);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); document.removeEventListener("touchmove", move); document.removeEventListener("touchend", end); document.removeEventListener("touchcancel", cancel); window.removeEventListener("resize", cancel); };
  });

  const unique = uniqueMemberReactions(localReactions);
  const mine = unique.find((r) => r.member_id === me?.id);
  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 450, damping: 25 };

  return <div className="post-interactions mt-4 border-t border-border pt-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex min-h-5 items-center gap-1.5 text-[11px] text-muted-foreground" aria-label={`${unique.length} ${copy.heart}`}>
        <span className="flex -space-x-1.5">{[...new Set(unique.map((r) => r.emoji))].map((emoji) => <span key={emoji} className="grid size-4 place-items-center rounded-full bg-card ring-1 ring-card">{emoji}</span>)}</span>
        {unique.length > 0 && <span className="font-medium">{unique.length}</span>}
      </div>

      <div className="flex items-center gap-1">
        <Button ref={button} variant="ghost" size="sm" disabled={reacting} className={cn("post-reaction-trigger h-8 min-w-0 touch-pan-y rounded-full px-2.5 py-1 text-muted-foreground", mine && "text-primary")} aria-expanded={open} aria-haspopup="dialog" aria-label={copy.heart}
          onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } close(); void react(mine?.emoji ?? "❤️"); }}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") show(); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") closeTimer.current = setTimeout(close, 120); }}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { const t = e.touches[0]; if (!t) return; suppressClick.current = false; touchStart.current = { x: t.clientX, y: t.clientY }; clearHold(); hold.current = setTimeout(() => { held.current = true; suppressClick.current = true; show(); }, 200); }}
          onTouchMove={(e) => { const t = e.touches[0]; const start = touchStart.current; if (!held.current && t && start && Math.hypot(t.clientX - start.x, t.clientY - start.y) > 10) { clearHold(); suppressClick.current = true; } }}
          onTouchEnd={() => { clearHold(); held.current = false; }}
          onTouchCancel={() => { clearHold(); held.current = false; close(); }}
          onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); show(); requestAnimationFrame(() => picker.current?.querySelector<HTMLButtonElement>("button")?.focus()); } }}>
          <Heart className={cn("size-[15px] stroke-[2.2]", mine ? "fill-primary text-primary" : "fill-none text-muted-foreground")} />
          {unique.length > 0 && <span className="ml-1 text-[11px] font-medium">{unique.length}</span>}
        </Button>

        <Button variant="ghost" size="sm" className="h-8 min-w-0 touch-pan-y rounded-full px-2.5 py-1 text-muted-foreground" onClick={() => { close(); setSheet(true); }} aria-label={copy.comments}>
          <MessageCircle className="size-[15px]" />
          {localComments.length > 0 && <span className="ml-1 text-[11px] font-medium">{localComments.length}</span>}
        </Button>
      </div>
    </div>

    {typeof document !== "undefined" && createPortal(<AnimatePresence>{open && <motion.div ref={picker} role="dialog" aria-label={copy.heart} className="post-reaction-popover fixed z-[80] flex h-11 w-[220px] items-center justify-center gap-1 rounded-full border border-border bg-popover/95 p-1.5 text-popover-foreground shadow-lg backdrop-blur-sm" style={position} initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.9 }} transition={spring} onClick={(e) => e.stopPropagation()} onPointerEnter={clearClose} onPointerLeave={(e) => { if (e.pointerType === "mouse") closeTimer.current = setTimeout(close, 120); }}>
      {EMOJIS.map((emoji, index) => <motion.div key={emoji} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: reduced ? 0 : index * 0.02 }}>
        <motion.div animate={{ scale: hovered === index ? 1.2 : 1, y: hovered === index ? -3 : 0, x: hovered !== null && hovered !== index ? (index < hovered ? -2 : 2) : 0 }} transition={spring}>
          <Button data-reaction-index={index} variant="ghost" size="icon" className="size-8 rounded-full text-lg" aria-label={`${copy.heart} ${emoji}`} aria-pressed={mine?.emoji === emoji}
            onPointerEnter={() => { selected.current = index; setHovered(index); }} onFocus={() => setHovered(index)}
            onClick={() => { if (held.current) return; suppressClick.current = true; close(); void react(emoji); }}>{emoji}</Button>
        </motion.div>
      </motion.div>)}
    </motion.div>}</AnimatePresence>, document.body)}

    <Drawer open={sheet} onOpenChange={setSheet} shouldScaleBackground={false}>
      <DrawerContent className="post-comment-sheet mx-auto h-[75svh] max-h-[85svh] max-w-lg rounded-t-3xl" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0"><DrawerTitle>{copy.comments} · {localComments.length}</DrawerTitle><DrawerDescription className="mt-1 truncate">{title}</DrawerDescription></div>
          <DrawerClose asChild><Button variant="ghost" size="icon" aria-label={copy.close}><X /></Button></DrawerClose>
        </div>

        <div className="post-comment-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
          {localComments.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">{copy.empty}</p> : localComments.map((c) => {
            const reaction = commentReactions[c.id];
            const owner = me?.id === c.member_id;
            const selectedComment = commentActionsFor === c.id;
            return <div key={c.id} className="relative flex items-start gap-2.5" onContextMenu={(e) => { e.preventDefault(); setCommentActionsFor(c.id); }} onMouseDown={() => startCommentAction(c.id)} onMouseUp={stopCommentAction} onMouseLeave={stopCommentAction} onTouchStart={() => startCommentAction(c.id)} onTouchEnd={stopCommentAction}>
              {selectedComment && <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" onClick={() => setCommentActionsFor(null)} />}
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-medium" aria-label={memberName(c.member_id)}>{members.find((m) => m.id === c.member_id)?.emoji ?? memberName(c.member_id).split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}</span>
              <div className="relative min-w-0 flex-1">
                <div className={cn("relative inline-block max-w-[84%] rounded-[18px] bg-muted px-3 py-2 shadow-sm transition-all", selectedComment && "z-50 bg-muted/95 ring-1 ring-primary/15 shadow-lg")}>
                  <p className="text-[11px] font-semibold text-foreground/80">{memberName(c.member_id)}</p>
                  {editingCommentId === c.id ? (
                    <div className="mt-2 space-y-2">
                      <Input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="min-w-[200px] rounded-full" aria-label={copy.edit} />
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>{copy.cancel}</Button>
                        <Button type="button" size="sm" onClick={() => void saveEditedComment(c.id)}>{copy.save}</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{c.content}</p>
                  )}

                  {reaction && <div className="mt-2 inline-flex items-center rounded-full border border-border bg-background/80 px-1.5 py-0.5 text-[11px] shadow-sm">{reaction}</div>}

                  {selectedComment && (
                    <div className="absolute left-0 top-0 z-[60] -translate-y-[calc(100%+8px)]">
                      <div className="flex items-center gap-1 rounded-full border border-border bg-background/95 p-1 shadow-lg backdrop-blur-sm">
                        {EMOJIS.map((emoji) => (
                          <button key={emoji} type="button" className="grid size-7 place-items-center rounded-full text-base transition hover:bg-secondary" onClick={() => reactToComment(c.id, emoji)} aria-label={`${copy.reactToComment} ${emoji}`}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedComment && (
                    <div className="absolute left-0 top-full z-[60] mt-2">
                      <div className="flex min-w-[186px] flex-col rounded-2xl border border-border bg-white/95 p-1.5 shadow-xl backdrop-blur-sm dark:bg-card">
                        <button type="button" className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-foreground transition hover:bg-secondary" onClick={() => replyToComment(c)}>
                          <Reply className="size-3.5" /> {copy.reply}
                        </button>
                        {owner && (
                          <button type="button" className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-foreground transition hover:bg-secondary" onClick={() => editComment(c)}>
                            <Edit3 className="size-3.5" /> {copy.edit}
                          </button>
                        )}
                        {owner && (
                          <button type="button" className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10" onClick={() => void deleteComment(c.id)}>
                            <Trash2 className="size-3.5" /> {copy.delete}
                          </button>
                        )}
                        <button type="button" className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-foreground transition hover:bg-secondary" onClick={() => void copyCommentContent(c)}>
                          <Copy className="size-3.5" /> {copy.copy}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <time>{new Date(c.created_at).toLocaleString(language === "vi" ? "vi-VN" : language === "zh" ? "zh-CN" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
                  <button type="button" className="font-medium text-foreground/80" onClick={() => replyToComment(c)}>{copy.reply}</button>
                </div>
              </div>
            </div>;
          })}
        </div>

        <form className="post-comment-composer flex shrink-0 items-center gap-2 border-t border-border px-4 pt-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={me ? (replyTarget ? `${copy.reply} ${memberName(replyTarget.member_id)}` : copy.input) : copy.login} aria-label={copy.input} disabled={!me || sending} className="h-11 min-w-0 flex-1 rounded-full" />
          <Button type="submit" disabled={!me || !draft.trim() || sending} aria-label={copy.send} className="h-11 rounded-full"><Send /><span>{copy.send}</span></Button>
        </form>
      </DrawerContent>
    </Drawer>
  </div>;
}