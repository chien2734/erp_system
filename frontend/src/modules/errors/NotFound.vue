<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div class="max-w-md w-full text-center space-y-8">
      <div class="relative">
        <h1 class="text-[120px] font-black text-slate-200 leading-none">404</h1>
        <div class="absolute inset-0 flex items-center justify-center">
          <el-icon class="text-6xl text-blue-500 animate-bounce"><Monitor /></el-icon>
        </div>
      </div>
      
      <div class="space-y-3">
        <h2 class="text-2xl font-bold text-slate-800 uppercase tracking-tight">Trang không tồn tại</h2>
        <p class="text-slate-500 leading-relaxed">
          Có vẻ như đường dẫn bạn đang truy cập không tồn tại trong hệ thống hoặc đã bị thay đổi địa chỉ.
        </p>
      </div>

      <div class="pt-4">
        <el-button 
          type="primary" 
          size="large" 
          class="!h-12 px-8 font-bold !rounded-xl shadow-lg shadow-blue-500/20"
          @click="goHome"
        >
          QUAY VỀ TRANG CHỦ
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Monitor } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../auth/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const goHome = () => {
  const userRole = authStore.getUserRole;
  // Quay về trang mặc định: Giám đốc & Quản lý -> Dashboard, còn lại -> Check-in
  if (userRole === 1 || userRole === 2) {
    router.push('/');
  } else {
    router.push('/hr/checkin');
  }
};
</script>

<style scoped>
/* Hiệu ứng mờ dần */
.min-h-screen {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
