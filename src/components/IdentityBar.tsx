import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, LogOut, Music, Volume2, VolumeX } from "lucide-react";

import { useIdentity } from "@/lib/identity";
import { daysTogether, todayKey } from "@/lib/constants";
import { computeStreak, fetchPresence } from "@/lib/db";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { playSound, useMusicEnabled, useMusicVolume, useSoundEnabled } from "@/lib/sound";
import { NotificationBell } from "@/components/NotificationBell";
import { StreakFlame } from "@/components/StreakFlame";

export function IdentityBar() {
  const { me, members, signOut } = useIdentity();
  const { data: presence = [] } = useQuery({ queryKey: ["presence"], queryFn: fetchPresence });
  const [soundEnabled, setSoundEnabled] = useSoundEnabled();
  const [musicEnabled, setMusicEnabled] = useMusicEnabled();
  const [musicVolume, setMusicVolume] = useMusicVolume();
  const streak = computeStreak(presence, members.length || 2);
  const activeToday = new Set(presence.filter((entry) => entry.day === todayKey()).map((entry) => entry.member_id));
  const lit = members.length >= 2 && members.every((member) => activeToday.has(member.id));

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <StreakFlame days={streak.current} lit={lit} compact />
          <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold">Wish Jar 🫙</p>
          <p className="text-[11px] text-muted-foreground">
            Thu Thủy &amp; Duy Đức · ngày thứ {daysTogether()}
          </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="jelly flex shrink-0 items-center gap-2 rounded-full bg-secondary py-1.5 pl-3 pr-2 text-xs font-medium text-secondary-foreground" aria-label="Mở menu tài khoản">
              <span>{me?.emoji}</span>
              <span>{me?.name.split(" ").slice(-1)[0]}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl">
            <DropdownMenuLabel className="font-normal text-muted-foreground">{me?.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={soundEnabled}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => {
                setSoundEnabled(checked);
                if (checked) window.setTimeout(() => playSound("success"), 0);
              }}
            >
              {soundEnabled ? <Volume2 /> : <VolumeX />}
              Âm thanh
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={musicEnabled}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => setMusicEnabled(checked)}
            >
              <Music />
              Nhạc nền
            </DropdownMenuCheckboxItem>
            <div className="px-2 pb-2 pt-1" onPointerDown={(event) => event.stopPropagation()}>
              <p className="mb-1 text-[11px] text-muted-foreground">Âm lượng nhạc</p>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(musicVolume * 100)}
                disabled={!musicEnabled}
                onChange={(event) => setMusicVolume(Number(event.target.value) / 100)}
                className="h-1.5 w-full accent-primary disabled:opacity-40"
                aria-label="Âm lượng nhạc nền"
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut()}>
              <LogOut /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export function IdentityGate() {
  const { members, signedIn, signIn, signOut, claim } = useIdentity();
  const [busy, setBusy] = useState(false);

  const free = members.filter((m) => !m.user_id);

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6">
      <div className="paper w-full max-w-sm rounded-3xl p-7 text-center">
        <p className="text-4xl">🫙</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Wish List của chúng mình</h1>

        {!signedIn ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Đây là nơi riêng của hai đứa mình, đăng nhập để mở lọ nhé.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await signIn();
                } catch {
                  toast.error("Chưa đăng nhập được, thử lại nhé");
                } finally {
                  setBusy(false);
                }
              }}
              className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 text-base font-medium text-primary-foreground shadow disabled:opacity-60"
            >
              Đăng nhập bằng Google
            </button>
          </>
        ) : free.length > 0 ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Bạn là ai nè?</p>
            <div className="mt-6 space-y-3">
              {free.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await claim(member.id);
                    } catch {
                      toast.error("Không nhận được chỗ này, thử lại nhé");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-base font-medium transition-colors hover:bg-accent disabled:opacity-60"
                >
                  <span className="mr-2 text-xl">{member.emoji}</span>
                  {member.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-5 text-xs text-muted-foreground underline"
            >
              Đăng nhập tài khoản khác
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Lọ điều ước này chỉ dành cho Thu Thủy và Duy Đức thôi.
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-6 w-full rounded-2xl border border-border px-4 py-3 text-base font-medium"
            >
              Đăng nhập tài khoản khác
            </button>
          </>
        )}
      </div>
    </div>
  );
}
