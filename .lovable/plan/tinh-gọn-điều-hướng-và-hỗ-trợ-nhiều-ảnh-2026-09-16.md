# Tinh gọn điều hướng và hỗ trợ nhiều ảnh

## Mục tiêu
- Đưa “Đăng xuất” khỏi thanh trên cùng vào menu tài khoản, đồng thời làm thanh trên gọn và cân đối hơn.
- Giảm thanh điều hướng dưới còn 5 mục: Nhà, Điều ước, Ăn gì, Làm gì, Kỷ niệm.
- Đặt lối vào “Thống kê” ở cuối trang Nhà; trang Thống kê có nút quay lại Nhà.
- Cho Điều ước, Món ăn/Quán, Hoạt động và Kỷ niệm lưu, căn chỉnh, thay thế hoặc xóa một hay nhiều ảnh.

## Trải nghiệm sau khi sửa
- Chạm vào tên/biểu tượng người dùng trên thanh trên cùng để mở menu tài khoản và chọn “Đăng xuất”.
- Chạm vào khối Thống kê cuối trang Nhà để mở trang chi tiết; có mũi tên quay lại rõ ràng.
- Trong mỗi cửa sổ thêm/sửa, có thể chọn nhiều ảnh, thêm ảnh tiếp theo và căn dọc từng ảnh độc lập.
- Các danh sách hiển thị bộ ảnh gọn gàng; “Kỷ niệm gần đây” trên trang Nhà vẫn chỉ dùng ảnh đầu tiên.
- Dữ liệu ảnh cũ được giữ nguyên và tự chuyển thành ảnh đầu tiên, không làm mất nội dung đã lưu.

## Chi tiết kỹ thuật
- Thêm trường danh sách ảnh có cấu trúc `{ path, position }` cho bốn nhóm dữ liệu và chuyển dữ liệu ảnh đơn hiện có sang danh sách này.
- Tạo bộ chọn nhiều ảnh dùng chung, tái sử dụng tải ảnh riêng tư và thanh căn khung hiện tại.
- Cập nhật các luồng tạo Kỷ niệm tự động để sao chép đầy đủ danh sách ảnh từ Điều ước, Món ăn hoặc Hoạt động.
- Giữ nguyên quyền hiện tại: chỉ người tạo nội dung mới được sửa hoặc xóa.
- Kiểm tra trên kích thước iPhone 16 Pro Max, gồm menu tài khoản, điều hướng, thêm nhiều ảnh và hiển thị ảnh đầu tiên ở trang Nhà.
