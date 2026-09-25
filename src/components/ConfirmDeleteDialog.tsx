import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppLanguage } from "@/lib/language";

export function ConfirmDeleteDialog({
  open,
  itemName,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  itemName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const language = useAppLanguage();

  const title =
    language === "vi"
      ? `Xác nhận xóa ${itemName || "mục"}?`
      : language === "zh"
        ? `确认删除 ${itemName || "项目"}？`
        : `Delete ${itemName || "this item"}?`;

  const description =
    language === "vi"
      ? "Hành động này không thể hoàn tác."
      : language === "zh"
        ? "此操作无法撤销。"
        : "This action cannot be undone.";

  const cancel = language === "vi" ? "Hủy" : language === "zh" ? "取消" : "Cancel";
  const confirm = language === "vi" ? "Xóa" : language === "zh" ? "删除" : "Delete";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-3xl border-border bg-card p-5">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl leading-tight text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 flex-row gap-2 sm:gap-2">
          <AlertDialogCancel className="flex-1 rounded-full border-border bg-background hover:bg-accent">
            {cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
