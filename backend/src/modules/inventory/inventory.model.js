const db = require('../../config/db');

const InventoryModel = {
    //===============================
    // HANG SAN PHAM
    //===============================

    // Lấy danh sách hãng sản phẩm
    getAllHangSP: async () => {
        const sql = `SELECT * FROM hangsp WHERE trangThai = 1`;
        const [rows] = await db.query(sql);
        return rows;
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
        const [result] = await db.query(sql, [id]);
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
            for (let item of daSachSanPham){
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
    } 
};

module.exports = InventoryModel;