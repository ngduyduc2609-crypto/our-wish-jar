import { useEffect, useRef, useState, type ReactNode } from "react";
import { Images } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StoredImage } from "@/components/StoredImage";
import type { ImageAsset } from "@/lib/db";

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
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    galleryRef.current?.scrollTo({ left: 0 });
  }, [open, title]);

  const showControls = images.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl p-0">
        <div className="overflow-hidden rounded-t-3xl bg-secondary">
          {images.length > 0 ? (
            <div className="relative">
              <div
                ref={galleryRef}
                aria-label={`Bộ ảnh ${title}`}
                onScroll={(event) => {
                  const width = event.currentTarget.clientWidth;
                  if (width > 0) setActiveIndex(Math.round(event.currentTarget.scrollLeft / width));
                }}
                className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {images.map((image, index) => (
                  <div key={`${image.path}-${index}`} className="h-full min-w-full snap-center snap-always">
                    <StoredImage
                      path={image.path}
                      alt={`${title} — ảnh ${index + 1}`}
                      position={image.position}
                      className="size-full"
                    />
                  </div>
                ))}
              </div>
              {showControls && (
                <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground">
                  {activeIndex + 1}/{images.length}
                </span>
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
            <div className="-mt-1 flex items-center justify-center gap-1.5" aria-hidden="true">
              {images.map((image, index) => (
                <span
                  key={`${image.path}-${index}`}
                  className={`h-1.5 rounded-full transition-[width,background-color] ${index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
                />
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