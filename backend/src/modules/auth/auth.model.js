const db = require('../../config/db');

const AuthModel = {
    // ==========================================
    // 1. CÁC HÀM CƠ BẢN
    // ==========================================
    findByUsername: async (username) => {
        const sql = `
            SELECT tk.*, nv.hoten, nv.email, nq.tenNhomQuyen, nv.trangThai AS nvTrangThai
            FROM taikhoan tk
            JOIN nhanvien nv ON tk.maNhanVien = nv.maNhanVien
            JOIN nhomquyen nq ON tk.maNhomQuyen = nq.maNhomQuyen
            WHERE tk.username = ? 
            -- XÓA "and tk.trangThai = 1" Ở ĐÂY ĐỂ CHO PHÉP TÌM THẤY TÀI KHOẢN BỊ KHÓA
        `;
        const [rows] = await db.query(sql, [username]);
        return rows[0]; 
    },

    getPermissions: async (maNhomQuyen) => {
        const sql = `
            SELECT maChucNang, quyenXem, quyenThem, quyenSua, quyenXoa
            FROM phanquyen
            WHERE maNhomQuyen = ? 
        `;
        const [rows] = await db.query(sql, [maNhomQuyen]);
        return rows;
    },
    
    changePassword: async (maNhanVien, newPassword) => {
        const sql = `UPDATE taikhoan SET password = ? WHERE maNhanVien = ?`;
        const [result] = await db.query(sql, [newPassword, maNhanVien]);
        return result.affectedRows;
    },

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
    },

    // ==========================================
    // 2. CÁC HÀM DÀNH CHO ADMIN QUẢN LÝ 
    // ==========================================

    // Lấy danh sách tài khoản
    getAllAccounts: async () => {
        const sql = `
            SELECT tk.maNhanVien, tk.username, tk.maNhomQuyen, tk.trangThai, 
                   nv.hoTen, nq.tenNhomQuyen
            FROM taikhoan tk
            JOIN nhanvien nv ON tk.maNhanVien = nv.maNhanVien
            JOIN nhomquyen nq ON tk.maNhomQuyen = nq.maNhomQuyen
            ORDER BY tk.maNhanVien DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    },

    // Tìm nhân viên chưa có tài khoản (Để gán vào Dropdown)
    getFreeEmployees: async () => {
        const sql = `
            SELECT nv.maNhanVien, nv.hoTen 
            FROM nhanvien nv
            LEFT JOIN taikhoan tk ON nv.maNhanVien = tk.maNhanVien
            WHERE tk.maNhanVien IS NULL AND nv.trangThai = 1
        `;
        const [rows] = await db.query(sql);
        return rows;
    },

    // Tạo tài khoản mới (Mật khẩu đang để Text thường, tương lai nên Hash)
    createAccount: async (data) => {
        const sql = `INSERT INTO taikhoan (maNhanVien, username, password, maNhomQuyen, trangThai) VALUES (?, ?, ?, ?, 1)`;
        const values = [data.maNhanVien, data.username, '123456', data.maNhomQuyen];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },

    // Đổi nhóm quyền cho tài khoản
    updateAccountRole: async (maNhanVien, maNhomQuyen) => {
        const sql = `UPDATE taikhoan SET maNhomQuyen = ? WHERE maNhanVien = ?`;
        const [result] = await db.query(sql, [maNhomQuyen, maNhanVien]);
        return result.affectedRows;
    },

    // Khóa / Mở khóa tài khoản
    updateAccountStatus: async (maNhanVien, trangThai) => {
        const sql = `UPDATE taikhoan SET trangThai = ? WHERE maNhanVien = ?`;
        const [result] = await db.query(sql, [trangThai, maNhanVien]);
        return result.affectedRows;
    },

    // Lấy danh sách Roles
    getAllRoles: async () => {
        const [rows] = await db.query(`SELECT * FROM nhomquyen`);
        return rows;
    },

    // Tạo Role mới
    createRole: async (data) => {
        const sql = `INSERT INTO nhomquyen (tenNhomQuyen, moTa) VALUES (?, ?)`;
        const [result] = await db.query(sql, [data.tenNhomQuyen, data.moTa]);
        return result.insertId;
    },

    // Lấy danh sách Modules chức năng
    getAllFunctions: async () => {
        const [rows] = await db.query(`SELECT * FROM chucnang`);
        return rows;
    },

    // Cập nhật ma trận phân quyền (Sử dụng Transaction an toàn tuyệt đối)
    updateRolePermissions: async (maNhomQuyen, permissionsArray) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 1. Xóa sạch quyền cũ của Nhóm này
            await connection.query(`DELETE FROM phanquyen WHERE maNhomQuyen = ?`, [maNhomQuyen]);

            // 2. Chèn quyền mới vào (Dùng chèn hàng loạt Bulk Insert cho nhanh)
            if (permissionsArray && permissionsArray.length > 0) {
                const values = permissionsArray.map(p => [
                    maNhomQuyen,
                    p.maChucNang,
                    p.quyenXem,
                    p.quyenThem,
                    p.quyenSua,
                    p.quyenXoa
                ]);
                const sql = `INSERT INTO phanquyen (maNhomQuyen, maChucNang, quyenXem, quyenThem, quyenSua, quyenXoa) VALUES ?`;
                await connection.query(sql, [values]);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = AuthModel;