<template>
  <div class="space-y-4 md:space-y-6 max-w-6xl mx-auto p-2 sm:p-4 md:p-0">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <el-icon class="text-blue-600"><Setting /></el-icon> Cấu Hình Hệ Thống
        </h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Các chỉ số tự động áp dụng cho chấm công và tính lương.</p>
      </div>
      <el-button type="primary" size="large" @click="saveSettings" :loading="saving" class="w-full sm:w-auto font-bold shadow-lg shadow-blue-500/30 px-8">
        <el-icon class="mr-2"><Check /></el-icon> LƯU CẤU HÌNH
      </el-button>
    </div>

    <el-form :model="formData" label-position="top" v-loading="loading">
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        
        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div class="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-100 pb-3">
            <div class="p-1.5 md:p-2 bg-amber-50 text-amber-600 rounded-lg"><el-icon class="text-lg md:text-xl"><Clock /></el-icon></div>
            <h3 class="font-bold text-slate-800 text-base md:text-lg">Chấm công & Kỷ luật</h3>
          </div>
          
          <div class="space-y-4 md:space-y-5 flex-1">
            <el-form-item label="Giờ vào làm chuẩn (Check-in)">
              <el-time-picker 
                v-model="formData.gioVaoLamChuan" 
                format="HH:mm" 
                value-format="HH:mm:ss" 
                class="!w-full" 
                size="large"
              />
              <span class="text-[10px] md:text-xs text-slate-400 block mt-1">Check-in sau giờ này bị tính đi trễ.</span>
            </el-form-item>

            <el-form-item label="Giờ ra làm chuẩn (Check-out)">
              <el-time-picker 
                v-model="formData.gioRaLamChuan" 
                format="HH:mm" 
                value-format="HH:mm:ss" 
                class="!w-full" 
                size="large"
              />
            </el-form-item>

            <div class="grid grid-cols-2 gap-3 md:gap-4">
              <el-form-item label="Chờ OT (Phút)">
                <el-input-number 
                  v-model="formData.tgChoTangCa" 
                  :min="0" :step="15" 
                  class="!w-full" 
                  size="large" 
                  controls-position="right"
                />
              </el-form-item>

              <el-form-item label="OT Tối đa (Giờ)">
                <el-input-number 
                  v-model="formData.soGioTangCaToiDa" 
                  :min="0" :max="12" :step="0.5" 
                  class="!w-full" 
                  size="large" 
                  controls-position="right"
                />
              </el-form-item>
            </div>
            
            <div class="bg-amber-50/50 p-2.5 md:p-3 rounded-lg border border-amber-100 -mt-1 md:-mt-2">
              <p class="text-[10px] md:text-[11px] text-amber-700 leading-relaxed">
                <el-icon class="align-middle mr-1"><InfoFilled /></el-icon> 
                Sau <b class="text-amber-800">{{ formData.gioRaLamChuan }}</b> chờ <b class="text-amber-800">{{ formData.tgChoTangCa }} phút</b> bắt đầu tính OT. 
                Giới hạn <b class="text-red-600">{{ formData.soGioTangCaToiDa }} tiếng/ngày</b>.
              </p>
            </div>

            <el-form-item label="Tiền phạt đi trễ (VNĐ/phút)">
              <el-input-number 
                v-model="formData.tienPhatDiTre" 
                :min="0" :step="1000" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
              <span class="text-[10px] md:text-xs text-slate-400 block mt-1">VD: Trễ 30p x 2.000đ = Phạt 60.000đ.</span>
            </el-form-item>
          </div>
        </div>

        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div class="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-100 pb-3">
            <div class="p-1.5 md:p-2 bg-emerald-50 text-emerald-600 rounded-lg"><el-icon class="text-lg md:text-xl"><Money /></el-icon></div>
            <h3 class="font-bold text-slate-800 text-base md:text-lg">Lương & Phụ cấp</h3>
          </div>
          
          <div class="space-y-4 md:space-y-5 flex-1">
            <el-form-item label="Hệ số lương tăng ca (OT)">
              <el-input-number 
                v-model="formData.heSoTangCa" 
                :min="1.0" :max="3.0" :step="0.1" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
              <span class="text-[10px] md:text-xs text-slate-400 block mt-1">Hệ số nhân với lương cơ bản theo giờ.</span>
            </el-form-item>

            <el-form-item label="Phụ cấp ăn trưa (VNĐ/tháng)">
              <el-input-number 
                v-model="formData.phuCapAnTrua" 
                :min="0" :step="50000" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
            </el-form-item>

            <el-form-item label="Phụ cấp xăng xe (VNĐ/tháng)">
              <el-input-number 
                v-model="formData.phuCapXangXe" 
                :min="0" :step="50000" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
            </el-form-item>
          </div>
        </div>

        <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:col-span-1 lg:col-span-2">
          <div class="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-100 pb-3">
            <div class="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg"><el-icon class="text-lg md:text-xl"><Lock /></el-icon></div>
            <h3 class="font-bold text-slate-800 text-base md:text-lg">Bảo hiểm (BHXH, BHYT)</h3>
          </div>
          
          <div class="space-y-4 md:space-y-5 flex-1">
            <el-form-item label="Mức lương cơ sở đóng BH (VNĐ)">
              <el-input-number 
                v-model="formData.luongCoSoBH" 
                :min="0" :step="100000" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
              <span class="text-[10px] md:text-xs text-slate-400 block mt-1">Dùng làm mốc tính phần trăm bảo hiểm.</span>
            </el-form-item>

            <div class="grid grid-cols-2 gap-3 md:gap-4">
              <el-form-item label="Tỷ lệ BHXH (%)">
                <el-input-number 
                  v-model="formData.phanTramBHXH" 
                  :min="0" :max="100" :step="0.5" 
                  class="!w-full" 
                  size="large" 
                  controls-position="right"
                />
              </el-form-item>

              <el-form-item label="Tỷ lệ BHYT (%)">
                <el-input-number 
                  v-model="formData.phanTramBHYT" 
                  :min="0" :max="100" :step="0.5" 
                  class="!w-full" 
                  size="large" 
                  controls-position="right"
                />
              </el-form-item>
            </div>
            
            <div class="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100 mt-2 md:mt-4">
              <p class="text-xs md:text-sm text-blue-800 font-semibold mb-1">Ví dụ minh họa khấu trừ:</p>
              <p class="text-[10px] md:text-xs text-blue-600 font-mono break-words">
                Lương CS ({{ formatPrice(formData.luongCoSoBH) }}) x Tổng BH ({{ formData.phanTramBHXH + formData.phanTramBHYT }}%) 
                = <span class="font-bold text-rose-600">-{{ formatPrice(formData.luongCoSoBH * (formData.phanTramBHXH + formData.phanTramBHYT) / 100) }} đ</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Setting, Clock, Money, Lock, Check, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../../services/api';

// --- STATE ---
const formData = ref({
  gioVaoLamChuan: '08:00:00',
  gioRaLamChuan: '17:00:00',
  tgChoTangCa: 60,
  soGioTangCaToiDa: 2,
  tienPhatDiTre: 2000,
  heSoTangCa: 1.5,
  luongCoSoBH: 4680000, 
  phanTramBHXH: 8.0,
  phanTramBHYT: 1.5,
  phuCapAnTrua: 730000,
  phuCapXangXe: 300000
});
const loading = ref(false);
const saving = ref(false);

// --- TẢI DỮ LIỆU ---
const fetchSettings = async () => {
  loading.value = true;
  try {
    const res = await api.get('/hr/cauhinh');
    const resData = res.data?.data || res.data;
    
    if (resData && Object.keys(resData).length > 0) {
      formData.value = { ...formData.value, ...resData };
    }
  } catch (error) {
    console.error("Lỗi tải cấu hình:", error);
    ElMessage.error('Không thể tải cấu hình hệ thống từ máy chủ');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSettings();
});

// --- TIỆN ÍCH & LƯU ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const saveSettings = () => {
  ElMessageBox.confirm(
    'Thay đổi cấu hình sẽ lập tức ảnh hưởng đến kết quả chấm công ngày hôm nay và các kỳ lương tiếp theo. Bạn chắc chắn chứ?',
    'Cảnh báo hệ thống',
    { confirmButtonText: 'Xác nhận Lưu', cancelButtonText: 'Hủy', type: 'warning' }
  ).then(async () => {
    saving.value = true;
    try {
      const res = await api.put('/hr/cauhinh', formData.value);
      const resData = res.data || res;
      
      if (resData.success) {
        ElMessage.success(resData.message || 'Lưu cấu hình thành công!');
      }
    } catch (error) {
      console.error(error);
      ElMessage.error(error.response?.data?.message || 'Lỗi hệ thống khi lưu cấu hình');
    } finally {
      saving.value = false;
    }
  }).catch(() => {});
};
</script>

<style scoped>
/* Căn trái số cho dễ nhìn */
:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
/* Đảm bảo các form-item không bị tràn ngang trên màn hình siêu nhỏ */
:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>