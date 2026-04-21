const AuditModel = require('../src/modules/audit/audit.model');

const recordLog = async (maNhanVien, hanhDong, chiTiet = null) => {
    try {
        await AuditModel.create(maNhanVien, hanhDong, chiTiet);
    } catch (error) {
        console.error("Failed to record audit log:", error);
    }
};

module.exports = { recordLog };
