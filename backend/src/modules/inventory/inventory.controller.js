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

    getAllNCC: async (req, res) => {
        try {
            const { id, tenNCC } = req.query;
            const data = await InventoryModel.getAllNCC({ id, tenNCC });
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Lỗi API Lấy DS Nhà Cung Cấp:", error);
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
            const maNhanVien = req.user.maNhanVien || req.user.id; // Lấy ID nhân viên từ token
            const { maNCC, danhSachSanPham } = req.body;
            // kiem tra du lieu dau vao
            if (!maNCC || !danhSachSanPham || danhSachSanPham.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu phiếu nhập không hợp lệ'
                });
            }
            // Tính tổng tiền
            let tongTien = 0;
            for (const item of danhSachSanPham) {
                tongTien += (item.donGia || item.donGiaNhap || 0) * (item.soLuong || 0);
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
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo phiếu nhập kho'
            });
        }
    },

    getAllPhieuNhapKho: async (req, res) => {
        try {
            const { maPhieuNhap, tuNgay, denNgay, page, limit } = req.query;
            const data = InventoryModel.getAllPhieuNhapKho({ maPhieuNhap, tuNgay, denNgay, page, limit });
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, meesage: 'Lỗi khi lấy danh sách phiếu nhập' })
        }
    },

    getCTPhieuNhapById: async (req, res) => {
        try {
            const { maPhieuNhap } = req.params;
            const data = InventoryModel.getCTPhieuNhapById(maPhieuNhap);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: ' Lỗi API lấy chi tiết phiếu nhập' });
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

};

module.exports = InventoryController;