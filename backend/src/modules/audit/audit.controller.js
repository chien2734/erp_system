const AuditModel = require('./audit.model');

const AuditController = {
    getLogs: async (req, res) => {
        // Chỉ Giám đốc (maNhomQuyen === 1) mới có quyền xem Audit Logs
        if (req.user.maNhomQuyen !== 1) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập lịch sử hệ thống!' });
        }

        try {
            const { page, limit } = req.query;
            const result = await AuditModel.getAll({ page, limit });
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            console.error("Lỗi lấy Audit Logs:", error);
            res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử hệ thống' });
        }
    }
};

module.exports = AuditController;
