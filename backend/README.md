# 💻 Hệ Thống Quản Lý Cửa Hàng Laptop (ERP / POS) - Backend API

Đây là hệ thống Backend API RESTful được xây dựng để phục vụ cho phần mềm quản lý tổng thể cửa hàng bán máy tính/laptop. Hệ thống xử lý các nghiệp vụ phức tạp như quản lý nhân sự, nhập kho tự động sinh mã Serial, và bán hàng POS trừ tồn kho.

## 🚀 Công Nghệ Sử Dụng

* **Runtime Environment:** Node.js
* **Framework:** Express.js
* **Database:** MySQL (Sử dụng thư viện `mysql2` với Connection Pool)
* **Authentication:** JSON Web Token (JWT)
* **Kiến trúc:** Module-based / Domain-driven Design

## ✨ Các Phân Hệ & Tính Năng Nổi Bật

Hệ thống được chia thành 4 module chính, tích hợp xử lý **Transaction** chặt chẽ để đảm bảo toàn vẹn dữ liệu:

1. **🔐 Phân hệ Quản trị (Auth):**
   * Đăng nhập và cấp phát JWT Token.
   * Lấy thông tin Profile và danh sách quyền hạn động theo chức vụ.
   * Đổi mật khẩu an toàn.

2. **👥 Phân hệ Nhân Sự & Tiền Lương (HR):**
   * Quản lý danh sách nhân viên, chức vụ (CRUD).
   * Nghiệp vụ thăng chức/điều chuyển: Tự động lưu lịch sử thay đổi chức vụ qua Transaction.

3. **📦 Phân hệ Kho & Sản Phẩm (Inventory):**
   * Quản lý danh mục Hãng sản xuất và Sản phẩm.
   * Tìm kiếm, lọc và phân trang (Pagination) thông minh.
   * **Nghiệp vụ Nhập Kho:** Tự động cộng dồn tồn kho và tự động sinh mã Serial (mã máy) duy nhất cho từng chiếc laptop dựa trên số lượng nhập.

4. **🛒 Phân hệ Bán Hàng (Sales):**
   * Quản lý thông tin Khách hàng.
   * **Nghiệp vụ POS:** Quét mã Serial máy tính -> Tự động tính tiền -> Tạo hóa đơn -> Trừ số lượng tồn kho -> Cập nhật trạng thái máy thành "Đã bán".

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
* [Node.js](https://nodejs.org/) (Phiên bản 16.x trở lên)
* MySQL Server (XAMPP, WAMP, hoặc MySQL Workbench)

### 2. Cài đặt CSDL (Database)
1. Mở công cụ quản lý MySQL của bạn.
2. Tạo database mới hoặc import trực tiếp file `quanlycuahanglaptop.sql` có sẵn trong dự án.

### 3. Cài đặt Source Code
Mở Terminal/Command Prompt, di chuyển vào thư mục backend và chạy lệnh:

    npm install

### 4. Thiết lập Biến Môi Trường
Tạo một file **.env** ở thư mục gốc của backend và cấu hình các thông số sau:

    PORT=5000
    DB_HOST=127.0.0.1
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=erp_system
    JWT_SECRET=YourSuperSecretKeyHere_2026 # ghi gi cung duoc

### 5. Khởi chạy Server
Để chạy server trong môi trường phát triển (tự động reload khi sửa code):

    npm run dev

Server sẽ chạy tại địa chỉ: *http://localhost:5000*

## 📂 Cấu Trúc Thư Mục

    backend/
    ├── src/
    │   ├── config/             # Cấu hình kết nối MySQL Pool
    │   ├── middlewares/        # Các hàm trung gian (verifyToken bảo vệ API)
    │   ├── modules/            # Các phân hệ nghiệp vụ chính
    │   │   ├── auth/           # API Đăng nhập, Tài khoản
    │   │   ├── hr/             # API Nhân viên, Chức vụ, Bảng Lương, Chấm Công
    │   │   ├── inventory/      # API Sản phẩm, Nhập kho
    │   │   └── sales/          # API Khách hàng, Bán hàng
    │   ├── routes/             # File tổng hợp định tuyến (index.js)
    ├── .env                    # Biến môi trường (Bảo mật)
    ├── .gitignore
    ├── package.json
    └── server.js               # File khởi chạy gốc