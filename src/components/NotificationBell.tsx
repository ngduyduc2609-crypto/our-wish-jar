import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { useAppLanguage } from "@/lib/language";

import { supabase } from "@/integrations/supabase/client";
import { useIdentity } from "@/lib/identity";
import { playSound } from "@/lib/sound";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Notification = {
  id: string;
  recipient_member_id: string;
  actor_member_id: string | null;
  kind: string;
  subject: string | null;
  created_at: string;
  read_at: string | null;
};

const db = supabase as unknown as { from: (table: string) => any };

const ACTION_TEXT: Record<string, Record<"vi" | "en" | "zh", string>> = {
  wish: { vi: "vừa thêm một điều ước mới", en: "just added a new wish", zh: "刚刚添加了一个新愿望" },
  food: { vi: "vừa thêm một quán/món mới", en: "just added a new place/dish", zh: "刚刚添加了一个新餐馆/美食" },
  activity: { vi: "vừa thêm một hoạt động mới", en: "just added a new activity", zh: "刚刚添加了一个新活动" },
  memory: { vi: "vừa lưu một kỷ niệm mới", en: "just saved a new memory", zh: "刚刚保存了一条新回忆" },
  reaction: { vi: "vừa bày tỏ cảm xúc với một điều ước", en: "just reacted to a wish", zh: "刚刚对一个愿望表达了感受" },
  comment: { vi: "vừa bình luận vào một điều ước", en: "just commented on a wish", zh: "刚刚评论了一个愿望" },
};

export function describe(item: Notification, actorName: string, language: "vi" | "en" | "zh") {
  const action = ACTION_TEXT[item.kind]?.[language] ?? (language === "zh" ? "刚刚更新了内容" : language === "en" ? "just updated something" : "vừa cập nhật gì đó");
  const subject = (item.subject ?? "").split("|")[0]?.trim();
  return { title: `${actorName} ${action}`, subject: subject || null };
}

function timeAgo(iso: string, language: "vi" | "en" | "zh") {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return language === "zh" ? "刚刚" : language === "en" ? "just now" : "vừa xong";
  if (mins < 60) return language === "zh" ? `${mins} 分钟前` : language === "en" ? `${mins} min ago` : `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return language === "zh" ? `${hours} 小时前` : language === "en" ? `${hours}h ago` : `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return language === "zh" ? `${days} 天前` : language === "en" ? `${days}d ago` : `${days} ngày trước`;
}

export function NotificationBell() {
  const { me, members } = useIdentity();
  const language = useAppLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery<Notification[]>({
    queryKey: ["notifications", me?.id],
    enabled: Boolean(me?.id),
    queryFn: async () => {
      if (!me?.id) return [];
      const { data, error } = await db
        .from("notifications")
        .select("*")
        .eq("recipient_member_id", me.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const nameOf = (id: string | null) => members.find((m) => m.id === id)?.name ?? (language === "zh" ? "某人" : language === "en" ? "Someone" : "Người ấy");
  const unread = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!me?.id) return;
    const channel = supabase
      .channel(`notifications-${me.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_member_id=eq.${me.id}` },
        (payload) => {
          const item = payload.new as Notification;
          const { title, subject } = describe(item, nameOf(item.actor_member_id), language);
          playSound("sparkle");
          toast(title, { description: subject ?? undefined });
          if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
            try {
              const options: NotificationOptions = { icon: "/app-icon-192.png" };
              if (subject) options.body = subject;
              new window.Notification(title, options);
            } catch {
              /* bỏ qua nếu trình duyệt chặn */
            }
          }
          void queryClient.invalidateQueries({ queryKey: ["notifications", me.id] });
          void queryClient.invalidateQueries();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, members]);

  const markAllRead = async () => {
    if (!me?.id || unread === 0) return;
    await db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_member_id", me.id)
      .is("read_at", null);
    void queryClient.invalidateQueries({ queryKey: ["notifications", me.id] });
  };

  const askPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (window.Notification.permission === "default") {
      try {
        await window.Notification.requestPermission();
      } catch {
        /* preview có thể chặn */
      }
    }
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          void askPermission();
          void markAllRead();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={language === "zh" ? "通知" : language === "en" ? "Notifications" : "Thông báo"}
          className="jelly relative flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="pop-in absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
              {unread}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl">
        <DropdownMenuLabel className="font-normal text-muted-foreground">{language === "zh" ? "通知" : language === "en" ? "Notifications" : "Thông báo"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">{language === "zh" ? "还没有新消息 🌸" : language === "en" ? "Nothing new yet 🌸" : "Chưa có gì mới đâu 🌸"}</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => {
              const { title, subject } = describe(item, nameOf(item.actor_member_id), language);
              return (
                <div key={item.id} className="rounded-xl px-2 py-2">
                  <p className="text-xs font-medium leading-snug">{title}</p>
                  {subject ? <p className="truncate text-[11px] text-muted-foreground">{subject}</p> : null}
                  <p className="text-[10px] text-muted-foreground">{timeAgo(item.created_at, language)}</p>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
