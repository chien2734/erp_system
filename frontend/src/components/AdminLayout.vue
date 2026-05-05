<template>
    <div class="min-h-screen bg-gray-50 flex relative overflow-hidden">
        
        <div 
            v-if="isSidebarOpen" 
            @click="isSidebarOpen = false"
            class="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        ></div>

        <aside 
            class="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-2xl fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0"
            :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        >
        
            <div 
                class="p-6 flex items-center justify-between border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
                @click="$router.push('/')"
            >
                <div class="flex items-center gap-3">
                    <el-icon class="text-2xl text-blue-400"><Monitor /></el-icon>
                    <span class="font-bold text-lg tracking-tight">LAPTOP STORE ERP</span>
                </div>
                <button @click.stop="isSidebarOpen = false" class="md:hidden text-slate-400 hover:text-white p-1">
                    <el-icon class="text-2xl"><Close /></el-icon>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <el-menu
                    active-text-color="#60a5fa"
                    background-color="#0f172a"
                    class="border-none w-full"
                    default-active="1"
                    text-color="#94a3b8"
                    router :default-active="$route.path"
                >
                    <el-menu-item index="/hr/checkin">
                        <el-icon><Location /></el-icon>
                        <span class="font-bold text-emerald-400">Chấm Công Hàng Ngày</span>
                    </el-menu-item>

                    <el-sub-menu index="sales" v-if="authStore.hasPermission(CHUCNANG.POS) || authStore.hasPermission(CHUCNANG.KHACH_HANG)">
                        <template #title>
                            <el-icon><ShoppingCart /></el-icon>
                            <span>Bán Hàng & POS</span>
                        </template>
                        <el-menu-item index="/sales/pos" v-if="authStore.hasPermission(CHUCNANG.POS)">Màn hình POS</el-menu-item>
                        <el-menu-item index="/sales/orders" v-if="authStore.hasPermission(CHUCNANG.POS)">Lịch sử hóa đơn</el-menu-item>
                        <el-menu-item index="/sales/report" v-if="authStore.hasPermission(CHUCNANG.BAO_CAO)">Báo cáo sản phẩm</el-menu-item>
                        <el-menu-item index="/sales/customers" v-if="authStore.hasPermission(CHUCNANG.KHACH_HANG)">Quản lý khách hàng</el-menu-item>
                    </el-sub-menu>

                    <el-sub-menu index="inventory" v-if="authStore.hasPermission(CHUCNANG.SAN_PHAM) || authStore.hasPermission(CHUCNANG.NHAP_KHO)">
                        <template #title>
                            <el-icon><Box /></el-icon>
                            <span>Kho & Sản phẩm</span>
                        </template>
                        <el-menu-item index="/inventory/products" v-if="authStore.hasPermission(CHUCNANG.SAN_PHAM)">Danh mục Sản phẩm</el-menu-item>
                        <el-menu-item index="/inventory/brands" v-if="authStore.hasPermission(CHUCNANG.SAN_PHAM)">Quản lý Hãng</el-menu-item>
                        <el-menu-item index="/inventory/suppliers" v-if="authStore.hasPermission(CHUCNANG.SAN_PHAM)">Nhà Cung Cấp</el-menu-item>
                        <el-menu-item index="/inventory/stock" v-if="authStore.hasPermission(CHUCNANG.NHAP_KHO)">Nhập kho</el-menu-item>
                        <el-menu-item index="/inventory/serial" v-if="authStore.hasPermission(CHUCNANG.SERIAL)">Quản lý Serial</el-menu-item>
                        <el-menu-item index="/inventory/report" v-if="authStore.hasPermission(CHUCNANG.BAO_CAO)">Báo cáo kho</el-menu-item>
                    </el-sub-menu>

                    <el-sub-menu index="hr" v-if="authStore.hasPermission(CHUCNANG.NHAN_VIEN) || authStore.hasPermission(CHUCNANG.CHAM_CONG)">
                        <template #title>
                            <el-icon><UserFilled /></el-icon>
                            <span>Nhân Sự & Lương</span>
                        </template>
                        <el-menu-item index="/hr/employees" v-if="authStore.hasPermission(CHUCNANG.NHAN_VIEN)">Quản lý nhân viên</el-menu-item>
                        <el-menu-item index="/hr/positions" v-if="authStore.hasPermission(CHUCNANG.PHAN_QUYEN)">Quản lý Chức vụ</el-menu-item>
                        <el-menu-item index="/hr/attendance" v-if="authStore.hasPermission(CHUCNANG.CHAM_CONG)">Quản lý chấm công</el-menu-item>
                        <el-menu-item index="/hr/payroll" v-if="authStore.hasPermission(CHUCNANG.TINH_LUONG)">Bảng tính lương</el-menu-item>
                        <el-menu-item index="/hr/leaves" v-if="authStore.hasPermission(CHUCNANG.CHAM_CONG)">Quản lý Đơn từ</el-menu-item>
                        <el-menu-item index="/hr/report-salary" v-if="authStore.hasPermission(CHUCNANG.BAO_CAO)">Báo cáo lương</el-menu-item>
                    </el-sub-menu>

                    <el-menu-item index="/settings" v-if="authStore.hasPermission(CHUCNANG.PHAN_QUYEN)">
                        <el-icon><Setting /></el-icon>
                        <span>Cấu hình hệ thống</span>
                    </el-menu-item>

                    <el-menu-item index="/auth/accounts" v-if="authStore.hasPermission(CHUCNANG.PHAN_QUYEN)">
                        <el-icon><User /></el-icon>
                        <span>Quản lý Phân quyền</span>
                    </el-menu-item>

                    <el-menu-item index="/audit/logs" v-if="authStore.hasPermission(CHUCNANG.PHAN_QUYEN)">
                        <el-icon><Timer /></el-icon>
                        <span>Lịch sử hệ thống</span>
                    </el-menu-item>
                </el-menu>
            </div>

            <div class="p-4 border-t border-slate-800 text-xs text-slate-500 text-center shrink-0">
                v1.0.0 - ERP System
            </div>
        </aside>

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 shrink-0">
                
                <div class="flex items-center gap-3 md:gap-0">
                    <button 
                        @click="isSidebarOpen = true" 
                        class="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <el-icon class="text-2xl"><Menu /></el-icon>
                    </button>
                    
                    <div class="text-gray-500 font-medium capitalize truncate max-w-[150px] sm:max-w-xs">
                        {{ $route.name || 'Dashboard' }}
                    </div>
                </div>

                <div class="flex items-center gap-2 md:gap-4 shrink-0">
                    <div class="text-right mr-2 hidden sm:block">
                        <p class="text-sm font-bold text-gray-700 truncate max-w-[150px]">
                            {{ authStore.user?.hoten || authStore.user?.username || 'Người dùng' }}
                        </p>
                        <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                            {{ authStore.user?.tenNhomQuyen || 'Nhân viên' }}
                        </p>
                    </div>
                    
                    <el-dropdown trigger="click">
                        <el-avatar :size="40" class="cursor-pointer bg-blue-500 font-bold text-white hover:ring-2 hover:ring-blue-300 transition-all">
                            {{ (authStore.user?.hoten || authStore.user?.username || 'U').charAt(0).toUpperCase() }}
                        </el-avatar>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="$router.push('/profile')">
                                    <el-icon><User /></el-icon> Hồ sơ cá nhân
                                </el-dropdown-item>
                                
                                <el-dropdown-item divided @click="handleLogout" class="text-red-500 font-bold">
                                    <el-icon><SwitchButton /></el-icon> Đăng xuất
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </header>

            <main class="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 relative">
                <router-view :key="$route.fullPath" v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../modules/auth/auth.store';
import { Monitor, ShoppingCart, Box, UserFilled, Setting, User, Location, SwitchButton, Menu, Close, Timer } from '@element-plus/icons-vue';
import { CHUCNANG } from '../utils/constants';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Trạng thái mở/đóng Sidebar trên Mobile
const isSidebarOpen = ref(false);

// Tự động đóng Sidebar mỗi khi người dùng click chuyển trang (đổi route)
watch(() => route.path, () => {
    isSidebarOpen.value = false;
});

const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

:deep(.el-sub-menu__title) {
    font-weight: 500;
}
:deep(.el-menu-item.is-active) {
    background-color: #1e293b !important;
    border-left: 4px solid #3b82f6;
}

/* Custom Scrollbar cho Sidebar khi xem trên màn hình nhỏ */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #0f172a; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155; 
    border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #475569; 
}
</style>