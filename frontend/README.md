# 💻 ERP System Frontend - Vue 3 Enterprise Suite

Giao diện quản trị hiện đại, chuyên nghiệp dành cho hệ thống quản lý Laptop. Được thiết kế tối ưu cho trải nghiệm người dùng (UX) và hiệu năng cực cao.

## 🎨 Công Nghệ & UI/UX
*   **Core:** Vue 3 (Composition API).
*   **Build Tool:** Vite (Tốc độ khởi động và HMR siêu nhanh).
*   **Styling:** Tailwind CSS (Giao diện tùy biến theo phong cách hiện đại).
*   **UI Library:** Element Plus (Hệ thống component phong phú, mạnh mẽ).
*   **State Management:** Pinia (Quản lý trạng thái đăng nhập, phân quyền và giỏ hàng).
*   **Responsive:** Thiết kế đa thiết bị, tối ưu cho cả Desktop, Tablet và Mobile.

## 🚀 Các Phân Hệ Chính (src/modules)

### 📊 1. Dashboard & Báo Cáo
*   **Dashboard:** Tổng quan doanh thu, số lượng đơn hàng và biểu đồ tăng trưởng.
*   **Báo cáo Kho:** Thống kê giá trị tồn kho, sản phẩm sắp hết hàng.
*   **Báo cáo Lương:** Phân tích quỹ lương, chi phí nhân sự theo tháng/năm.

### 👥 2. Quản Trị Nhân Sự (HR)
*   **Hồ sơ:** Quản lý nhân viên, chức vụ và quyền hạn.
*   **Chấm công:** Cổng chấm công cá nhân và màn hình quản lý chấm công tập trung.
*   **Đơn từ:** Giao diện nộp đơn nghỉ phép và duyệt đơn trực quan.
*   **Bảng lương:** Bảng tính lương linh hoạt, cho phép điều chỉnh thưởng/phạt và in phiếu lương.

### 📦 3. Quản Lý Kho (Inventory)
*   **Danh mục:** Quản lý Sản phẩm, Hãng sản xuất, Nhà cung cấp.
*   **Nhập kho:** Giao diện nhập hàng hỗ trợ quét/nhập mã Serial hàng loạt.
*   **Serial Tracking:** Tra cứu lịch sử vòng đời của từng mã máy cụ thể.

### 🛒 4. Bán Hàng & POS (Sales)
*   **POS:** Màn hình bán hàng tối ưu, hỗ trợ quét mã máy, tính tiền tự động.
*   **Thanh toán:** Tích hợp quy trình thanh toán QR VNPay an toàn.
*   **Hóa đơn:** Quản lý lịch sử hóa đơn, bộ lọc phương thức thanh toán và tính năng in lại hóa đơn.

### 🔐 5. Hệ Thống & Bảo Mật
*   **Phân quyền (RBAC):** Giao diện quản lý quyền hạn chi tiết cho từng chức vụ.
*   **Audit Logs:** Xem nhật ký hoạt động của toàn bộ hệ thống.
*   **Cấu hình:** Thiết lập các thông số hệ thống (giờ làm việc, hệ số lương...).

## 📁 Cấu Trúc Thư Mục
*   `src/components/`: Các component dùng chung (Layout, Sidebar, Charts...).
*   `src/modules/`: Chứa mã nguồn chia theo từng phân hệ nghiệp vụ riêng biệt.
*   `src/services/`: Cấu hình API Axios và các interceptors xử lý token.
*   `src/stores/`: Quản lý trạng thái toàn cục bằng Pinia.
*   `src/utils/`: Các hàm bổ trợ, định dạng tiền tệ, ngày tháng và hằng số.

## ⚙️ Cấu Hình Môi Trường (.env)

Tạo một file `.env` tại thư mục gốc của `frontend` (cùng cấp với `package.json`) và thêm cấu hình URL để kết nối với Backend API:

```env
# URL của Backend API (mặc định)
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 🚀 Khởi Chạy
1. `npm install`
2. Cấu hình file `.env` như hướng dẫn bên trên.
3. `npm run dev`
4. Truy cập: `http://localhost:5173`
