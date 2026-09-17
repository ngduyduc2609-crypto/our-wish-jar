# Vuốt ảnh, tách Kỷ niệm và làm giấy điều ước sinh động

## Mục tiêu
- Đổi bộ xem nhiều ảnh từ bấm nút sang vuốt ngang tự nhiên trên điện thoại.
- Hoàn thành Điều ước, Ăn uống hoặc Hoạt động chỉ cập nhật trạng thái, không tự tạo bản ghi trong Kỷ niệm.
- Làm mỗi điều ước trong lọ trên trang Nhà trông như một mảnh giấy viết tay, phát sáng và chuyển động nhẹ.

## Trải nghiệm sau khi sửa
- Trong cửa sổ chi tiết, vuốt trái/phải trực tiếp trên ảnh; hàng chấm phía dưới cho biết ảnh đang xem.
- Các thao tác “đã hoàn thành”, “đã ăn” và “đã làm” vẫn lưu trạng thái, đánh giá hoặc cảm nhận cần thiết nhưng không xuất hiện thêm trong Kỷ niệm.
- Kỷ niệm chỉ được tạo khi người dùng chủ động thêm trong trang Kỷ niệm.
- Các mảnh giấy trong lọ có nếp gấp, nét chữ mềm, ánh sáng đa sắc hài hòa và chuyển động lệch nhịp.

## Chi tiết kỹ thuật
- Dùng vùng cuộn ngang có snap để hỗ trợ thao tác vuốt native, đồng bộ chỉ báo ảnh theo vị trí cuộn và giữ đúng căn ảnh đã lưu.
- Gỡ ba luồng tự động chèn Kỷ niệm khỏi Điều ước, Ăn uống và Hoạt động; giữ nguyên cập nhật dữ liệu nguồn và nhật ký thao tác.
- Bổ sung token màu/ánh sáng và animation cho mảnh giấy, đồng thời tắt chuyển động khi thiết bị yêu cầu giảm chuyển động.
- Kiểm tra bản dựng và các luồng trạng thái sau thay đổi.
