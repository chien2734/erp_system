const InventoryModel = require('./inventory.model');

const InventoryController = {
    // =====================================
    // BRAND AND NHA CUNG CAP
    //======================================
    getAllHangSP: async (req, res) => {
        try {
            const { id, tenHang } = req.query;
            const result = await InventoryModel.getAllHangSP({ id, tenHang });
            res.status(200).json({ success: true, result });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy danh sách hãng sản phẩm'
            });
        }
    },

    // Dùng cho trang Quản lý NCC (Lấy tất cả, không truyền trangThai)
    getAllNCC: async (req, res) => {
        try {
            const { id, tenNCC } = req.query;
            // Không truyền trangThai -> Lấy cả 1 và 0 (Vì Model dùng WHERE 1=1)
            const data = await InventoryModel.getAllNCC({ id, tenNCC }); 
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Lỗi API Lấy DS Nhà Cung Cấp:", error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách' });
        }
    },

    // Dùng cho trang Nhập Kho (Chỉ lấy NCC đang hoạt động)
    getActiveNCC: async (req, res) => {
        try {
            const { tenNCC } = req.query;
            // Truyền cứng trangThai = 1 xuống Model
            const data = await InventoryModel.getAllNCC({ tenNCC, trangThai: 1 }); 
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Lỗi API Lấy DS Nhà Cung Cấp Active:", error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách' });
        }
    },

    createNCC: async (req, res) => {
        try {
            const { tenNCC, sdt, diaChi, email } = req.body;
            if (!tenNCC) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập tên nhà cung cấp' });
            }
            const newId = await InventoryModel.createNCC(req.body);
            res.status(201).json({
                success: true,
                message: 'Thêm nhà cung cấp thành công',
                maNCC: newId
            });
        } catch (error) {
            console.error("Lỗi API Thêm NCC:", error);
            res.status(500).json({ success: false, message: 'Lỗi khi thêm nhà cung cấp' });
        }
    },

    updateNCC: async (req, res) => {
        try {
            const { id } = req.params;
            const affectedRows = await InventoryModel.updateNCC(id, req.body);
            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Nhà cung cấp không tồn tại' });
            }
            res.status(200).json({ success: true, message: 'Cập nhật thông tin thành công' });
        } catch (error) {
            console.error("Lỗi API Cập nhật NCC:", error);
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật nhà cung cấp' });
        }
    },

    deleteNCC: async (req, res) => {
        try {
            const { id } = req.params;

            const affectedRows = await InventoryModel.deleteNCC(id);

            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Nhà cung cấp không tồn tại' });
            }
            res.status(200).json({ success: true, message: 'Đã xóa nhà cung cấp' });
        } catch (error) {
            console.error("Lỗi API Xóa NCC:", error);
            res.status(500).json({ success: false, message: 'Lỗi khi xóa nhà cung cấp' });
        }
    },
    
    //======================================
    // SAN PHAM
    //======================================
    getAllSanPham: async (req, res) => {
        try {
            const { keyword, maHang, page, limit } = req.query;
            const result = await InventoryModel.getAllProducts({ keyword, maHang, page, limit });
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy danh sách sản phẩm'
            });
        }
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params; // Lấy ID từ URL
            const product = await InventoryModel.getProductById(id);
            if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
        }
    },

    createProduct: async (req, res) => {
        try {
            const newId = await InventoryModel.createProduct(req.body);
            res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', id: newId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi thêm sản phẩm' });
        }
    },

    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const affectedRows = await InventoryModel.updateProduct(id, req.body);
            if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
            res.status(200).json({ success: true, message: 'Cập nhật thành công' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const affectedRows = await InventoryModel.deleteProduct(id);
            if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
            res.status(200).json({ success: true, message: 'Đã xóa sản phẩm' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
        }
    },

    // Nhap kho
    nhapKho: async (req, res) => {
        try {
            // Lấy ID nhân viên từ token (Thêm dấu ? để không bị crash app nếu đang test mà quên gửi Token)
            const maNhanVien = req.user?.maNhanVien || req.user?.id || 1; 
            
            const { maNCC, danhSachSanPham } = req.body;

            // Kiểm tra dữ liệu đầu vào
            if (!maNCC || !danhSachSanPham || danhSachSanPham.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu phiếu nhập không hợp lệ hoặc giỏ hàng trống!'
                });
            }

            // Tính tổng tiền 
            let tongTien = 0;
            for (const item of danhSachSanPham) {
                // Đảm bảo số lượng phải đúng bằng số lượng Serial gửi lên
                const soLuongThucTe = item.serials ? item.serials.length : (item.soLuong || 0);
                tongTien += (item.donGia || item.donGiaNhap || 0) * soLuongThucTe;
            }

            // Thực hiện tạo phiếu nhập kho
            const maPhieuNhapKho = await InventoryModel.createNhapKho(maNCC, maNhanVien, tongTien, danhSachSanPham);
            
            res.status(201).json({
                success: true,
                message: 'Tạo phiếu nhập kho thành công',
                maPhieuNhap: maPhieuNhapKho,
                tongTien: tongTien
            });
        } catch (error) {
            // BẮT LỖI TRÙNG SERIAL TỪ MODEL NÉM LÊN
            if (error.message && error.message.startsWith('DUP_SERIAL:')) {
                const dups = error.message.split(':')[1];
                return res.status(400).json({
                    success: false,
                    message: `THẤT BẠI! Các mã Serial sau đã tồn tại trong hệ thống: ${dups}. Vui lòng kiểm tra lại!`
                });
            }

            // Lỗi hệ thống khác
            console.error("Lỗi API Nhập kho:", error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo phiếu nhập kho trên Server'
            });
        }
    },

    getAllPhieuNhapKho: async (req, res) => {
        try {
            const { maPhieuNhap, tuNgay, denNgay, page, limit } = req.query;
            
            // ĐÃ THÊM AWAIT Ở ĐÂY (Rất quan trọng!)
            const data = await InventoryModel.getAllPhieuNhapKho({ maPhieuNhap, tuNgay, denNgay, page, limit });
            
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách phiếu nhập' });
        }
    },

    getCTPhieuNhapById: async (req, res) => {
        try {
            // Đổi maPhieuNhap thành id để khớp với route '/ctnhapkho/:id'
            const { id } = req.params; 
            
            // ĐÃ THÊM AWAIT Ở ĐÂY (Rất quan trọng!)
            const data = await InventoryModel.getCTPhieuNhapById(id);
            
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Lỗi API lấy chi tiết phiếu nhập' });
        }
    },

    getAllMayTinh: async (req, res) => {
        try {
            const { keyword, maSP, trangThai, page, limit } = req.query;

            const result = await InventoryModel.getAllMayTinh({ 
                keyword, 
                maSP, 
                trangThai, 
                page, 
                limit 
            });
            res.status(200).json({ 
                success: true, 
                ...result 
            });

        } catch (error) {
            console.error("Lỗi API lấy danh sách mã máy:", error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi máy chủ khi lấy danh sách Serial máy tính' 
            });
        }
    },

    updateMayTinh: async (req, res) => {
        try {
            const { maMay } = req.params; // Lấy mã máy từ URL (VD: /maytinh/SN-MAC-111)
            const { trangThai } = req.body; // Lấy trạng thái mới từ Frontend gửi lên

            if (!trangThai) {
                return res.status(400).json({ success: false, message: 'Vui lòng cung cấp trạng thái mới!' });
            }

            const affectedRows = await InventoryModel.updateMayTinh(maMay, trangThai);

            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy Serial này trong hệ thống!' });
            }

            res.status(200).json({ success: true, message: 'Cập nhật trạng thái máy thành công!' });

        } catch (error) {
            console.error("Lỗi API Cập nhật trạng thái Serial:", error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật trạng thái!' });
        }
    },

};

module.exports = InventoryController;