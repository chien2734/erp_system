const express = require('express');
const router = express.Router();

// Import routes từ các modules
const authRoutes = require('../modules/auth/auth.routes');
const hrRoutes = require('../modules/hr/hr.routes');
const inventoryRoutes = require('../modules/inventory/inventory.routes');
const salesRoutes = require('../modules/sales/sales.routes');

// Định tuyến API
router.use('/auth', authRoutes);           // VD: /api/v1/auth/login
router.use('/hr', hrRoutes);               // VD: /api/v1/hr/nhanvien
router.use('/inventory', inventoryRoutes); // VD: /api/v1/inventory/sanpham
router.use('/sales', salesRoutes);         // VD: /api/v1/sales/hoadon

module.exports = router;