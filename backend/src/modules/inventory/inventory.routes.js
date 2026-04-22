const express = require('express');
const router = express.Router();
const InventoryController = require('./inventory.controller');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const multer = require('multer');

// SỬ DỤNG RAM THAY VÌ Ổ CỨNG
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } 
});

router.use(verifyToken); 

router.get('/hangsp', InventoryController.getAllHangSP); // Lấy danh sách hãng sản phẩm
router.post('/hangsp', InventoryController.createHangSP);
router.put('/hangsp/:id', InventoryController.updateHangSP);
router.delete('/hangsp/:id', InventoryController.deleteHangSP);

router.get('/ncc', InventoryController.getAllNCC);
router.get('/ncc/active', InventoryController.getActiveNCC);
router.post('/ncc', InventoryController.createNCC);
router.put('/ncc/:id', InventoryController.updateNCC);
router.delete('/ncc/:id', InventoryController.deleteNCC);

router.get('/report/inventory', InventoryController.getInventoryReport); // Báo cáo tồn kho

router.get('/sanpham', InventoryController.getAllSanPham); // Lấy danh sách sản phẩm (Kèm bo loc)
router.get('/sanpham/:id', InventoryController.getOne); // Lấy chi tiết 1 sản phẩm theo ID
router.post('/sanpham', upload.single('hinhAnhFile'), InventoryController.createProduct); // Thêm mới 1 sản phẩm
router.put('/sanpham/:id', upload.single('hinhAnhFile'), InventoryController.updateProduct); // Cập nhật thông tin 1 sản phẩm
router.delete('/sanpham/:id', InventoryController.deleteProduct); //    Xóa 1 sản phẩm (Thay đổi trạng thái thành 0 - Không hiển thị)

router.post('/nhapkho', InventoryController.nhapKho); // Nhập khẩu sản phẩm 
router.get('/nhapkho', InventoryController.getAllPhieuNhapKho);
router.get('/ctnhapkho/:id', InventoryController.getCTPhieuNhapById);
router.get('/maytinh', InventoryController.getAllMayTinh);
router.put('/maytinh/:maMay', InventoryController.updateMayTinh); // Cập nhật trạng thái 1 mã máy cụ thể
module.exports = router;