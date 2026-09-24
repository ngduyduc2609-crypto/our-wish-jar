import { useEffect, useState, type ReactNode } from "react";

export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return (
      <>
        {fallback ?? (
          <div className="flex min-h-[100svh] items-center justify-center bg-[radial-gradient(circle_at_top,_#fffaf5,_#fdf2f8_35%,_#f5f3ff_100%)] text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-full border border-border/70 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              Đang mở lọ điều ước...
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
