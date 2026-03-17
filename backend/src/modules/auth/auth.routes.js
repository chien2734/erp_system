const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const verifyToken = require('../../../middleware/verifyToken');

router.post('/login', AuthController.login);
router.get('/profile', verifyToken, AuthController.getProfile);
router.put('/change-password', verifyToken, AuthController.changePassword);

// router.post('/register', AuthController.register);
module.exports = router;