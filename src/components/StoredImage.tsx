import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { signedUrl } from "@/lib/db";
import { cn } from "@/lib/utils";

export function StoredImage({
  path,
  alt,
  className,
  position,
  eager = false,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  position?: string | null;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const { data } = useQuery({
    queryKey: ["signed-url", path],
    queryFn: () => signedUrl(path!),
    enabled: !!path,
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
  });

  if (!path) return null;

  const showPlaceholder = !loaded && !failed;

  return (
    <span className={cn("relative block overflow-hidden bg-gradient-to-br from-muted via-card to-secondary", className)} aria-busy={!loaded && !failed}>
      <span
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          showPlaceholder ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_48%)]" />
        <span className={cn("absolute inset-0 animate-pulse bg-gradient-to-br from-rose-100/70 via-amber-50/60 to-sky-100/70", !showPlaceholder && "opacity-0")} />
      </span>

      {data && !failed ? (
        <img
          src={data}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          sizes="(max-width: 768px) 100vw, 33vw"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(false);
          }}
          style={{ objectPosition: position || "50% 50%" }}
          className={cn(
            "size-full object-cover transition-all duration-300",
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]",
          )}
        />
      ) : null}
    </span>
  );
}
