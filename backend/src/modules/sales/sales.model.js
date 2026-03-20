const db = require('../../config/db');

const SalesModel = {
    // ==============================================
    // PHẦN 1: QUẢN LÝ KHÁCH HÀNG
    // ==============================================
    getAllKhachHang: async (filters) => {
        const { keyword, page = 1, limit = 10 } = filters;
        let sql = `SELECT * FROM khachhang WHERE 1=1`;
        let values = [];

        if (keyword) {
            sql += ` AND (tenKH LIKE ? OR sdt LIKE ?)`;
            values.push(`%${keyword}%`, `%${keyword}%`);
        }

        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
        const [countResult] = await db.query(countSql, values);
        const totalRecords = countResult[0].total;

        const offset = (page - 1) * limit;
        sql += ` ORDER BY maKH DESC LIMIT ? OFFSET ?`;
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

    themKhachHang: async (data) => {
        const sql = `INSERT INTO khachhang (tenKH, sdt, diaChi) VALUES (?, ?, ?)`;
        const [result] = await db.query(sql, [data.tenKH, data.sdt, data.diaChi]);
        return result.insertId;
    },

    // ==============================================
    // PHẦN 2: NGHIỆP VỤ BÁN HÀNG (TẠO HÓA ĐƠN)
    // ==============================================
    // Dữ liệu đầu vào: maKH, maNhanVien, giamGia, mangSerial (Mảng các mã máy được quét)
    taoHoaDonBanHang: async (maKH, maNhanVien, giamGia, mangSerial) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Bước 1: Lấy thông tin giá bán của các mã máy (Serial) được quét
            // Dùng dấu ? lặp lại tùy theo số lượng máy trong mảng
            const placeholders = mangSerial.map(() => '?').join(','); 
            const sqlGiaBan = `
                SELECT mt.maMay, mt.maSP, sp.tenSP, ctpn.donGiaNhap 
                FROM maytinh mt
                JOIN sanpham sp ON mt.maSP = sp.maSP
                JOIN chitietphieunhap ctpn ON mt.maPhieuNhap = ctpn.maPhieuNhap AND mt.maSP = ctpn.maSP
                WHERE mt.maMay IN (${placeholders}) AND mt.trangThai = 'Trong kho'
            `;
            const [danhSachMay] = await connection.query(sqlGiaBan, mangSerial);

            if (danhSachMay.length !== mangSerial.length) {
                throw new Error('Có máy tính không tồn tại hoặc đã được bán!');
            }

            // Tính tổng tiền (Giá bán mặc định = Giá nhập + 20% lợi nhuận)
            // Trong thực tế, bạn có thể tạo thêm cột GiaBan trong bảng SanPham. Ở đây mình tính nội suy.
            let tongTien = 0;
            const chiTietGomNhom = {}; 

            danhSachMay.forEach(may => {
                const donGiaBan = may.donGiaNhap * 1.2; // Lãi 20%
                tongTien += donGiaBan;

                // Gom nhóm theo maSP để insert vào bảng chitiethoadon
                if (!chiTietGomNhom[may.maSP]) {
                    chiTietGomNhom[may.maSP] = { soLuong: 0, donGia: donGiaBan, donGiaGoc: may.donGiaNhap };
                }
                chiTietGomNhom[may.maSP].soLuong += 1;
            });

            const thanhTien = tongTien - (giamGia || 0);

            // Bước 2: Tạo Hóa đơn
            const sqlHoaDon = `INSERT INTO hoadon (maKH, maNhanVien, ngayLap, tongTien, giamGia, thanhTien) VALUES (?, ?, NOW(), ?, ?, ?)`;
            const [hoaDonResult] = await connection.query(sqlHoaDon, [maKH, maNhanVien, tongTien, giamGia, thanhTien]);
            const maHoaDon = hoaDonResult.insertId;

            // Bước 3: Lưu Chi tiết hóa đơn và Trừ tồn kho
            for (const maSP in chiTietGomNhom) {
                const item = chiTietGomNhom[maSP];
                const thanhTienChiTiet = item.soLuong * item.donGia;
                
                // 3.1 Lưu bảng chitiethoadon
                const sqlCTHD = `INSERT INTO chitiethoadon (maHoaDon, maSP, soLuong, donGia, donGiaGoc, thanhTien) VALUES (?, ?, ?, ?, ?, ?)`;
                await connection.query(sqlCTHD, [maHoaDon, maSP, item.soLuong, item.donGia, item.donGiaGoc, thanhTienChiTiet]);

                // 3.2 Trừ số lượng tồn kho
                const sqlTruTonKho = `UPDATE sanpham SET soLuongTon = soLuongTon - ? WHERE maSP = ?`;
                await connection.query(sqlTruTonKho, [item.soLuong, maSP]);
            }

            // Bước 4: Cập nhật trạng thái của từng cái máy tính cụ thể (Serial)
            const sqlUpdateMayTinh = `UPDATE maytinh SET maHoaDon = ?, trangThai = 'Đã bán' WHERE maMay IN (${placeholders})`;
            await connection.query(sqlUpdateMayTinh, [maHoaDon, ...mangSerial]);

            await connection.commit();
            return { maHoaDon, tongTien, thanhTien };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = SalesModel;