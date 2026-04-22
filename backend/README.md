# 🚀 ERP System Backend - Node.js API

Hệ thống API mạnh mẽ điều khiển toàn bộ nghiệp vụ của hệ thống quản lý Laptop. Được thiết kế theo kiến trúc Module-based giúp dễ dàng mở rộng và bảo trì.

## 🛠️ Công Nghệ Cốt Lõi
*   **Engine:** Node.js & Express.js
*   **Database:** MySQL (Sử dụng `mysql2` với Connection Pool tối ưu hiệu năng)
*   **Bảo mật:** JSON Web Token (JWT) cho Authentication & Middleware phân quyền.
*   **Lưu trữ:** Cloudinary API (Quản lý hình ảnh sản phẩm).
*   **Thanh toán:** VNPay Integration (Xử lý giao dịch trực tuyến).
*   **Tiện ích:** `moment` (xử lý thời gian), `multer` (xử lý file), `recordLog` (tự động ghi nhật ký hệ thống).

## 📁 Cấu Trúc Module (src/modules)

### 🔐 1. Phân hệ Auth & Hệ thống
*   **Tài khoản:** Đăng ký, đăng nhập, quản lý danh sách tài khoản.
*   **Phân quyền (RBAC):** Quản lý quyền hạn động dựa trên Chức năng và Hành động (Xem/Thêm/Sửa/Xóa).
*   **Audit Log:** Tự động ghi lại mọi hành động nhạy cảm của người dùng để truy vết.

### 👥 2. Phân hệ Nhân Sự & Lương (HR)
*   **Nhân viên & Chức vụ:** Quản lý hồ sơ, lịch sử thăng tiến và điều chuyển công tác.
*   **Chấm công:** Logic check-in/out linh hoạt, tự động tính giờ làm việc.
*   **Đơn từ:** Quy trình nộp và duyệt đơn nghỉ phép tự động trừ công.
*   **Tính lương:** Cơ chế tính lương phức tạp bao gồm lương cơ bản, tăng ca, phụ cấp, bảo hiểm và phạt đi trễ. Đặc biệt hỗ trợ tra cứu **chức vụ lịch sử** tại thời điểm tính lương.

### 📦 3. Phân hệ Kho & Sản Phẩm (Inventory)
*   **Quản lý Danh mục:** Hãng sản xuất, Sản phẩm, Nhà cung cấp.
*   **Nhập kho:** Quy trình nhập kho chặt chẽ, tự động sinh mã **Serial/IMEI** duy nhất cho từng máy.
*   **Theo dõi Serial:** Quản lý trạng thái vòng đời sản phẩm (Trong kho, Đã bán, Bảo hành).

### 🛒 4. Phân hệ Bán Hàng (Sales)
*   **POS API:** Xử lý đơn hàng, tự động trừ kho theo mã Serial, cập nhật doanh thu.
*   **VNPay:** Xử lý IPN và Return URL để xác nhận thanh toán trực tuyến an toàn.
*   **Khách hàng:** Quản lý thông tin và lịch sử mua hàng.

## ⚙️ Cấu Hình .env
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=erp_system
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
VNP_TMN_CODE=...
VNP_HASH_SECRET=...
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5173/sales/pos
```

## 🗄️ Cài đặt Cơ sở dữ liệu
1. Tạo database tên là `erp_system` trong MySQL.
2. Tìm file `erp_system.sql` tại thư mục gốc của dự án.
3. Import file này vào database vừa tạo để có đầy đủ cấu trúc bảng và dữ liệu mẫu.

## 🚀 Khởi Chạy
1. `npm install`
2. `npm run dev`
3. Server sẽ chạy tại `http://localhost:5000`