import { useState } from "react";
import { toast } from "sonner";

import { useIdentity } from "@/lib/identity";
import { daysTogether } from "@/lib/constants";

export function IdentityBar() {
  const { me, signOut } = useIdentity();

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold">Wish Jar 🫙</p>
          <p className="text-[11px] text-muted-foreground">
            Thu Thủy &amp; Duy Đức · ngày thứ {daysTogether()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
            {me?.emoji} {me?.name.split(" ").slice(-1)[0]}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
          >
            Thoát
          </button>
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
