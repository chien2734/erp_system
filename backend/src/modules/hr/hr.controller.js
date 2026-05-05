const HrModel = require('./hr.model');
const { recordLog } = require('../../../utils/helpers');

const HrController = {
    // ==========================================
    // PHẦN PROFILE CÁ NHÂN (Cho người đăng nhập)
    // ==========================================

    getProfile: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien;
            const data = await HrModel.getNhanVienById(maNhanVien);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi lấy thông tin cá nhân' });
        }
    },

    updateProfileInfo: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien;
            const { email, sdt } = req.body;

            // 1. KIỂM TRA TRÙNG EMAIL/SĐT (loại trừ chính mình)
            const checkUnique = await HrModel.checkUniqueEmailSdt(email, sdt, maNhanVien);
            if (checkUnique.emailExists) return res.status(400).json({ success: false, message: 'Email này đã được người khác sử dụng!' });
            if (checkUnique.sdtExists) return res.status(400).json({ success: false, message: 'Số điện thoại này đã được người khác sử dụng!' });
            
            await HrModel.updateProfileInfo(maNhanVien, req.body);
            
            res.status(200).json({ success: true, message: 'Đã cập nhật thông tin liên hệ!' });
            
            await recordLog(maNhanVien, 'Cập nhật Profile', { updates: req.body });
        } catch (error) {
            console.error("Lỗi updateProfileInfo:", error);
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thông tin' });
        }
    },
    
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
            const roleNguoiDangSua = req.user.maNhomQuyen; 
            const { hoTen, email, sdt, maChucVu, ngaySinh } = req.body;

            // 1. KIỂM TRA TUỔI (Frontend đã check nhưng Backend phải chốt chặn)
            if (ngaySinh) {
                const age = Math.floor((new Date() - new Date(ngaySinh)) / (365.25 * 24 * 60 * 60 * 1000));
                if (age < 18) {
                    return res.status(400).json({ success: false, message: 'Nhân viên phải từ 18 tuổi trở lên!' });
                }
            }

            // 2. KIỂM TRA TRÙNG EMAIL/SĐT
            const checkUnique = await HrModel.checkUniqueEmailSdt(email, sdt);
            if (checkUnique.emailExists) return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong hệ thống!' });
            if (checkUnique.sdtExists) return res.status(400).json({ success: false, message: 'Số điện thoại này đã tồn tại!' });

            // 3. CHỐT CHẶN BỔ NHIỆM
            if (roleNguoiDangSua !== 1 && maChucVu) {
                const chucVuCheck = await HrModel.getChucVuById(maChucVu);
                if (chucVuCheck && chucVuCheck.tenChucVu.toLowerCase().includes('giám đốc')) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Từ chối truy cập! Chỉ Giám đốc mới có quyền tạo nhân sự cấp Giám đốc.' 
                    });
                }
            }

            const newId = await HrModel.createNhanVien(req.body);
            res.status(201).json({ success: true, message: 'Thêm nhân viên thành công', id: newId });
            
            await recordLog(req.user.maNhanVien, 'Thêm nhân viên', { maNhanVien: newId, hoTen: req.body.hoTen });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi thêm nhân viên' });
        }
    },

    // Cập nhật thông tin nhân viên
    update: async (req, res) => {
        try {
            const roleNguoiDangSua = req.user.maNhomQuyen; 
            const { id } = req.params; 
            const { email, sdt, ngaySinh, ngayVaoLam } = req.body;

            const targetEmployee = await HrModel.getNhanVienById(id);
            if (!targetEmployee) return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });

            // 1. KIỂM TRA TUỔI
            if (ngaySinh) {
                const age = Math.floor((new Date() - new Date(ngaySinh)) / (365.25 * 24 * 60 * 60 * 1000));
                if (age < 18) return res.status(400).json({ success: false, message: 'Nhân viên phải từ 18 tuổi trở lên!' });
            }

            // 2. KIỂM TRA TRÙNG EMAIL/SĐT (loại trừ chính mình)
            const checkUnique = await HrModel.checkUniqueEmailSdt(email, sdt, id);
            if (checkUnique.emailExists) return res.status(400).json({ success: false, message: 'Email đã được sử dụng bởi nhân viên khác!' });
            if (checkUnique.sdtExists) return res.status(400).json({ success: false, message: 'Số điện thoại đã được sử dụng!' });

            // 3. KIỂM TRA KHÓA NGÀY VÀO LÀM (Nếu ngày bị thay đổi)
            const oldNgayVaoLam = targetEmployee.ngayVaoLam ? new Date(targetEmployee.ngayVaoLam).toISOString().split('T')[0] : null;
            if (ngayVaoLam && ngayVaoLam !== oldNgayVaoLam) {
                const hasPayroll = await HrModel.checkNhanVienHasPayroll(id);
                if (hasPayroll) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Không thể sửa Ngày vào làm vì nhân viên này đã có dữ liệu bảng lương!' 
                    });
                }
            }

            // 4. BẢO VỆ HỒ SƠ SẾP
            if (roleNguoiDangSua !== 1 && targetEmployee.maNhomQuyen === 1) {
                return res.status(403).json({ success: false, message: 'Bạn không có thẩm quyền thay đổi hồ sơ của Ban Giám Đốc.' });
            }

            // 5. BẢO VỆ GHẾ SẾP
            const maChucVuMoi = req.body.maChucVu;
            if (roleNguoiDangSua !== 1 && maChucVuMoi && maChucVuMoi !== targetEmployee.maChucVu) {
                const chucVuCheck = await HrModel.getChucVuById(maChucVuMoi);
                if (chucVuCheck && chucVuCheck.tenChucVu.toLowerCase().includes('giám đốc')) {
                    return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền bổ nhiệm chức vụ Giám đốc.' });
                }
            }

            const success = await HrModel.updateNhanVien(id, req.body);
            if (!success) return res.status(400).json({ success: false, message: 'Không thể cập nhật nhân viên lúc này' });
            
            res.status(200).json({ success: true, message: 'Cập nhật nhân viên thành công' });
            await recordLog(req.user.maNhanVien, 'Cập nhật nhân viên', { maNhanVien: id, hoTen: req.body.hoTen });
        } catch (error) {
            console.error("Lỗi cập nhật NV:", error);
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

            await recordLog(req.user.maNhanVien, 'Xóa nhân viên', { maNhanVien: id });
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

            await recordLog(req.user.maNhanVien, 'Thay đổi chức vụ', { maNhanVien: id, maChucVuMoi, ngayHieuLuc });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Lỗi máy chủ khi cập nhật chức vụ'
            });
        }
    },

    // Kiểm tra nhân viên đã có lương chưa
    checkPayroll: async (req, res) => {
        try {
            const hasPayroll = await HrModel.checkNhanVienHasPayroll(req.params.id);
            res.status(200).json({ success: true, hasPayroll });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi kiểm tra bảng lương' });
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

    // Thêm chức vụ mới
    createChucVu: async (req, res) => {
        try {
            const { tenChucVu, luongTheoGio, phuCapTrachNhiem } = req.body;
            if (!tenChucVu || !luongTheoGio) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập tên chức vụ và lương theo giờ' });
            }
            await HrModel.createChucVu(req.body);
            res.status(201).json({ success: true, message: 'Thêm chức vụ mới thành công' });
            
            await recordLog(req.user.maNhanVien, 'Thêm chức vụ', { tenChucVu });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi tạo chức vụ' });
        }
    },

    // Cập nhật chức vụ
    updateChucVu: async (req, res) => {
        try {
            const { id } = req.params;
            const { tenChucVu, luongTheoGio, phuCapTrachNhiem } = req.body;
            if (!tenChucVu || !luongTheoGio) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập tên chức vụ và lương theo giờ' });
            }
            const affectedRows = await HrModel.updateChucVu(id, req.body);
            if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy chức vụ' });
            res.status(200).json({ success: true, message: 'Cập nhật chức vụ thành công' });
            
            await recordLog(req.user.maNhanVien, 'Cập nhật chức vụ', { maChucVu: id, tenChucVu });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật chức vụ' });
        }
    },

    // Xóa chức vụ (Có bảo vệ Foreign Key)
    deleteChucVu: async (req, res) => {
        try {
            const { id } = req.params;
            const affectedRows = await HrModel.deleteChucVu(id);
            if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy chức vụ' });
            res.status(200).json({ success: true, message: 'Đã xóa chức vụ thành công' });
            
            await recordLog(req.user.maNhanVien, 'Xóa chức vụ', { maChucVu: id });
        } catch (error) {
            // Bắt lỗi MySQL: Nếu chức vụ đang có người làm, mã lỗi là 1451 (ER_ROW_IS_REFERENCED)
            if (error.errno === 1451) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Không thể xóa! Đang có nhân viên giữ chức vụ này. Vui lòng chuyển chức vụ cho nhân viên trước.' 
                });
            }
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi xóa chức vụ' });
        }
    },

    getLichSu: async (req, res) => {
        try {
            const data = await HrModel.getLichSuCongTac(req.params.id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử công tác' });
        }
    },
    
    //===============================
    // CHAM CONG VA TINH LUONG
    //===============================

    // Cham cong - Nhân viên tự chấm công cho mình
    ghiNhanChamCong: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien;
            
            // Lấy ngày và giờ thực tế từ Server
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const ngayHienTai = `${year}-${month}-${day}`; 
            const gioHienTai = now.toTimeString().split(' ')[0]; // HH:MM:SS
            
            // BỎ HARDCODE TRONG SẢN PHẨM THỰC TẾ
            // const ngayHienTai = '2026-04-06'; 
            // const gioHienTai = '18:15:00';
            
            const cauHinh = await HrModel.getCauHinh();
            const GIO_VAO_CHUAN = cauHinh.gioVaoLamChuan || '08:00:00'; 
            const GIO_RA_CHUAN = cauHinh.gioRaLamChuan || '17:00:00';
            const TG_CHO_OT_PHUT = Number(cauHinh.tgChoTangCa) || 60;   // Buffer time (VD: 60 phút)
            const MAX_OT_GIO = Number(cauHinh.soGioTangCaToiDa) || 2;   // OT Max (VD: 2 giờ)

            const chamCongHomNay = await HrModel.getChamCongNgayHienTai(maNhanVien, ngayHienTai);
            
            if (gioHienTai < '06:00:00') {
                return res.status(400).json({ success: false, message: 'Chưa đến giờ mở ca. Vui lòng quay lại sau 6h00 sáng!' });
            }

            if (!chamCongHomNay) {
                const trangThaiChot = (gioHienTai > GIO_VAO_CHUAN) ? 'Đi trễ' : 'Đúng giờ';
                await HrModel.checkIn(maNhanVien, ngayHienTai, gioHienTai, trangThaiChot);
                return res.status(200).json({
                    success: true,
                    message: `Check-in thành công lúc ${gioHienTai}`,
                    trangThai: trangThaiChot
                });
            } else {
                if (chamCongHomNay.gioRa) {
                    return res.status(400).json({ success: false, message: 'Bạn đã hoàn tất chấm công ra về cho ngày hôm nay rồi!' });
                }

                let trangThaiChot = chamCongHomNay.trangThai || '';
                let soGioLam = 0;

                const tgVao = new Date(`1970-01-01T${chamCongHomNay.gioVao}Z`);
                const tgRa = new Date(`1970-01-01T${gioHienTai}Z`);
                const tgRaChuan = new Date(`1970-01-01T${GIO_RA_CHUAN}Z`);
                
                // TÍNH TOÁN CÁC MỐC TĂNG CA DỰA VÀO CẤU HÌNH
                const tgBatDauOT = new Date(tgRaChuan.getTime() + (TG_CHO_OT_PHUT * 60 * 1000));
                const tgMaxOT = new Date(tgBatDauOT.getTime() + (MAX_OT_GIO * 60 * 60 * 1000));

                if (tgRa < tgRaChuan) {
                    // VÙNG 1: Về sớm (Trước 17h)
                    trangThaiChot = trangThaiChot ? (trangThaiChot + ' - Về sớm') : 'Về sớm';
                    soGioLam = ((tgRa - tgVao) / 3600000) - 1; // Trừ 1 tiếng nghỉ trưa
                } 
                else if (tgRa >= tgRaChuan && tgRa <= tgBatDauOT) {
                    // VÙNG 2: Trong thời gian chờ (17h - 18h) -> Chốt 8h
                    trangThaiChot = trangThaiChot ? (trangThaiChot + ' - Về đúng giờ') : 'Về đúng giờ';
                    soGioLam = ((tgRaChuan - tgVao) / 3600000) - 1; 
                } 
                else if (tgRa > tgBatDauOT) {
                    // VÙNG 3: Tăng ca (Sau 18h)
                    trangThaiChot = trangThaiChot ? (trangThaiChot + ' và Tăng ca') : 'Tăng ca';
                    const gioHanhChinh = ((tgRaChuan - tgVao) / 3600000) - 1;
                    
                    let gioTangCa = 0;
                    if (tgRa <= tgMaxOT) {
                        // Nằm trong mức OT cho phép (18h - 20h)
                        gioTangCa = (tgRa - tgBatDauOT) / 3600000;
                    } else {
                        // Vượt mức OT tối đa (> 20h) -> Chốt cứng số giờ OT tối đa
                        gioTangCa = MAX_OT_GIO;
                        trangThaiChot += ' (Đã đạt mốc OT tối đa)';
                    }
                    
                    soGioLam = gioHanhChinh + gioTangCa;
                }

                if (soGioLam < 0) soGioLam = 0;
                soGioLam = parseFloat(soGioLam.toFixed(2));

                await HrModel.checkOut(maNhanVien, ngayHienTai, gioHienTai, soGioLam, trangThaiChot);

                return res.status(200).json({
                    success: true,
                    message: `Check-out thành công lúc ${gioHienTai}. Trạng thái: ${trangThaiChot}`
                });
            }

        } catch (error) {
            console.error("Lỗi API Chấm Công:", error);
            res.status(500).json({ success: false, message: 'Lỗi hệ thống khi chấm công' });
        }
    },

    // Lich su cham cong
    getLichSuChamCong: async (req, res) => {
        try {
            const { thang, nam, maNhanVien } = req.query;
            if (!thang || !nam) {
                return res.status(400).json({ success: false, message: 'Thiếu tháng hoặc năm' });
            }

            let data = [];
            
            // Sửa lại dòng này để chặn chữ 'undefined' từ Frontend gửi lên
            if (maNhanVien && maNhanVien !== 'undefined' && maNhanVien !== 'null') {
                // Lấy cho 1 người (Dùng ở trang CheckIn)
                data = await HrModel.getChamCongThang(maNhanVien, thang, nam);
            } else {
                // Lấy cho toàn công ty (Dùng ở trang ChamCong)
                data = await HrModel.getTatCaChamCongThang(thang, nam);
            }

            return res.status(200).json({ success: true, data: data });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    // Admin điều chỉnh chấm công bằng tay
    adminSuaChamCong: async (req, res) => {
        try {
            let { maNhanVien, ngayLamViec, gioVao, gioRa, trangThai } = req.body;

            if (gioVao && gioVao.length === 5) gioVao += ':00';
            if (gioRa && gioRa.length === 5) gioRa += ':00';
            
            if (!gioVao) gioVao = null;
            if (!gioRa) gioRa = null;

            let soGioLam = 0;
            let trangThaiMoi = trangThai; 

            if (trangThaiMoi === 'Nghỉ phép' || trangThaiMoi === 'Nghỉ ốm') {
                soGioLam = 8.00; 
            } 
            else if (trangThaiMoi === 'Vắng mặt') {
                soGioLam = 0;
                gioVao = null; 
                gioRa = null;
            } 
            else if (gioVao && gioRa) {
                const cauHinh = await HrModel.getCauHinh();
                const GIO_VAO_CHUAN = cauHinh.gioVaoLamChuan || '08:00:00';
                const GIO_RA_CHUAN = cauHinh.gioRaLamChuan || '17:00:00';
                const TG_CHO_OT_PHUT = Number(cauHinh.tgChoTangCa) || 60;
                const MAX_OT_GIO = Number(cauHinh.soGioTangCaToiDa) || 2;

                const tgVao = new Date(`1970-01-01T${gioVao}Z`);
                const tgRa = new Date(`1970-01-01T${gioRa}Z`);
                
                const tgVaoChuan = new Date(`1970-01-01T${GIO_VAO_CHUAN}Z`); 
                const tgRaChuan = new Date(`1970-01-01T${GIO_RA_CHUAN}Z`);  
                const tgBatDauOT = new Date(tgRaChuan.getTime() + (TG_CHO_OT_PHUT * 60 * 1000));
                const tgMaxOT = new Date(tgBatDauOT.getTime() + (MAX_OT_GIO * 60 * 60 * 1000));

                const calcTgVao = (tgVao < tgVaoChuan) ? tgVaoChuan : tgVao;
                let prefix = (tgVao > tgVaoChuan) ? 'Đi trễ' : 'Đúng giờ';

                if (tgRa < tgRaChuan) {
                    trangThaiMoi = `${prefix} - Về sớm`;
                    soGioLam = ((tgRa - calcTgVao) / 3600000) - 1; 
                } 
                else if (tgRa >= tgRaChuan && tgRa <= tgBatDauOT) {
                    trangThaiMoi = `${prefix} - Về đúng giờ`;
                    soGioLam = ((tgRaChuan - calcTgVao) / 3600000) - 1; 
                } 
                else if (tgRa > tgBatDauOT) {
                    trangThaiMoi = `${prefix} và Tăng ca`;
                    const gioHanhChinh = ((tgRaChuan - calcTgVao) / 3600000) - 1;
                    
                    let gioTangCa = 0;
                    if (tgRa <= tgMaxOT) {
                        gioTangCa = (tgRa - tgBatDauOT) / 3600000;
                    } else {
                        gioTangCa = MAX_OT_GIO;
                        trangThaiMoi += ' (Max OT)';
                    }
                    soGioLam = gioHanhChinh + gioTangCa;
                }

                if (soGioLam < 0) soGioLam = 0;
                soGioLam = parseFloat(soGioLam.toFixed(2));
            }
            else if (gioVao && !gioRa) {
                const tgVao = new Date(`1970-01-01T${gioVao}Z`);
                const tgVaoChuan = new Date(`1970-01-01T08:00:00Z`);
                trangThaiMoi = (tgVao > tgVaoChuan) ? 'Đi trễ' : 'Đúng giờ';
                soGioLam = 0; 
            }

            await HrModel.adminUpdateChamCong(maNhanVien, ngayLamViec, gioVao, gioRa, soGioLam, trangThaiMoi);
            res.status(200).json({ success: true, message: 'Cập nhật chấm công thành công!' });
            
            await recordLog(req.user.maNhanVien, 'Điều chỉnh chấm công', { maNhanVien, ngayLamViec, trangThaiMoi });
        } catch (error) {
            console.error("Lỗi update chấm công:", error);
            return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
        }
    },

    // Tính lương
    TinhLuong: async (req, res) => {
        try {
            const { thang, nam, type = 'month' } = req.query;
            if (!nam) {
                return res.status(400).json({ success: false, message: 'Thiếu năm để tính lương' });
            }

            const cauhinh = await HrModel.getCauHinh();

            if (type === 'year') {
                let totalNhanVien = 0;
                for (let month = 1; month <= 12; month++) {
                    const count = await HrModel.chotBangLuongThang(month, nam, cauhinh);
                    totalNhanVien += Number(count || 0);
                }
                return res.status(200).json({
                    success: true,
                    message: `Đã tính lương cho cả năm ${nam} với ${totalNhanVien} nhân viên!`
                });
            }

            if (!thang) {
                return res.status(400).json({ success: false, message: 'Thiếu tháng để tính lương' });
            }
            const dsNhanVien = await HrModel.chotBangLuongThang(thang, nam, cauhinh);
            if (dsNhanVien === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có nhân viên nào được tính lương'
                });
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Đã tính lương cho ' + dsNhanVien + ' nhân viên!'
                });
                
                await recordLog(req.user.maNhanVien, 'Tính lương tháng', { thang, nam });
            }
        } catch (error) {
            if (error.message === 'ĐÃ_CHỐT') {
                return res.status(400).json({
                    success: false,
                    message: 'Bảng lương tháng này đã được chốt, hệ thống khóa không cho phép tính lại!'
                });
            }
            console.log(error);
            return res.status(500).json({ success: false, message: 'Lỗi khi tính lương nhân viên' });
        }
    },

    // CHỐT BẢNG LƯƠNG
    chotBangLuong: async (req, res) => {
        try {
            const { thang, nam } = req.body;
            if (!thang || !nam) {
                return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tháng và năm cần chốt!' });
            }

            const affectedRows = await HrModel.updateTrangThaiBangLuong(thang, nam, 1); // 1 = Đã chốt
            
            if (affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Không tìm thấy dữ liệu lương tháng ${thang}/${nam}. Vui lòng bấm Tính Lương trước!` 
                });
            }

            res.status(200).json({ 
                success: true, 
                message: `Đã chốt bảng lương tháng ${thang}/${nam} thành công! Nhân viên đã có thể xem phiếu lương.` 
            });

            await recordLog(req.user.maNhanVien, 'Chốt bảng lương', { thang, nam });
        } catch (error) {
            console.error("Lỗi khi chốt lương:", error);
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi chốt lương' });
        }
    },
    
    getLuongThongKe: async (req, res) => {
        try {
            const { type = 'month', thang, nam } = req.query;
            if (!nam) {
                return res.status(400).json({ success: false, message: 'Thiếu năm thống kê' });
            }

            let bangLuong = [];
            if (type === 'month') {
                if (!thang) {
                    return res.status(400).json({ success: false, message: 'Thiếu tháng thống kê' });
                }
                bangLuong = await HrModel.getBangLuong({ thang, nam });
            } else if (type === 'year') {
                bangLuong = await HrModel.getBangLuong({ nam });
            } else {
                return res.status(400).json({ success: false, message: 'Loại thống kê không hợp lệ' });
            }

            const totalNhanVien = bangLuong.length;
            const totalLuongCoBan = bangLuong.reduce((sum, item) => sum + Number(item.luongCoBan || 0), 0);
            const totalThuong = bangLuong.reduce((sum, item) => sum + Number(item.thuong || 0), 0);
            const totalPhuCap = bangLuong.reduce((sum, item) => sum + Number(item.phuCapChucVu || 0) + Number(item.phuCapKhac || 0), 0);
            const totalKhauTru = bangLuong.reduce((sum, item) => sum + Number(item.tongTienPhat || 0) + Number(item.truBaoHiem || 0), 0);
            const totalThucLanh = bangLuong.reduce((sum, item) => sum + Number(item.thucLanh || 0), 0);

            let chartData = [];
            if (type === 'year') {
                const byMonth = {};
                for (const row of bangLuong) {
                    const monthKey = Number(row.thang) || 0;
                    if (!byMonth[monthKey]) {
                        byMonth[monthKey] = { thang: monthKey, totalThucLanh: 0, totalThuong: 0, totalKhauTru: 0, totalNguoi: 0 };
                    }
                    byMonth[monthKey].totalThucLanh += Number(row.thucLanh || 0);
                    byMonth[monthKey].totalThuong += Number(row.thuong || 0);
                    byMonth[monthKey].totalKhauTru += Number(row.tongTienPhat || 0) + Number(row.truBaoHiem || 0);
                    byMonth[monthKey].totalNguoi += 1;
                }
                chartData = Object.values(byMonth).sort((a, b) => a.thang - b.thang);
            }

            return res.status(200).json({
                success: true,
                type,
                period: type === 'month' ? `${thang}/${nam}` : `${nam}`,
                summary: {
                    totalNhanVien,
                    totalLuongCoBan,
                    totalThuong,
                    totalPhuCap,
                    totalKhauTru,
                    totalThucLanh
                },
                data: bangLuong,
                chartData
            });
        } catch (error) {
            console.error('Lỗi thống kê lương:', error);
            return res.status(500).json({ success: false, message: 'Lỗi thống kê lương' });
        }
    },
    
    // Cap nhat bảng lương: thuong/phat (Admin)
    updateBangLuong: async (req, res) => {
        try {
            const { thang, nam, dsNhanVien, thuong } = req.body;
            // Cho phép thưởng bằng 0 (Sửa lỗi !thuong chặn số 0)
            if (!thang || !nam || (thuong === undefined || thuong === null)) {
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
            const affectedRow = await HrModel.updateBangLuong(thang, nam, dsNhanVien, thuong)
            if (affectedRow === 0) return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên hợp lệ!'
            });

            res.status(200).json({
                success: true,
                message: 'Đã thêm tiền thưởng thành công!'
            });

            await recordLog(req.user.maNhanVien, 'Cập nhật thưởng/phạt lương', { thang, nam, count: dsNhanVien.length });
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
            console.error("Lỗi Controller getBangLuong:", error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }      
    },

    // Xem bang luong (User)
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


    // ==========================================
    // PHẦN BÁO CÁO LƯƠNG (Dành cho Admin)
    // ==========================================
    getSalaryReport: async (req, res) => {
        try {
            const data = await HrModel.getSalaryReport(req.query);
            
            // Tính toán summary cho các thẻ trên cùng
            const tongNhanVien = data.length;
            const tongQuyLuong = data.reduce((sum, item) => sum + Number(item.thucLanh), 0);
            
            // Tổng khấu trừ = Tiền phạt + Trừ Bảo hiểm
            const tongKhauTru = data.reduce((sum, item) => sum + Number(item.tongTienPhat) + Number(item.truBaoHiem), 0);

            res.status(200).json({
                success: true,
                summary: { tongNhanVien, tongQuyLuong, tongKhauTru },
                result: data 
            });
        } catch (error) {
            console.error("Lỗi lấy báo cáo lương:", error);
            res.status(500).json({ success: false, message: 'Lỗi server khi lấy báo cáo' });
        }
    },
    
    // ==========================================
    // PHẦN CẤU HÌNH HỆ THỐNG (Dành cho Admin)
    // ==========================================
    
    getCauHinhSys: async (req, res) => {
        try {
            const data = await HrModel.getCauHinh();
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("Lỗi lấy cấu hình:", error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy cấu hình hệ thống' });
        }
    },

    updateCauHinhSys: async (req, res) => {
        try {
            const data = req.body;
            
            // KIỂM TRA LOGIC GIỜ LÀM VIỆC
            if (data.gioVaoLamChuan && data.gioRaLamChuan) {
                const gioVao = data.gioVaoLamChuan.length === 5 ? `${data.gioVaoLamChuan}:00` : data.gioVaoLamChuan;
                const gioRa = data.gioRaLamChuan.length === 5 ? `${data.gioRaLamChuan}:00` : data.gioRaLamChuan;

                const timeVao = new Date(`1970-01-01T${gioVao}Z`);
                const timeRa = new Date(`1970-01-01T${gioRa}Z`);

                const diffHours = (timeRa - timeVao) / (1000 * 60 * 60);

                // Phải đủ 9 tiếng (Bao gồm 8h làm việc + 1h nghỉ trưa)
                if (diffHours !== 9) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Khoảng cách giữa Giờ vào (${gioVao}) và Giờ ra (${gioRa}) đang là ${diffHours} tiếng. Vui lòng thiết lập CHÍNH XÁC 9 tiếng (Bao gồm 8h làm việc + 1h nghỉ trưa) để logic tính Tăng ca không bị lỗi!` 
                    });
                }
            }

            await HrModel.updateCauHinh(data);
            res.status(200).json({ success: true, message: 'Cập nhật cấu hình hệ thống thành công!' });
            
            await recordLog(req.user.maNhanVien, 'Cập nhật cấu hình hệ thống', { data });
        } catch (error) {
            console.error("Lỗi cập nhật cấu hình:", error);
            res.status(500).json({ success: false, message: 'Lỗi khi lưu cấu hình' });
        }
    },

    //=================================
    // QUAN LY DON TU
    //=================================

    // --- LUỒNG NHÂN VIÊN ---
    createLeaveRequest: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien; 
            
            const { loaiDon, ngayBatDau, ngayKetThuc, lyDo } = req.body;

            const validTypes = ['Nghỉ phép năm', 'Nghỉ không lương', 'Nghỉ ốm', 'Nghỉ thai sản', 'Nghỉ việc riêng'];
            if (!validTypes.includes(loaiDon)) {
                return res.status(400).json({ success: false, message: 'Loại đơn xin nghỉ không hợp lệ!' });
            }

            if (!loaiDon || !ngayBatDau || !ngayKetThuc || !lyDo) {
                return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin đơn nghỉ phép' });
            }
            if (new Date(ngayBatDau) > new Date(ngayKetThuc)) {
                return res.status(400).json({ success: false, message: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc' });
            }

            const checkTrung = await HrModel.checkTrungThoiGian(maNhanVien, ngayBatDau, ngayKetThuc);
            if (checkTrung.isTrung) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Thời gian xin nghỉ bị trùng lặp với ${checkTrung.type}. Vui lòng kiểm tra lại!` 
                });
            }
            
            if (loaiDon === 'Nghỉ phép năm') {
                const start = new Date(ngayBatDau);
                const end = new Date(ngayKetThuc);
                
                // Tính số ngày muốn xin (VD: 15/10 đến 16/10 là 2 ngày)
                const soNgayMuonXin = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                // Lấy số ngày phép đã dùng trong năm (Tính theo năm của ngày bắt đầu xin nghỉ)
                const namHienTai = start.getFullYear();
                const soNgayDaDung = await HrModel.getPhepNamDaDung(maNhanVien, namHienTai);
                
                // Quy định công ty: 12 ngày phép/năm
                const QUY_PHEP_NAM = 12;
                const soNgayConLai = QUY_PHEP_NAM - soNgayDaDung;

                // Kiểm tra vượt hạn mức
                if (soNgayMuonXin > soNgayConLai) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Quỹ phép năm ${namHienTai} của bạn chỉ còn ${soNgayConLai} ngày. Không thể xin thêm ${soNgayMuonXin} ngày!` 
                    });
                }
            }

            await HrModel.createLeaveRequest(maNhanVien, req.body);
            
            res.status(201).json({ success: true, message: 'Đã gửi đơn xin nghỉ phép thành công. Vui lòng chờ quản lý duyệt!' });
            
            await recordLog(maNhanVien, 'Gửi đơn nghỉ phép', { loaiDon, ngayBatDau, ngayKetThuc });
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
            
            await recordLog(nguoiDuyet, 'Duyệt đơn nghỉ phép', { maDon: id, trangThai });
        } catch (error) {
            console.error("Lỗi duyệt đơn:", error);
            res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xử lý đơn' });
        }
    }
};

module.exports = HrController;