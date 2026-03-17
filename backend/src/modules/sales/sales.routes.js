const express = require('express');
const router = express.Router();
const SalesController = require('./sales.controller');
const { verifyToken } = require('../../../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/khachhang', SalesController.getAllKhachHang);
router.post('/khachhang', SalesController.create);

router.post('/hoadon', SalesController.banHangPOS);

module.exports = router;