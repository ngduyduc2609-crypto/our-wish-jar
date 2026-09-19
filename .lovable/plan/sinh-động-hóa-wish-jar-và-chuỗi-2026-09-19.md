# Sinh động hóa Wish Jar và chuỗi

## Mục tiêu
- Hoàn thiện phần âm thanh và thông báo đang dang dở, không thay đổi luồng dữ liệu hiện có.
- Làm lọ điều ước chứa nhiều mảnh giấy hơn, đa dạng kích thước và chuyển động mềm như bong bóng.
- Biến chuỗi thành một ngọn lửa có trạng thái chưa sáng/đã sáng, nâng cấp theo mốc và có màn chúc mừng.
- Đưa biểu tượng ngọn lửa cùng số chuỗi lên thanh trên cùng, cạnh tên Wish Jar.
- Thêm phản hồi nảy, nhấn 3D và pop-in cho điều hướng, nhóm nội dung và các thao tác chính.

## Cách thực hiện
- Dùng dữ liệu điều ước hiện có; phân bố nhiều mảnh giấy trong lọ theo kích thước, màu, độ nghiêng và nhịp chuyển động ổn định.
- Tạo một thành phần ngọn lửa dùng chung cho trang Nhà và thanh trên cùng. Giao diện thay đổi theo các mốc 10, 30, 100 và cao hơn.
- Xác định hôm nay cả hai đã ghé app hay chưa để hiển thị lửa tắt hoặc đang cháy.
- Khi vừa đạt mốc chuỗi hoặc mốc ngày yêu nhau, hiển thị chúc mừng một lần trên thiết bị với hiệu ứng bùng nổ nhẹ.
- Áp dụng hiệu ứng tương tác có chọn lọc, đồng thời tôn trọng cài đặt giảm chuyển động của điện thoại.

## Kiểm tra
- Kiểm tra biên dịch và lỗi khi chạy.
- Kiểm tra trực quan trên kích thước iPhone 16 Pro Max và màn hình lớn, gồm lọ, thanh trên cùng, chuỗi, thông báo và vùng chạm.
