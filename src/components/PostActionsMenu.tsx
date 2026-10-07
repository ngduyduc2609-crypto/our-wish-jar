import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppLanguage } from "@/lib/language";

export function PostActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const language = useAppLanguage();
  return <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={language === "vi" ? "Tùy chọn" : language === "zh" ? "更多" : "More options"}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={onEdit}><Pencil />{language === "vi" ? "Sửa" : language === "zh" ? "编辑" : "Edit"}</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 />{language === "vi" ? "Xóa" : language === "zh" ? "删除" : "Delete"}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}