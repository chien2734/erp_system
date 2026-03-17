const SalesModel = require('./sales.model');

const SalesController = {
    // --- KHÁCH HÀNG ---
    getAllKhachHang: async (req, res) => {
        try {
            const { keyword, page, limit } = req.query;
            const result = await SalesModel.getAllKhachHang({ keyword, page, limit });
            res.status(200).json({ 
                success: true, 
                ...result 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi lấy danh sách khách hàng' 
            });
        }
    },

    create: async (req, res) => {
        try {
            const { tenKH, sdt, diaChi } = req.body;
            if (!tenKH || !sdt) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng nhập tên và số điện thoại khách hàng' 
                });
            }
            const newId = await SalesModel.createKhachHang({ tenKH, sdt, diaChi });
            res.status(201).json({ 
                success: true, 
                message: 'Thêm khách hàng thành công', maKH: newId 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi khi thêm khách hàng' 
            });
        }
    },

    // --- BÁN HÀNG ---
    banHangPOS: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien; // Lấy từ Token thu ngân
            const { maKH, giamGia, mangSerial } = req.body;

            if (!maKH || !mangSerial || mangSerial.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng chọn khách hàng và quét ít nhất 1 mã máy!' 
                });
            }

            const ketQua = await SalesModel.taoHoaDonBanHang(maKH, maNhanVien, giamGia, mangSerial);

            res.status(201).json({ 
                success: true, 
                message: 'Tạo hóa đơn thành công!', 
                data: ketQua
            });

        } catch (error) {
            console.error("Lỗi API Bán Hàng:", error.message);
            // Nếu lỗi do máy đã bán hoặc không tồn tại thì báo ra cho Frontend biết
            if (error.message.includes('không tồn tại')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tạo hóa đơn' });
        }
    }
};

module.exports = SalesController;