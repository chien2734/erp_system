const InventoryModel = require('./inventory.model');

const InventoryController = {
    // Hang san pham va San pham
    getAllHangSP: async (req, res) => {
        try {
            const result = await InventoryModel.getAllHangSP();
            res.status(200).json({ 
                success: true, 
                data: result 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi lấy danh sách hãng sản phẩm' 
            });
        }
    },

    getAllSanPham: async (req, res) => {
        try {
            const { keyword, maHang, page, limit } = req.query;
            const result = await InventoryModel.getAllSanPham({ keyword, maHang, page, limit });
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

    create: async (req, res) => {
        try {
            const newId = await InventoryModel.createProduct(req.body);
            res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', id: newId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi thêm sản phẩm' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const affectedRows = await InventoryModel.updateProduct(id, req.body);
            if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
            res.status(200).json({ success: true, message: 'Cập nhật thành công' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
        }
    },

    delete: async (req, res) => {
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
            const maNhanVien = req.user.id; // Lấy ID nhân viên từ token
            const { maNCC, danhSachSanPham } = req.body;
            // kiem tra du lieu dau vao
            if(!maNCC || !danhSachSanPham || danhSachSanPham.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Dữ liệu phiếu nhập không hợp lệ' 
                });
            }
            // Tính tổng tiền
            let tongTien = danhSachSanPham.array.forEach(item => {
                tongTien += item.donGia * item.soLuong;  
            });
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
    }
};

module.exports = InventoryController;