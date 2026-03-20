const db = require('../../config/db');

const HrModel = {
    // ===================================
    // Phan 1: Quản lý nhân viên
    //====================================

    // Lấy danh sách nhân viên (Kèm filter)
    getAllNhanVien: async (filters) => {
        const { keyword, maChucVu, page = 1, limit = 10 } = filters;
        let sql = `
            SELECT nv.*, cv.tenChucVu 
            FROM nhanvien nv
            LEFT JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
            WHERE nv.trangThai = 1
        `;
        let values = [];
        if (keyword) {
            sql += ` AND (nv.hoTen LIKE ? OR nv.sdt LIKE ?)`;
            values.push(`%${keyword}%`, `%${keyword}%`);
        }
        if (maChucVu) {
            sql += ` AND nv.maChucVu = ?`;
            values.push(maChucVu);
        }
        // Đếm tổng số bản ghi
        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
        const [countResult] = await db.query(countSql, values);
        const totalRecords = countResult[0].total;
        // Phân trang
        const offset = (page - 1) * limit;
        sql += ` ORDER BY nv.maNhanVien DESC LIMIT ? OFFSET ?`;
        values.push(Number(limit), Number(offset));
        const [rows] = await db.query(sql, values);
        return {
            data: rows,
            pagination: { page: Number(page), limit: Number(limit), totalRecords, totalPages: Math.ceil(totalRecords / limit) }
        };
    },
    // Lấy chi tiết 1 nhân viên theo ID
    getNhanVienById: async (id) => {
        const sql = `SELECT * FROM nhanvien WHERE maNhanVien = ? AND trangThai = 1`;
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    },
    // Thêm mới nhân viên
    createNhanVien: async (data) => {
        const sql = `
            INSERT INTO nhanvien (hoTen, ngaySinh, gioiTinh, sdt, email, diaChi, ngayVaoLam, maChucVu, trangThai) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;
        const values = [data.hoTen, data.ngaySinh, data.gioiTinh, data.sdt, data.email, data.diaChi, data.ngayVaoLam, data.maChucVu];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },
    // Cập nhật thông tin nhân viên
    updateNhanVien: async (id, data) => {
        const sql = `
            UPDATE nhanvien 
            SET hoTen = ?, ngaySinh = ?, gioiTinh = ?, sdt = ?, email = ?, diaChi = ?
            WHERE maNhanVien = ?
        `;
        const values = [data.hoTen, data.ngaySinh, data.gioiTinh, data.sdt, data.email, data.diaChi, id];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },
    // Xóa nhân viên (chuyển trangThai = 0)
    deleteNhanVien: async (id) => {
        const sql = `UPDATE nhanvien SET trangThai = 0 WHERE maNhanVien = ?`;
        const [result] = await db.query(sql, [id]);
        return result.affectedRows;
    },
    // Thay đổi chức vụ -> lịch sử công tác
    changeChucVu: async (id, maChucVuMoi, ngayHieuLuc) => {
        // Lấy một kết nối riêng biệt từ Pool để chạy Transaction
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const sqlCloseOld = `
                UPDATE thaydoichucvu
                SET ngayKetThuc = ?
                WHERE maNhanVien = ? AND ngayKetThuc IS NULL
            `;
            await connection.query(sqlCloseOld, [ngayHieuLuc, id]);

            const sqlAddMew = `
                INSERT INTO thaydoichucvu (maNhanVien, maChucVu, ngayBatDau, ngayKetThuc)
                VALUES (?, ?, ?, NULL)
            `;
            await connection.query(sqlAddMew, [id, maChucVuMoi, ngayHieuLuc]);

            const sqlUpdateNhanVien = `UPDATE nhanvien SET maChucVu = ? WHERE maNhanVien = ?`;
            await connection.query(sqlUpdateNhanVien, [maChucVuMoi, id]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },
    // Lay lich su cong tac cua nhan vien
    // getLichSuCongTac: async (id) => {
    //     const sql = `
    //         SELECT td.maNhanVien, td.maChucVu, cv.tenChucVu, td.ngayBatDau, td.ngayKetThuc
    //         FROM thaydoichucvu td
    //         JOIN chucvu cv ON td.maChucVu = cv.maChucVu
    //         WHERE td.maNhanVien = ?
    //         ORDER BY td.ngayBatDau DESC
    //     `;
    //     const [rows] = await db.query(sql, [id]);
    //     return rows;
    // },
    //================================

    //================================
    // Phan 2: Quan ly chuc vu
    // ===============================
    //  Lay danh sach chuc vu
    getAllChucVu: async () => {
        const sql = `SELECT * FROM chucvu`;
        const [rows] = await db.query(sql);
        return rows;
    },
    //=======================================

    // ==============================================
    // PHẦN 3: CHẤM CÔNG & TIỀN LƯƠNG 
    // ==============================================
    // 1. Chấm công
    checkIn: async (maNhanVien, ngayLamViec, gioVao, trangThai) => {
        const sql = `
            INSERT INTO chamcong (maNhanVien, ngayLamViec, gioVao, trangThai)
            VALUES (?, ?, ?, ?)
        `;
        const values = [maNhanVien, ngayLamViec, gioVao, trangThai];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },

    checkOut: async (maNhanVien, ngayLamViec, gioRa, trangThai) => {
        const sql = `
            UPDATE chamcong
            SET gioRa = ?, trangThai = ?
            WHERE maNhanVien = ? AND ngayLamViec = ?
        `;
        const values = [gioRa, trangThai, maNhanVien, ngayLamViec];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },
    // 2. Lịch sử chấm công trong tháng
    getLichSuChamCong: async (thang, nam, maNhanVien) => {
        let sql = `
            SELECT * from chamcong
            WHERE MONTH(ngayLamViec) = ? AND YEAR(ngayLamViec) = ?  AND maNhanVien = ?
            `;
        const [rows] = await db.query(sql, [thang, nam, maNhanVien]);
        return rows;
    },
    // Kiem tra xem nhan vien da check in chua trong ngay
    getChamCongNgayHienTai: async (maNhanVien, ngay) => {
        const sql = `SELECT * FROM chamcong WHERE maNhanVien = ? AND ngay = ?`;
        const [rows] = await db.query(sql, [maNhanVien, ngay]);
        return rows[0];
    },

    // 3. Tính lương
    // Lay cau hinh tinh luong (tien phat di tre moi phut, he so tang ca)
    getCauHinh: async () => {
        const sql = `SELECT * FROM cauhinhluong WHERE trangThai = 1 LIMIT 1`;
        const [rows] = await db.query(sql);
        return rows[0];
    },

    chotBangLuongThang: async (thang, nam, cauHinh) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const TIEN_PHAT_MOI_PHUT = cauHinh.tienPhatDitre;
            const HE_SO_TANG_CA = cauHinh.heSoTangCa;
            const GIO_VAO_CHUAN = cauHinh.gioVaoLamChuan;
            const LUONG_THEO_GIO = cauHinh.luongTheoGio;
            const BHXH = cauHinh.phanTramBHXH;
            const BHYT = cauHinh.phanTramBHYT;
            // lay danh sach nhan vien dang lam viec (trangThai = 1) va thong tin chuc vu de tinh luong
            const sqlNhanVien = `
                SELECT nv.maNhanVien, cv.luongTheoGio, cv.phuCapTrachNhiem
                FROM nhanvien nv
                JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
                WHERE nv.trangThai = 1
            `;
            const [dsNhanVien] = await connection.query(sqlNhanVien);
            // danh sach cham cong trong thang do (co gioVao) de tinh luong
            const sqlChamCong = `
                SELECT maNhanVien, gioVao, gioRa 
                FROM chamcong 
                WHERE MONTH(ngay) = ? AND YEAR(ngay) = ? AND gioVao IS NOT NULL
            `;
            const [dsChamCong] = await connection.query(sqlChamCong, [thang, nam]);
            // Xóa bảng lương cũ của tháng đó (nếu kế toán muốn chốt lại)
            const sqlDeleteOld = `DELETE FROM bangluong WHERE thang = ? AND nam = ?`;
            await connection.query(sqlDeleteOld, [thang, nam]);
            // Vòng lặp tính toán chi tiết cho TỪNG nhân viên
            for (let nv of dsNhanVien) {
                const chamCongCaNhan = dsChamCong.filter(cc => cc.maNhanVien === nv.maNhanVien);
                let soGioLamBinhThuong = 0;
                let soPhutDiTre = 0;
                let soGioTangCa = 0;
                // Tính toán trên từng ngày đi làm
                chamCongCaNhan.forEach(ngayLam => {
                    // Xử lý Đi trễ
                    if (ngayLam.gioVao > GIO_VAO_CHUAN) {
                        // Tính số phút đi trễ bằng cách đổi ra Timestamp
                        const thoiGianVao = new Date(`1970-01-01T${ngayLam.gioVao}Z`);
                        const thoiGianChuan = new Date(`1970-01-01T${GIO_VAO_CHUAN}Z`);
                        const phutTre = Math.floor((thoiGianVao - thoiGianChuan) / 60000);
                        soPhutDiTre += phutTre;
                    }
                    // Xử lý Giờ làm bình thường & Tăng ca
                    if (ngayLam.gioRa) {
                        const tgVao = new Date(`1970-01-01T${ngayLam.gioVao}Z`);
                        const tgRa = new Date(`1970-01-01T${ngayLam.gioRa}Z`);
                        // Tổng số giờ làm trong ngày (trừ 1 tiếng nghỉ trưa)
                        let tongGioThucTe = ((tgRa - tgVao) / 3600000) - 1;
                        if (tongGioThucTe < 0) tongGioThucTe = 0;
                        // Chốt giờ hành chính tối đa 8 tiếng/ngày
                        if (tongGioThucTe > 8) {
                            soGioLamBinhThuong += 8;
                            soGioTangCa += (tongGioThucTe - 8);
                        } else {
                            soGioLamBinhThuong += tongGioThucTe;
                        }
                    }
                });
                // Quy đổi lương tháng ra lương giờ (Giả sử 1 tháng làm 26 ngày, mỗi ngày 8 tiếng)
                const luongCoBanThucTe = Math.round(soGioLamBinhThuong * LUONG_THEO_GIO);
                const tongTienTangCa = Math.round(soGioTangCa * LUONG_THEO_GIO * HE_SO_TANG_CA);
                const tongTienPhat = soPhutDiTre * TIEN_PHAT_MOI_PHUT;
                const phuCapChucVu = nv.phuCapTrachNhiem || 0;
                const phuCapKhac = 0;
                // Trừ bảo hiểm (Ví dụ 10.5% trên Lương cơ bản thực tế)
                const truBaoHiem = Math.round(luongCoBanThucTe * (BHXH + BHYT));
                // Tính Thực Lãnh
                const thuong = 0;
                const thucLanh = luongCoBanThucTe + tongTienTangCa + phuCapChucVu + phuCapKhac + thuong - tongTienPhat - truBaoHiem;

                const sqlInsertLuong = `
                    INSERT INTO bangluong (
                        maNhanVien, thang, nam, luongTheoGio, soGioLamBinhThuong, 
                        luongCoBan, soGioTangCa, heSoTangCa, tongTienTangCa, 
                        soPhutDiTre, tienPhatDiTre, tongTienPhat, 
                        phuCapChucVu, phuCapKhac, truBaoHiem, thuong, thucLanh, ngayTao, trangThai
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Chưa thanh toán')
                `;

                const values = [
                    nv.maNhanVien, thang, nam, LUONG_THEO_GIO, soGioLamBinhThuong,
                    luongCoBanThucTe, soGioTangCa, HE_SO_TANG_CA, tongTienTangCa,
                    soPhutDiTre, TIEN_PHAT_MOI_PHUT, tongTienPhat,
                    phuCapChucVu, phuCapKhac, truBaoHiem, thuong, thucLanh
                ];

                await connection.query(sqlInsertLuong, values);
            }
            await connection.commit();
            return dsNhanVien.length;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },
    // Lấy bảng lương kem bo loc (Admin)
    getBangLuong: async (filters) => {
        const { thang, nam, maNhanVien, maChucVu } = filters;
        const sql = `
            SELECT bl.*, nv.hoTen, cv.tenChucVu 
            FROM bangluong bl
            JOIN nhanvien nv ON bl.maNhanVien = nv.maNhanVien
            JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
        `;

        let values = [];

        if (thang) {
            sql += ` WHERE bl.thang = ?`;
            values.push(thang);
        }
        if(nam){
            sql += values.length > 0 ? ` AND bl.nam = ?` : ` WHERE bl.nam = ?`;
            values.push(nam);
        }
        if(maChucVu){
            sql += values.length > 0 ? ` AND nv.maChucVu = ?` : ` WHERE nv.maChucVu = ?`;
            values.push(maChucVu);
        }
        if (maNhanVien) {
            sql += values.length > 0 ? ` AND bl.maNhanVien = ?` : ` WHERE bl.maNhanVien = ?`;
            values.push(maNhanVien);
        }
        const [rows] = await db.query(sql, values);
        return rows;
    },

    // Xem luong (User)
    xemLuong: async (thang, nam, maNhanVien) =>{
        const sql = `
            SELECT *
            FROM bangluong
            WHERE maNhanVien = ?
        `;
        let values = [maNhanVien];
        if (thang) {
            sql += ` AND thang = ?`;
            values.push(thang);
        }
        if(nam){
            sql += ` AND nam = ?`;
            values.push(nam);
        }
        const [rows] = await db.query(sql, values);
        return rows;
    },

    // Update bang Luong (Thuong )
    updateBangLuong: async (thang, nam, dsNhanVien, thuong) => {
        let totalAffected = 0;
        for (let nv of dsNhanVien) {
            const sql = `
                UPDATE bangluong
                SET thuong = ? , thucLanh = thucLanh + ?
                WHERE nam = ? AND thang = ? AND maNhanVien = ? 
            `;
            const values = [thuong, thuong, nam, thang, nv];
            const [result] = await db.query(sql, values);
            totalAffected += result.affectedRows;
        }
        return totalAffected;
    },
    //================================

    // ==============================================
    // PHẦN 4: QUẢN LÝ ĐƠN NGHỈ PHÉP
    // ==============================================

    // 1. Nhân viên: Nộp đơn xin nghỉ
   createLeaveRequest: async (maNhanVien, data) => {
        const sql = `
            INSERT INTO dontu (maNhanVien, loaiDon, lyDo, ngayBatDau, ngayKetThuc, trangThai) 
            VALUES (?, ?, ?, ?, ?, 'Chờ duyệt')
        `;
        const values = [maNhanVien, data.loaiDon, data.lyDo, data.ngayBatDau, data.ngayKetThuc];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },

    // 2. Nhân viên: Xem danh sách đơn mình đã nộp
    getLeaveRequestById: async (maNhanVien) => {
        const sql = `
            SELECT * FROM dontu 
            WHERE maNhanVien = ? 
            ORDER BY ngayBatDau DESC
        `;
        const [rows] = await db.query(sql, [maNhanVien]);
        return rows;
    },

    // 3. Quản lý/HR: Xem toàn bộ đơn xin nghỉ của cả công ty (Có bộ lọc)
    getAllLeaveRequest: async (filters) => {
        const { trangThai, thang, nam } = filters;
        let sql = `
            SELECT dt.*, nv.hoTen, cv.tenChucVu, nd.hoTen as tenNguoiDuyet
            FROM dontu dt
            JOIN nhanvien nv ON dt.maNhanVien = nv.maNhanVien
            JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
            LEFT JOIN nhanvien nd ON dt.maNguoiDuyet = nd.maNhanVien
            WHERE 1=1
        `;
        let values = [];

        if (trangThai) {
            sql += ` AND dt.trangThai = ?`;
            values.push(trangThai);
        }
        if (thang && nam) {
            sql += ` AND MONTH(dt.ngayBatDau) = ? AND YEAR(dt.ngayBatDau) = ?`;
            values.push(thang, nam);
        }
        sql += ` ORDER BY dt.ngayTao DESC`;
        const [rows] = await db.query(sql, values);
        return rows;
    },

    // 4. Quản lý/HR: Duyệt hoặc Từ chối đơn (TÍCH HỢP TỰ ĐỘNG CHẤM CÔNG)
    handleLeaveRequest: async (maDon, trangThaiMoi, nguoiDuyet) => {
        // Lấy một kết nối riêng biệt để chạy Transaction
        const connection = await db.getConnection(); 

        try {
            // Bắt đầu khóa an toàn
            await connection.beginTransaction();

            // BƯỚC 1: Cập nhật trạng thái duyệt vào bảng dontu
            const sqlUpdateDon = `
                UPDATE dontu
                SET trangThai = ?, maNguoiDuyet = ? 
                WHERE maDon = ?
            `;
            const [result] = await connection.query(sqlUpdateDon, [trangThaiMoi, nguoiDuyet, maDon]);
            // BƯỚC 2: Nếu quản lý "Đã duyệt" -> Tự động sinh ra các ngày chấm công
            if (trangThaiMoi === 'Đã duyệt') {
                // 2.1: Lấy thông tin chi tiết của đơn này (Ai nghỉ, từ ngày nào đến ngày nào)
                // Giả định bảng dontu của bạn có các cột: maNhanVien, tuNgay, denNgay, loaiDon
                const sqlGetDon = `SELECT maNhanVien, ngayBatDau, ngayKetThuc, loaiDon FROM dontu WHERE maDon = ?`;
                const [donInfo] = await connection.query(sqlGetDon, [maDon]);

                if (donInfo.length > 0) {
                    const { maNhanVien, tuNgay, denNgay, loaiDon } = donInfo[0];
                    // 2.2: Dùng vòng lặp duyệt qua từng ngày từ 'tuNgay' đến 'denNgay'
                    let currentDate = new Date(tuNgay);
                    const endDate = new Date(denNgay);
                    while (currentDate <= endDate) {
                        // Cắt lấy chuỗi YYYY-MM-DD chuẩn của MySQL
                        const dateString = currentDate.toISOString().split('T')[0];
                        const trangThaiNghi = `Nghỉ có phép`;
                        // 2.3: Chèn vào bảng chamcong. 
                        // Dùng ON DUPLICATE KEY UPDATE để lỡ nhân viên sáng check-in rồi trưa xin nghỉ ốm về thì hệ thống sẽ ghi đè lại trạng thái.
                        const sqlChamCong = `
                            INSERT INTO chamcong (maNhanVien, ngayLamViec, trangThai) 
                            VALUES (?, ?, ?)
                            ON DUPLICATE KEY UPDATE trangThai = ?
                        `;
                        await connection.query(sqlChamCong, [
                            maNhanVien, dateString, trangThaiNghi, 
                            trangThaiNghi
                        ]);
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            }
            // Nếu mọi thứ trơn tru (Không có lỗi DB) -> Lưu vĩnh viễn
            await connection.commit();
            return result.affectedRows;
        } catch (error) {
            // Có lỗi xảy ra -> Hủy bỏ, trả dữ liệu về như cũ, tránh sinh ra data rác
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },
    updateLeaveRequest: async (maDon, data) => {
        const sql = `
            UPDATE dontu
            SET ngayBatDau = ?, ngayKetThuc = ?, lyDo = ?
            WHERE maDon = ? 
        `;
        const [result] = await db.query(sql, [data.ngayBatDau, data.ngayKetThuc, data.lyDo, maDon]);
        return result.affectedRows; 
    }
    
};

module.exports = HrModel;