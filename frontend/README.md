# 💻 Hệ thống Quản lý Cửa hàng Laptop (ERP System) - Phân hệ Frontend

Dự án này là phân hệ Frontend (Giao diện người dùng) cho hệ thống quản lý cửa hàng kinh doanh Laptop, bao gồm các chức năng bán hàng POS, quản lý kho (Serial/IMEI), và quản trị nhân sự - tiền lương.
Dự án được xây dựng dựa trên **Vue 3** (Composition API) và công cụ build siêu tốc **Vite**.

## 🛠 Công nghệ sử dụng

- **Framework:** Vue 3
- **Build Tool:** Vite
- **Router:** Vue Router (Quản lý luồng chuyển trang)
- **State Management:** Pinia (Quản lý trạng thái đăng nhập, giỏ hàng POS)
- **HTTP Client:** Axios (Giao tiếp với Backend API)
- **UI Framework:** Element Plus / Tailwind CSS _(Cập nhật theo thực tế dự án)_

---

## 🚀 Hướng dẫn cài đặt và chạy dự án (Setup Guide)

Yêu cầu môi trường: Cài đặt sẵn [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên).

### Bước 1: Clone dự án về máy

Mở Terminal / Git Bash và chạy lệnh:
`git clone <đường-dẫn-repo-của-bạn>`
`cd erp_system/frontend`

### Bước 2: Cài đặt các thư viện phụ thuộc (Dependencies)

`npm install`
`npm install vue-router pinia axios element-plus`

### Bước 3: Cấu hình biến môi trường (Environment Variables)

Tạo một file có tên là .env tại thư mục gốc của frontend (ngang hàng với file package.json).
Copy nội dung sau vào file .env và chỉnh sửa port cho khớp với server Backend của bạn:

` VITE_API_BASE_URL=http://localhost:3000/api`

### Bước 4: Khởi chạy Server ở môi trường phát triển

`npm run dev`

Sau khi chạy lệnh, Terminal sẽ hiển thị một đường dẫn Localhost (thường là http://localhost:5173). Nhấn Ctrl + Click vào link đó để mở giao diện trên trình duyệt.

---

## 📁 Cấu trúc thư mục dự án

Để thuận tiện cho việc phối hợp phát triển, code được phân chia theo kiến trúc sau:

src/assets/: Chứa các tài nguyên tĩnh như hình ảnh, file CSS/SCSS dùng chung.

src/components/: Chứa các thành phần UI dùng lại nhiều lần (VD: Navbar, Sidebar, CustomButton).

src/router/: Chứa cấu hình đường dẫn (Routes) để điều hướng các màn hình.

src/services/: Chứa các file cấu hình Axios để gọi API (VD: authService.js, posService.js).

src/stores/: Chứa các file Pinia quản lý State toàn cục (VD: thông tin User đang đăng nhập, Giỏ hàng).

src/views/: Chứa các Component đóng vai trò là Trang màn hình đầy đủ (VD: Login.vue, POS.vue, BangLuong.vue).
