import { Link } from "@tanstack/react-router";
import { Home, Sparkles, UtensilsCrossed, MapPinned, Heart } from "lucide-react";

const items = [
  { to: "/", label: "Nhà", icon: Home },
  { to: "/wishes", label: "Điều ước", icon: Sparkles },
  { to: "/food", label: "Ăn gì", icon: UtensilsCrossed },
  { to: "/activities", label: "Làm gì", icon: MapPinned },
  { to: "/memories", label: "Kỷ niệm", icon: Heart },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav-3d fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-2xl items-stretch justify-between px-1 pt-1"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="nav-bounce flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground transition-colors"
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
