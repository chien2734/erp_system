const db = require('../../config/db');

const HrModel = {
    // ===================================
    // Phan 1: Quan ly nhan vien
    //====================================

    // Lấy danh sách nhân viên (Kèm filter)
    getAllNhanVien: async (filters) => {
        const { keyword, maChucVu, page = 1, limit = 10 } = filters;
        let sql = `
            SELECT nv.*, cv.tenChucVu 
            FROM nhanvien nv
            LEFT JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
            WHERE nv.trangThai = 1
        `;
        let values = [];

        if (keyword) {
            sql += ` AND (nv.hoTen LIKE ? OR nv.sdt LIKE ?)`;
            values.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (maChucVu) {
            sql += ` AND nv.maChucVu = ?`;
            values.push(maChucVu);
        }

        // Đếm tổng số bản ghi
        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
        const [countResult] = await db.query(countSql, values);
        const totalRecords = countResult[0].total;

        // Phân trang
        const offset = (page - 1) * limit;
        sql += ` ORDER BY nv.maNhanVien DESC LIMIT ? OFFSET ?`;
        values.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, values);
        return {
            data: rows,
            pagination: { page: Number(page), limit: Number(limit), totalRecords, totalPages: Math.ceil(totalRecords / limit) }
        };
    },
    // Lấy chi tiết 1 nhân viên theo ID
    getNhanVienById: async (id) => {
        const sql = `SELECT * FROM nhanvien WHERE maNhanVien = ? AND trangThai = 1`;
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    },

    // Thêm mới nhân viên
    createNhanVien: async (data) => {
        const sql = `
            INSERT INTO nhanvien (hoTen, ngaySinh, gioiTinh, sdt, email, diaChi, ngayVaoLam, maChucVu, trangThai) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;
        const values = [data.hoTen, data.ngaySinh, data.gioiTinh, data.sdt, data.email, data.diaChi, data.ngayVaoLam, data.maChucVu];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },

    // Cập nhật thông tin nhân viên
    updateNhanVien: async (id, data) => {
        const sql = `
            UPDATE nhanvien 
            SET hoTen = ?, ngaySinh = ?, gioiTinh = ?, sdt = ?, email = ?, diaChi = ?
            WHERE maNhanVien = ?
        `;
        const values = [data.hoTen, data.ngaySinh, data.gioiTinh, data.sdt, data.email, data.diaChi, id];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },

    // Xóa nhân viên (chuyển trangThai = 0)
    deleteNhanVien: async (id) => {
        const sql = `UPDATE nhanvien SET trangThai = 0 WHERE maNhanVien = ?`;
        const [result] = await db.query(sql, [id]);
        return result.affectedRows;
    }, 

    // Thay đổi chức vụ -> lịch sử công tác
    changeChucVu: async (id, maChucVuMoi, ngayHieuLuc) => {
        // Lấy một kết nối riêng biệt từ Pool để chạy Transaction
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const sqlCloseOld = `
                UPDATE thaydoichucvu
                SET ngayKetThuc = ?
                WHERE maNhanVien = ? AND ngayKetThuc IS NULL
            `;
            await connection.query(sqlCloseOld, [ngayHieuLuc, id]);

            const sqlAddMew = `
                INSERT INTO thaydoichucvu (maNhanVien, maChucVu, ngayBatDau, ngayKetThuc)
                VALUES (?, ?, ?, NULL)
            `;
            await connection.query(sqlAddMew, [id, maChucVuMoi, ngayHieuLuc]);
            
            const sqlUpdateNhanVien = `UPDATE nhanvien SET maChucVu = ? WHERE maNhanVien = ?`;
            await connection.query(sqlUpdateNhanVien, [maChucVuMoi, id]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Lay lich su cong tac cua nhan vien
    getLichSuCongTac: async (id) => {
        const sql = `
            SELECT td.maNhanVien, td.maChucVu, cv.tenChucVu, td.ngayBatDau, td.ngayKetThuc
            FROM thaydoichucvu td
            JOIN chucvu cv ON td.maChucVu = cv.maChucVu
            WHERE td.maNhanVien = ?
            ORDER BY td.ngayBatDau DESC
        `;
        const [rows] = await db.query(sql, [id]);
        return rows;
    },
     
    //=========================
    // Phan 2: Quan ly chuc vu
    // ========================
    //  Lay danh sach chuc vu
    getAllChucVu: async () => {
        const sql = `SELECT * FROM chucvu`;
        const [rows] = await db.query(sql);
        return rows;
    }

};

module.exports = HrModel;