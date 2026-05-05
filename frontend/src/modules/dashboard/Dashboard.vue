<template>
    <div class="space-y-8" v-loading="loading">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h2>
            </div>
            <el-button type="primary" :icon="Plus" @click="$router.push('/sales/pos')">Bán hàng (POS)</el-button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="(stat, index) in stats" :key="index" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div :class="`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.bgIcon}`">
                    <el-icon><component :is="stat.icon" /></el-icon>
                </div>
                <div>
                    <p class="text-sm font-medium text-slate-500">{{ stat.title }}</p>
                    <h3 class="text-xl font-bold text-slate-900">{{ stat.value }}</h3>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="font-bold text-slate-900">Doanh thu 7 ngày qua</h3>
                    <el-tag type="info" effect="plain" round class="font-bold">Đơn vị: Triệu VNĐ</el-tag>
                </div>
                
                <div ref="mainChartRef" class="w-full h-64 md:h-72"></div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="font-bold text-slate-900 mb-6">Việc cần xử lý & Cảnh báo</h3>
                <div class="space-y-4">
                    
                    <div class="flex gap-4 relative cursor-pointer hover:bg-slate-50 p-3 rounded-xl transition-colors border border-transparent hover:border-slate-200" @click="$router.push('/hr/leaves')">
                        <div class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg z-10 bg-blue-500">
                            <el-icon><Document /></el-icon>
                        </div>
                        <div>
                            <p class="text-sm text-slate-700 font-medium">
                                Có <span class="font-bold text-blue-600 text-base mx-1">{{ alerts.pendingLeaves }}</span> đơn xin nghỉ
                            </p>
                            <p class="text-xs text-slate-400 mt-1">Đang chờ quản lý duyệt</p>
                        </div>
                    </div>

                    <div class="flex gap-4 relative cursor-pointer hover:bg-slate-50 p-3 rounded-xl transition-colors border border-transparent hover:border-slate-200" @click="$router.push('/inventory/products')">
                        <div class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg z-10 bg-amber-500">
                            <el-icon><Warning /></el-icon>
                        </div>
                        <div>
                            <p class="text-sm text-slate-700 font-medium">
                                Có <span class="font-bold text-amber-600 text-base mx-1">{{ alerts.lowStockItems }}</span> sản phẩm
                            </p>
                            <p class="text-xs text-slate-400 mt-1">Sắp hết hàng (Tồn kho < 5)</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-slate-900">5 Hóa đơn bán hàng mới nhất</h3>
                <el-button link type="primary" @click="$router.push('/sales/orders')">Xem tất cả</el-button>
            </div>
            
            <el-table :data="recentSales" style="width: 100%" size="large">
                <el-table-column prop="id" label="Mã HĐ" width="120">
                    <template #default="scope">
                        <span class="font-bold text-blue-600">HD{{ scope.row.id }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column prop="customer" label="Khách hàng" min-width="180">
                    <template #default="scope">
                        <span class="font-semibold">{{ scope.row.customer || 'Khách vãng lai' }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column prop="product" label="Sản phẩm chính" min-width="250" show-overflow-tooltip />
                
                <el-table-column prop="ngayLap" label="Thời gian" min-width="160">
                    <template #default="scope">
                        {{ new Date(scope.row.ngayLap).toLocaleString('vi-VN') }}
                    </template>
                </el-table-column>

                <el-table-column prop="amount" label="Tổng tiền" width="180" align="right" fixed="right">
                    <template #default="scope">
                        <span class="font-black text-slate-900">{{ formatPrice(scope.row.amount) }}</span>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { Plus, Money, ShoppingBag, Box, UserFilled, Warning, Document } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import api from '../../services/api';

const loading = ref(true);

// Dữ liệu rỗng ban đầu để render UI
const stats = ref([
    { title: 'Doanh thu hôm nay', value: '0đ', icon: Money, bgIcon: 'bg-blue-50 text-blue-600' },
    { title: 'Đơn hàng hôm nay', value: '0', icon: ShoppingBag, bgIcon: 'bg-indigo-50 text-indigo-600' },
    { title: 'Tổng sản phẩm tồn', value: '0', icon: Box, bgIcon: 'bg-amber-50 text-amber-600' },
    { title: 'Nhân sự đi làm', value: '0', icon: UserFilled, bgIcon: 'bg-emerald-50 text-emerald-600' }
]);

const chartData = ref([0, 0, 0, 0, 0, 0, 0]);
const chartLabels = ref(['', '', '', '', '', '', '']);

const alerts = ref({
    pendingLeaves: 0,
    lowStockItems: 0
});

const recentSales = ref([]);
const mainChartRef = ref(null);
let chartInstance = null;

const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

// Gọi API lấy dữ liệu
// Gọi API lấy dữ liệu
const fetchDashboardData = async () => {
    loading.value = true;
    try {
        const res = await api.get('/dashboard/summary');
        
        // SỬA LỖI BÓC VỎ AXIOS
        // Vì api.js đã return response.data rồi, nên res ở đây chính là response.data
        const dbData = res.data; 

        // Console log để bạn nhìn tận mắt dữ liệu đổ về
        console.log("Dữ liệu Dashboard nhận được:", dbData);

        if (dbData && dbData.stats) {
            // 1. Cập nhật khối Thống kê
            stats.value[0].value = formatPrice(dbData.stats.doanhThuNgay);
            stats.value[1].value = dbData.stats.donHangMoi + ' đơn';
            stats.value[2].value = dbData.stats.sanPhamTon + ' máy';
            stats.value[3].value = dbData.stats.nhanVienDiLam + ' người';

            // 2. Cập nhật Biểu đồ
            chartData.value = dbData.chart.data;
            chartLabels.value = dbData.chart.labels;
            await nextTick();
            initChart();

            // 3. Cập nhật Việc cần làm
            alerts.value = dbData.alerts;

            // 4. Cập nhật Bảng
            recentSales.value = dbData.recentOrders;
        } else {
            console.warn("Không tìm thấy thuộc tính stats trong dữ liệu!", res);
        }
    } catch (error) {
        console.error("Lỗi Dashboard:", error);
        ElMessage.error('Không thể tải dữ liệu Tổng quan!');
    } finally {
        loading.value = false;
    }
};

const initChart = () => {
    if (!mainChartRef.value) return;
    if (chartInstance) chartInstance.dispose();
    chartInstance = echarts.init(mainChartRef.value);
    
    chartInstance.setOption({
        tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const item = params[0];
                return `${item.marker} ${item.name}<br/>
                        <span style="font-weight:bold; margin-left: 14px;">${item.value} triệu VNĐ</span>`;
            }
        },
        grid: { left: '0%', right: '0%', bottom: '0%', top: '10%', containLabel: true },
        xAxis: { 
            type: 'category', 
            data: chartLabels.value,
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisLabel: { color: '#64748b', fontSize: 11 }
        },
        yAxis: { 
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
            axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        series: [{
            name: 'Doanh thu',
            type: 'bar',
            data: chartData.value,
            barWidth: '40%',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#3b82f6' },
                    { offset: 1, color: '#60a5fa' }
                ]),
                borderRadius: [6, 6, 0, 0]
            }
        }]
    });
};

const handleResize = () => chartInstance && chartInstance.resize();

onMounted(() => {
    fetchDashboardData();
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (chartInstance) chartInstance.dispose();
});
</script>

<style scoped>
:deep(.el-table) {
    --el-table-header-bg-color: #f8fafc;
    --el-table-header-text-color: #64748b;
    border-radius: 12px;
    overflow: hidden;
}
:deep(.el-table__row) {
    transition: all 0.2s;
}
:deep(.el-table__row:hover) {
    background-color: #f1f5f9 !important;
}
</style>