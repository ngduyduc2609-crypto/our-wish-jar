import type { Member } from "./db";

/** Chỉ người tạo mới được sửa/xoá. Dữ liệu cũ không rõ người tạo thì ai cũng sửa được. */
export function canManage(me: Member | null, ownerId: string | null | undefined) {
  if (!ownerId) return true;
  return !!me && me.id === ownerId;
}
