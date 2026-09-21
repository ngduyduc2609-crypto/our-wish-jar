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
  const { data } = useQuery({
    queryKey: ["signed-url", path],
    queryFn: () => signedUrl(path!),
    enabled: !!path,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });

  if (!path) return null;
  return (
    <span className={cn("relative block overflow-hidden bg-muted", className)}>
      <span className={cn("absolute inset-0 bg-gradient-to-br from-muted via-card to-secondary transition-opacity", !loaded && "animate-pulse", loaded && "opacity-0")} aria-hidden="true" />
      {data ? (
        <img
          src={data}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          style={{ objectPosition: position || "50% 50%" }}
          className={cn("size-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        />
      ) : null}
    </span>
  );
}
