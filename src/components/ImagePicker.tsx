import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/db";
import { StoredImage } from "./StoredImage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function parseY(position?: string | null) {
  const match = /(-?\d+(?:\.\d+)?)%\s*$/.exec(position ?? "");
  return match ? Number(match[1]) : 50;
}

export function ImagePicker({
  value,
  onChange,
  position,
  onPositionChange,
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  position?: string | null;
  onPositionChange?: (position: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const y = parseY(position);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file));
      onPositionChange?.("50% 50%");
    } catch {
      toast.error("Không tải được ảnh, thử lại nhé");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-2xl">
            <StoredImage
              path={value}
              alt="Ảnh đã chọn"
              position={position ?? null}
              className="h-40 w-full"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 rounded-full bg-card/90 p-1.5 text-foreground shadow"
              aria-label="Xoá ảnh"
            >
              <X className="size-4" />
            </button>
          </div>
          {onPositionChange && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Căn khung ảnh</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={y}
                onChange={(e) => onPositionChange(`50% ${e.target.value}%`)}
                className="w-full accent-[var(--color-primary)]"
                aria-label="Căn khung ảnh theo chiều dọc"
              />
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-2xl"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {busy ? "Đang tải ảnh..." : "Đổi ảnh khác"}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-full rounded-2xl border border-dashed"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {busy ? "Đang tải ảnh..." : "Thêm ảnh"}
        </Button>
      )}
    </div>
  );
}
