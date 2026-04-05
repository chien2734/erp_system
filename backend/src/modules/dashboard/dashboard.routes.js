const express = require('express');
const router = express.Router();
const DashboardController = require('../dashboard/dashboard.controller');
const { verifyToken } = require('../../../middlewares/auth.middleware');

router.use(verifyToken);

// Chỉ Giám đốc (Role 1) mới được truy cập Dashboard
router.get('/summary', DashboardController.getSummary);

module.exports = router;