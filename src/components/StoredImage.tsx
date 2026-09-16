import { useQuery } from "@tanstack/react-query";
import { signedUrl } from "@/lib/db";
import { cn } from "@/lib/utils";

export function StoredImage({
  path,
  alt,
  className,
  position,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  position?: string | null;
}) {
  const { data } = useQuery({
    queryKey: ["signed-url", path],
    queryFn: () => signedUrl(path!),
    enabled: !!path,
    staleTime: 1000 * 60 * 60,
  });

  if (!path) return null;
  if (!data) return <div className={cn("animate-pulse bg-muted", className)} />;
  return (
    <img
      src={data}
      alt={alt}
      loading="lazy"
      style={{ objectPosition: position || "50% 50%" }}
      className={cn("object-cover", className)}
    />
  );
}
