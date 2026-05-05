const db = require('../../config/db');

const HrModel = {
    // ===================================
    // Phan 1: Quản lý nhân viên
    //====================================

    // Lấy danh sách nhân viên (Kèm filter)
    getAllNhanVien: async (filters) => {
        const { keyword, maChucVu, page = 1, limit = 10 } = filters;
        let sql = `
            SELECT nv.*, cv.tenChucVu, tk.maNhomQuyen 
            FROM nhanvien nv
            LEFT JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
            LEFT JOIN taikhoan tk ON nv.maNhanVien = tk.maNhanVien
            WHERE 1 = 1
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
        const sql = `
            SELECT nv.*, cv.tenChucVu, tk.maNhomQuyen 
            FROM nhanvien nv
            LEFT JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
            LEFT JOIN taikhoan tk ON nv.maNhanVien = tk.maNhanVien
            WHERE nv.maNhanVien = ?
        `;
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    },
    // Thêm mới nhân viên
    createNhanVien: async (data) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Thêm nhân viên vào bảng chính
            const sqlNV = `
                INSERT INTO nhanvien (hoTen, ngaySinh, gioiTinh, sdt, email, diaChi, ngayVaoLam, maChucVu, trangThai) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            `;
            const [result] = await connection.query(sqlNV, [
                data.hoTen, data.ngaySinh || null, data.gioiTinh, data.sdt,
                data.email, data.diaChi, data.ngayVaoLam, data.maChucVu
            ]);
            const newId = result.insertId;

            // 2. GHI NHẬN LỊCH SỬ CHỨC VỤ ĐẦU TIÊN
            const sqlHistory = `
                INSERT INTO thaydoichucvu (maNhanVien, maChucVu, ngayBatDau, ngayKetThuc)
                VALUES (?, ?, ?, NULL)
            `;
            await connection.query(sqlHistory, [newId, data.maChucVu, data.ngayVaoLam]);

            await connection.commit();
            return newId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },
    // Cập nhật thông tin nhân viên (Bổ sung Ngày vào làm & Fix lỗi Date)
    updateNhanVien: async (id, data) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Lấy chức vụ HIỆN TẠI của nhân viên trong DB để so sánh
            const [currentInfo] = await connection.query(
                `SELECT maChucVu FROM nhanvien WHERE maNhanVien = ?`, [id]
            );
            const oldMaChucVu = currentInfo[0]?.maChucVu;

            // 2. Nếu chức vụ bị thay đổi -> Ghi nhận vào bảng thaydoichucvu
            if (oldMaChucVu && oldMaChucVu != data.maChucVu) {
                // Khởi tạo đối tượng Date riêng biệt
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1); // Không làm ảnh hưởng đến 'today'

                // Xử lý bù trừ múi giờ (để lấy đúng Local Date)
                const offset = today.getTimezoneOffset() * 60000;
                const localToday = new Date(today.getTime() - offset);
                const localYesterday = new Date(yesterday.getTime() - offset);

                const ngayKetThucCu = localYesterday.toISOString().split('T')[0];
                const ngayBatDauMoi = localToday.toISOString().split('T')[0];

                // Chốt ngày kết thúc chức vụ cũ
                await connection.query(
                    `UPDATE thaydoichucvu SET ngayKetThuc = ? WHERE maNhanVien = ? AND ngayKetThuc IS NULL`,
                    [ngayKetThucCu, id]
                );

                // Thêm dòng lịch sử cho chức vụ mới
                await connection.query(
                    `INSERT INTO thaydoichucvu (maNhanVien, maChucVu, ngayBatDau) VALUES (?, ?, ?)`,
                    [id, data.maChucVu, ngayBatDauMoi]
                );
            }

            // 3. Cập nhật bảng chính nhanvien
            const sqlUpdate = `
            UPDATE nhanvien 
            SET hoTen = ?, ngaySinh = ?, gioiTinh = ?, sdt = ?, email = ?, diaChi = ?, ngayVaoLam = ?, maChucVu = ?, trangThai = ?
            WHERE maNhanVien = ?
        `;
            const values = [
                data.hoTen, data.ngaySinh || null, data.gioiTinh, data.sdt,
                data.email, data.diaChi, data.ngayVaoLam || null, data.maChucVu, data.trangThai, id
            ];
            await connection.query(sqlUpdate, values);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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

    // Lấy lịch sử công tác của nhân viên
    getLichSuCongTac: async (id) => {
        // 1. Trả lại câu SELECT nguyên bản của bạn để không bị lỗi cột
        const sqlHistory = `
            SELECT td.*, cv.tenChucVu
            FROM thaydoichucvu td
            JOIN chucvu cv ON td.maChucVu = cv.maChucVu
            WHERE td.maNhanVien = ?
            ORDER BY td.ngayBatDau DESC
        `;
        const [history] = await db.query(sqlHistory, [id]);

        // Nếu đã có lịch sử thì trả về luôn
        if (history.length > 0) {
            return history;
        }

        // 2. Nếu chưa từng thăng tiến, lấy chức vụ ngày đầu tiên vào làm
        const sqlDefault = `
            SELECT nv.ngayVaoLam AS ngayBatDau, cv.tenChucVu
            FROM nhanvien nv
            JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
            WHERE nv.maNhanVien = ?
        `;
        const [defaultRole] = await db.query(sqlDefault, [id]);

        // Trả về Object mô phỏng lại bảng thaydoichucvu
        if (defaultRole.length > 0) {
            return [{
                ngayBatDau: defaultRole[0].ngayBatDau,
                tenChucVu: defaultRole[0].tenChucVu,
                ghiChu: 'Tiếp nhận công việc / Bắt đầu làm việc'
            }];
        }
        return [];
    },

    // Kiểm tra trùng Email hoặc Số điện thoại
    checkUniqueEmailSdt: async (email, sdt, excludeId = null) => {
        let sqlEmail = `SELECT maNhanVien FROM nhanvien WHERE email = ?`;
        let sqlSdt = `SELECT maNhanVien FROM nhanvien WHERE sdt = ?`;
        let valuesEmail = [email];
        let valuesSdt = [sdt];

        if (excludeId) {
            sqlEmail += ` AND maNhanVien != ?`;
            sqlSdt += ` AND maNhanVien != ?`;
            valuesEmail.push(excludeId);
            valuesSdt.push(excludeId);
        }

        const [rowsEmail] = await db.query(sqlEmail, valuesEmail);
        const [rowsSdt] = await db.query(sqlSdt, valuesSdt);

        return {
            emailExists: rowsEmail.length > 0,
            sdtExists: rowsSdt.length > 0
        };
    },

    // Kiểm tra nhân viên đã có bảng lương chưa
    checkNhanVienHasPayroll: async (maNhanVien) => {
        const sql = `SELECT 1 FROM bangluong WHERE maNhanVien = ? LIMIT 1`;
        const [rows] = await db.query(sql, [maNhanVien]);
        return rows.length > 0;
    },

    // Lấy thông tin tháng lương sớm nhất của nhân viên
    getEarliestPayroll: async (maNhanVien) => {
        const sql = `SELECT thang, nam FROM bangluong WHERE maNhanVien = ? ORDER BY nam ASC, thang ASC LIMIT 1`;
        const [rows] = await db.query(sql, [maNhanVien]);
        return rows[0] || null;
    },

    //================================
    // Phan 2: Quan ly chuc vu
    // ===============================
    //  Lay danh sach chuc vu
    getAllChucVu: async () => {
        const sql = `SELECT * FROM chucvu`;
        const [rows] = await db.query(sql);
        return rows;
    },

    // Lấy thông tin 1 chức vụ theo ID (Hỗ trợ check phân quyền)
    getChucVuById: async (maChucVu) => {
        const sql = `SELECT * FROM chucvu WHERE maChucVu = ?`;
        const [rows] = await db.query(sql, [maChucVu]);
        return rows[0];
    },

    createChucVu: async (data) => {
        const sql = `INSERT INTO chucvu (tenChucVu, luongTheoGio, phuCapTrachNhiem) VALUES (?, ?, ?)`;
        const values = [data.tenChucVu, data.luongTheoGio, data.phuCapTrachNhiem || 0];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },

    updateChucVu: async (id, data) => {
        const sql = `UPDATE chucvu SET tenChucVu = ?, luongTheoGio = ?, phuCapTrachNhiem = ? WHERE maChucVu = ?`;
        const values = [data.tenChucVu, data.luongTheoGio, data.phuCapTrachNhiem || 0, id];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },

    deleteChucVu: async (id) => {
        const sql = `DELETE FROM chucvu WHERE maChucVu = ?`;
        const [result] = await db.query(sql, [id]);
        return result.affectedRows;
    },

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

    checkOut: async (maNhanVien, ngayLamViec, gioRa, soGioLam, trangThai) => {
        const sql = `
            UPDATE chamcong
            SET gioRa = ?, soGioLam = ?, trangThai = ?  
            WHERE maNhanVien = ? AND ngayLamViec = ?
        `;
        const values = [gioRa, soGioLam, trangThai, maNhanVien, ngayLamViec];
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
        const sql = `SELECT * FROM chamcong WHERE maNhanVien = ? AND ngayLamViec = ?`;
        const [rows] = await db.query(sql, [maNhanVien, ngay]);
        return rows[0];
    },

    // Lấy lịch sử chấm công của 1 nhân viên trong tháng
    getChamCongThang: async (maNhanVien, thang, nam) => {
        const sql = `
            SELECT * FROM chamcong 
            WHERE maNhanVien = ? 
            AND MONTH(ngayLamViec) = ? 
            AND YEAR(ngayLamViec) = ?
        `;
        const [rows] = await db.query(sql, [maNhanVien, thang, nam]);
        return rows;
    },

    // Lấy chấm công của TOÀN BỘ nhân viên trong tháng
    getTatCaChamCongThang: async (thang, nam) => {
        const sql = `SELECT * FROM chamcong WHERE MONTH(ngayLamViec) = ? AND YEAR(ngayLamViec) = ?`;
        const [rows] = await db.query(sql, [thang, nam]);
        return rows;
    },

    //bAdmin ép kiểu/sửa dữ liệu chấm công
    adminUpdateChamCong: async (maNhanVien, ngayLamViec, gioVao, gioRa, soGioLam, trangThai) => {
        // Kiểm tra xem ngày đó nhân viên đã có dòng dữ liệu nào chưa
        const checkSql = `SELECT maChamCong FROM chamcong WHERE maNhanVien = ? AND ngayLamViec = ?`;
        const [check] = await db.query(checkSql, [maNhanVien, ngayLamViec]);

        if (check.length > 0) {
            // Đã có -> Cập nhật (Sửa giờ, sửa trạng thái)
            const sql = `UPDATE chamcong SET gioVao = ?, gioRa = ?, soGioLam = ?, trangThai = ? WHERE maNhanVien = ? AND ngayLamViec = ?`;
            const [result] = await db.query(sql, [gioVao, gioRa, soGioLam, trangThai, maNhanVien, ngayLamViec]);
            return result.affectedRows;
        } else {
            // Chưa có (Ví dụ: Admin tự thêm ngày nghỉ phép) -> Tạo mới
            const sql = `INSERT INTO chamcong (maNhanVien, ngayLamViec, gioVao, gioRa, soGioLam, trangThai) VALUES (?, ?, ?, ?, ?, ?)`;
            const [result] = await db.query(sql, [maNhanVien, ngayLamViec, gioVao, gioRa, soGioLam, trangThai]);
            return result.insertId;
        }
    },

    // 3. Cấu Hình
    getCauHinh: async () => {
        const sql = `SELECT * FROM cauhinh LIMIT 1`;

        try {
            const [rows] = await db.query(sql);
            return rows[0] || {
                gioVaoLamChuan: '08:00:00',
                gioRaLamChuan: '17:00:00',
                tgChoTangCa: 60,     // phút     
                soGioTangCaToiDa: 2,
                tienPhatDiTre: 2000,
                heSoTangCa: 1.5,
                phanTramBHXH: 8.0,
                phanTramBHYT: 1.5,
                phuCapAnTrua: 730000,
                phuCapXangXe: 300000,
                luongCoSo: 4680000
            };
        } catch (error) {
            console.error("Lỗi lấy cấu hình:", error);
            return {};
        }
    },

    updateCauHinh: async (data) => {
        const sql = `
            UPDATE cauhinh 
            SET gioVaoLamChuan = ?, 
                gioRaLamChuan = ?, 
                tgChoTangCa = ?,      
                soGioTangCaToiDa = ?,
                tienPhatDiTre = ?, 
                heSoTangCa = ?, 
                luongCoSoBH = ?, 
                phanTramBHXH = ?, 
                phanTramBHYT = ?, 
                phuCapAnTrua = ?, 
                phuCapXangXe = ?
            WHERE maCauHinh = 1
        `;
        const values = [
            data.gioVaoLamChuan,
            data.gioRaLamChuan,
            data.tgChoTangCa || 60,
            data.soGioTangCaToiDa || 2,
            data.tienPhatDiTre,
            data.heSoTangCa,
            data.luongCoSoBH,
            data.phanTramBHXH,
            data.phanTramBHYT,
            data.phuCapAnTrua,
            data.phuCapXangXe
        ];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },

    // 4. TÍNH LƯƠNG
    chotBangLuongThang: async (thang, nam, cauHinh) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Nếu đã chốt (trangThai = 1) thì CẤM không cho tính lại để bảo vệ dữ liệu!
            const [checkChot] = await connection.query(
                `SELECT 1 FROM bangluong WHERE thang = ? AND nam = ? AND trangThai = 1 LIMIT 1`,
                [thang, nam]
            );
            if (checkChot.length > 0) {
                throw new Error('ĐÃ_CHỐT'); // Ném lỗi ra cho Controller xử lý
            }

            // Dùng || để nếu DB thiếu cột, hệ thống tự lấy số mặc định để tính tiếp
            const TIEN_PHAT_MOI_PHUT = parseFloat(cauHinh.tienPhatDiTre || cauHinh.tienPhatDitre || 2000);
            const GIO_VAO_CHUAN = cauHinh.gioVaoLamChuan || '08:00:00';
            const HE_SO_TANG_CA = parseFloat(cauHinh.heSoTangCa || 1.5);
            const ptBHXH = parseFloat(cauHinh.phanTramBHXH || 8.0);
            const ptBHYT = parseFloat(cauHinh.phanTramBHYT || 1.5);
            const BH_PERCENT = (ptBHXH + ptBHYT) / 100;

            const pcAnTrua = parseFloat(cauHinh.phuCapAnTrua || 730000);
            const pcXangXe = parseFloat(cauHinh.phuCapXangXe || 300000);
            const PHU_CAP_CO_DINH = pcAnTrua + pcXangXe;

            const luongCoSo = parseFloat(cauHinh.luongCoSo || 4680000);
            const MUC_TRU_BAO_HIEM = Math.round(luongCoSo * BH_PERCENT);

            const ngayMoc = `${nam}-${String(thang).padStart(2, '0')}-01`;

            const sqlGetNhanVien = `
                SELECT DISTINCT nv.maNhanVien, nv.hoTen 
                FROM nhanvien nv
                LEFT JOIN chamcong cc ON nv.maNhanVien = cc.maNhanVien 
                    AND MONTH(cc.ngayLamViec) = ? AND YEAR(cc.ngayLamViec) = ?
                WHERE (nv.trangThai = 1 OR cc.maNhanVien IS NOT NULL)
                AND nv.ngayVaoLam <= LAST_DAY(STR_TO_DATE(CONCAT(?, '-', ?, '-01'), '%Y-%m-%d'))
            `;
            const [dsNhanVien] = await connection.query(sqlGetNhanVien, [thang, nam, nam, thang]);

            const [dsChamCong] = await connection.query(
                `SELECT maNhanVien, soGioLam, trangThai, gioVao 
                 FROM chamcong 
                 WHERE MONTH(ngayLamViec) = ? AND YEAR(ngayLamViec) = ?`,
                [thang, nam]
            );

            const [oldSalary] = await connection.query(`SELECT maNhanVien, thuong FROM bangluong WHERE thang = ? AND nam = ?`, [thang, nam]);
            await connection.query(`DELETE FROM bangluong WHERE thang = ? AND nam = ?`, [thang, nam]);

            for (let nv of dsNhanVien) {
                // TÌM CHỨC VỤ ÁP DỤNG CHO THÁNG TÍNH LƯƠNG
                let luongTheoGio = 0;
                let pcChucVu = 0;
                let tenChucVu = '';

                // Check 1: Tìm chức vụ được phân công TỪ TRƯỚC mùng 1 của tháng này
                // (Vì đổi chức vụ trong tháng này thì tháng sau mới được áp dụng)
                const [chucVuTruocDo] = await connection.query(`
                    SELECT cv.luongTheoGio, cv.phuCapTrachNhiem, cv.tenChucVu
                    FROM thaydoichucvu td
                    JOIN chucvu cv ON td.maChucVu = cv.maChucVu
                    WHERE td.maNhanVien = ? AND td.ngayBatDau < ?
                    ORDER BY td.ngayBatDau DESC LIMIT 1
                `, [nv.maNhanVien, ngayMoc]);

                if (chucVuTruocDo.length > 0) {
                    luongTheoGio = parseFloat(chucVuTruocDo[0].luongTheoGio || 0);
                    pcChucVu = parseFloat(chucVuTruocDo[0].phuCapTrachNhiem || 0);
                    tenChucVu = chucVuTruocDo[0].tenChucVu;
                } else {
                    // Check 2: Nếu không có lịch sử TRƯỚC mùng 1 (Tức là NV mới vào làm hoặc 
                    // mới có data trong tháng này). Ta lấy chức vụ CŨ NHẤT trong tháng này.
                    const [chucVuTrongThang] = await connection.query(`
                        SELECT cv.luongTheoGio, cv.phuCapTrachNhiem, cv.tenChucVu
                        FROM thaydoichucvu td
                        JOIN chucvu cv ON td.maChucVu = cv.maChucVu
                        WHERE td.maNhanVien = ? AND MONTH(td.ngayBatDau) = ? AND YEAR(td.ngayBatDau) = ?
                        ORDER BY td.ngayBatDau ASC LIMIT 1
                    `, [nv.maNhanVien, thang, nam]);

                    if (chucVuTrongThang.length > 0) {
                        luongTheoGio = parseFloat(chucVuTrongThang[0].luongTheoGio || 0);
                        pcChucVu = parseFloat(chucVuTrongThang[0].phuCapTrachNhiem || 0);
                        tenChucVu = chucVuTrongThang[0].tenChucVu;
                    } else {
                        // Check 3: Fallback cuối cùng - Lấy đại chức vụ hiện tại ở bảng nhanvien
                        // (Trường hợp Admin quên cập nhật bảng thaydoichucvu hoàn toàn)
                        const [cvHienTai] = await connection.query(`
                            SELECT cv.luongTheoGio, cv.phuCapTrachNhiem, cv.tenChucVu 
                            FROM nhanvien nv JOIN chucvu cv ON nv.maChucVu = cv.maChucVu WHERE nv.maNhanVien = ?
                        `, [nv.maNhanVien]);
                        if (cvHienTai.length > 0) {
                            luongTheoGio = parseFloat(cvHienTai[0].luongTheoGio || 0);
                            pcChucVu = parseFloat(cvHienTai[0].phuCapTrachNhiem || 0);
                            tenChucVu = cvHienTai[0].tenChucVu;
                        }
                    }
                }

                // TÍNH TOÁN GIỜ LÀM & SỐ PHÚT TRỄ
                const ccCaNhan = dsChamCong.filter(c => c.maNhanVien === nv.maNhanVien);
                let soGioHanhChinh = 0;
                let soGioTangCa = 0;
                let soPhutDiTre = 0;

                ccCaNhan.forEach(ngay => {
                    const soGio = parseFloat(ngay.soGioLam || 0);
                    let gioVao = ngay.gioVao;

                    if (soGio <= 8) {
                        soGioHanhChinh += soGio;
                    } else {
                        soGioHanhChinh += 8;
                        soGioTangCa += (soGio - 8);
                    }

                    // BỌC THÉP 3: Xử lý định dạng giờ bị thiếu giây (08:00 thay vì 08:00:00)
                    if (gioVao && typeof gioVao === 'string') {
                        if (gioVao.length === 5) gioVao += ':00'; // Sửa 08:05 thành 08:05:00

                        if (gioVao > GIO_VAO_CHUAN) {
                            const timeVao = new Date(`1970-01-01T${gioVao}Z`);
                            const timeChuan = new Date(`1970-01-01T${GIO_VAO_CHUAN}Z`);
                            if (!isNaN(timeVao.getTime())) { // Đảm bảo Date hợp lệ
                                const phutTre = Math.floor((timeVao - timeChuan) / 60000);
                                if (phutTre > 0) soPhutDiTre += phutTre;
                            }
                        }
                    }
                });

                // FIX LỖI FLOATING POINT (Làm tròn 2 chữ số thập phân)
                soGioHanhChinh = Math.round(soGioHanhChinh * 100) / 100;
                soGioTangCa = Math.round(soGioTangCa * 100) / 100;

                // TÍNH TIỀN (Chặn toàn bộ số âm hoặc NaN)
                const luongCoBan = Math.round(soGioHanhChinh * luongTheoGio) || 0;
                const tongTienTangCa = Math.round(soGioTangCa * luongTheoGio * HE_SO_TANG_CA) || 0;
                const tongTienPhat = Math.round(soPhutDiTre * TIEN_PHAT_MOI_PHUT) || 0;

                const backup = oldSalary.find(o => o.maNhanVien === nv.maNhanVien) || { thuong: 0 };
                const thuongThem = parseFloat(backup.thuong || 0);

                const phuCapKhac = PHU_CAP_CO_DINH + thuongThem;
                const tongKhauTru = tongTienPhat + MUC_TRU_BAO_HIEM;

                let thucLanh = (luongCoBan + tongTienTangCa + pcChucVu + phuCapKhac) - tongKhauTru;
                if (thucLanh < 0) thucLanh = 0; // Không để âm lương

                // LƯU DB
                const sqlInsert = `
                    INSERT INTO bangluong (
                        maNhanVien, thang, nam, luongTheoGio, soGioLamBinhThuong, 
                        luongCoBan, soGioTangCa, heSoTangCa, tongTienTangCa, 
                        soPhutDiTre, tienPhatDiTre, tongTienPhat, 
                        phuCapChucVu, phuCapKhac, thuong, truBaoHiem, thucLanh, ngayTao, trangThai
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)
                `;

                await connection.query(sqlInsert, [
                    nv.maNhanVien, thang, nam, luongTheoGio, soGioHanhChinh,
                    luongCoBan, soGioTangCa, HE_SO_TANG_CA, tongTienTangCa,
                    soPhutDiTre, TIEN_PHAT_MOI_PHUT, tongTienPhat,
                    pcChucVu, phuCapKhac, thuongThem, MUC_TRU_BAO_HIEM, thucLanh
                ]);
            }

            await connection.commit();
            return dsNhanVien.length;

        } catch (error) {
            await connection.rollback();
            console.error("LỖI SQL KHI TÍNH LƯƠNG: ", error); // Sẽ in thẳng lỗi ra terminal để bạn đọc
            throw error;
        } finally {
            connection.release();
        }
    },

    // Update trạng thái chốt lương
    updateTrangThaiBangLuong: async (thang, nam, trangThai) => {
        const sql = `UPDATE bangluong SET trangThai = ? WHERE thang = ? AND nam = ?`;
        const [result] = await db.query(sql, [trangThai, thang, nam]);
        return result.affectedRows;
    },

    // Xem phiếu lương cá nhân (Dành cho trang Profile)
    xemLuong: async (thang, nam, maNhanVien) => {
        let sql = `
            SELECT 
                bl.*, 
                nv.hoTen, 
                COALESCE(
                    (
                        SELECT cv_hist.tenChucVu 
                        FROM thaydoichucvu td 
                        JOIN chucvu cv_hist ON td.maChucVu = cv_hist.maChucVu 
                        WHERE td.maNhanVien = bl.maNhanVien 
                          AND td.ngayBatDau <= LAST_DAY(STR_TO_DATE(CONCAT(bl.nam, '-', bl.thang, '-01'), '%Y-%m-%d'))
                        ORDER BY td.ngayBatDau DESC 
                        LIMIT 1
                    ),
                    cv_curr.tenChucVu
                ) as tenChucVu
            FROM bangluong bl
            JOIN nhanvien nv ON bl.maNhanVien = nv.maNhanVien
            LEFT JOIN chucvu cv_curr ON nv.maChucVu = cv_curr.maChucVu
            WHERE bl.maNhanVien = ? and bl.trangThai = 1
        `;
        let values = [maNhanVien];

        if (thang && nam) {
            sql += ` AND bl.thang = ? AND bl.nam = ?`;
            values.push(thang, nam);
        }
        sql += ` ORDER BY bl.nam DESC, bl.thang DESC`; // Sắp xếp lương mới nhất lên đầu

        const [rows] = await db.query(sql, values);
        return rows;
    },

    // Lấy bảng lương
    getBangLuong: async (filters) => {
        const { thang, nam, maNhanVien } = filters;

        let sql = `
            SELECT 
                bl.*, 
                nv.hoTen, 
                COALESCE(
                    (
                        SELECT cv_hist.tenChucVu 
                        FROM thaydoichucvu td 
                        JOIN chucvu cv_hist ON td.maChucVu = cv_hist.maChucVu 
                        WHERE td.maNhanVien = bl.maNhanVien 
                          AND td.ngayBatDau <= LAST_DAY(STR_TO_DATE(CONCAT(bl.nam, '-', bl.thang, '-01'), '%Y-%m-%d'))
                        ORDER BY td.ngayBatDau DESC 
                        LIMIT 1
                    ),
                    cv_curr.tenChucVu
                ) as tenChucVu
            FROM bangluong bl
            JOIN nhanvien nv ON bl.maNhanVien = nv.maNhanVien
            LEFT JOIN chucvu cv_curr ON nv.maChucVu = cv_curr.maChucVu
            WHERE 1=1
        `;
        let values = [];

        if (thang) { sql += ` AND bl.thang = ?`; values.push(thang); }
        if (nam) { sql += ` AND bl.nam = ?`; values.push(nam); }
        if (maNhanVien) { sql += ` AND bl.maNhanVien = ?`; values.push(maNhanVien); }

        const [rows] = await db.query(sql, values);
        return rows;
    },

    // Update bảng Lương (Chỉ còn Thưởng thêm)
    updateBangLuong: async (thang, nam, maNhanVien, thuongThem) => {
        const [old] = await db.query(`SELECT thucLanh, thuong FROM bangluong WHERE thang = ? AND nam = ? AND maNhanVien = ?`, [thang, nam, maNhanVien]);
        if (old.length === 0) return 0;

        const oldThucLanh = parseFloat(old[0].thucLanh);
        const oldThuong = parseFloat(old[0].thuong) || 0;

        // Hoàn tác tiền thưởng cũ, cộng tiền thưởng mới
        const newThucLanh = (oldThucLanh - oldThuong) + parseFloat(thuongThem);

        const sql = `
            UPDATE bangluong
            SET thuong = ?, thucLanh = ?
            WHERE nam = ? AND thang = ? AND maNhanVien = ? 
        `;
        const [result] = await db.query(sql, [thuongThem, newThucLanh, nam, thang, maNhanVien]);
        return result.affectedRows;
    },

    // BÁO CÁO QUỸ LƯƠNG THỐNG KÊ
    getSalaryReport: async (filters) => {
        const { thang, nam, keyword } = filters;

        let sql = `
            SELECT 
                bl.*, 
                nv.hoTen, 
                COALESCE(
                    (
                        SELECT cv_hist.tenChucVu 
                        FROM thaydoichucvu td 
                        JOIN chucvu cv_hist ON td.maChucVu = cv_hist.maChucVu 
                        WHERE td.maNhanVien = bl.maNhanVien 
                          AND td.ngayBatDau <= LAST_DAY(STR_TO_DATE(CONCAT(bl.nam, '-', bl.thang, '-01'), '%Y-%m-%d'))
                        ORDER BY td.ngayBatDau DESC 
                        LIMIT 1
                    ),
                    cv_curr.tenChucVu
                ) as tenChucVu
            FROM bangluong bl
            JOIN nhanvien nv ON bl.maNhanVien = nv.maNhanVien
            LEFT JOIN chucvu cv_curr ON nv.maChucVu = cv_curr.maChucVu
            WHERE 1=1
        `;
        let values = [];

        if (thang) {
            sql += ` AND bl.thang = ?`;
            values.push(thang);
        }
        if (nam) {
            sql += ` AND bl.nam = ?`;
            values.push(nam);
        }
        if (keyword) {
            sql += ` AND (nv.hoTen LIKE ? OR nv.maNhanVien LIKE ?)`;
            values.push(`%${keyword}%`, `%${keyword}%`);
        }

        sql += ` ORDER BY bl.thang ASC`; // Xếp người lương cao nhất lên đầu
        const [rows] = await db.query(sql, values);
        return rows;
    },

    // ==============================================
    // PHẦN 5: QUẢN LÝ ĐƠN NGHỈ PHÉP
    // ==============================================

    // 0. Lấy số ngày phép năm đã sử dụng (hoặc đang chờ duyệt)
    getPhepNamDaDung: async (maNhanVien, namHienTai) => {
        const sql = `
            SELECT SUM(DATEDIFF(ngayKetThuc, ngayBatDau) + 1) AS soNgayDaDung
            FROM dontu
            WHERE maNhanVien = ? 
              AND loaiDon = 'Nghỉ phép năm' 
              AND trangThai IN ('Đã duyệt', 'Chờ duyệt')
              AND YEAR(ngayBatDau) = ?
        `;
        const [rows] = await db.query(sql, [maNhanVien, namHienTai]);
        return parseInt(rows[0].soNgayDaDung) || 0;
    },

    // BỔ SUNG: Kiểm tra xem những ngày xin nghỉ có bị trùng với lịch cũ không
    checkTrungThoiGian: async (maNhanVien, ngayBatDau, ngayKetThuc) => {

        // 1. Quét bảng Đơn Từ (Xem có trùng với đơn nào Đã duyệt/Chờ duyệt không)
        const sqlDonTu = `
            SELECT maDon, loaiDon FROM dontu 
            WHERE maNhanVien = ? 
              AND trangThai IN ('Chờ duyệt', 'Đã duyệt')
              AND ngayBatDau <= ? AND ngayKetThuc >= ?
            LIMIT 1
        `;
        const [donTuTrung] = await db.query(sqlDonTu, [maNhanVien, ngayKetThuc, ngayBatDau]);
        if (donTuTrung.length > 0) {
            return { isTrung: true, type: `đơn xin "${donTuTrung[0].loaiDon}" khác đang tồn tại` };
        }


        // 2. Quét bảng Chấm Công (Xem những ngày đó đã đi làm chưa)
        const sqlChamCong = `
            SELECT ngayLamViec FROM chamcong 
            WHERE maNhanVien = ? 
              AND ngayLamViec >= ? AND ngayLamViec <= ?
              AND gioVao IS NOT NULL
            LIMIT 1
        `;
        const [chamCongTrung] = await db.query(sqlChamCong, [maNhanVien, ngayBatDau, ngayKetThuc]);
        if (chamCongTrung.length > 0) {
            return { isTrung: true, type: 'ngày bạn đã đi làm (đã có dữ liệu chấm công)' };
        }

        // Vượt qua 2 chốt an toàn
        return { isTrung: false };
    },

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

        // ĐÃ SỬA: Chuyển toàn bộ thành LEFT JOIN để chống thất thoát dữ liệu
        let sql = `
            SELECT dt.*, nv.hoTen, cv.tenChucVu, nd.hoTen as tenNguoiDuyet
            FROM dontu dt
            LEFT JOIN nhanvien nv ON dt.maNhanVien = nv.maNhanVien
            LEFT JOIN chucvu cv ON nv.maChucVu = cv.maChucVu
            LEFT JOIN nhanvien nd ON dt.maNguoiDuyet = nd.maNhanVien
            WHERE 1=1
        `;
        let values = [];

        if (trangThai) { sql += ` AND dt.trangThai = ?`; values.push(trangThai); }
        if (thang && nam) { sql += ` AND MONTH(dt.ngayBatDau) = ? AND YEAR(dt.ngayBatDau) = ?`; values.push(thang, nam); }

        sql += ` ORDER BY dt.ngayTao DESC`;
        const [rows] = await db.query(sql, values);
        return rows;
    },

    // 4. Quản lý/HR: Duyệt hoặc Từ chối đơn (TÍCH HỢP TỰ ĐỘNG CHẤM CÔNG)
    handleLeaveRequest: async (maDon, trangThaiMoi, nguoiDuyet) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const sqlUpdateDon = `UPDATE dontu SET trangThai = ?, maNguoiDuyet = ? WHERE maDon = ?`;
            const [result] = await connection.query(sqlUpdateDon, [trangThaiMoi, nguoiDuyet, maDon]);

            if (trangThaiMoi === 'Đã duyệt') {
                const sqlGetDon = `SELECT maNhanVien, ngayBatDau, ngayKetThuc, loaiDon FROM dontu WHERE maDon = ?`;
                const [donInfo] = await connection.query(sqlGetDon, [maDon]);

                if (donInfo.length > 0) {
                    const { maNhanVien, ngayBatDau, ngayKetThuc, loaiDon } = donInfo[0];

                    let currentDate = new Date(ngayBatDau);
                    const endDate = new Date(ngayKetThuc);

                    // Bất chấp Node.js hay MySQL bị lệch múi giờ, +- 7 tiếng vẫn nằm gọn trong cùng 1 ngày!
                    currentDate.setHours(12, 0, 0, 0);
                    endDate.setHours(12, 0, 0, 0);

                    while (currentDate <= endDate) {
                        // Tự build chuỗi YYYY-MM-DD an toàn tuyệt đối
                        const y = currentDate.getFullYear();
                        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                        const d = String(currentDate.getDate()).padStart(2, '0');
                        const dateString = `${y}-${m}-${d}`;

                        // Lấy trạng thái là tên loại đơn (Nghỉ phép năm, Nghỉ ốm...)
                        const trangThaiNghi = loaiDon;

                        // Tính lương: Phép năm & Việc riêng được tính 8h, còn lại 0h
                        let gioTinhLuong = 0;
                        if (loaiDon === 'Nghỉ phép năm' || loaiDon === 'Nghỉ việc riêng') {
                            gioTinhLuong = 8;
                        }

                        // Đẩy vào bảng chấm công
                        const sqlChamCong = `
                            INSERT INTO chamcong (maNhanVien, ngayLamViec, trangThai, soGioLam) 
                            VALUES (?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE trangThai = ?, soGioLam = ?
                        `;
                        await connection.query(sqlChamCong, [
                            maNhanVien, dateString, trangThaiNghi, gioTinhLuong,
                            trangThaiNghi, gioTinhLuong
                        ]);

                        // LƯU Ý TỐI QUAN TRỌNG: Lệnh cộng thêm 1 ngày PHẢI NẰM Ở CUỐI CÙNG
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            }
            await connection.commit();
            return result.affectedRows;
        } catch (error) {
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
    },

    // Cập nhật thông tin cá nhân (Cho trang Profile)
    updateProfileInfo: async (maNhanVien, data) => {
        const sql = `UPDATE nhanvien SET sdt = ?, email = ?, diaChi = ? WHERE maNhanVien = ?`;
        const [result] = await db.query(sql, [data.sdt, data.email, data.diaChi, maNhanVien]);
        return result.affectedRows;
    },

};

module.exports = HrModel;