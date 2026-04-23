const DashboardModel = require('./dashboard.model');
const moment = require('moment');

const DashboardController = {
    getSummary: async (req, res) => {
        try {
            const today = moment().format('YYYY-MM-DD');

            const [thongKeNgay, tongTonKho, doanhThu7Ngay, donHangMoi, canhBao] = await Promise.all([
                DashboardModel.getThongKeNgay(today),
                DashboardModel.getTongTonKho(),
                DashboardModel.getDoanhThu7Ngay(today),
                DashboardModel.getDonHangMoiNhat(),
                DashboardModel.getCanhBao()
            ]);

            const chartData = [];
            const labels = [];
            for (let i = 6; i >= 0; i--) {
                const d = moment().subtract(i, 'days');
                const dateStr = d.format('YYYY-MM-DD');
                
                const found = doanhThu7Ngay.find(item => {
                    return moment(item.ngay).format('YYYY-MM-DD') === dateStr;
                });

                const doanhThuTriệu = found ? (Number(found.doanhThu) / 1000000).toFixed(1) : 0;
                chartData.push(Number(doanhThuTriệu));
                labels.push(d.format('DD/MM'));
            }

            res.status(200).json({
                success: true,
                data: {
                    stats: {
                        doanhThuNgay: thongKeNgay.doanhThuNgay,
                        donHangMoi: thongKeNgay.soDonHangMoi,
                        sanPhamTon: tongTonKho,
                        nhanVienDiLam: thongKeNgay.soNhanVienDiLam // Đã thêm biến này
                    },
                    chart: {
                        data: chartData,     
                        labels: labels       
                    },
                    alerts: canhBao,
                    recentOrders: donHangMoi
                }
            });

        } catch (error) {
            console.error("Lỗi API Dashboard:", error);
            res.status(500).json({ success: false, message: 'Lỗi khi tải dữ liệu tổng quan' });
        }
    }
};

module.exports = DashboardController;