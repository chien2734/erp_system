const DashboardModel = require('./dashboard.model');

const DashboardController = {
    getSummary: async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];

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
                const d = new Date();
                d.setDate(d.getDate() - i);
                
                // 👉 ĐÃ SỬA: So sánh trực tiếp Ngày, Tháng, Năm để không bị lệch múi giờ UTC
                const found = doanhThu7Ngay.find(item => {
                    const itemDate = new Date(item.ngay);
                    return itemDate.getDate() === d.getDate() && 
                           itemDate.getMonth() === d.getMonth() && 
                           itemDate.getFullYear() === d.getFullYear();
                });

                const doanhThuTriệu = found ? (Number(found.doanhThu) / 1000000).toFixed(1) : 0;
                chartData.push(Number(doanhThuTriệu));
                labels.push(`${d.getDate()}/${d.getMonth()+1}`);
            }

            res.status(200).json({
                success: true,
                data: {
                    stats: {
                        doanhThuNgay: thongKeNgay.doanhThuNgay,
                        donHangMoi: thongKeNgay.soDonHangMoi,
                        sanPhamTon: tongTonKho,
                        nhanVienDiLam: thongKeNgay.soNhanVienDiLam // 👉 Đã thêm biến này
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