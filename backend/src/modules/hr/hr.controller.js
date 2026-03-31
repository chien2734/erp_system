const HrModel = require('./hr.model');

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
            const { sdt, email, diaChi } = req.body;
            
            // Viết 1 hàm update nhỏ gọn trong Model để chỉ sửa 3 cột này
            const sql = `UPDATE nhanvien SET sdt = ?, email = ?, diaChi = ? WHERE maNhanVien = ?`;
            await db.query(sql, [sdt, email, diaChi, maNhanVien]);
            
            res.status(200).json({ success: true, message: 'Đã cập nhật thông tin liên hệ!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thông tin' });
        }
    },

    changePassword: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien;
            const { oldPass, newPass } = req.body;

            // Kiểm tra pass cũ
            const [user] = await db.query(`SELECT matKhau FROM nhanvien WHERE maNhanVien = ?`, [maNhanVien]);
            if (user[0].matKhau !== oldPass) {
                return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
            }

            // Lưu pass mới
            await db.query(`UPDATE nhanvien SET matKhau = ? WHERE maNhanVien = ?`, [newPass, maNhanVien]);
            res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu' });
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

    // Thêm chức vụ mới
    createChucVu: async (req, res) => {
        try {
            const { tenChucVu, luongTheoGio, phuCapTrachNhiem } = req.body;
            if (!tenChucVu || !luongTheoGio) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập tên chức vụ và lương theo giờ' });
            }
            await HrModel.createChucVu(req.body);
            res.status(201).json({ success: true, message: 'Thêm chức vụ mới thành công' });
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
            // const now = new Date();
            // const year = now.getFullYear();
            // const month = String(now.getMonth() + 1).padStart(2, '0');
            // const day = String(now.getDate()).padStart(2, '0');
            // const ngayHienTai = `${year}-${month}-${day}`; // Ra chuẩn YYYY-MM-DD theo giờ VN
            // const gioHienTai = now.toTimeString().split(' ')[0]; // HH:MM:SS
            // Quy định giờ làm việc chuẩn
            const ngayHienTai = '2026-03-30'; // Ngày test
            const gioHienTai = '17:45:00';
            
            const GIO_VAO_CHUAN = '08:00:00';
            const GIO_RA_CHUAN = '17:00:00';
            const chamCongHomNay = await HrModel.getChamCongNgayHienTai(maNhanVien, ngayHienTai);
            // chưa chấm công -> thực hiện check-in
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
                // =============== XỬ LÝ CHECK-OUT ===============
                if (chamCongHomNay.gioRa) {
                    return res.status(400).json({ success: false, message: 'Bạn đã hoàn tất chấm công ra về cho ngày hôm nay rồi!' });
                }

                let trangThaiChot = chamCongHomNay.trangThai || '';
                let soGioLam = 0;

                // Quy đổi ra Timestamp để tính toán chính xác
                const tgVao = new Date(`1970-01-01T${chamCongHomNay.gioVao}Z`);
                const tgRa = new Date(`1970-01-01T${gioHienTai}Z`);
                const tgRaChuan = new Date(`1970-01-01T17:00:00Z`); // 17:00
                const tgBatDauTC = new Date(`1970-01-01T18:00:00Z`); // 18:00

                // PHÂN LOẠI 3 VÙNG THỜI GIAN CHECK-OUT
                if (tgRa < tgRaChuan) {
                    // VÙNG 1: Về sớm (Trước 17h)
                    trangThaiChot = trangThaiChot ? (trangThaiChot + ' - Về sớm') : 'Về sớm';
                    soGioLam = ((tgRa - tgVao) / 3600000) - 1; // Trừ 1 tiếng nghỉ trưa
                } 
                else if (tgRa >= tgRaChuan && tgRa <= tgBatDauTC) {
                    // VÙNG 2: La cà (Từ 17h đến 18h) -> Chốt cứng giờ về là 17h
                    trangThaiChot = trangThaiChot ? (trangThaiChot + ' - Về đúng giờ') : 'Về đúng giờ';
                    soGioLam = ((tgRaChuan - tgVao) / 3600000) - 1; 
                } 
                else if (tgRa > tgBatDauTC) {
                    // VÙNG 3: Tăng ca (Sau 18h) -> Tính 8 tiếng hành chính + Số giờ sau 18h
                    trangThaiChot = trangThaiChot ? (trangThaiChot + ' và Tăng ca') : 'Tăng ca';
                    const gioHanhChinh = ((tgRaChuan - tgVao) / 3600000) - 1;
                    const gioTangCa = (tgRa - tgBatDauTC) / 3600000; // Chỉ tính từ 18h trở đi
                    soGioLam = gioHanhChinh + gioTangCa;
                }

                // Chống số âm nếu nhân viên đến làm rồi về luôn trong buổi sáng
                if (soGioLam < 0) soGioLam = 0;
                soGioLam = parseFloat(soGioLam.toFixed(2)); // Làm tròn 2 chữ số (VD: 8.50)

                // Lưu vào Database
                await HrModel.checkOut(maNhanVien, ngayHienTai, gioHienTai, soGioLam, trangThaiChot);

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

            // Xử lý nếu Frontend gửi thiếu giây (VD: '08:00' thành '08:00:00')
            if (gioVao && gioVao.length === 5) gioVao += ':00';
            if (gioRa && gioRa.length === 5) gioRa += ':00';
            
            if (!gioVao) gioVao = null;
            if (!gioRa) gioRa = null;

            let soGioLam = 0;
            let trangThaiMoi = trangThai; // Lấy tạm trạng thái từ Frontend

            // 1. NHÓM TRẠNG THÁI ĐẶC BIỆT (Nghỉ phép, vắng mặt)
            if (trangThaiMoi === 'Nghỉ phép' || trangThaiMoi === 'Nghỉ ốm') {
                soGioLam = 8.00; // Nghỉ có đơn vẫn được tính 8 tiếng
            } 
            else if (trangThaiMoi === 'Vắng mặt') {
                soGioLam = 0;
                gioVao = null; // Xóa luôn giờ nếu có
                gioRa = null;
            } 
            // 2. NHÓM ĐI LÀM THỰC TẾ (Hệ thống tự động tính toán lại 100% dựa trên giờ)
            else if (gioVao && gioRa) {
                const tgVao = new Date(`1970-01-01T${gioVao}Z`);
                const tgRa = new Date(`1970-01-01T${gioRa}Z`);
                
                // Các mốc giờ chuẩn của công ty
                const tgVaoChuan = new Date(`1970-01-01T08:00:00Z`); // 8h sáng
                const tgRaChuan = new Date(`1970-01-01T17:00:00Z`);  // 5h chiều
                const tgBatDauTC = new Date(`1970-01-01T18:00:00Z`); // 6h tối bắt đầu OT

                // 👉 FIX LỖI ẢO GIỜ: Nếu đi sớm trước 8h, chỉ bắt đầu tính lương từ 8h
                const calcTgVao = (tgVao < tgVaoChuan) ? tgVaoChuan : tgVao;

                // XÉT ĐẦU VÀO: Trễ hay Đúng giờ?
                let prefix = (tgVao > tgVaoChuan) ? 'Đi trễ' : 'Đúng giờ';

                // XÉT ĐẦU RA VÀ TÍNH TIỀN (3 Vùng thời gian)
                if (tgRa < tgRaChuan) {
                    // Vùng 1: Về sớm
                    trangThaiMoi = `${prefix} - Về sớm`;
                    soGioLam = ((tgRa - calcTgVao) / 3600000) - 1; 
                } 
                else if (tgRa >= tgRaChuan && tgRa <= tgBatDauTC) {
                    // Vùng 2: La cà / Về chuẩn (Chốt cứng giờ về là 17:00)
                    trangThaiMoi = `${prefix} - Về đúng giờ`;
                    soGioLam = ((tgRaChuan - calcTgVao) / 3600000) - 1; 
                } 
                else if (tgRa > tgBatDauTC) {
                    // Vùng 3: Tăng ca (Giờ hành chính + Giờ OT)
                    trangThaiMoi = `${prefix} và Tăng ca`;
                    const gioHanhChinh = ((tgRaChuan - calcTgVao) / 3600000) - 1;
                    const gioTangCa = (tgRa - tgBatDauTC) / 3600000;
                    soGioLam = gioHanhChinh + gioTangCa;
                }

                // Chống số âm (Nếu vô tình sửa giờ ra < giờ vào)
                if (soGioLam < 0) soGioLam = 0;
                soGioLam = parseFloat(soGioLam.toFixed(2));
            }
            // 3. NẾU CHỈ CÓ GIỜ VÀO (Đang đi làm, chưa về)
            else if (gioVao && !gioRa) {
                const tgVao = new Date(`1970-01-01T${gioVao}Z`);
                const tgVaoChuan = new Date(`1970-01-01T08:00:00Z`);
                trangThaiMoi = (tgVao > tgVaoChuan) ? 'Đi trễ' : 'Đúng giờ';
                soGioLam = 0; // Chưa về chưa tính giờ
            }

            // Gọi Model cập nhật xuống DB (Ghi đè luôn cái trạng thái mới)
            await HrModel.adminUpdateChamCong(maNhanVien, ngayLamViec, gioVao, gioRa, soGioLam, trangThaiMoi);

            return res.status(200).json({ success: true, message: 'Cập nhật chấm công thành công!' });
        } catch (error) {
            console.error("Lỗi update chấm công:", error);
            return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
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
            const affectedRow = await HrModel.updateBangLuong(thang, nam, dsNhanVien, thuong)
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
            
            // 🔴 CAMERA 2: Xem Frontend có truyền đúng tháng, năm xuống không?
            console.log("Backend đang tìm lương cho:", {thang, nam}); 

            const result = await HrModel.getBangLuong({thang, nam, maNhanVien, maChucVu});
            
            // 🔴 CAMERA 3: Xem SQL có lấy lên được dòng nào không?
            console.log("Số dòng lấy được từ Database:", result.length);

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
            
            await HrModel.createLeaveRequest(maNhanVien, req.body);
            
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