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
            const newId = await SalesModel.themKhachHang({ tenKH, sdt, diaChi });
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

    update: async (req, res) => {
        try {
            const { id } = req.params; // Lấy maKH từ đường dẫn URL
            const { tenKH, sdt, diaChi } = req.body;

            if (!tenKH || !sdt) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng nhập tên và số điện thoại khách hàng' 
                });
            }

            const affectedRows = await SalesModel.capNhatKhachHang(id, { tenKH, sdt, diaChi });

            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng này!' });
            }

            res.status(200).json({ 
                success: true, 
                message: 'Cập nhật thông tin khách hàng thành công!' 
            });
        } catch (error) {
            console.error("Lỗi API Cập nhật KH:", error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi máy chủ khi cập nhật khách hàng' 
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
    },

    // --- TRA CỨU HÓA ĐƠN ---
    getAllHoaDon: async (req, res) => {
        try {
            const data = await SalesModel.getAllHoaDon(req.query);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách hóa đơn' });
        }
    },

    getChiTietHoaDon: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await SalesModel.getChiTietHoaDonById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy chi tiết hóa đơn' });
        }
    }
};

module.exports = SalesController;