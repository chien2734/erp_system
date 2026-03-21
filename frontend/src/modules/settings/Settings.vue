<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <el-icon class="text-blue-600"><Setting /></el-icon> Cấu Hình Hệ Thống
        </h2>
        <p class="text-slate-500 mt-1">Các chỉ số tại đây sẽ áp dụng tự động cho toàn bộ nhân viên trong kỳ lương tiếp theo.</p>
      </div>
      <el-button type="primary" size="large" @click="saveSettings" :loading="saving" class="font-bold shadow-lg shadow-blue-500/30 px-8">
        <el-icon class="mr-2"><Check /></el-icon> LƯU CẤU HÌNH
      </el-button>
    </div>

    <el-form :model="formData" label-position="top">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
            <div class="p-2 bg-amber-50 text-amber-600 rounded-lg"><el-icon class="text-xl"><Clock /></el-icon></div>
            <h3 class="font-bold text-slate-800 text-lg">Chấm công & Kỷ luật</h3>
          </div>
          
          <div class="space-y-5">
            <el-form-item label="Giờ vào làm chuẩn (Check-in)">
              <el-time-picker 
                v-model="formData.gioVaoLamChuan" 
                format="HH:mm" 
                value-format="HH:mm:ss" 
                class="!w-full" 
                size="large"
              />
              <span class="text-xs text-slate-400 block mt-1">Nhân viên tít vân tay sau giờ này sẽ bị tính đi trễ.</span>
            </el-form-item>

            <el-form-item label="Tiền phạt đi trễ (VNĐ / phút)">
              <el-input-number 
                v-model="formData.tienPhatDiTre" 
                :min="0" :step="1000" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
              <span class="text-xs text-slate-400 block mt-1">VD: Trễ 30 phút x 2.000đ = Phạt 60.000đ.</span>
            </el-form-item>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
            <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><el-icon class="text-xl"><Money /></el-icon></div>
            <h3 class="font-bold text-slate-800 text-lg">Lương & Phụ cấp</h3>
          </div>
          
          <div class="space-y-5">
            <el-form-item label="Hệ số lương tăng ca (Ngoài giờ)">
              <el-input-number 
                v-model="formData.heSoTangCa" 
                :min="1.0" :max="3.0" :step="0.1" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
              <span class="text-xs text-slate-400 block mt-1">Tiêu chuẩn: 1.5 (Ngày thường), 2.0 (Cuối tuần).</span>
            </el-form-item>

            <el-form-item label="Phụ cấp ăn trưa (VNĐ / tháng)">
              <el-input-number 
                v-model="formData.phuCapAnTrua" 
                :min="0" :step="50000" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
            </el-form-item>

            <el-form-item label="Phụ cấp xăng xe (VNĐ / tháng)">
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

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><el-icon class="text-xl"><Lock /></el-icon></div>
            <h3 class="font-bold text-slate-800 text-lg">Bảo hiểm (BHXH, BHYT)</h3>
          </div>
          
          <div class="space-y-5">
            <el-form-item label="Mức lương cơ sở đóng BH (VNĐ)">
              <el-input-number 
                v-model="formData.luongCoSo" 
                :min="0" :step="100000" 
                class="!w-full" 
                size="large" 
                controls-position="right"
              />
              <span class="text-xs text-slate-400 block mt-1">Dùng làm mốc tính phần trăm bảo hiểm, không phải lương thực nhận.</span>
            </el-form-item>

            <div class="grid grid-cols-2 gap-4">
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
            
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
              <p class="text-sm text-blue-800 font-semibold mb-1">Ví dụ minh họa khấu trừ:</p>
              <p class="text-xs text-blue-600 font-mono">
                Lương CS ({{ formatPrice(formData.luongCoSo) }}) x Tổng BH ({{ formData.phanTramBHXH + formData.phanTramBHYT }}%) 
                = <span class="font-bold text-rose-600">-{{ formatPrice(formData.luongCoSo * (formData.phanTramBHXH + formData.phanTramBHYT) / 100) }} đ</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Setting, Clock, Money, Lock, Check } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- MOCK DATABASE CẤU HÌNH ---
// Khi vào trang, gọi API GET /api/cau-hinh lấy bản ghi cấu hình hiện tại đang active
const dbCauHinh = {
  maCauHinh: 1,
  gioVaoLamChuan: '08:00:00',
  tienPhatDiTre: 2000,
  heSoTangCa: 1.5,
  luongCoSo: 4680000,
  phanTramBHXH: 8.0,
  phanTramBHYT: 1.5,
  phuCapAnTrua: 730000,
  phuCapXangXe: 300000
};

// --- STATE ---
const formData = ref({ ...dbCauHinh });
const saving = ref(false);

// --- METHODS ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const saveSettings = () => {
  ElMessageBox.confirm(
    'Việc thay đổi cấu hình sẽ ảnh hưởng đến kết quả chấm công và tính lương của toàn bộ nhân sự từ thời điểm này trở đi. Bạn có chắc chắn muốn lưu?',
    'Cảnh báo thay đổi hệ thống',
    { confirmButtonText: 'Xác nhận Lưu', cancelButtonText: 'Hủy', type: 'warning' }
  ).then(() => {
    saving.value = true;
    
    // Giả lập gọi API PUT /api/cau-hinh/1
    setTimeout(() => {
      saving.value = false;
      ElMessage.success('Đã lưu cấu hình hệ thống thành công! Bảng lương sẽ áp dụng chỉ số mới.');
      console.log("Payload gửi lên Backend:", formData.value);
    }, 800);
  }).catch(() => {});
};
</script>

<style scoped>
/* Tùy chỉnh input number cho căn lề trái chữ số cho dễ đọc */
:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>