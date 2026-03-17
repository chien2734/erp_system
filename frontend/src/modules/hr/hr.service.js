// Giả lập dữ liệu nhân viên
const mockEmployees = [
  { id: 1, hoTen: 'Nguyễn Văn Admin', email: 'admin@laptop.com', soDienThoai: '0901234567', chucVu: 'Giám đốc', phongBan: 'Quản trị' },
  { id: 2, hoTen: 'Lê Thị Kế Toán', email: 'ketoan@laptop.com', soDienThoai: '0907654321', chucVu: 'Kế toán trưởng', phongBan: 'Tài chính' },
  { id: 3, hoTen: 'Trần Văn Bán Hàng', email: 'sales@laptop.com', soDienThoai: '0988888888', chucVu: 'Nhân viên kinh doanh', phongBan: 'Kinh doanh' },
];

const HrService = {
  async getEmployees() {
    // Giả lập độ trễ mạng 500ms
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockEmployees), 500);
    });
  },
  
  async createEmployee(data) {
    console.log("Gửi yêu cầu tạo nhân viên lên Backend:", data);
    return { success: true };
  }
};

export default HrService;