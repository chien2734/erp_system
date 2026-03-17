<template>
    <div class="space-y-8">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h2>
                <p class="text-slate-500 mt-1">Chào mừng bạn trở lại, đây là những gì đang diễn ra hôm nay.</p>
            </div>
            <el-button type="primary" :icon="Plus">Tạo đơn hàng mới</el-button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="stat in stats" :key="stat.title" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div :class="`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.bgIcon}`">
                <el-icon><component :is="stat.icon" /></el-icon>
                </div>
                <div>
                <p class="text-sm font-medium text-slate-500">{{ stat.title }}</p>
                <h3 class="text-xl font-bold text-slate-900">{{ stat.value }}</h3>
                <p :class="`text-xs mt-1 font-medium ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`">
                    {{ stat.trendUp ? '↑' : '↓' }} {{ stat.trendValue }}
                </p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="font-bold text-slate-900">Doanh thu 7 ngày qua</h3>
                    <el-radio-group v-model="chartPeriod" size="small">
                        <el-radio-button label="Tuần" />
                        <el-radio-button label="Tháng" />
                    </el-radio-group>
                </div>
                <div class="flex items-end justify-between h-64 px-4 border-b border-slate-100 pb-2">
                    <div v-for="(val, idx) in chartData" :key="idx" class="flex flex-col items-center gap-2 w-full group">
                        <div 
                        class="w-8 bg-blue-500 rounded-t-lg transition-all duration-500 group-hover:bg-blue-600 relative"
                        :style="{ height: val + '%' }"
                        >
                            <span class="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100">{{ val }}tr</span>
                        </div>
                        <span class="text-xs text-slate-400 font-medium">T{{ idx + 2 }}</span>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="font-bold text-slate-900 mb-6">Hoạt động gần nhất</h3>
                <div class="space-y-6">
                    <div v-for="(act, i) in activities" :key="i" class="flex gap-4 relative">
                        <div v-if="i !== activities.length - 1" class="absolute left-4 top-8 w-0.5 h-full bg-slate-100"></div>
                        <div :class="`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs z-10 ${act.color}`">
                            <el-icon><component :is="act.icon" /></el-icon>
                        </div>
                        <div>
                            <p class="text-sm text-slate-700 font-medium">{{ act.content }}</p>
                            <p class="text-xs text-slate-400 mt-1">{{ act.time }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-slate-900">Đơn hàng mới nhất</h3>
                <el-button link type="primary">Xem tất cả</el-button>
            </div>
            
            <el-table :data="recentSales" style="width: 100%" size="large">
                <el-table-column prop="id" label="Mã ĐH" width="100" />
                <el-table-column prop="customer" label="Khách hàng" />
                <el-table-column prop="product" label="Sản phẩm" width="250" />
                <el-table-column prop="amount" label="Tổng tiền">
                    <template #default="scope">
                        <span class="font-bold text-slate-900">{{ scope.row.amount }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="status" label="Trạng thái">
                    <template #default="scope">
                        <el-tag :type="scope.row.statusType" effect="light" round>{{ scope.row.status }}</el-tag>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  Plus, Money, ShoppingBag, Box, UserFilled, 
  Check, Message, Warning 
} from '@element-plus/icons-vue';

const chartPeriod = ref('Tuần');

// 1. Thống kê nhanh
const stats = [
  { title: 'Doanh thu ngày', value: '45.200.000đ', icon: Money, bgIcon: 'bg-blue-50 text-blue-600', trendUp: true, trendValue: '12.5%' },
  { title: 'Đơn hàng mới', value: '28', icon: ShoppingBag, bgIcon: 'bg-indigo-50 text-indigo-600', trendUp: true, trendValue: '8.2%' },
  { title: 'Sản phẩm tồn', value: '142', icon: Box, bgIcon: 'bg-amber-50 text-amber-600', trendUp: false, trendValue: '3.1%' },
  { title: 'Nhân viên online', value: '12/15', icon: UserFilled, bgIcon: 'bg-emerald-50 text-emerald-600', trendUp: true, trendValue: '2' },
];

// 2. Dữ liệu biểu đồ (giả lập % chiều cao)
const chartData = [40, 65, 50, 85, 70, 90, 75];

// 3. Hoạt động gần đây
const activities = [
  { content: 'Hồ Vĩnh Phúc vừa bán Laptop Dell XPS 13', time: '2 phút trước', icon: Check, color: 'bg-emerald-500' },
  { content: 'Yêu cầu nhập thêm kho MacBook M3', time: '45 phút trước', icon: Message, color: 'bg-blue-500' },
  { content: 'Cảnh báo tồn kho thấp: Asus ROG Strix', time: '2 giờ trước', icon: Warning, color: 'bg-amber-500' },
];

// 4. Bảng đơn hàng
const recentSales = [
  { id: 'DH001', customer: 'Nguyễn Văn A', product: 'MacBook Air M2 13 inch 8GB/256GB', amount: '26.490.000đ', status: 'Hoàn thành', statusType: 'success' },
  { id: 'DH002', customer: 'Trần Thị B', product: 'Laptop Gaming Acer Nitro 5 Tiger', amount: '18.990.000đ', status: 'Đang xử lý', statusType: 'warning' },
  { id: 'DH003', customer: 'Lê Văn C', product: 'Dell Inspiron 15 3520', amount: '12.490.000đ', status: 'Hoàn thành', statusType: 'success' },
];
</script>

<style scoped>
/* Tùy chỉnh bảng để nhìn chuyên nghiệp hơn */
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