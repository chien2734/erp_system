const express = require('express');
const router = express.Router();
const AuditController = require('./audit.controller');
const { verifyToken } = require('../../../middlewares/auth.middleware');

router.get('/logs', verifyToken, AuditController.getLogs);

module.exports = router;
