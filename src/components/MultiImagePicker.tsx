import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, type ImageAsset } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StoredImage } from "./StoredImage";

function parseY(position: string) {
  const match = /(-?\d+(?:\.\d+)?)%\s*$/.exec(position);
  return match ? Number(match[1]) : 50;
}

export function MultiImagePicker({ value, onChange }: { value: ImageAsset[]; onChange: (images: ImageAsset[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Giữ chỉ số ảnh đang xem trong phạm vi hợp lệ khi thêm/xoá ảnh.
  const safeIndex = Math.min(activeIndex, Math.max(value.length - 1, 0));

  useEffect(() => {
    stripRef.current?.scrollTo({ left: safeIndex * (stripRef.current?.clientWidth || 0) });
  }, [safeIndex]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const paths = await Promise.all(Array.from(files).map(uploadImage));
      const next = [...value, ...paths.map((path) => ({ path, position: "50% 50%" }))];
      onChange(next);
      setActiveIndex(next.length - 1);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      toast.error("Không tải được ảnh, thử lại nhé");
    } finally {
      setBusy(false);
    }
  }

  function removeImage(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
    setActiveIndex((current) => Math.max(0, Math.min(current, value.length - 2)));
  }

  const active = value[safeIndex];

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void handleFiles(event.target.files)} />

      {value.length > 0 && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary">
            <div
              ref={stripRef}
              aria-label={`Bộ ảnh đã chọn (${value.length} ảnh)`}
              onScroll={(event) => {
                const width = event.currentTarget.clientWidth;
                if (width > 0) setActiveIndex(Math.round(event.currentTarget.scrollLeft / width));
              }}
              className="flex h-44 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {value.map((image, index) => (
                <div key={`${image.path}-${index}`} className="h-full min-w-full snap-center snap-always">
                  <StoredImage path={image.path} alt={`Ảnh đã chọn ${index + 1}`} position={image.position} className="size-full" />
                </div>
              ))}
            </div>
            <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground">
              {safeIndex + 1}/{value.length}
            </span>
          </div>

          {active && (
            <div className="space-y-2 rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground">Căn khung ảnh {safeIndex + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(safeIndex)}
                  className="h-8 gap-1.5 rounded-full px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Xoá ảnh ${safeIndex + 1}`}
                >
                  <Trash2 className="size-4" />
                  Xoá ảnh này
                </Button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={parseY(active.position)}
                onChange={(event) => onChange(value.map((item, itemIndex) => itemIndex === safeIndex ? { ...item, position: `50% ${event.target.value}%` } : item))}
                className="w-full accent-[var(--color-primary)]"
                aria-label={`Căn khung ảnh ${safeIndex + 1} theo chiều dọc`}
              />
            </div>
          )}
        </div>
      )}

      <Button type="button" variant="secondary" className="w-full rounded-2xl border border-dashed" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {busy ? "Đang tải ảnh..." : value.length ? "Thêm ảnh khác" : "Thêm một hoặc nhiều ảnh"}
      </Button>
    </div>
  );
}
