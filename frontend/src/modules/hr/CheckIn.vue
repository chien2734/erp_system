<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div class="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md text-center relative overflow-hidden">
      
      <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-400"></div>

      <div class="mb-8 mt-4">
        <h1 class="text-6xl font-black text-slate-800 font-mono tracking-tighter mb-2">
          {{ currentTime }}
        </h1>
        <p class="text-lg text-slate-500 font-medium">{{ currentDate }}</p>
      </div>

      <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8" v-loading="pageLoading">
        <el-avatar :size="70" class="mb-3 bg-blue-100 text-blue-600 font-bold text-xl uppercase">
          {{ employeeProfile?.hoTen?.charAt(0) || 'NV' }}
        </el-avatar>
        
        <h2 class="text-2xl font-bold text-slate-800">
          {{ employeeProfile?.hoTen || 'Đang tải thông tin...' }}
        </h2>
        
        <p class="text-sm text-slate-500 font-mono mt-1">
          Mã NV: {{ employeeProfile?.maNhanVien || authStore.user?.maNhanVien }} • 
          {{ employeeProfile?.chucVu || 'Ca Hành Chính' }}
        </p>
      </div>

      <div class="space-y-4">
        <el-button 
          v-if="!attendanceData.gioVao" 
          type="primary" 
          @click="handleAttendance('in')"
          class="w-full !h-16 text-xl font-bold !rounded-xl shadow-lg shadow-blue-500/30"
          :loading="loading"
        >
          <el-icon class="mr-2 text-2xl"><Location /></el-icon> CHECK IN (VÀO CA)
        </el-button>

        <el-button 
          v-else-if="!attendanceData.gioRa" 
          type="warning" 
          @click="handleAttendance('out')"
          class="w-full !h-16 text-xl font-bold !rounded-xl shadow-lg shadow-amber-500/30"
          :loading="loading"
        >
          <el-icon class="mr-2 text-2xl"><Timer /></el-icon> CHECK OUT (KẾT THÚC)
        </el-button>

        <div v-else class="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-200 font-bold flex items-center justify-center gap-2 animate-bounce">
          <el-icon class="text-xl"><CircleCheckFilled /></el-icon>
          ĐÃ HOÀN THÀNH CÔNG VIỆC HÔM NAY
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
        <div>
          <p class="text-xs text-slate-400 font-bold uppercase mb-1">Giờ vào</p>
          <p class="text-lg font-mono font-bold" :class="attendanceData.gioVao ? 'text-blue-600' : 'text-slate-300'">
            {{ attendanceData.gioVao || '--:--:--' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-bold uppercase mb-1">Giờ ra</p>
          <p class="text-lg font-mono font-bold" :class="attendanceData.gioRa ? 'text-amber-600' : 'text-slate-300'">
            {{ attendanceData.gioRa || '--:--:--' }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Location, Timer, CircleCheckFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../auth/auth.store'; // Đường dẫn chuẩn của bạn
import api from '../../services/api'; // Đường dẫn chuẩn của bạn

// --- STATE ---
const authStore = useAuthStore();
const currentTime = ref('');
const currentDate = ref('');
const loading = ref(false);
const pageLoading = ref(true);
let timer = null;

// Dữ liệu profile và chấm công
const employeeProfile = ref(null);
const attendanceData = ref({
  gioVao: null,
  gioRa: null
});

// --- CLOCK LOGIC ---
const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('vi-VN', { hour12: false });
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDate.value = now.toLocaleDateString('vi-VN', options);
};

// --- FETCH DATA: Thông tin NV & Trạng thái chấm công ---
const fetchInitialData = async () => {
  try {
    // 1. Lấy thông tin chi tiết nhân viên
    const maNV = authStore.user?.maNhanVien || authStore.user?.id;
    if (maNV) {
      const profileRes = await api.get(`/hr/nhanvien/${maNV}`);
      employeeProfile.value = profileRes.data?.data || profileRes.data;
    }

    // 2. Lấy trạng thái chấm công hôm nay
    const now = new Date();
    const thang = now.getMonth() + 1;
    const nam = now.getFullYear();
    
    // Gọi API có truyền maNhanVien
    const attRes = await api.get(`/hr/chamcong?thang=${thang}&nam=${nam}&maNhanVien=${maNV}`);
    
    // 👉 CẢI TIẾN 1: Quét mọi lớp vỏ dữ liệu (Giống hệt ChamCong.vue)
    let history = [];
    const resData = attRes.data || attRes; 
    
    if (resData?.data?.data && Array.isArray(resData.data.data)) {
        history = resData.data.data;
    } else if (resData?.data && Array.isArray(resData.data)) {
        history = resData.data;
    } else if (Array.isArray(resData)) {
        history = resData;
    }

    // In log ra để kiểm tra xem Backend đã trả đúng dữ liệu chưa
    console.log("Lịch sử CheckIn:", history);

    // Tạo ngày hiện tại chuẩn YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // 👉 ĐÃ FIX MÚI GIỜ: Khôi phục lại hàm new Date() để nó tự động +7 tiếng
    const todayRecord = history.find(item => {
        if (!item.ngayLamViec) return false;
        
        // Truyền thẳng chuỗi có đuôi Z vào để nó tự bù giờ Việt Nam
        const itemDateObj = new Date(item.ngayLamViec); 
        const iYear = itemDateObj.getFullYear();
        const iMonth = String(itemDateObj.getMonth() + 1).padStart(2, '0');
        const iDay = String(itemDateObj.getDate()).padStart(2, '0');
        
        const itemDateStr = `${iYear}-${iMonth}-${iDay}`;
        
        return itemDateStr === todayStr;
    });

    if (todayRecord) {
      attendanceData.value = {
        gioVao: todayRecord.gioVao,
        gioRa: todayRecord.gioRa
      };
    }
  } catch (error) {
    console.error("Lỗi lấy dữ liệu CheckIn:", error);
    ElMessage.error('Không thể tải thông tin ca làm việc!');
  } finally {
    pageLoading.value = false;
  }
};

onMounted(() => {
  updateClock();
  timer = setInterval(updateClock, 1000);
  fetchInitialData();
});

onUnmounted(() => {
  clearInterval(timer);
});

// --- METHODS: Gọi API chấm công ---
const handleAttendance = async (type) => {
  const actionText = type === 'in' ? 'Check-in VÀO CA' : 'Check-out RA VỀ';
  
  try {
    await ElMessageBox.confirm(
      `Xác nhận ${actionText} vào lúc <b>${currentTime.value}</b>?`,
      'Xác nhận chấm công',
      { confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy', dangerouslyUseHTMLString: true, type: 'info' }
    );

    loading.value = true;
    const res = await api.post('/hr/chamcong');
    
    // 👉 ĐÃ SỬA: Lấy dữ liệu an toàn, tương thích với mọi cách cấu hình Axios
    const resultData = res.data || res; 
    
    if (resultData.success) {
      ElMessage.success(resultData.message);
      // Gọi lại hàm này để load lại giờ và ẩn nút
      await fetchInitialData();
    }
  } catch (error) {
    if (error !== 'cancel') {
      // In log ra console để dễ debug nếu có lỗi khác
      console.error("Lỗi Catch:", error); 
      ElMessage.error(error.response?.data?.message || error.message || 'Lỗi hệ thống chấm công');
    }
  } finally {
    loading.value = false;
  }
};
</script>