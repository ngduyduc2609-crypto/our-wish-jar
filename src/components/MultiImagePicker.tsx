import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
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
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const paths = await Promise.all(Array.from(files).map(uploadImage));
      onChange([...value, ...paths.map((path) => ({ path, position: "50% 50%" }))]);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      toast.error("Không tải được ảnh, thử lại nhé");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void handleFiles(event.target.files)} />
      {value.map((image, index) => (
        <div key={`${image.path}-${index}`} className="space-y-2 rounded-2xl border border-border p-2">
          <div className="relative overflow-hidden rounded-xl">
            <StoredImage path={image.path} alt={`Ảnh đã chọn ${index + 1}`} position={image.position} className="h-36 w-full" />
            <Button type="button" variant="secondary" size="icon" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 size-8 rounded-full shadow" aria-label={`Xoá ảnh ${index + 1}`}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Căn khung ảnh {index + 1}</Label>
            <input type="range" min={0} max={100} step={1} value={parseY(image.position)} onChange={(event) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, position: `50% ${event.target.value}%` } : item))} className="w-full accent-[var(--color-primary)]" aria-label={`Căn khung ảnh ${index + 1} theo chiều dọc`} />
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" className="w-full rounded-2xl border border-dashed" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {busy ? "Đang tải ảnh..." : value.length ? "Thêm ảnh khác" : "Thêm một hoặc nhiều ảnh"}
      </Button>
    </div>
  );
}