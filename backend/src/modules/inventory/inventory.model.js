const db = require('../../config/db');

const InventoryModel = {
    //===============================
    // HANG SAN PHAM VA NCC
    //===============================

    // Lấy danh sách hãng sản phẩm
    getAllHangSP: async (filters) => {
        const { id, tenHang } = filters;
        let sql = `SELECT * FROM hangsp WHERE 1 = 1`;
        let values = [];
        if (id) {
            sql += ` AND maHang = ?`;
            values.push(id);
        }
        if (tenHang) {
            sql += ` AND tenHang like ?`;
            values.push(`%${tenHang}%`);
        }
        const [rows] = await db.query(sql, values);
        return rows;
    },
    // NCC
    // NCC
    getAllNCC: async (filters) => {
        const { id, tenNCC, trangThai } = filters; 
        
        let sql = `SELECT * FROM nhacungcap WHERE 1=1`;
        let values = [];
        
        if (id) {
            sql += ` AND maNCC = ?`;
            values.push(id);
        }
        if (tenNCC) {
            sql += ` AND tenNCC like ?`;
            values.push(`%${tenNCC}%`);
        }
        
        // Lưu ý: So sánh với undefined để vẫn cho phép truyền trangThai = 0
        if (trangThai !== undefined) { 
            sql += ` AND trangThai = ?`;
            values.push(trangThai);
        }
        
        const [rows] = await db.query(sql, values);
        return rows;
    },

    createNCC: async (data) => {
        const sql = `
            INSERT INTO nhacungcap (tenNCC, sdt, diaChi, email) VALUES (?, ?, ?, ?)
        `;
        const values = [data.tenNCC, data.sdt, data.diaChi, data.email];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },

    updateNCC: async (maNCC, data) => {
        const sql = `
            UPDATE nhacungcap 
            SET tenNCC = ?, sdt = ?, diaChi = ?, email = ?, trangThai = ?
            WHERE maNCC = ?`; 
            
        const values = [data.tenNCC, data.sdt, data.diaChi, data.email, data.trangThai, maNCC];
        
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },

    deleteNCC: async (maNCC) => {
        const sql = `
            UPDATE nhacungcap
            SET trangThai = 0
            WHERE maNCC = ?
        `;
        const [result] = await db.query(sql, maNCC);
        return result.affectedRows;
    },
    //================================
    // SAN PHAM
    //================================

    // Lấy danh sách sản phẩm (Kèm bo loc)
    getAllProducts: async (filters) => {
        const { keyword, maHang, page = 1, limit = 10 } = filters;

        // 1. Khởi tạo câu query gốc
        let sql = `
            SELECT sp.*, h.tenHang 
            FROM sanpham sp
            JOIN hangsp h ON sp.maHang = h.maHang
            WHERE 1=1
        `;
        let values = [];
        // 2. Thêm điều kiện Tìm kiếm
        if (keyword) {
            sql += ` AND sp.tenSP LIKE ?`;
            values.push(`%${keyword}%`);
        }
        // 3. Thêm điều kiện Lọc
        if (maHang) {
            sql += ` AND sp.maHang = ?`;
            values.push(maHang);
        }
        // 4. Đếm tổng số lượng bản ghi (để Frontend làm nút phân trang 1, 2, 3...)
        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
        const [countResult] = await db.query(countSql, values);
        const totalRecords = countResult[0].total;
        // 5. Thêm Phân trang (LIMIT và OFFSET)
        const offset = (page - 1) * limit;
        sql += ` ORDER BY sp.maSP DESC LIMIT ? OFFSET ?`;
        // LIMIT và OFFSET bắt buộc phải ép kiểu số nguyên (Number)
        values.push(Number(limit), Number(offset));
        // 6. Thực thi câu query cuối cùng
        const [rows] = await db.query(sql, values);
        return {
            data: rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit)
            }
        };
    },

    // Lấy chi tiết 1 sản phẩm theo ID
    getProductById: async (id) => {
        const sql = `SELECT * FROM sanpham WHERE maSP = ? AND trangThai = 1`;
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    },

    // Thêm mới sản phẩm (Bỏ giaNhap, giữ giaBan)
    createProduct: async (data) => {
        const cauHinh = data.cauHinhSP || data.cauHinh || ''; 
        
        const sql = `
            INSERT INTO sanpham (maHang, tenSP, moTa, cauHinh, hinhAnh, soLuongTon, giaBan, trangThai) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `;
        const values = [
            data.maHang, 
            data.tenSP, 
            data.moTa, 
            cauHinh, 
            data.hinhAnh, 
            data.soLuongTon || 0,
            data.giaBan || 0   // Chỉ lưu giá bán
        ];
        const [result] = await db.query(sql, values);
        return result.insertId;
    },

    // Cập nhật thông tin sản phẩm (Bỏ giaNhap, giữ giaBan và trangThai)
    updateProduct: async (id, data) => {
        const cauHinh = data.cauHinhSP || data.cauHinh || '';
        const sql = `
            UPDATE sanpham 
            SET maHang = ?, tenSP = ?, moTa = ?, cauHinh = ?, hinhAnh = ?, giaBan = ?, trangThai = ? 
            WHERE maSP = ?
        `;
        // BẮT BUỘC MẢNG VALUES PHẢI CÓ data.trangThai
        const values = [data.maHang, data.tenSP, data.moTa, cauHinh, data.hinhAnh, data.giaBan || 0, data.trangThai, id];
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    },

    // Xóa sản phẩm (chuyển trangThai = 0)
    deleteProduct: async (id) => {
        const sql = `UPDATE sanpham SET trangThai = 0 WHERE maSP = ?`;
        const [result] = await db.query(sql, id);
        return result.affectedRows;
    },

    //================================
    // NHAP KHO
    //================================

    // Tạo phiếu nhập kho 
    createNhapKho: async (maNCC, maNhanVien, tongTien, danhSachSanPham) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            // 0. KIỂM TRA TRÙNG LẶP SERIAL (THÊM MỚI)
            let allIncomingSerials = [];
            for (let item of danhSachSanPham) {
                if (item.serials) {
                    allIncomingSerials.push(...item.serials);
                }
            }

            if (allIncomingSerials.length > 0) {
                // Quét Database xem có thằng nào trùng với đám serial sắp nhập không
                const sqlCheckDup = `SELECT maMay FROM maytinh WHERE maMay IN (?)`;
                const [dupRows] = await connection.query(sqlCheckDup, [allIncomingSerials]);

                if (dupRows.length > 0) {
                    // Lấy ra danh sách các mã bị trùng
                    const dupMACS = dupRows.map(r => r.maMay).join(', ');
                    // Quăng lỗi có đánh dấu riêng để Controller bắt
                    throw new Error(`DUP_SERIAL:${dupMACS}`); 
                }
            }
            
            // 1. Tạo phiếu nhập
            const sqlPhieuNhap = `INSERT INTO phieunhap (maNCC, maNhanVien, ngayNhap, tongTien) VALUES (?, ?, NOW(), ?)`;
            const [resultPhieuNhap] = await connection.query(sqlPhieuNhap, [maNCC, maNhanVien, tongTien]);
            const maPhieuNhap = resultPhieuNhap.insertId;

            // 2. Duyệt qua danh sách sản phẩm 
            for (let item of danhSachSanPham) {
                // Thêm chi tiết phiếu nhập
                const sqlChiTiet = `INSERT INTO chitietphieunhap (maPhieuNhap, maSP, soLuong, donGiaNhap) VALUES (?, ?, ?, ?)`;
                await connection.query(sqlChiTiet, [maPhieuNhap, item.maSP, item.soLuong, item.donGiaNhap]);

                const sqlUpdateTonKho = `
                    UPDATE sanpham 
                    SET soLuongTon = soLuongTon + ?
                    WHERE maSP = ?
                `;
                await connection.query(sqlUpdateTonKho, [item.soLuong, item.maSP]);
                
                // 3. LƯU SERIAL THỰC TẾ (Do Frontend gửi lên)
                if (item.serials && item.serials.length > 0) {
                    for (let serial of item.serials) {
                        const sqlMayTinh = `
                            INSERT INTO maytinh (maMay, maSP, maPhieuNhap, trangThai)
                            VALUES (?, ?, ?, 'Trong kho')
                        `;
                        // Lưu đúng chữ 'Trong kho' để khớp với POS và màn hình Serial
                        await connection.query(sqlMayTinh, [serial, item.maSP, maPhieuNhap]);
                    }
                }
            }
            await connection.commit();
            return maPhieuNhap;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Lấy danh sách phiếu nhập (Thêm JOIN Nhà cung cấp)
    getAllPhieuNhapKho: async (filters = {}) => {
        const { maPhieuNhap, tuNgay, denNgay, page = 1, limit = 10 } = filters;
        const offset = (page - 1) * limit;
        
        // Đã sửa thành pn.* và thêm ncc.tenNCC
        let sql = `
            SELECT pn.*, ncc.tenNCC, nv.hoTen AS tenNhanVien 
            FROM phieunhap pn
            LEFT JOIN nhacungcap ncc ON pn.maNCC = ncc.maNCC
            LEFT JOIN nhanvien nv ON pn.maNhanVien = nv.maNhanVien
            WHERE 1 = 1
        `;
        let values = [];

        if (maPhieuNhap) {
            sql += ` AND pn.maPhieuNhap = ?`;
            values.push(maPhieuNhap);
        }
        if (tuNgay) {
            sql += ` AND pn.ngayNhap >= ?`;
            values.push(tuNgay);
        }
        if (denNgay) {
            sql += ` AND pn.ngayNhap <= ?`;
            values.push(denNgay);
        }
        sql += ` ORDER BY pn.ngayNhap DESC`;

        // Thêm Phân trang (Pagination)
        sql += ` LIMIT ? OFFSET ?`;
        values.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(sql, values);
        return rows;
    },

    // Lấy chi tiết phiếu nhập (Gộp thêm Tên SP và Mảng Serial)
    getCTPhieuNhapById: async (maPN) => {
        // 1. Lấy chi tiết nhập kèm Tên sản phẩm
        const sqlChiTiet = `
            SELECT ct.*, sp.tenSP 
            FROM chitietphieunhap ct
            JOIN sanpham sp ON ct.maSP = sp.maSP
            WHERE ct.maPhieuNhap = ?
        `;
        const [chiTietRows] = await db.query(sqlChiTiet, [maPN]);

        // 2. Lấy toàn bộ Serial đã sinh ra của phiếu nhập này
        const sqlSerial = `SELECT maMay, maSP FROM maytinh WHERE maPhieuNhap = ?`;
        const [serialRows] = await db.query(sqlSerial, [maPN]);

        // 3. Gắn mảng Serial tương ứng vào từng dòng Chi tiết sản phẩm
        return chiTietRows.map(ct => {
            return {
                ...ct,
                serials: serialRows.filter(s => s.maSP === ct.maSP).map(s => s.maMay)
            };
        });
    },
    // Quan ly SERIAL
    // ==============================================
    // PHẦN 4: QUẢN LÝ MÃ MÁY (SERIAL/IMEI)
    // ==============================================

    getAllMayTinh: async (filters) => {
        const { keyword, maSP, trangThai, page = 1, limit = 10 } = filters;      
        let sql = `
            SELECT mt.maMay, mt.maSP, mt.maPhieuNhap, mt.maHoaDon, mt.trangThai, sp.tenSP, ctpn.donGiaNhap 
            FROM maytinh mt
            JOIN sanpham sp ON mt.maSP = sp.maSP
            LEFT JOIN chitietphieunhap ctpn ON mt.maPhieuNhap = ctpn.maPhieuNhap AND mt.maSP = ctpn.maSP
            WHERE 1=1
        `;
        let values = [];

        if (keyword) {
            sql += ` AND mt.maMay LIKE ?`;
            values.push(`%${keyword}%`);
        }
        if (maSP) {
            sql += ` AND mt.maSP = ?`;
            values.push(maSP);
        }
        if (trangThai) {
            sql += ` AND mt.trangThai = ?`;
            values.push(trangThai);
        }
        // Đếm tổng số lượng bản ghi để phân trang
        const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
        const [countResult] = await db.query(countSql, values);
        const totalRecords = countResult[0].total;

        // Phân trang
        const offset = (page - 1) * limit;
        sql += ` ORDER BY mt.maPhieuNhap DESC, mt.maMay ASC LIMIT ? OFFSET ?`;
        values.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, values);
      
        return {
            data: rows,
            pagination: { 
                page: Number(page), 
                limit: Number(limit), 
                totalRecords, 
                totalPages: Math.ceil(totalRecords / limit) 
            }
        };
    },

    // Cập nhật trạng thái của 1 máy tính cụ thể (Serial)
    updateMayTinh: async (maMay, trangThai) => {
        const sql = `
            UPDATE maytinh 
            SET trangThai = ? 
            WHERE maMay = ?
        `;
        const [result] = await db.query(sql, [trangThai, maMay]);
        return result.affectedRows;
    },

    //================================
    // BÁO CÁO THỐNG KÊ
    //================================

    // Lấy báo cáo hàng tồn (Tính giá trị dựa trên giá nhập gần nhất)
    getInventoryReport: async (filters) => {
        const { maHang } = filters;
        
        let sql = `
            SELECT 
                sp.maSP, 
                sp.tenSP, 
                h.tenHang, 
                sp.giaBan,
                -- 1. Đếm số lượng máy thực tế đang ở trạng thái 'Trong kho'
                COUNT(mt.maMay) AS soLuongTon,
                
                -- 2. Tính Tổng giá trị tồn = Tổng đơn giá nhập của chính những máy đó
                -- Dùng COALESCE để trả về 0 nếu không có máy nào
                COALESCE(SUM(ctpn.donGiaNhap), 0) AS tongGiaTriTon,

                -- 3. Tính giá vốn trung bình thực tế (Dùng cho báo cáo)
                -- = Tổng giá trị tồn / Số lượng tồn
                CASE 
                    WHEN COUNT(mt.maMay) > 0 THEN SUM(ctpn.donGiaNhap) / COUNT(mt.maMay)
                    ELSE 0 
                END AS giaVonTrungBinh
                
            FROM sanpham sp
            JOIN hangsp h ON sp.maHang = h.maHang
            -- Join sang bảng máy tính để lấy danh sách máy đang tồn
            LEFT JOIN maytinh mt ON sp.maSP = mt.maSP AND mt.trangThai = 'Trong kho'
            -- Join sang chi tiết phiếu nhập để lấy đúng giá nhập của từng máy dựa trên mã phiếu nhập
            LEFT JOIN chitietphieunhap ctpn ON mt.maPhieuNhap = ctpn.maPhieuNhap AND mt.maSP = ctpn.maSP
            
            WHERE sp.trangThai = 1
        `;
        
        let values = [];
        if (maHang) {
            sql += ` AND sp.maHang = ?`;
            values.push(maHang);
        }

        // Bắt buộc Group By theo mã sản phẩm
        sql += ` GROUP BY sp.maSP, sp.tenSP, h.tenHang, sp.giaBan`;
        sql += ` ORDER BY tongGiaTriTon DESC`;

        const [rows] = await db.query(sql, values);
        return rows;
    },
    
};

module.exports = InventoryModel;