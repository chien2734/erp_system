const HrModel = require('./hr.model');

const HrController = {
    // Lay danh sach nhan vien
    getAll: async (req, res) => {
        try {
            const { keyword, maChucVu, page, limit } = req.query;
            const result = await HrModel.getAllNhanVien({ keyword, maChucVu, page, limit });
            res.status(200).json({ 
                success: true, 
                ...result 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi lấy danh sách nhân viên' 
            });
        }
    },

    // Lay chi tiet 1 nhan vien
    getOne: async (req, res) => {
        try {
            const { id } = req.params; 
            const nhanVien = await HrModel.getNhanVienById(id);
            if (!nhanVien) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Không tìm thấy nhân viên' 
                });
            }
            res.status(200).json({ 
                success: true, 
                data: nhanVien 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi máy chủ khi lấy chi tiết nhân viên' 
            });
        }
    },

    // Thêm mới nhân viên
    create: async (req, res) => {
        try {
            const newId = await HrModel.createNhanVien(req.body);       
            res.status(201).json({ success: true, message: 'Thêm nhân viên thành công', id: newId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi thêm nhân viên' });
        }
    },

    // Cập nhật thông tin nhân viên
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const affetedRows = await HrModel.updateNhanVien(id, req.body);
            if (affetedRows === 0) {
                return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });
            }
            res.status(200).json({ success: true, message: 'Cập nhật nhân viên thành công' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật nhân viên' });
        }   
    },
    
    // Xóa nhân viên
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const affetedRows = await HrModel.deleteNhanVien(id);
            if (affetedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Nhân viên không tồn tại' 
                });
            }
            res.status(200).json({ 
                success: true, 
                message: 'Đã xóa nhân viên' 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi khi xóa nhân viên' 
            });
        }
    },
    // Xử lý API Thăng chức
    changeChucVu: async (req, res) => {
        try {
            const { id } = req.params;
            const { maChucVuMoi, ngayHieuLuc } = req.body;
            if (!maChucVuMoi || !ngayHieuLuc) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng cung cấp mã chức vụ mới và ngày bắt đầu' 
                });
            }
            await HrModel.thangChuc(id, maChucVuMoi, ngayHieuLuc);
            res.status(200).json({ 
                success: true, 
                message: 'Đã cập nhật chức vụ và lưu lịch sử thành công!' 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi máy chủ khi cập nhật chức vụ' 
            });
        }
    },

    // Lay danh sach chuc vu
    getAllChucVu: async (req, res) => {
        try {
            const chucVuList = await HrModel.getAllChucVu();
            res.status(200).json({ success: true, data: chucVuList });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi máy chủ khi lấy danh sách chức vụ' 
            });
        }
    }
};

module.exports = HrController;