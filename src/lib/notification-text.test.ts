import { test } from "node:test";
import { strict as assert } from "node:assert";
import { describe } from "./notification-text";
const expectations = {
  food_reaction: "Duy Đức vừa bày tỏ cảm xúc với một quán/món ăn",
  food_comment: "Duy Đức vừa bình luận vào một quán/món ăn",
  activity_reaction: "Duy Đức vừa bày tỏ cảm xúc với một hoạt động",
  activity_comment: "Duy Đức vừa bình luận vào một hoạt động",
  memory_reaction: "Duy Đức vừa bày tỏ cảm xúc với một kỷ niệm",
  memory_comment: "Duy Đức vừa bình luận vào một kỷ niệm",
};
for (const [kind, title] of Object.entries(expectations)) {
  test(`${kind} names the correct content type`, () => {
    assert.deepEqual(describe({ kind, subject: "Hẹn hò|❤️" }, "Duy Đức", "vi"), { title, subject: "Hẹn hò" });
  });
}