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

    capNhatKhachHang: async (maKH, data) => {
        const sql = `UPDATE khachhang SET tenKH = ?, sdt = ?, diaChi = ? WHERE maKH = ?`;
        const [result] = await db.query(sql, [data.tenKH, data.sdt, data.diaChi, maKH]);
        return result.affectedRows; // Trả về số dòng bị ảnh hưởng để biết có update thành công không
    },

    // ==============================================
    // PHẦN 2: NGHIỆP VỤ BÁN HÀNG (TẠO HÓA ĐƠN)
    // ==============================================
    // Dữ liệu đầu vào: maKH, maNhanVien, giamGia, mangSerial (Mảng các mã máy được quét)
    taoHoaDonBanHang: async (maKH, maNhanVien, giamGia, mangSerial, tienKhachDua, phuongThucThanhToan) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const placeholders = mangSerial.map(() => '?').join(','); 
            const sqlGiaBan = `
                SELECT mt.maMay, mt.maSP, sp.tenSP, sp.giaBan 
                FROM maytinh mt
                JOIN sanpham sp ON mt.maSP = sp.maSP
                WHERE mt.maMay IN (${placeholders}) AND mt.trangThai = 'Trong kho'
            `;
            const [danhSachMay] = await connection.query(sqlGiaBan, mangSerial);

            if (danhSachMay.length !== mangSerial.length) {
                throw new Error('Có máy tính không tồn tại hoặc đã được bán!');
            }

            let tongTien = 0;
            const chiTietGomNhom = {}; 

            danhSachMay.forEach(may => {
                const donGiaBan = may.giaBan; 
                tongTien += donGiaBan;

                if (!chiTietGomNhom[may.maSP]) {
                    chiTietGomNhom[may.maSP] = { soLuong: 0, donGia: donGiaBan};
                }
                chiTietGomNhom[may.maSP].soLuong += 1;
            });

            // Doanh thu thực tế
            const thanhTien = tongTien - (giamGia || 0);
            
            const khachDua = tienKhachDua ? parseInt(tienKhachDua) : thanhTien;

            const sqlHoaDon = `INSERT INTO hoadon (maKH, maNhanVien, ngayLap, tongTien, giamGia, thanhTien, tienKhachDua, phuongThucThanhToan) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`;
            const [hoaDonResult] = await connection.query(sqlHoaDon, [maKH, maNhanVien, tongTien, giamGia, thanhTien, khachDua, phuongThucThanhToan || 'Tiền mặt']);
            const maHoaDon = hoaDonResult.insertId;

            for (const maSP in chiTietGomNhom) {
                const item = chiTietGomNhom[maSP];
                const thanhTienChiTiet = item.soLuong * item.donGia;
                
                const sqlCTHD = `INSERT INTO chitiethoadon (maHoaDon, maSP, soLuong, donGia, thanhTien) VALUES (?, ?, ?, ?, ?)`;
                await connection.query(sqlCTHD, [maHoaDon, maSP, item.soLuong, item.donGia, thanhTienChiTiet]);

                const sqlTruTonKho = `UPDATE sanpham SET soLuongTon = soLuongTon - ? WHERE maSP = ?`;
                await connection.query(sqlTruTonKho, [item.soLuong, maSP]);
            }

            const sqlUpdateMayTinh = `UPDATE maytinh SET maHoaDon = ?, trangThai = 'Đã bán' WHERE maMay IN (${placeholders})`;
            await connection.query(sqlUpdateMayTinh, [maHoaDon, ...mangSerial]);

            await connection.commit();
            return { maHoaDon, tongTien, thanhTien, tienKhachDua: khachDua };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // ==============================================
    // PHẦN 3: TRA CỨU HÓA ĐƠN
    // ==============================================
    getAllHoaDon: async (filters = {}) => {
        // Join thêm bảng khachhang và nhanvien/taikhoan để lấy tên
        let sql = `
            SELECT hd.*, kh.tenKH, kh.sdt , nv.hoTen AS tenNhanVien 
            FROM hoadon hd
            LEFT JOIN khachhang kh ON hd.maKH = kh.maKH
            LEFT JOIN nhanvien nv ON hd.maNhanVien = nv.maNhanVien
            ORDER BY hd.ngayLap DESC
        `;
        
        const [rows] = await db.query(sql);
        return rows;
    },

    getChiTietHoaDonById: async (maHoaDon) => {
        // 1. Lấy thông tin chung của Hóa đơn (Gồm cả tên KH và tên NV)
        const sqlHD = `
            SELECT hd.*, kh.tenKH, kh.sdt, nv.hoTen AS tenNhanVien 
            FROM hoadon hd
            LEFT JOIN khachhang kh ON hd.maKH = kh.maKH
            LEFT JOIN nhanvien nv ON hd.maNhanVien = nv.maNhanVien
            WHERE hd.maHoaDon = ?
        `;
        const [hoaDonRows] = await db.query(sqlHD, [maHoaDon]);
        if (hoaDonRows.length === 0) throw new Error('Không tìm thấy hóa đơn!');
        const thongTinChung = hoaDonRows[0];

        // 2. Lấy danh sách sản phẩm (Chi tiết hóa đơn)
        const sqlCT = `
            SELECT ct.*, sp.tenSP 
            FROM chitiethoadon ct
            JOIN sanpham sp ON ct.maSP = sp.maSP
            WHERE ct.maHoaDon = ?
        `;
        const [chiTietRows] = await db.query(sqlCT, [maHoaDon]);

        // 3. Lấy danh sách Serial của hóa đơn này
        const sqlSerial = `SELECT maMay, maSP FROM maytinh WHERE maHoaDon = ?`;
        const [serialRows] = await db.query(sqlSerial, [maHoaDon]);

        // 4. Nhét Serial vào từng dòng sản phẩm tương ứng (Giống hệt bên Nhập kho)
        thongTinChung.chiTiet = chiTietRows.map(ct => {
            return {
                ...ct,
                serials: serialRows.filter(s => s.maSP === ct.maSP).map(s => s.maMay)
            };
        });

        return thongTinChung;
    },
    // Báo cáo sản phẩm
    getProductSalesReport: async ({ startDate, endDate }) => {
        const sql = `
            SELECT sp.maSP,
                   sp.tenSP,
                   SUM(cthd.soLuong) AS soLuongDaXuat,
                   SUM(cthd.thanhTien) AS doanhThu,
                   COALESCE(SUM(cost.tongGiaVon), 0) AS tongGiaVon,
                   SUM(cthd.thanhTien) - COALESCE(SUM(cost.tongGiaVon), 0) AS loiNhuan
            FROM hoadon hd
            JOIN chitiethoadon cthd ON hd.maHoaDon = cthd.maHoaDon
            JOIN sanpham sp ON cthd.maSP = sp.maSP
            LEFT JOIN (
                SELECT mt.maHoaDon, mt.maSP, SUM(COALESCE(ctpn.donGiaNhap, 0)) AS tongGiaVon
                FROM maytinh mt
                LEFT JOIN chitietphieunhap ctpn ON mt.maPhieuNhap = ctpn.maPhieuNhap AND mt.maSP = ctpn.maSP
                WHERE mt.maHoaDon IS NOT NULL
                GROUP BY mt.maHoaDon, mt.maSP
            ) cost ON cost.maHoaDon = hd.maHoaDon AND cost.maSP = cthd.maSP
            WHERE hd.ngayLap BETWEEN ? AND ?
            GROUP BY sp.maSP, sp.tenSP
            ORDER BY soLuongDaXuat DESC, sp.tenSP ASC
        `;
        const [rows] = await db.query(sql, [startDate, endDate]);
        return rows;
    },
    // Báo cáo lợi nhuận
    getProfitReport: async ({ startDate, endDate, groupBy }) => {
        const costSubquery = `
            SELECT mt.maHoaDon, mt.maSP, SUM(COALESCE(ctpn.donGiaNhap, 0)) AS tongGiaVon
            FROM maytinh mt
            LEFT JOIN chitietphieunhap ctpn ON mt.maPhieuNhap = ctpn.maPhieuNhap AND mt.maSP = ctpn.maSP
            WHERE mt.maHoaDon IS NOT NULL
            GROUP BY mt.maHoaDon, mt.maSP
        `;

        let sql = '';
        if (groupBy === 'month') {
            sql = `
                SELECT MONTH(hd.ngayLap) AS thang,
                       SUM(cthd.thanhTien) AS doanhThu,
                       COALESCE(SUM(cost.tongGiaVon), 0) AS tongGiaVon,
                       SUM(cthd.thanhTien) - COALESCE(SUM(cost.tongGiaVon), 0) AS loiNhuan
                FROM hoadon hd
                JOIN chitiethoadon cthd ON hd.maHoaDon = cthd.maHoaDon
                LEFT JOIN (${costSubquery}) cost ON cost.maHoaDon = hd.maHoaDon AND cost.maSP = cthd.maSP
                WHERE hd.ngayLap BETWEEN ? AND ?
                GROUP BY MONTH(hd.ngayLap)
                ORDER BY MONTH(hd.ngayLap)
            `;
        } else if (groupBy === 'quarter') {
            sql = `
                SELECT CEILING(MONTH(hd.ngayLap) / 3) AS quy,
                       SUM(cthd.thanhTien) AS doanhThu,
                       COALESCE(SUM(cost.tongGiaVon), 0) AS tongGiaVon,
                       SUM(cthd.thanhTien) - COALESCE(SUM(cost.tongGiaVon), 0) AS loiNhuan
                FROM hoadon hd
                JOIN chitiethoadon cthd ON hd.maHoaDon = cthd.maHoaDon
                LEFT JOIN (${costSubquery}) cost ON cost.maHoaDon = hd.maHoaDon AND cost.maSP = cthd.maSP
                WHERE hd.ngayLap BETWEEN ? AND ?
                GROUP BY CEILING(MONTH(hd.ngayLap) / 3)
                ORDER BY CEILING(MONTH(hd.ngayLap) / 3)
            `;
        } else {
            sql = `
                SELECT SUM(cthd.thanhTien) AS doanhThu,
                       COALESCE(SUM(cost.tongGiaVon), 0) AS tongGiaVon,
                       SUM(cthd.thanhTien) - COALESCE(SUM(cost.tongGiaVon), 0) AS loiNhuan
                FROM hoadon hd
                JOIN chitiethoadon cthd ON hd.maHoaDon = cthd.maHoaDon
                LEFT JOIN (${costSubquery}) cost ON cost.maHoaDon = hd.maHoaDon AND cost.maSP = cthd.maSP
                WHERE hd.ngayLap BETWEEN ? AND ?
            `;
        }
        const [rows] = await db.query(sql, [startDate, endDate]);
        return rows;
    },
};

module.exports = SalesModel;