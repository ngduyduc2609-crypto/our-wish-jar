# Wish List của Thu Thủy và Duy Đức

Ứng dụng riêng tư cho 2 người, lưu dữ liệu bền vững trên Lovable Cloud, giao diện sổ tay ấm áp, tối ưu cho điện thoại.

## Cách hoạt động

- Mở app, chọn mình là **Thu Thủy** hay **Duy Đức** (đổi người bất cứ lúc nào ở góc trên). Không cần đăng ký.
- Mọi thao tác (thêm điều ước, thả cảm xúc, bình luận, đánh dấu hoàn thành) đều ghi nhận đúng tên người làm.

## Các trang

**Trang chủ**
- Đếm số ngày bên nhau từ 22/12/2025.
- Lọ điều ước tổng quan: bao nhiêu điều ước đang chờ, đã hoàn thành.
- Nút "Rút một điều ước" ngẫu nhiên, có hiệu ứng nhẹ.
- Rút nhanh món ăn và hoạt động.
- Chuỗi ngày cùng nhau (chỉ tăng khi cả hai cùng hoạt động trong ngày).
- Kỷ niệm gần đây và dòng hoạt động mới nhất của cả hai.

**Điều ước**
- Thêm điều ước theo nhóm: Du lịch, Ăn uống, Trải nghiệm, Học điều mới, Mua sắm, Khác.
- Ghi người đề xuất, độ khó, hạn mong muốn, trạng thái hoàn thành.
- Thả cảm xúc ❤️ 😍 😂 🤔 👍 và bình luận qua lại.
- Nút rút ngẫu nhiên một điều ước.

**Món ăn**
- Danh sách quán/món muốn thử và đã thử, kèm địa điểm, mức giá, chấm điểm, ảnh.
- "Hôm nay ăn gì?" quay ngẫu nhiên món chưa thử; ăn xong bấm một nút là chuyển thành kỷ niệm.

**Hoạt động**
- Địa điểm và hoạt động: Cafe, Rạp phim, Workshop, Picnic...
- "Hôm nay làm gì?" quay ngẫu nhiên, lọc theo Chill, Hẹn hò, Tiết kiệm, Vui, Buổi tối.

**Kỷ niệm**
- Dòng thời gian, tự tạo khi hoàn thành một điều ước / món ăn / hoạt động.
- Lưu ảnh, cảm nhận, ngày và chấm điểm.

**Thống kê**
- Số điều ước, món đã ăn, hoạt động đã làm, chuỗi ngày kỷ lục, các cột mốc ngày bên nhau.

## Giao diện

Kem ấm, hồng nhạt, be; chữ tiêu đề mềm mại kiểu viết tay, bo góc tròn, thẻ giấy nhẹ. Thiết kế ưu tiên màn hình điện thoại, thanh điều hướng dưới cùng.

## Chi tiết kỹ thuật

- Bật Lovable Cloud (Supabase). Bảng: `members` (2 dòng seed), `wishes`, `wish_reactions`, `wish_comments`, `foods`, `activities`, `memories`, `activity_log`, `daily_presence`.
- Không dùng đăng nhập công khai: danh tính lưu ở thiết bị (localStorage) và gửi kèm mỗi thao tác; RLS mở cho `anon` trên các bảng này (app riêng tư, chấp nhận đánh đổi) — mọi bảng đều có GRANT rõ ràng.
- Ảnh lưu trong Storage bucket `media` (public read).
- Streak tính từ `daily_presence` (mỗi người ghi nhận 1 dòng/ngày khi thao tác); ngày chỉ tính khi có đủ 2 người.
- Đọc/ghi qua server functions TanStack Start + TanStack Query; routes: `/` (home), `/wishes`, `/food`, `/activities`, `/memories`, `/stats`.
- Mỗi trang có tiêu đề và mô tả riêng cho SEO.

## Lưu ý

Ứng dụng không có mật khẩu, nên ai có đường dẫn đều xem được. Nếu cần khoá, mình có thể thêm một mã PIN chung.
