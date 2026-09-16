import { useIdentity } from "@/lib/identity";
import { cn } from "@/lib/utils";
import { daysTogether } from "@/lib/constants";

export function IdentityBar() {
  const { members, me, setMe } = useIdentity();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold">Wish Jar 🫙</p>
          <p className="text-[11px] text-muted-foreground">
            Thu Thủy &amp; Duy Đức · ngày thứ {daysTogether()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary p-1">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setMe(member.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                me?.id === member.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-secondary-foreground",
              )}
            >
              {member.emoji} {member.name.split(" ").slice(-1)[0]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

export function IdentityGate() {
  const { members, setMe } = useIdentity();

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="paper w-full max-w-sm rounded-3xl p-7 text-center">
        <p className="text-4xl">🫙</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Wish List của chúng mình</h1>
        <p className="mt-2 text-sm text-muted-foreground">Hôm nay bạn là ai nè?</p>
        <div className="mt-6 space-y-3">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setMe(member.id)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-base font-medium transition-colors hover:bg-accent"
            >
              <span className="mr-2 text-xl">{member.emoji}</span>
              {member.name}
            </button>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          )}
        </div>
      </div>
    </div>
  );
}
