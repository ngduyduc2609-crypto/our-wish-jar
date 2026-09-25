import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Languages, LogOut, Mail, Music, Palette, Volume2, VolumeX } from "lucide-react";

import { useIdentity } from "@/lib/identity";
import { daysTogether, todayKey } from "@/lib/constants";
import { computeStreak, fetchPresence } from "@/lib/db";
import { LANGUAGE_OPTIONS, applyLanguage, getLanguageStorageKey, readStoredLanguage, type AppLanguage } from "@/lib/language";
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

const THEME_OPTIONS = [
  {
    id: "lilac-dream",
    label: { vi: "Lilac Dream", en: "Lilac Dream", zh: "淡紫梦境" },
    swatch: "linear-gradient(135deg, #f5eefe 0%, #e6d9ff 46%, #f8e9ef 100%)",
    themeColor: "#f8f3ff",
  },
  {
    id: "blush-warm",
    label: { vi: "Warm Blush", en: "Warm Blush", zh: "暖粉柔光" },
    swatch: "linear-gradient(135deg, #f7eadf 0%, #f5d6d8 46%, #fdf5ef 100%)",
    themeColor: "#fdf5ef",
  },
  {
    id: "ocean-soft",
    label: { vi: "Ocean Calm", en: "Ocean Calm", zh: "海蓝宁静" },
    swatch: "linear-gradient(135deg, #edfafd 0%, #d9efff 46%, #f7eaf1 100%)",
    themeColor: "#edfafd",
  },
  {
    id: "matcha-pure",
    label: { vi: "Pure Matcha", en: "Pure Matcha", zh: "薄荷清雅" },
    swatch: "linear-gradient(135deg, #edf6ee 0%, #dfeedc 46%, #f8f2e9 100%)",
    themeColor: "#f6faf7",
  },
] as const;

type ThemeId = (typeof THEME_OPTIONS)[number]["id"];

function isThemeId(value: string | null): value is ThemeId {
  return Boolean(value && THEME_OPTIONS.some((theme) => theme.id === value));
}

function getThemeStorageKey() {
  if (typeof window === "undefined") return "wish-jar-theme:guest";
  const email = (window.localStorage.getItem("wishjar_user_email") ?? "").trim().toLowerCase();
  return email ? `wish-jar-theme:${email}` : "wish-jar-theme:guest";
}

function applyTheme(themeId: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = themeId;

  const theme = THEME_OPTIONS.find((option) => option.id === themeId);
  const meta = document.querySelector('meta[name="theme-color"]') ?? document.createElement("meta");
  if (!meta.hasAttribute("name")) {
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", theme?.themeColor ?? "#f8f2ff");
}

export function IdentityBar() {
  const { me, members, signOut } = useIdentity();
  const { data: presence = [] } = useQuery({ queryKey: ["presence"], queryFn: fetchPresence });
  const [soundEnabled, setSoundEnabled] = useSoundEnabled();
  const [musicEnabled, setMusicEnabled] = useMusicEnabled();
  const [musicVolume, setMusicVolume] = useMusicVolume();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("lilac-dream");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>("vi");
  const streak = computeStreak(presence, members.length || 2);
  const themeMenuLabel = selectedLanguage === "zh" ? "主题" : "Theme";
  const languageMenuLabel = selectedLanguage === "vi" ? "Ngôn ngữ" : selectedLanguage === "zh" ? "语言" : "Language";
  const themePickerHeading =
    selectedLanguage === "vi" ? "Chọn màu sắc" : selectedLanguage === "zh" ? "选择主题" : "Choose theme";
  const currentThemeLabel = THEME_OPTIONS.find((theme) => theme.id === selectedTheme)?.label[selectedLanguage] ?? "Lilac Dream";
  const activeToday = new Set(presence.filter((entry) => entry.day === todayKey()).map((entry) => entry.member_id));
  const lit = members.length >= 2 && members.every((member) => activeToday.has(member.id));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = window.localStorage.getItem(getThemeStorageKey());
    const nextTheme = isThemeId(savedTheme) ? savedTheme : "lilac-dream";
    setSelectedTheme(nextTheme);
    applyTheme(nextTheme);
  }, [me?.id, me?.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getThemeStorageKey(), selectedTheme);
    applyTheme(selectedTheme);
  }, [selectedTheme, me?.id, me?.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextLanguage = readStoredLanguage();
    setSelectedLanguage(nextLanguage);
    applyLanguage(nextLanguage);
  }, [me?.id, me?.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getLanguageStorageKey(), selectedLanguage);
    applyLanguage(selectedLanguage);
  }, [selectedLanguage, me?.id, me?.name]);

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
                if (checked && typeof window !== "undefined") {
                  window.setTimeout(() => playSound("success"), 0);
                }
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
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setThemePickerOpen((current) => !current);
                setLanguagePickerOpen(false);
              }}
            >
              <Palette /> {themeMenuLabel}
            </DropdownMenuItem>

            {themePickerOpen ? (
              <div className="border-t border-border/80 bg-background/80 px-2 pb-2 pt-2" onPointerDown={(event) => event.stopPropagation()}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{themePickerHeading}</p>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setSelectedTheme(theme.id);
                        setThemePickerOpen(false);
                      }}
                      className={`rounded-2xl border p-2 text-left transition-all ${selectedTheme === theme.id ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card/80 hover:border-primary/60"}`}
                    >
                      <div className="mb-2 h-8 rounded-xl border border-white/80 shadow-inner" style={{ background: theme.swatch }} />
                      <div className="text-[10px] font-medium text-foreground">{theme.label[selectedLanguage] ?? theme.label.en}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setLanguagePickerOpen((current) => !current);
                setThemePickerOpen(false);
              }}
            >
              <Languages /> {languageMenuLabel}
            </DropdownMenuItem>

            {languagePickerOpen ? (
              <div className="border-t border-border/80 bg-background/80 px-2 pb-2 pt-2" onPointerDown={(event) => event.stopPropagation()}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{languageMenuLabel}</p>
                <div className="space-y-2">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(option.value);
                        setLanguagePickerOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-left text-sm transition-all ${selectedLanguage === option.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/80 text-foreground"}`}
                    >
                      <span>{option.label}</span>
                      {selectedLanguage === option.value ? <span className="text-xs">✓</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

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
  const { members, signedIn, signIn, loginAs, signInWithPassword, signUpWithPassword, signOut, claim } = useIdentity();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const free = members.filter((m) => !m.user_id);

  const handleEmailAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      toast.error("Vui lòng nhập email và mật khẩu của bạn.");
      return;
    }

    const allowedEmails = ["ngduyduc2609@gmail.com", "thuthuydanghocbai@gmail.com"];
    if (!allowedEmails.includes(cleanEmail)) {
      toast.error("Đây là không gian riêng tư của Duy Đức và Thu Thuỷ, bạn không có quyền truy cập chiếc lọ này nhé!");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await loginAs(cleanEmail);
        toast.success("Đăng nhập thành công.");
      } else {
        await signUpWithPassword(cleanEmail, password);
        await loginAs(cleanEmail);
        toast.success("Tạo tài khoản thành công. Chúng mình đang chuẩn bị mở chiếc lọ cho bạn.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đăng nhập không thành công, thử lại nhé.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

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

            <div className="mt-6 space-y-3 rounded-[2rem] border border-border/70 bg-card/50 p-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Email</label>
                <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 shadow-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-full border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              <div className="flex gap-2 rounded-full bg-secondary/60 p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 rounded-full px-2 py-2 text-sm font-medium transition ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-full px-2 py-2 text-sm font-medium transition ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  Đăng ký
                </button>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleEmailAuth()}
                className="w-full rounded-full bg-primary px-4 py-3 text-base font-medium text-primary-foreground shadow disabled:opacity-60"
              >
                {busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>hoặc</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              disabled={true}
              title="Đăng nhập bằng Google đang tắt cho môi trường riêng tư này"
              className="mt-4 w-full cursor-not-allowed rounded-full border border-border bg-card px-4 py-3 text-base font-medium text-muted-foreground shadow-sm opacity-60"
            >
              Đăng nhập bằng Google (tắt)
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
                  className="w-full rounded-full border border-border bg-card px-4 py-3 text-left text-base font-medium transition-colors hover:bg-accent disabled:opacity-60"
                >
                  <span className="mr-2 text-xl">{member.emoji}</span>
                  {member.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("wishjar_user_email");
                  window.localStorage.removeItem("wishjar_user_name");
                  window.localStorage.removeItem("wish-jar-private-auth-session");
                }
                void signOut();
              }}
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
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem("wishjar_user_email");
                  window.localStorage.removeItem("wishjar_user_name");
                  window.localStorage.removeItem("wish-jar-private-auth-session");
                }
                void signOut();
              }}
              className="mt-6 w-full rounded-full border border-border px-4 py-3 text-base font-medium"
            >
              Đăng nhập tài khoản khác
            </button>
          </>
        )}
      </div>
    </div>
  );
}
