const express = require('express');
const router = express.Router();
const {verifyToken} = require('../../../middlewares/auth.middleware');
const HrController = require('./hr.controller');
router.use(verifyToken); // Áp dụng middleware xác thực cho tất cả routes bên dưới

router.get('/chucvu', HrController.getAllChucVu);// Lấy danh sách chức vụ
router.post('/chucvu', HrController.createChucVu);
router.put('/chucvu/:id', HrController.updateChucVu);
router.delete('/chucvu/:id', HrController.deleteChucVu);

// Phần cá nhân (Profile)
router.get('/profile/me', HrController.getProfile);
router.put('/profile/update-info', HrController.updateProfileInfo);
router.put('/profile/change-password', HrController.changePassword);

// Phần Quản lý nhân viên
router.get('/nhanvien' , HrController.getAll); // Lấy danh sách nhân viên với phân trang và lọc
router.get('/nhanvien/:id', HrController.getOne);// Lấy chi tiết 1 nhân viên theo ID
router.post('/nhanvien', HrController.create);// Thêm mới nhân viên
router.put('/nhanvien/:id', HrController.update);// Cập nhật thông tin nhân viên
router.delete('/nhanvien/:id', HrController.delete);// Xóa nhân viên (chuyển trạng thái)
router.put('/nhanvien/:id/chucvu', HrController.changeChucVu);// Thăng chức nhân viên

// Phần chấm công và lương thưởng
router.post('/chamcong', HrController.ghiNhanChamCong);
router.get('/chamcong', HrController.getLichSuChamCong);
router.put('/chamcong/admin', HrController.adminSuaChamCong);
router.post('/luong', HrController.TinhLuong);
router.put('/luong-thuong', HrController.updateBangLuong);
router.get('/luong', HrController.getBangLuong);
router.get('/luong/:id', HrController.xemLuong);
router.get('/thongke/luong', HrController.getLuongThongKe);

// Phần quản lý đơn từ
router.get('/dontu', HrController.getAllLeaveRequest);
router.get('/dontu/canhan', HrController.getLeaveRequestById);
router.put('/dontu/:id', HrController.updateLeaveRequest);
router.post('/dontu', HrController.createLeaveRequest);
router.put('/dontu/:id/xuly', HrController.handleLeaveRequest);
module.exports = router;