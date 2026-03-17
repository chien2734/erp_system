const db = require('../../config/db');

const AuthModel = {
    // Tim tai khoan theo username (dùng cho login)
    findByUsername: async (username) => {
        const sql = `
            SELECT tk.*, nv.hoten, nv.email, nq.tenNhomQuyen
            FROM taikhoan tk
            JOIN nhanvien nv ON tk.maNhanVien = nv.maNhanVien
            JOIN nhomquyen nq ON tk.maNhomQuyen = nq.maNhomQuyen
            WHERE tk.username = ? and tk.trangThai = 1 and nv.trangThai = 1
        `;
        const [rows] = await db.query(sql, [username]);
        return rows[0]; 
    },

    // Lay quyen han theo maNhomQuyen (dùng cho phân quyền)
    getPermissions: async (maNhomQuyen) => {
        const sql = `
            SELECT cn.tenChucNang, pq.hanhDong
            FROM phanquyen pq
            JOIN chucnang cn ON pq.maChucNang = cn.maChucNang
            WHERE pq.maNhomQuyen = ? 
        `;
        const [rows] = await db.query(sql, [maNhomQuyen]);
        return rows;
    },
    
    // Đổi mật khẩu
    changePassword: async (maNhanVien, newPassword) => {
        const sql = `UPDATE taikhoan SET password = ? WHERE maNhanVien = ?`;
        const [result] = await db.query(sql, [newPassword, maNhanVien]);
        return result.affectedRows;
    },

    // Lay thong tin tai khoan theo maNhanVien (dùng cho profile)
    getAccountById: async (maNhanVien) => {
        const sql = `
            SELECT tk.*, nv.hoten, nv.email, nq.tenNhomQuyen
            FROM taikhoan tk
            JOIN nhanvien nv ON tk.maNhanVien = nv.maNhanVien
            JOIN nhomquyen nq ON tk.maNhomQuyen = nq.maNhomQuyen
            WHERE tk.maNhanVien = ? and tk.trangThai = 1
        `;
        const [rows] = await db.query(sql, [maNhanVien]);
        return rows[0];
    }
}

module.exports = AuthModel;