import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Home, Sparkles, UtensilsCrossed, MapPinned, Heart } from "lucide-react";

import { NAV_LABELS, applyLanguage, readStoredLanguage, type AppLanguage } from "@/lib/language";

const items = [
  { to: "/", key: "home", icon: Home },
  { to: "/wishes", key: "wishes", icon: Sparkles },
  { to: "/food", key: "food", icon: UtensilsCrossed },
  { to: "/activities", key: "activities", icon: MapPinned },
  { to: "/memories", key: "memories", icon: Heart },
] as const;

export function BottomNav() {
  const [language, setLanguage] = useState<AppLanguage>("vi");

  useEffect(() => {
    const sync = () => {
      const stored = readStoredLanguage();
      setLanguage(stored);
      applyLanguage(stored);
    };

    sync();

    const onStorage = () => sync();
    const onLanguageChange = () => sync();

    window.addEventListener("storage", onStorage);
    window.addEventListener("wishjar-language-change", onLanguageChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("wishjar-language-change", onLanguageChange);
    };
  }, []);

  return (
    <nav className="bottom-nav-3d fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-2xl items-stretch justify-between px-1 pt-1"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        {items.map(({ to, key, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="nav-bounce flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground transition-colors"
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Icon className="size-5" />
            {NAV_LABELS[key][language]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
