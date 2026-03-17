<template>
  <div class="w-screen h-screen grid grid-cols-1 lg:grid-cols-2 bg-white overflow-hidden font-sans">
    
    <div class="hidden lg:flex relative bg-slate-950 flex-col justify-center items-center p-16 overflow-hidden">
      
      <div class="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 rounded-full blur-[120px]"></div>
      
      <div class="relative z-10 w-full max-w-lg flex flex-col items-center text-center space-y-12">
        
        <div class="inline-flex items-center justify-center w-28 h-28 bg-white/5 rounded-[2.5rem] backdrop-blur-2xl border border-white/10 shadow-2xl">
          <el-icon class="text-7xl text-blue-400"><Monitor /></el-icon>
        </div>

        <div class="space-y-6">
          <h1 class="text-6xl font-black text-white tracking-tighter leading-[1.1]">
            Hệ thống <br/> 
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Laptop ERP
            </span> 
          </h1>
          <p class="text-slate-400 text-xl font-light leading-relaxed max-w-md mx-auto">
            Quản trị thông minh cho chuỗi cửa hàng máy tính hiện đại.
          </p>
        </div>
        
        <div class="w-full p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl transform hover:scale-[1.02] transition-all duration-500 group">
          <div class="aspect-video bg-slate-900/50 rounded-2xl flex flex-col items-center justify-center border border-slate-800 group-hover:border-blue-500/30">
            <div class="flex items-end gap-3 h-24 mb-6">
               <div class="w-5 bg-blue-500/20 h-1/2 rounded-t-md animate-pulse"></div>
               <div class="w-5 bg-blue-500/40 h-3/4 rounded-t-md animate-pulse delay-75"></div>
               <div class="w-5 bg-blue-500 h-full rounded-t-md animate-pulse delay-150"></div>
               <div class="w-5 bg-blue-400/60 h-2/3 rounded-t-md animate-pulse delay-200"></div>
            </div>
            <span class="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase">Enterprise Dashboard</span>
          </div>
        </div>
      </div>

      <div class="absolute bottom-10 text-slate-600 text-sm font-medium tracking-widest">
        DESIGNED FOR <span class="text-slate-400">SGU UNIVERSITY</span>
      </div>
    </div>

    <div class="flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-slate-50/50 relative">
      <div class="w-full max-w-md space-y-10">
        
        <div class="lg:hidden text-center">
           <div class="inline-flex p-4 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
              <el-icon class="text-3xl text-white"><Monitor /></el-icon>
           </div>
           <h2 class="text-2xl font-black text-slate-900 uppercase tracking-wider">Laptop ERP</h2>
        </div>

        <div class="text-left space-y-2">
          <h2 class="text-4xl font-extrabold text-slate-900 tracking-tight">Đăng nhập</h2>
          <p class="text-slate-500 text-lg">Chào mừng trở lại! Vui lòng điền thông tin.</p>
        </div>

        <el-form 
          ref="loginFormRef" 
          :model="loginForm" 
          :rules="rules" 
          label-position="top"
          size="large"
          class="space-y-6"
          @keyup.enter="handleLogin(loginFormRef)"
        >
          <el-form-item label="Tài khoản hệ thống" prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="Nhập username nhân viên" 
              :prefix-icon="User"
              class="custom-input"
            />
          </el-form-item>

          <el-form-item label="Mật khẩu bảo mật" prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="••••••••" 
              show-password
              :prefix-icon="Lock"
              class="custom-input"
            />
          </el-form-item>

          <div class="flex items-center justify-between text-sm">
            <el-checkbox v-model="rememberMe" label="Ghi nhớ phiên đăng nhập" />
            <a href="#" class="font-bold text-blue-600 hover:text-blue-700 transition-colors">Quên mật khẩu?</a>
          </div>

          <el-button 
            type="primary" 
            class="w-full h-14 text-base font-bold rounded-xl shadow-xl shadow-blue-600/20 !bg-blue-600 hover:!bg-blue-700 border-none transition-all active:scale-[0.98]"
            :loading="isLoading" 
            @click="handleLogin(loginFormRef)"
          >
            {{ isLoading ? 'ĐANG XÁC THỰC...' : 'VÀO HỆ THỐNG' }}
          </el-button>
        </el-form>

        <p class="text-center text-slate-400 text-xs font-medium pt-10">
          &copy; 2026 Laptop Store Management System. <br/> All Rights Reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './auth.store';
import { ElMessage } from 'element-plus';
import { Monitor, User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();
const loginFormRef = ref(null);
const isLoading = ref(false);
const rememberMe = ref(true);

const loginForm = reactive({ username: '', password: '' });

const rules = reactive({
  username: [{ required: true, message: 'Vui lòng nhập tài khoản', trigger: 'blur' }],
  password: [{ required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' }]
});

const handleLogin = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      isLoading.value = true;
      try {
        await authStore.login(loginForm.username, loginForm.password);
        ElMessage.success('Đăng nhập thành công!');
        router.push('/');
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Lỗi đăng nhập!');
      } finally {
        isLoading.value = false;
      }
    }
  });
};
</script>

<style scoped>
/* Tùy chỉnh Input cho sắc nét hơn */
:deep(.el-input__wrapper) {
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  padding: 8px 16px;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3b82f6 inset !important;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
}
</style>