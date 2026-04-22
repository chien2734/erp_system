const SalesModel = require('./sales.model');
const { recordLog } = require('../../../utils/helpers');
const crypto = require('crypto');
const moment = require('moment');
const qs = require('qs');

const SalesController = {
    // --- KHÁCH HÀNG ---
    getAllKhachHang: async (req, res) => {
        try {
            const { keyword, page, limit } = req.query;
            const result = await SalesModel.getAllKhachHang({ keyword, page, limit });
            res.status(200).json({ 
                success: true, 
                ...result 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi lấy danh sách khách hàng' 
            });
        }
    },



    create: async (req, res) => {
        try {
            const { tenKH, sdt, diaChi } = req.body;
            if (!tenKH || !sdt) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng nhập tên và số điện thoại khách hàng' 
                });
            }
            const newId = await SalesModel.themKhachHang({ tenKH, sdt, diaChi });
            
            await recordLog(req.user.maNhanVien, 'Thêm khách hàng', { maKH: newId, tenKH, sdt });

            res.status(201).json({ 
                success: true, 
                message: 'Thêm khách hàng thành công', maKH: newId 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi khi thêm khách hàng' 
            });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params; // Lấy maKH từ đường dẫn URL
            const { tenKH, sdt, diaChi } = req.body;

            if (!tenKH || !sdt) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng nhập tên và số điện thoại khách hàng' 
                });
            }

            const affectedRows = await SalesModel.capNhatKhachHang(id, { tenKH, sdt, diaChi });

            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng này!' });
            }

            res.status(200).json({ 
                success: true, 
                message: 'Cập nhật thông tin khách hàng thành công!' 
            });

            await recordLog(req.user.maNhanVien, 'Cập nhật khách hàng', { maKH: id, tenKH, sdt });
        } catch (error) {
            console.error("Lỗi API Cập nhật KH:", error);
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi máy chủ khi cập nhật khách hàng' 
            });
        }
    },

    // --- BÁN HÀNG ---
    banHangPOS: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien; // Lấy từ Token thu ngân
            
            const { maKH, giamGia, mangSerial, tienKhachDua, phuongThucThanhToan } = req.body;
            
            if (!maKH || !mangSerial || mangSerial.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Vui lòng chọn khách hàng và quét ít nhất 1 mã máy!' 
                });
            }

            const ketQua = await SalesModel.taoHoaDonBanHang(maKH, maNhanVien, giamGia, mangSerial, tienKhachDua, phuongThucThanhToan);

            res.status(201).json({ 
                success: true, 
                message: 'Tạo hóa đơn thành công!', 
                data: ketQua
            });

            await recordLog(maNhanVien, 'Bán hàng (POS)', { 
                maHoaDon: ketQua.maHoaDon, 
                maKH, 
                tongTien: ketQua.tongTien,
                mangSerial 
            });

        } catch (error) {
            console.error("Lỗi API Bán Hàng:", error.message);
            if (error.message.includes('không tồn tại')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tạo hóa đơn' });
        }
    },

    // --- TRA CỨU HÓA ĐƠN ---
    getAllHoaDon: async (req, res) => {
        try {
            const data = await SalesModel.getAllHoaDon(req.query);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách hóa đơn' });
        }
    },

    getChiTietHoaDon: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await SalesModel.getChiTietHoaDonById(id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy chi tiết hóa đơn' });
        }
    },

    getThongKeSanPham: async (req, res) => {
        try {
            const { type = 'month', thang, nam, quy } = req.query;
            if (!nam) {
                return res.status(400).json({ success: false, message: 'Thiếu năm thống kê' });
            }

            const getDateRange = () => {
                const year = Number(nam);
                if (type === 'month') {
                    if (!thang) throw new Error('Thiếu tháng thống kê');
                    const month = Number(thang);
                    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                    const lastDay = new Date(year, month, 0).getDate();
                    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
                    return { startDate, endDate };
                }
                if (type === 'quarter') {
                    if (!quy) throw new Error('Thiếu quý thống kê');
                    const quarter = Number(quy);
                    const startMonth = (quarter - 1) * 3 + 1;
                    const endMonth = startMonth + 2;
                    const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
                    const lastDay = new Date(year, endMonth, 0).getDate();
                    const endDate = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
                    return { startDate, endDate };
                }
                const startDate = `${year}-01-01`;
                const endDate = `${year}-12-31`;
                return { startDate, endDate };
            };

            const { startDate, endDate } = getDateRange();
            const rows = await SalesModel.getProductSalesReport({ startDate, endDate });
            const summary = rows.reduce(
                (acc, item) => {
                    acc.tongSoLuong += Number(item.soLuongDaXuat || 0);
                    acc.tongDoanhThu += Number(item.doanhThu || 0);
                    acc.tongGiaVon += Number(item.tongGiaVon || 0);
                    acc.tongLoiNhuan += Number(item.loiNhuan || 0);
                    return acc;
                },
                { tongSoLuong: 0, tongDoanhThu: 0, tongGiaVon: 0, tongLoiNhuan: 0 }
            );

            res.status(200).json({ success: true, data: rows, summary });
        } catch (error) {
            console.error('Lỗi API thống kê sản phẩm:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi thống kê sản phẩm' });
        }
    },

    getThongKeLoiNhuan: async (req, res) => {
        try {
            const { type = 'month', thang, nam, quy } = req.query;
            if (!nam) {
                return res.status(400).json({ success: false, message: 'Thiếu năm thống kê' });
            }

            const getDateRange = () => {
                const year = Number(nam);
                if (type === 'month') {
                    if (!thang) throw new Error('Thiếu tháng thống kê');
                    const month = Number(thang);
                    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                    const lastDay = new Date(year, month, 0).getDate();
                    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
                    return { startDate, endDate };
                }
                if (type === 'quarter') {
                    if (!quy) throw new Error('Thiếu quý thống kê');
                    const quarter = Number(quy);
                    const startMonth = (quarter - 1) * 3 + 1;
                    const endMonth = startMonth + 2;
                    const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
                    const lastDay = new Date(year, endMonth, 0).getDate();
                    const endDate = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
                    return { startDate, endDate };
                }
                const startDate = `${year}-01-01`;
                const endDate = `${year}-12-31`;
                return { startDate, endDate };
            };

            const { startDate, endDate } = getDateRange();
            const groupBy = type === 'year' ? 'quarter' : undefined;
            const rows = await SalesModel.getProfitReport({ startDate, endDate, groupBy });

            if (type === 'year') {
                const summary = rows.reduce(
                    (acc, item) => {
                        acc.tongDoanhThu += Number(item.doanhThu || 0);
                        acc.tongGiaVon += Number(item.tongGiaVon || 0);
                        acc.tongLoiNhuan += Number(item.loiNhuan || 0);
                        return acc;
                    },
                    { tongDoanhThu: 0, tongGiaVon: 0, tongLoiNhuan: 0 }
                );
                return res.status(200).json({ success: true, period: type, data: rows, summary });
            }

            const result = rows[0] || { doanhThu: 0, tongGiaVon: 0, loiNhuan: 0 };
            res.status(200).json({ success: true, period: type, data: result });
        } catch (error) {
            console.error('Lỗi API thống kê lợi nhuận:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi thống kê lợi nhuận' });
        }
    },

    createVnpayUrl: async (req, res) => {
        try {
            const { amount, bankCode, orderDescription, orderType, language } = req.body;
            
            process.env.TZ = 'Asia/Ho_Chi_Minh';
            let date = new Date();
            let createDate = moment(date).format('YYYYMMDDHHmmss');
            
            let ipAddr = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.connection.socket.remoteAddress || '127.0.0.1';

            let tmnCode = process.env.VNP_TMN_CODE;
            let secretKey = process.env.VNP_HASH_SECRET;
            let vnpUrl = process.env.VNP_URL;
            let returnUrl = process.env.VNP_RETURN_URL;

            let orderId = moment(date).format('DDHHmmss');
            let locale = language || 'vn';
            let currCode = 'VND';
            
            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = tmnCode;
            vnp_Params['vnp_Locale'] = locale;
            vnp_Params['vnp_CurrCode'] = currCode;
            vnp_Params['vnp_TxnRef'] = orderId;
            vnp_Params['vnp_OrderInfo'] = orderDescription || 'Thanh toan don hang POS';
            vnp_Params['vnp_OrderType'] = orderType || 'other';
            vnp_Params['vnp_Amount'] = Math.floor(amount * 100);
            vnp_Params['vnp_ReturnUrl'] = returnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = createDate;

            if (bankCode !== undefined && bankCode !== null && bankCode !== "") {
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            vnp_Params = sortObject(vnp_Params);

            let signData = qs.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

            console.log('--- VNPAY DEBUG ---');
            console.log('TMN CODE:', tmnCode);
            console.log('URL GỐC:', vnpUrl);
            
            res.status(200).json({ success: true, redirectUrl: vnpUrl });
        } catch (error) {
            console.error('LỖI TẠO URL VNPAY CHI TIẾT:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi tạo liên kết VNPay' });
        }
    }
};

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = SalesController;