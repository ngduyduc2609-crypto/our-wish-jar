import { StoredImage } from "./StoredImage";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/lib/db";

export function ImageGallery({ images, alt, className }: { images: ImageAsset[]; alt: string; className?: string }) {
  if (images.length === 0) return null;
  return (
    <div className={cn("grid h-44 gap-1 overflow-hidden", images.length === 1 ? "grid-cols-1" : "grid-cols-2", className)}>
      {images.slice(0, 4).map((image, index) => (
        <div key={`${image.path}-${index}`} className={cn("relative min-h-0", images.length === 3 && index === 0 && "row-span-2")}>
          <StoredImage path={image.path} alt={`${alt} ${index + 1}`} position={image.position} className="size-full" />
          {index === 3 && images.length > 4 && (
            <span className="absolute inset-0 grid place-items-center bg-foreground/55 text-lg font-semibold text-background">+{images.length - 4}</span>
          )}
        </div>
      ))}
    </div>
  );
}