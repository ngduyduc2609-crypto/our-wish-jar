# Hoàn thiện âm thanh, hình ảnh và lọ điều ước

## Mục tiêu
- Làm hiệu ứng âm thanh phản hồi gần như ngay khi chạm, tách hoàn toàn công tắc âm thanh và nhạc nền, đồng thời hạ và cân bằng âm lượng nhạc.
- Làm ảnh xuất hiện mượt hơn bằng cách nén trước khi tải lên, hiển thị khung chờ rõ ràng và ưu tiên ảnh nhẹ cho các khung nhỏ.
- Sắp lại giấy trong lọ điều ước theo bố cục tự nhiên, nhiều kích thước, có chồng nhẹ nhưng luôn nằm gọn trong thân lọ.
- Hoàn tất kiểm tra các hiệu ứng 3D và bố cục còn dở trên điện thoại và màn hình lớn.

## Cách thực hiện
- Khởi tạo và “làm ấm” hệ thống âm thanh ngay ở cử chỉ đầu tiên; phát tiếng chạm từ lúc nhấn xuống thay vì đợi nhả tay. Dùng hai đường âm lượng độc lập cho hiệu ứng và nhạc, để tắt âm thanh không làm thay đổi nhạc và ngược lại.
- Giảm mức khuếch đại nhạc nền, dùng thang âm lượng mượt hơn để mức 50% không lấn tiếng hiệu ứng.
- Nén/resize ảnh ngay trên thiết bị trước khi tải lên, giữ đúng hướng ảnh và định dạng phù hợp; cải thiện khung chờ ảnh, chuyển cảnh khi ảnh sẵn sàng và cache đường dẫn ảnh.
- Tạo vị trí giấy ổn định theo từng điều ước bằng giá trị giả ngẫu nhiên: rải theo nhiều vùng, thay đổi chiều rộng/chiều cao 80–120%, góc xoay và độ sâu. Tính biên an toàn theo từng vùng của thân lọ, đặc biệt ở đáy, và giữ `overflow: hidden` như lớp bảo vệ cuối.

## Kiểm tra
- Đo thời điểm phát tiếng khi nhấn liên tục, kiểm tra riêng bốn trạng thái bật/tắt âm thanh và nhạc nền.
- Thử ảnh lớn và nhiều ảnh; xác nhận có khung chờ và ảnh card không để khoảng trắng.
- Thử lọ với ít, vừa và nhiều điều ước; kiểm tra không có giấy hoặc biểu tượng nào tràn khỏi thân lọ.
- Kiểm tra trên kích thước iPhone 16 Pro Max và desktop, cùng lỗi biên dịch/chạy ứng dụng.
