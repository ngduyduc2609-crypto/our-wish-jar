export type NotificationTextItem = { kind: string; subject: string | null };
const ACTION_TEXT: Record<string, Record<"vi" | "en" | "zh", string>> = {
  wish: { vi: "vừa thêm một điều ước mới", en: "just added a new wish", zh: "刚刚添加了一个新愿望" },
  food: { vi: "vừa thêm một quán/món mới", en: "just added a new place/dish", zh: "刚刚添加了一个新餐馆/美食" },
  activity: { vi: "vừa thêm một hoạt động mới", en: "just added a new activity", zh: "刚刚添加了一个新活动" },
  memory: { vi: "vừa lưu một kỷ niệm mới", en: "just saved a new memory", zh: "刚刚保存了一条新回忆" },
  reaction: { vi: "vừa bày tỏ cảm xúc với một điều ước", en: "just reacted to a wish", zh: "刚刚对一个愿望表达了感受" },
  comment: { vi: "vừa bình luận vào một điều ước", en: "just commented on a wish", zh: "刚刚评论了一个愿望" },
};
const ENTITY_TEXT = {
  food: { vi: "một quán/món ăn", en: "a place/dish", zh: "餐馆/美食" },
  activity: { vi: "một hoạt động", en: "an activity", zh: "活动" },
  memory: { vi: "một kỷ niệm", en: "a memory", zh: "回忆" },
};
export function describe(item: NotificationTextItem, actorName: string, language: "vi" | "en" | "zh") {
  let action = ACTION_TEXT[item.kind]?.[language];
  for (const [entity, labels] of Object.entries(ENTITY_TEXT)) {
    if (item.kind === `${entity}_reaction`) action = language === "vi" ? `vừa bày tỏ cảm xúc với ${labels.vi}` : language === "en" ? `just reacted to ${labels.en}` : `刚刚对${labels.zh}表达了感受`;
    if (item.kind === `${entity}_comment`) action = language === "vi" ? `vừa bình luận vào ${labels.vi}` : language === "en" ? `just commented on ${labels.en}` : `刚刚评论了${labels.zh}`;
  }
  action ??= language === "zh" ? "刚刚更新了内容" : language === "en" ? "just updated something" : "vừa cập nhật gì đó";
  const subject = (item.subject ?? "").split("|")[0]?.trim();
  return { title: `${actorName} ${action}`, subject: subject || null };
}