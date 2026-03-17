<template>
  <div class="min-h-screen bg-gray-50 flex">
    <aside class="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-xl">
      <div class="p-6 flex items-center gap-3 border-b border-slate-800">
        <el-icon class="text-2xl text-blue-400"><Monitor /></el-icon>
        <span class="font-bold text-lg tracking-tight">LAPTOP ERP</span>
      </div>

      <el-menu
        active-text-color="#60a5fa"
        background-color="#0f172a"
        class="border-none flex-1"
        default-active="1"
        text-color="#94a3b8"
        router
      >
        <el-sub-menu index="sales">
          <template #title>
            <el-icon><ShoppingCart /></el-icon>
            <span>Bán Hàng & POS</span>
          </template>
          <el-menu-item index="/sales/pos">Màn hình POS</el-menu-item>
          <el-menu-item index="/sales/orders">Lịch sử hóa đơn</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="inventory">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>Kho & Sản phẩm</span>
          </template>
          <el-menu-item index="/inventory/products">Danh sách Laptop</el-menu-item>
          <el-menu-item index="/inventory/stock">Nhập kho</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="hr">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>Nhân Sự & Lương</span>
          </template>
          <el-menu-item index="/hr/employees">Quản lý nhân viên</el-menu-item>
          <el-menu-item index="/hr/attendance">Chấm công</el-menu-item>
          <el-menu-item index="/hr/payroll">Bảng tính lương</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>Cấu hình hệ thống</span>
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
            <p class="text-sm font-bold text-gray-700">{{ authStore.getUserName }}</p>
            <p class="text-xs text-gray-400">Quản trị viên</p>
          </div>
          <el-dropdown trigger="click">
            <el-avatar :size="40" class="cursor-pointer bg-blue-500">
              {{ authStore.getUserName.charAt(0) }}
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>Hồ sơ cá nhân</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout" class="text-red-500">
                  Đăng xuất
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-8 bg-gray-50">
        <router-view v-slot="{ Component }">
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
import { Monitor, ShoppingCart, Box, UserFilled, Setting } from '@element-plus/icons-vue';

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