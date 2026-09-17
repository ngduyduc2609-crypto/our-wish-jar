import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StoredImage } from "@/components/StoredImage";
import type { ImageAsset } from "@/lib/db";
import { cn } from "@/lib/utils";

export function ContentDetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  images,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: ReactNode;
  images: ImageAsset[];
  children?: ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open, title]);

  const activeImage = images[activeIndex];
  const showControls = images.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl p-0">
        <div className="overflow-hidden rounded-t-3xl bg-secondary">
          {activeImage ? (
            <div className="relative aspect-[4/3]">
              <StoredImage
                path={activeImage.path}
                alt={`${title} — ảnh ${activeIndex + 1}`}
                position={activeImage.position}
                className="size-full"
              />
              {showControls && (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label="Ảnh trước"
                    onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full shadow"
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label="Ảnh tiếp theo"
                    onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full shadow"
                  >
                    <ChevronRight />
                  </Button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground">
                    {activeIndex + 1}/{images.length}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="grid aspect-[4/3] place-items-center text-muted-foreground">
              <div className="text-center">
                <Images className="mx-auto size-9" />
                <p className="mt-2 text-sm">Chưa có ảnh</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 px-5 pb-6">
          {showControls && (
            <div className="-mt-1 flex gap-2 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <Button
                  key={`${image.path}-${index}`}
                  type="button"
                  variant="ghost"
                  aria-label={`Xem ảnh ${index + 1}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-lg border p-0",
                    index === activeIndex ? "border-primary ring-2 ring-primary/25" : "border-border",
                  )}
                >
                  <StoredImage
                    path={image.path}
                    alt=""
                    position={image.position}
                    className="size-full"
                  />
                </Button>
              ))}
            </div>
          )}

          <DialogHeader className="pr-8 text-left">
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
            <DialogTitle className="font-display text-2xl leading-tight">{title}</DialogTitle>
          </DialogHeader>
          {children && <div className="space-y-3 text-sm">{children}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}