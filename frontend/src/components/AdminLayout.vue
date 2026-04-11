<template>
    <div class="min-h-screen bg-gray-50 flex">
        <aside class="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-xl">
        
        <div 
            class="p-6 flex items-center gap-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
            @click="$router.push('/')"
        >
            <el-icon class="text-2xl text-blue-400"><Monitor /></el-icon>
            <span class="font-bold text-lg tracking-tight">LAPTOP ERP</span>
        </div>

        <el-menu
            active-text-color="#60a5fa"
            background-color="#0f172a"
            class="border-none flex-1"
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
<<<<<<< HEAD
                <el-menu-item index="/inventory/suppliers" v-if="authStore.hasPermission(CHUCNANG.SAN_PHAM)">Nhà Cung Cấp</el-menu-item>
                
                <el-menu-item index="/inventory/stock" v-if="authStore.hasPermission(CHUCNANG.NHAP_KHO)">Nhập kho</el-menu-item>

                <el-menu-item index="/inventory/serial" v-if="authStore.hasPermission(CHUCNANG.SERIAL)">Quản lý Serial</el-menu-item>

                <el-menu-item index="/inventory/report" v-if="authStore.hasPermission(CHUCNANG.BAO_CAO)">Báo cáo kho</el-menu-item>
=======

                <el-menu-item index="/inventory/suppliers" v-if="authStore.hasPermission(CHUCNANG.SAN_PHAM)">Nhà Cung Cấp</el-menu-item>
                
                <el-menu-item index="/inventory/stock" v-if="authStore.hasPermission(CHUCNANG.NHAP_KHO)">Nhập kho</el-menu-item>
                <el-menu-item index="/inventory/serial" v-if="authStore.hasPermission(CHUCNANG.SERIAL)">Quản lý Serial</el-menu-item>
>>>>>>> c095d035aed92d121b728fa823f98aa2a605e840
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
<<<<<<< HEAD
                <el-menu-item index="/inventory/report-salary" v-if="authStore.hasPermission(CHUCNANG.BAO_CAO)">Báo cáo lương</el-menu-item>
=======
>>>>>>> c095d035aed92d121b728fa823f98aa2a605e840
            </el-sub-menu>

            <el-menu-item index="/settings" v-if="authStore.hasPermission(CHUCNANG.PHAN_QUYEN)">
                <el-icon><Setting /></el-icon>
                <span>Cấu hình hệ thống</span>
            </el-menu-item>

            <el-menu-item index="/auth/accounts" v-if="authStore.hasPermission(CHUCNANG.PHAN_QUYEN)">
                <el-icon><User /></el-icon>
                <span>Quản lý Phân quyền</span>
            </el-menu-item>
        </el-menu>

        <div class="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
            v1.0.0 - ERP System
        </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
                <div class="text-gray-500 font-medium capitalize">
                {{ $route.name || 'Dashboard' }}
                </div>

                <div class="flex items-center gap-4">
                    <div class="text-right mr-2">
                        <p class="text-sm font-bold text-gray-700">
                            {{ authStore.user?.hoten || authStore.user?.username || 'Người dùng' }}
                        </p>
                        
                        <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                            {{ authStore.user?.tenNhomQuyen || 'Nhân viên' }}
                        </p>
                    </div>
                    
                    <el-dropdown trigger="click">
                        <el-avatar :size="40" class="cursor-pointer bg-blue-500 font-bold text-white">
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

            <main class="flex-1 overflow-y-auto p-8 bg-gray-50">
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
import { useRouter } from 'vue-router';
import { useAuthStore } from '../modules/auth/auth.store';
import { Monitor, ShoppingCart, Box, UserFilled, Setting, User, Location } from '@element-plus/icons-vue';
import { CHUCNANG } from '../utils/constants';

const router = useRouter();
const authStore = useAuthStore();

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
</style>