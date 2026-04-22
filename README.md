# 💻 Hệ Thống Quản Lý Tổng Thể Cửa Hàng Laptop (ERP System)

Hệ thống quản lý doanh nghiệp (ERP) chuyên biệt cho mô hình kinh doanh Laptop, tích hợp đầy đủ các phân hệ từ Bán hàng (POS), Quản lý Kho (Serial/IMEI), Nhân sự - Tiền lương đến Báo cáo thống kê chuyên sâu.

---

## 🏗️ Cấu Trúc Dự Án

Dự án được chia thành hai phần chính:

*   **[Frontend (Client)](./frontend/README.md):** Giao diện người dùng hiện đại, responsive, xây dựng bằng Vue 3.
*   **[Backend (Server)](./backend/README.md):** hệ thống API RESTful mạnh mẽ xử lý nghiệp vụ và dữ liệu, xây dựng bằng Node.js & Express.

---

## ✨ Các Tính Năng Cốt Lõi

### 1. Quản Trị Nhân Sự & Tiền Lương (HR)
*   **Quản lý Nhân viên:** Hồ sơ chi tiết, trạng thái làm việc.
*   **Lịch sử Công tác:** Tự động lưu vết quá trình thăng chức, điều chuyển chức vụ.
*   **Chấm công & Nghỉ phép:** Hệ thống check-in/out, quản lý đơn từ nghỉ phép trực tuyến.
*   **Tính lương tự động:** Tự động tính toán lương theo giờ, phụ cấp, tiền phạt đi trễ và bảo hiểm. Hỗ trợ xem lại lịch sử lương theo đúng chức vụ tại thời điểm đó.

### 2. Quản Lý Kho & Sản Phẩm (Inventory)
*   **Danh mục thông minh:** Quản lý sản phẩm theo Hãng, cấu hình (CPU/RAM/SSD).
*   **Theo dõi Serial/IMEI:** Quản lý vòng đời từng chiếc laptop từ lúc nhập kho đến khi đến tay khách hàng.
*   **Nhập kho tự động:** Tự động sinh mã máy (Serial) khi nhập hàng, quản lý Nhà cung cấp.

### 3. Bán Hàng & POS (Sales)
*   **Màn hình POS chuyên nghiệp:** Quét mã Serial để bán hàng, giao diện tối ưu cho nhân viên thu ngân.
*   **Thanh toán đa phương thức:** Hỗ trợ Tiền mặt và Chuyển khoản qua cổng **VNPay Sandbox**.
*   **Quản lý Hóa đơn:** Tra cứu lịch sử, in lại hóa đơn linh hoạt.

### 4. Báo Cáo & Hệ Thống
*   **Dashboard:** Biểu đồ trực quan về doanh thu, dòng tiền và quỹ lương.
*   **Audit Logs:** Ghi lại mọi hành động nhạy cảm của người dùng để truy vết khi cần.
*   **Phân quyền (RBAC):** Hệ thống phân quyền dựa trên chức vụ (Admin, Quản lý, Nhân viên).

---

## 🛠️ Công Nghệ Áp Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | Vue 3 (Composition API), Vite, Pinia, Element Plus, Tailwind CSS |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | MySQL (Connection Pool) |
| **Thanh toán** | VNPay SDK Integration |
| **Lưu trữ ảnh** | Cloudinary API |

---

## 🚀 Hướng Dẫn Cài Đặt Nhanh

### 1. Yêu cầu tiên quyết
*   Node.js (v18+)
*   MySQL Server

### 2. Cài đặt CSDL
*   Tạo database `erp_system`.
*   Import file `erp_system.sql` nằm ở thư mục gốc của dự án vào MySQL.

### 3. Khởi chạy Backend
```bash
cd backend
npm install
# Tạo file .env dựa trên hướng dẫn trong backend/README.md
npm run dev
```

### 4. Khởi chạy Frontend
```bash
cd frontend
npm install
# Tạo file .env dựa trên hướng dẫn trong frontend/README.md
npm run dev
```

Hệ thống sẽ chạy tại:
*   Frontend: `http://localhost:5173`
*   Backend API: `http://localhost:5000`

---
*Dự án này được xây dựng với mục tiêu tối ưu hóa quy trình vận hành và mang lại trải nghiệm quản trị tốt nhất cho chủ doanh nghiệp laptop.*