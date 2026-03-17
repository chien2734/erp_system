const express = require('express');
const router = express.Router();
const {verifyToken} = require('../../../middlewares/auth.middleware');
const HrController = require('./hr.controller');
router.use(verifyToken); // Áp dụng middleware xác thực cho tất cả routes bên dưới

router.get('/chucvu', HrController.getAllChucVu);// Lấy danh sách chức vụ

router.get('/nhanvien' , HrController.getAll); // Lấy danh sách nhân viên với phân trang và lọc
router.get('/nhanvien/:id', HrController.getOne);// Lấy chi tiết 1 nhân viên theo ID
router.post('/nhanvien', HrController.create);// Thêm mới nhân viên
router.put('/nhanvien/:id', HrController.update);// Cập nhật thông tin nhân viên
router.delete('/nhanvien/:id', HrController.delete);// Xóa nhân viên (chuyển trạng thái)
router.put('/nhanvien/:id/chucvu', HrController.changeChucVu);// Thăng chức nhân viên

module.exports = router;