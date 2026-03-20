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
    // Xử lý API Thăng/giáng chức
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
            await HrModel.changeChucVu(id, maChucVuMoi, ngayHieuLuc);
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
    },

    // getLichSuCongTac: async (req, res) => {
    //     try{
    //         const { id } = req.params;
    //         const result = await HrModel.getLichSuCongTac(id);
    //         result
    //     }catch(error) {
    //         console.log('Loi API getLichSuCongTac', error);

    //     }
    // },
    //===============================
    // CHAM CONG VA TINH LUONG
    //===============================

    // Cham cong - Nhân viên tự chấm công cho mình
    ghiNhanChamCong: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien;
            // Lấy ngày và giờ thực tế từ Server
            const now = new Date();
            const ngayHienTai = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            const gioHienTai = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS
            // Quy định giờ làm việc chuẩn
            const GIO_VAO_CHUAN = '08:00:00';
            const GIO_RA_CHUAN = '17:00:00';
            const chamCongHomNay = await HrModel.getChamCongNgayHienTai(maNhanVien, ngayHienTai);
            // chưa chấm công -> thực hiện check-in
            if (!chamCongHomNay) {
                const trangThaiChot = (gioHienTai > GIO_VAO_CHUAN) ? 'Đi trễ' : 'Đúng giờ';
                await HrModel.checkIn(maNhanVien, ngayHienTai, gioHienTai, trangThaiChot);
                return res.status(200).json({
                    success: true,
                    message: `Check-in thành công lúc ${gioHienTai}`,
                    trangThai: trangThaiChot
                });
            } else {
                // =============== XỬ LÝ CHECK-OUT ===============
                if (chamCongHomNay.gioRa) {
                    return res.status(400).json({ success: false, message: 'Bạn đã hoàn tất chấm công ra về cho ngày hôm nay rồi!' });
                }
                // lấy trạng thái hiện tại và có thể thêm thông tin tăng ca
                let trangThaiChot = chamCongHomNay.trangThai || '';
                if (gioHienTai > GIO_RA_CHUAN) {
                    trangThaiChot = (trangThaiChot ? (trangThaiChot + ' và Tăng ca') : 'Tăng ca');
                }
                await HrModel.checkOut(maNhanVien, ngayHienTai, gioHienTai, trangThaiChot);

                return res.status(200).json({
                    success: true,
                    message: `Check-out thành công lúc ${gioHienTai}. Trạng thái ngày: ${trangThaiChot}`
                });
            }

        } catch (error) {
            console.error("Lỗi API Chấm Công:", error);
            res.status(500).json({ success: false, message: 'Lỗi hệ thống khi chấm công' });
        }
    },

    // Lich su cham cong
    getHistoryChamCong: async (req, res) => {
        try{
            const {thang, nam} = req.query;
            // hỗ trợ lấy maNhanVien từ query, params hoặc token
            const maNhanVien = req.query.maNhanVien || req.params.id || req.user?.maNhanVien;
            const lichSuBangChamCong = await HrModel.getLichSuChamCong(thang, nam, maNhanVien);
            res.status(200).json({ 
                success: true,
                tongSoNgay: lichSuBangChamCong.length,
                data: lichSuBangChamCong
            });
        } catch(error){
            console.log(error);
            res.status(500).json({ success: false, message: 'Lỗi trong quá trình lọc bảng chấm công'})
        }       
    },
    // Tính lương
    TinhLuong: async (req, res) => {
        try {
            const { thang, nam } = req.query;
            const cauhinh = await HrModel.getCauHinh();
            const dsNhanVien = await HrModel.chotBangLuongThang(thang, nam, cauhinh);
            if (dsNhanVien === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có nhân viên nào được tính lương'
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'Đã tính lương cho ' + dsNhanVien + ' nhân viên!'
                });
            }
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tính lương nhân viên'
            })
        }
    },
    
    // Cap nhat bảng lương: thuong/phat (Admin)
    updateBangLuong: async (req, res) => {
        try {
            const { thang, nam, dsNhanVien, thuong } = req.body;
            if (!thang || !nam || !thuong) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu không hợp lệ, vui lòng nhập lại!'
                });
            }
            if (!dsNhanVien) {
                return res.status(400).json({
                    success: false,
                    message: 'Không hợp lệ, vui lòng chọn nhân viên!'
                });
            }
            const affectedRow = await HrModel.updateBangLuong(thang, nam, dsNhanVien, thuong, phat)
            if (affectedRow === 0) return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên hợp lệ!'
            });

            return res.status(200).json({
                success: true,
                message: 'Đã thêm tiền thưởng thành công!'
            });
        } catch(error) {
            console.log(error)
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi cập nhật lương'
            });
        }
    },

    // lay danh sach bang luong (Admin)
    getBangLuong: async (req, res) => {
        try{
            const {thang, nam, maNhanVien, maChucVu} = req.query;
            const result = await HrModel.getBangLuong({thang, nam, maNhanVien, maChucVu});
            res.status(200).json({success: true, data: result});
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                message: ''
            });
        }      
    },

    // Xem bang luong(User)
    xemLuong: async (req, res) => {
        try{
            const maNhanVien = req.params.id || req.user?.maNhanVien;
            const {thang, nam} = req.query;
            const bangLuong = await HrModel.xemLuong(thang, nam, maNhanVien);
            res.status(200).json({success: true, data: bangLuong});
        } catch(error){
            console.log(error);
            res.status(500).json({success: false, message: 'Lỗi khi lấy bảng lương'});
        }
    },


    //=================================
    // QUAN LY DON TU
    //=================================

    // --- LUỒNG NHÂN VIÊN ---
    createLeaveRequest: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien; // Tự động lấy ID của người đang đăng nhập
            const { loaiDon, ngayBatDau, ngayKetThuc, lyDo } = req.body;

            if (!loaiDon || !ngayBatDau || !ngayKetThuc || !lyDo) {
                return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin đơn nghỉ phép' });
            }
            // Có thể check thêm logic: tuNgay không được lớn hơn denNgay
            if (new Date(tuNgay) > new Date(denNgay)) {
                return res.status(400).json({ success: false, message: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc' });
            }
            await HrModel.taoDonNghiPhep(maNhanVien, req.body);
            res.status(201).json({ success: true, message: 'Đã gửi đơn xin nghỉ phép thành công. Vui lòng chờ quản lý duyệt!' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Lỗi khi tạo đơn nghỉ phép' });
        }
    },

    getLeaveRequestById: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien;
            const data = await HrModel.getLeaveRequestById(maNhanVien);
            res.status(200).json({ success: true, data: data });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn cá nhân' });
        }
    },

    updateLeaveRequest: async (req, res) => {
        try{
            const {id} = req.params;
            const {ngayBatDau, ngayKetThuc, lyDo, trangThai} = req.body;
            if (new Date(ngayBatDau) > new Date(ngayKetThuc)) {
                return res.status(400).json({ success: false, message: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc' });
            }
            if (!lyDo) {
                 return res.status(400).json({ success: false, message: 'Vui lòng ghi rõ lý do!' });
            }
            if (!['Chờ duyệt'].includes(trangThai)) {
                return res.status(400).json({ success: false, message: 'Trạng thái xử lý không hợp lệ' });
            }
            const affectedRows = await HrModel.updateLeaveRequest(id, {ngayBatDau, ngayKetThuc, lyDo});
            if(affectedRows === 0){
                res.status(404).json({success: false, message: 'Không tìm thấy mã đơn'});
            }
                res.status(200).json({success: true, message: 'Cập nhật thành công'});
        } catch(error) {
            console.log(error);
            res.status(500).json({success: false, message: 'Lỗi khi cập nhật đơn từ'})
        }
    },

    // --- LUỒNG QUẢN LÝ ---
    getAllLeaveRequest: async (req, res) => {
        try {
            const { trangThai, thang, nam } = req.query;
            const data = await HrModel.getAllLeaveRequest({ trangThai, thang, nam });
            res.status(200).json({ success: true, tongSoDon: data.length, data: data });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách tổng hợp đơn nghỉ phép' });
        }
    },

    handleLeaveRequest: async (req, res) => {
        try {
            const nguoiDuyet = req.user.maNhanVien; // ID của quản lý đang thao tác
            const { id } = req.params; // maDon
            const { trangThai } = req.body; // 'Đã duyệt' hoặc 'Từ chối'

            if (!['Đã duyệt', 'Từ chối'].includes(trangThai)) {
                return res.status(400).json({ success: false, message: 'Trạng thái xử lý không hợp lệ' });
            }
            const affectedRows = await HrModel.handleLeaveRequest(id, trangThai, nguoiDuyet);
            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn nghỉ phép này' });
            }

            res.status(200).json({ success: true, message: `Đã ${trangThai.toLowerCase()} đơn nghỉ phép!` });
        } catch (error) {
            console.error("Lỗi duyệt đơn:", error);
            res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xử lý đơn' });
        }
    }
};

module.exports = HrController;