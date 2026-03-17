const express = require('express');
const router = express.Router();
const InventoryController = require('./inventory.controller');
const { verifyToken } = require('../../../middlewares/auth.middleware');

router.use(verifyToken); 

router.get('/hangsp', InventoryController.getAllHangSP);// Lấy danh sách hãng sản phẩm

router.get('/sanpam', InventoryController.getAll);// Lấy danh sách sản phẩm (Kèm bo loc)
router.get('/sanpham/:id', InventoryController.getOne);// Lấy chi tiết 1 sản phẩm theo ID
router.post('/sanpham', InventoryController.create);// Thêm mới 1 sản phẩm
router.put('/sanpham/:id', InventoryController.update);// Cập nhật thông tin 1 sản phẩm
router.delete('/sanpham/:id', InventoryController.delete);//    Xóa 1 sản phẩm (Thay đổi trạng thái thành 0 - Không hiển thị)

router.post('/nhapkho', InventoryController.nhapKho); // Nhập khẩu sản phẩm từ file Excel
module.exports = router;