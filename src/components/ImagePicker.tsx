import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/db";
import { StoredImage } from "./StoredImage";
import { Button } from "@/components/ui/button";

export function ImagePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file));
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
        <div className="relative overflow-hidden rounded-2xl">
          <StoredImage path={value} alt="Ảnh đã chọn" className="h-40 w-full" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-card/90 p-1.5 text-foreground shadow"
            aria-label="Xoá ảnh"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-full rounded-2xl border border-dashed"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {busy ? "Đang tải ảnh..." : "Thêm ảnh"}
        </Button>
      )}
    </div>
  );
}
