const db = require('../../config/db');

const InventoryModel = {
    //===============================
    // HANG SAN PHAM VA NCC
    //===============================

    // Lấy danh sách hãng sản phẩm
    getAllHangSP: async (filters) => {
        const { id, tenHang } = filters;
        let sql = `SELECT * FROM hangsp WHERE 1 = 1`;
        let values = [];
        if (id) {
            sql += ` AND maHang = ?`;
            values.push(id);
        }
        if (tenHang) {
            sql += ` AND tenHang like ?`;
            values.push(`%${tenHang}%`);
        }
        const [rows] = await db.query(sql, values);
        return rows;
    },
    // NCC
    getAllNCC: async (filters) => {
        const { id, tenNCC } = filters;
        let sql = `
            SELECT * FROM nhacungcap WHERE trangThai = 1`;
        let values = [];
        if (id) {
            sql += ` AND maNCC = ?`;
            values.push(id);
        }
        if (tenNCC) {
            sql += ` AND tenNCC like ?`;
            values.push(`%${tenNCC}%`);
        }
        const [rows] = await db.query(sql, values);
        return rows;
    },

    createNCC: async (data) => {
        const sql = `
            INSERT INTO nhacungcap (tenNCC, sdt, diaChi, email) VALUES (?, ?, ?, ?)
        `;
        const values = [data.tenNCC, data.sdt, data.diaChi, data.email];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },

    updateNCC: async (maNCC, data) => {
        const sql = `
            UPDATE nhacungcap 
            SET tenNCC = ?, sdt = ?, diaChi =?, email =?
            WHERE maDon = ?`;
        const values = [data.tenNCC, data.sdt, data.diaChi, data.email, maNCC];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },

    deleteNCC: async (maNCC) => {
        const sql = `
            UPDATE nhacungcap
            SET trangThai = 0
            WHERE maNCC = ?
        `;
        const [result] = await db.query(sql, maNCC);
        return result.affectedRows;
    },
    //================================
    // SAN PHAM
    //================================

    // Lấy danh sách sản phẩm (Kèm bo loc)
    getAllProducts: async (filters) => {
        const { keyword, maHang, page = 1, limit = 10 } = filters;

        // 1. Khởi tạo câu query gốc
        let sql = `
            SELECT sp.*, h.tenHang 
            FROM sanpham sp
            JOIN hangsp h ON sp.maHang = h.maHang
            WHERE sp.trangThai = 1
        `;
        let values = [];
        // 2. Thêm điều kiện Tìm kiếm
        if (keyword) {
            sql += ` AND sp.tenSP LIKE ?`;
            values.push(`%${keyword}%`);
        }
        // 3. Thêm điều kiện Lọc
        if (maHang) {
            sql += ` AND sp.maHang = ?`;
            values.push(maHang);
        }
        // 4. Đếm tổng số lượng bản ghi (để Frontend làm nút phân trang 1, 2, 3...)
        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
        const [countResult] = await db.query(countSql, values);
        const totalRecords = countResult[0].total;
        // 5. Thêm Phân trang (LIMIT và OFFSET)
        const offset = (page - 1) * limit;
        sql += ` ORDER BY sp.maSP DESC LIMIT ? OFFSET ?`;
        // LIMIT và OFFSET bắt buộc phải ép kiểu số nguyên (Number)
        values.push(Number(limit), Number(offset));
        // 6. Thực thi câu query cuối cùng
        const [rows] = await db.query(sql, values);
        return {
            data: rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit)
            }
        };
    },
    // Lấy chi tiết 1 sản phẩm theo ID
    getProductById: async (id) => {
        const sql = `SELECT * FROM sanpham WHERE maSP = ? AND trangThai = 1`;
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    },
    // Thêm mới sản phẩm
    createProduct: async (data) => {
        const sql = `
            INSERT INTO sanpham (maHang, tenSP, moTa, cauHinh, hinhAnh, soLuongTon, trangThai) 
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `;
        const values = [data.maHang, data.tenSP, data.moTa, data.cauHinh, data.hinhAnh, data.soLuongTon || 0];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },

    // Cập nhật thông tin sản phẩm
    updateProduct: async (id, data) => {
        const sql = `
            UPDATE sanpham 
            SET maHang = ?, tenSP = ?, moTa = ?, cauHinh = ?, hinhAnh = ?
            WHERE maSP = ?
        `;
        const values = [data.maHang, data.tenSP, data.moTa, data.cauHinh, data.hinhAnh, id];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },

    // Xóa sản phẩm (chuyển trangThai = 0)
    deleteProduct: async (id) => {
        const sql = `UPDATE sanpham SET trangThai = 0 WHERE maSP = ?`;
        const [result] = await db.query(sql, id);
        return result.affectedRows;
    },

    //================================
    // NHAP KHO
    //================================

    // Tao phieu nhap kho
    createNhapKho: async (maNCC, maNhanVien, tongTien, daSachSanPham) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            // Tao phieu nhap
            const sqlPhieuNhap = `
                INSERT INTO phieunhap (maNCC, maNhanVien, ngayNhap, tongTien)
                VALUES (?, ?, NOW(), ?)
            `;
            const [resultPhieuNhap] = await connection.query(sqlPhieuNhap, [maNCC, maNhanVien, tongTien]);
            const maPhieuNhap = resultPhieuNhap.insertId;

            // Duyet qua danh sach san pham 
            for (let item of daSachSanPham) {
                // chi tiet phieu nhap
                const sqlChiTiet = `
                    INSERT INTO chitietphieunhap (maPhieuNhap, maSP, soLuong, donGiaNhap)
                    VALUES (?, ?, ?, ?)
                `;
                await connection.query(sqlChiTiet, [maPhieuNhap, item.maSP, item.soLuong, item.donGiaNhap]);
                // cap nhat so luong ton kho
                const sqlUpdateTonKho = `
                    UPDATE sanpham 
                    SET soLuongTon = soLuongTon + ?
                    WHERE maSP = ?
                `;
                await connection.query(sqlUpdateTonKho, [item.soLuong, item.maSP]);

                // Tao ma serial cho tung san pham
                for (let i = 0; i < item.soLuong; i++) {
                    const maMay = `SP${item.maSP}-PN${maPhieuNhap}-${i}`;
                    const sqlMayTinh = `
                        INSERT INTO maytinh (maMay, maSP, maPhieuNhap, trangThai)
                        VALUES (?, ?, ?, 1)
                    `;
                    await connection.query(sqlMayTinh, [maMay, item.maSP, maPhieuNhap]);
                }
            }
            await connection.commit();
            return maPhieuNhap;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    getAllPhieuNhapKho: async (filters) => {
        const { maPhieuNhap, tuNgay, denNgay, page = 1, limit = 10 } = filters;
        // Tính toán vị trí bắt đầu lấy dữ liệu
        const offset = (page - 1) * limit;
        let sql = `SELECT * FROM phieunhap WHERE 1 = 1`;
        let values = [];
        if (maPhieuNhap) {
            sql += ` AND maPhieuNhap = ?`;
            values.push(maPhieuNhap);
        }
        if (tuNgay) {
            sql += ` AND ngayNhap >= ?`;
            values.push(tuNgay);
        }
        if(denNgay){
            sql += ` AND ngayNhap <= ?`;
            values.push(denNgay);
        }
        sql += ` ORDER BY ngayNhap DESC`;

        // 3. Thêm Phân trang (Pagination)
        sql += ` LIMIT ? OFFSET ?`;
        values.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(sql, values);
        return rows;
    },
    // lay chi tiet phieu nhap
    getCTPhieuNhapById: async (maPN) => {
        const sql = `select * from chitietphieunhap where maPhieuNhap = ? `;
        const [rows] = await db.query(sql, maPN);
        return rows;
    },
    // Quan ly SERIAL
    // ==============================================
    // PHẦN 4: QUẢN LÝ MÃ MÁY (SERIAL/IMEI)
    // ==============================================

    getAllMayTinh: async (filters) => {
        const { keyword, maSP, trangThai, page = 1, limit = 10 } = filters;      
        let sql = `
            SELECT mt.maMay, mt.maSP, mt.maPhieuNhap, mt.maHoaDon, mt.trangThai, sp.tenSP 
            FROM maytinh mt
            JOIN sanpham sp ON mt.maSP = sp.maSP
            WHERE 1=1
        `;
        let values = [];

        if (keyword) {
            sql += ` AND mt.maMay LIKE ?`;
            values.push(`%${keyword}%`);
        }
        if (maSP) {
            sql += ` AND mt.maSP = ?`;
            values.push(maSP);
        }
        if (trangThai) {
            sql += ` AND mt.trangThai = ?`;
            values.push(trangThai);
        }
        // Đếm tổng số lượng bản ghi để phân trang
        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
        const [countResult] = await db.query(countSql, values);
        const totalRecords = countResult[0].total;

        // Phân trang
        const offset = (page - 1) * limit;
        sql += ` ORDER BY mt.maPhieuNhap DESC, mt.maMay ASC LIMIT ? OFFSET ?`;
        values.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, values);
      
        return {
            data: rows,
            pagination: { 
                page: Number(page), 
                limit: Number(limit), 
                totalRecords, 
                totalPages: Math.ceil(totalRecords / limit) 
            }
        };
    },
};

module.exports = InventoryModel;