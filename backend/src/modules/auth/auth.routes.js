const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const { verifyToken } = require('../../../middlewares/auth.middleware');

router.post('/login', AuthController.login);
router.get('/profile', verifyToken, AuthController.getProfile);
router.put('/change-password', verifyToken, AuthController.changePassword);

// Quản lý Tài khoản (Nhân viên)
router.get('/admin/accounts', verifyToken, AuthController.getAccounts);
router.post('/admin/accounts', verifyToken, AuthController.createAccount);
router.put('/admin/accounts/:id', verifyToken, AuthController.updateAccountRole);
router.put('/admin/accounts/:id/status', verifyToken, AuthController.updateAccountStatus);
router.put('/admin/accounts/:id/reset-password', verifyToken, AuthController.resetAccountPassword);
router.get('/admin/free-employees', verifyToken, AuthController.getFreeEmployees);

// Quản lý Phân quyền (Roles)
router.get('/admin/roles', verifyToken, AuthController.getRoles);
router.post('/admin/roles', verifyToken, AuthController.createRole);
router.get('/admin/functions', verifyToken, AuthController.getFunctions);
router.get('/admin/roles/:id/permissions', verifyToken, AuthController.getRolePermissions);
router.put('/admin/roles/:id/permissions', verifyToken, AuthController.updateRolePermissions);

module.exports = router;