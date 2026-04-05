const db = require('../../config/db');

const DashboardModel = {
    // 1. Thống kê nhanh trong ngày
    getThongKeNgay: async (ngay) => {
        const sqlDoanhThu = `SELECT COUNT(maHoaDon) as soDonHangMoi, COALESCE(SUM(thanhTien), 0) as doanhThuNgay FROM hoadon WHERE DATE(ngayLap) = ?`;
        const [dtRows] = await db.query(sqlDoanhThu, [ngay]);

        const sqlNhanVien = `SELECT COUNT(DISTINCT maNhanVien) as soNhanVienDiLam FROM chamcong WHERE ngayLamViec = ? AND gioVao IS NOT NULL`;
        const [nvRows] = await db.query(sqlNhanVien, [ngay]);

        return {
            soDonHangMoi: dtRows[0].soDonHangMoi,
            doanhThuNgay: dtRows[0].doanhThuNgay,
            soNhanVienDiLam: nvRows[0].soNhanVienDiLam
        };
    },

    // 2. Thống kê sản phẩm tồn kho
    getTongTonKho: async () => {
        const sql = `SELECT COALESCE(SUM(soLuongTon), 0) as tongTonKho FROM sanpham WHERE trangThai = 1`;
        const [rows] = await db.query(sql);
        return rows[0].tongTonKho;
    },

    // 3. Biểu đồ Doanh thu 7 ngày qua
    getDoanhThu7Ngay: async (ngayHienTai) => {
        const sql = `
            SELECT DATE(ngayLap) as ngay, SUM(thanhTien) as doanhThu
            FROM hoadon
            WHERE ngayLap >= DATE_SUB(?, INTERVAL 6 DAY)
            GROUP BY DATE(ngayLap) ORDER BY ngay ASC
        `;
        const [rows] = await db.query(sql, [ngayHienTai]);
        return rows;
    },

    // 4. Lấy danh sách 5 đơn hàng mới nhất
    getDonHangMoiNhat: async () => {
        const sql = `
            SELECT hd.maHoaDon as id, kh.tenKH as customer, hd.thanhTien as amount, hd.ngayLap,
                   (SELECT sp.tenSP FROM chitiethoadon ct JOIN sanpham sp ON ct.maSP = sp.maSP WHERE ct.maHoaDon = hd.maHoaDon LIMIT 1) as product
            FROM hoadon hd
            LEFT JOIN khachhang kh ON hd.maKH = kh.maKH
            ORDER BY hd.ngayLap DESC LIMIT 5
        `;
        const [rows] = await db.query(sql);
        return rows;
    },
    
    // 5. Cảnh báo (Việc cần xử lý)
    getCanhBao: async () => {
        const [stock] = await db.query(`SELECT COUNT(*) as count FROM sanpham WHERE soLuongTon < 5 AND trangThai = 1`);
        const [leaves] = await db.query(`SELECT COUNT(*) as count FROM dontu WHERE trangThai = 'Chờ duyệt'`);
        return {
            lowStockItems: stock[0].count,
            pendingLeaves: leaves[0].count
        };
    }
};

module.exports = DashboardModel;