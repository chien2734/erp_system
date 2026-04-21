const db = require('../../config/db');

const AuditModel = {
    create: async (maNhanVien, hanhDong, chiTiet) => {
        const sql = `INSERT INTO audit_logs (maNhanVien, hanhDong, chiTiet) VALUES (?, ?, ?)`;
        const [result] = await db.query(sql, [maNhanVien, hanhDong, JSON.stringify(chiTiet)]);
        return result.insertId;
    },

    getAll: async (filters = {}) => {
        const { page = 1, limit = 50 } = filters;
        const offset = (page - 1) * limit;
        
        const sql = `
            SELECT al.*, nv.hoTen as tenNhanVien, tk.username
            FROM audit_logs al
            LEFT JOIN nhanvien nv ON al.maNhanVien = nv.maNhanVien
            LEFT JOIN taikhoan tk ON al.maNhanVien = tk.maNhanVien
            ORDER BY al.ngayTao DESC
            LIMIT ? OFFSET ?
        `;
        
        const countSql = `SELECT COUNT(*) as total FROM audit_logs`;
        
        const [rows] = await db.query(sql, [Number(limit), Number(offset)]);
        const [countResult] = await db.query(countSql);
        
        return {
            data: rows,
            total: countResult[0].total
        };
    }
};

module.exports = AuditModel;
