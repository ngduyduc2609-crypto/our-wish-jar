# Our Shared Journey

Tạo ứng dụng private "Wish List của Thu Thủy và Duy Đức" dành riêng cho 2 người (Thu Thủy và Duy Đức) với Lovable Cloud backend để lưu trữ dữ liệu bền vững:
1. Identity: Cho phép chuyển đổi/chọn danh tính nhanh giữa "Thu Thủy" và "Duy Đức" (không cần public sign-up), mọi action (tạo, reaction, comment, complete) đều gắn đúng người thực hiện.
2. Home: Day counter tự động tính từ 22/12/2025, Wish Jar tổng quan, nút Random Wish ("Rút một điều ước"), Quick Random Food & Activity, Together Streak (chỉ tăng khi cả 2 người cùng active trong ngày), Recent Memories và Activity Feed.
3. Wish List: Quản lý điều ước theo categories (Du lịch, Ăn uống, Trải nghiệm, Học điều mới, Mua sắm, Khác), người đề xuất, độ khó, deadline, trạng thái hoàn thành. Tích hợp reaction (❤️ 😍 😂 🤔 👍) và comment trao đổi. Kèm modal "Rút một điều ước" ngẫu nhiên với animation nhẹ.
4. Food: Quản lý quán ăn/món ăn muốn thử (Want to try / Tried), địa điểm, mức giá, rating, ảnh. Tính năng "What should we eat today?" quay ngẫu nhiên món ăn chưa thử kèm flow chuyển thành Memory khi đã thử.
5. Activities: Quản lý địa điểm & hoạt động (Cafe, Cinema, Workshop, Picnic...) kèm tính năng "What should we do today?" random có filter (Chill, Date, Cheap, Fun, Night).
6. Memories: Timeline kỷ niệm tự động liên kết khi hoàn thành Wish/Food/Activity, lưu ảnh, cảm nhận, ngày tháng và rating.
7. Stats: Thống kê số lượng điều ước, món đã ăn, hoạt động đã làm, streak kỷ lục và các cột mốc ngày bên nhau.
8. Giao diện: Tone màu ấm áp (warm cream, soft pink, beige), phong cách sổ tay/lọ điều ước lãng mạn, nhẹ nhàng, tối ưu hoàn hảo cho mobile.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://our-wish-jar.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9eb8642f-c04f-4194-8142-ddbbf1b88786).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
