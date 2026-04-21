<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Tạo Phiếu Nhập Kho</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Nhập hàng hóa từ Nhà cung cấp và ghi nhận Số Serial</p>
      </div>
      <el-button type="primary" plain size="large" @click="$router.push('/inventory/history')" class="w-full sm:w-auto font-bold shrink-0">
        <el-icon class="mr-2"><List /></el-icon> Lịch sử nhập
      </el-button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
      
      <div class="lg:col-span-7 space-y-4 md:space-y-6">
        
        <div class="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
          <h3 class="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <el-icon class="text-blue-500 text-lg"><Box /></el-icon> Thông tin lô hàng
          </h3>
          <el-form-item label="Nhà cung cấp (*)" class="mb-0 font-medium">
            <el-select v-model="phieuNhap.maNCC" placeholder="Chọn nhà cung cấp" class="w-full" size="large" filterable>
              <el-option v-for="ncc in dbNhaCungCap" :key="ncc.maNCC" :label="ncc.tenNCC" :value="ncc.maNCC" />
            </el-select>
          </el-form-item>
        </div>

        <div class="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-blue-200 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          
          <h3 class="font-bold text-slate-800 mb-4 md:mb-5 flex items-center gap-2 text-sm md:text-base">
            <el-icon class="text-blue-500 text-lg"><Monitor /></el-icon> Chi tiết hàng nhập
          </h3>
          
          <div class="flex flex-col sm:flex-row gap-3 md:gap-4 items-start mb-4 md:mb-6">
            
            <div class="flex-1 w-full">
              <label class="block text-xs md:text-sm font-semibold text-slate-600 mb-1.5 md:mb-2">
                1. Chọn sản phẩm cần nhập 
                <span v-if="!phieuNhap.maNCC" class="text-red-500 font-normal italic text-[10px] md:text-xs ml-1 block sm:inline mt-1 sm:mt-0">(Cần chọn NCC trước)</span>
              </label>
              
              <el-select 
                v-model="currentItem.maSP" 
                :placeholder="phieuNhap.maNCC ? 'Tìm theo tên hoặc mã SP...' : 'Khóa: Đợi chọn NCC'" 
                class="w-full custom-select" 
                size="large" filterable @change="handleSelectProduct"
                :disabled="!phieuNhap.maNCC" 
              >
                <el-option v-for="sp in dbSanPham" :key="sp.maSP" :label="sp.tenSP" :value="sp.maSP">
                  <span class="float-left font-bold text-xs md:text-sm truncate max-w-[200px] sm:max-w-none" :title="sp.tenSP">{{ sp.tenSP }}</span>
                  <span class="float-right text-slate-400 text-xs md:text-sm pl-4 font-mono">SP{{ sp.maSP }}</span>
                </el-option>
              </el-select>
            </div>

            <div class="w-full sm:w-40 md:w-48 shrink-0 mt-2 sm:mt-0">
              <label class="block text-xs md:text-sm font-semibold text-slate-600 mb-1.5 md:mb-2">2. Đơn giá nhập</label>
              <el-input 
                v-model="giaNhapDisplay" 
                size="large" 
                class="w-full" 
                placeholder="0"
                :disabled="!currentItem.maSP"
              >
                <template #append>₫</template>
              </el-input>
            </div>

          </div>

          <div v-if="currentItem.maSP" class="p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl transition-all">
            <label class="block text-xs md:text-sm font-semibold text-slate-700 mb-2 md:mb-3">3. Quét mã Serial (S/N) trên từng hộp máy</label>
            
            <el-alert v-if="currentItem.giaNhap <= 0" title="Vui lòng nhập Đơn giá nhập > 0 để quét mã!" type="warning" show-icon :closable="false" class="mb-3 md:mb-4" />

            <div class="flex flex-col sm:flex-row gap-2 md:gap-3 mb-3 md:mb-4">
              <el-input 
                v-model="scanSerial" 
                placeholder="Quét Serial (Enter)..." 
                size="large" class="w-full font-mono" @keyup.enter="addSerial" :prefix-icon="FullScreen"
                :disabled="currentItem.giaNhap <= 0"
              />
              <div class="flex gap-2 w-full sm:w-auto shrink-0">
                 <el-button type="success" plain size="large" @click="addSerial" :disabled="currentItem.giaNhap <= 0" class="flex-1 sm:flex-none m-0">Thêm</el-button>
                 <el-button type="warning" plain size="large" @click="generateRandomSerials" :disabled="currentItem.giaNhap <= 0" class="flex-1 sm:flex-none m-0">+5 (Test)</el-button>
              </div>
            </div>

            <div class="min-h-[80px] bg-white border border-dashed border-slate-300 rounded-lg p-2.5 md:p-3">
              <p v-if="currentItem.serials.length === 0" class="text-xs md:text-sm text-slate-400 text-center mt-3 md:mt-2 italic">Chưa có Serial nào được quét</p>
              <div class="flex flex-wrap gap-1.5 md:gap-2">
                <el-tag 
                  v-for="(sn, index) in currentItem.serials" :key="sn" 
                  closable @close="removeSerial(index)" type="primary" effect="light" class="font-mono font-bold text-[11px] md:text-xs" size="default"
                >
                  <el-icon class="mr-0.5"><FullScreen /></el-icon> {{ sn }}
                </el-tag>
              </div>
            </div>
            
            <div class="mt-3 md:mt-4">
              <el-button type="primary" size="large" @click="saveItemToPhieu" :disabled="currentItem.serials.length === 0" class="w-full font-bold shadow-md shadow-blue-500/20">
                Đưa vào Phiếu Nhập ({{ currentItem.serials.length }} máy)
              </el-button>
            </div>
          </div>

        </div>
      </div>

      <div class="lg:col-span-5 mt-2 lg:mt-0">
        <div class="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 lg:sticky lg:top-6 flex flex-col h-auto lg:max-h-[calc(100vh-100px)]">
          <h3 class="font-bold text-slate-800 text-base md:text-lg mb-3 md:mb-4 border-b border-slate-100 pb-2 md:pb-3 shrink-0">Danh sách hàng chuẩn bị nhập</h3>
          
          <div v-if="phieuNhap.items.length === 0" class="py-8 md:py-12 text-center text-slate-400 flex-1 flex flex-col justify-center">
            <el-icon class="text-4xl md:text-5xl mb-2 opacity-50"><DocumentAdd /></el-icon>
            <p class="text-sm md:text-base font-medium">Phiếu nhập đang trống</p>
          </div>

          <div class="space-y-3 md:space-y-4 mb-4 md:mb-6 overflow-y-visible lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar flex-1">
            <div v-for="(item, index) in phieuNhap.items" :key="item.maSP" class="p-3 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl relative group">
              <el-button type="danger" link :icon="Delete" class="absolute top-2 right-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" @click="removeItemFromPhieu(index)"/>
              
              <h4 class="font-bold text-slate-800 text-xs md:text-sm pr-6 leading-tight mb-1">{{ item.tenSP }}</h4>
              <p class="text-[11px] md:text-xs text-slate-500 mb-1.5 md:mb-2">Đơn giá: {{ formatPrice(item.giaNhap) }}</p>
              
              <div class="flex justify-between items-center text-xs md:text-sm pt-1 md:pt-1.5 border-t border-slate-200 border-dashed">
                <span class="font-bold text-blue-600">SL: {{ item.serials.length }}</span>
                <span class="font-bold text-slate-800">T.Tiền: {{ formatPrice(item.giaNhap * item.serials.length) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-slate-200 space-y-2 shrink-0">
            <div class="flex justify-between text-xs md:text-sm text-slate-600">
              <span>Tổng số máy nhập:</span>
              <span class="font-bold text-slate-800">{{ totalMachines }} máy</span>
            </div>
            <div class="flex justify-between items-center text-base md:text-lg border-t border-slate-200 pt-2 mt-2">
              <span class="font-bold text-slate-800 text-sm md:text-base">TỔNG TIỀN NHẬP:</span>
              <span class="font-black text-blue-600">{{ formatPrice(totalCost) }}</span>
            </div>
          </div>

          <el-button 
            type="primary" class="w-full !h-12 md:!h-14 mt-4 md:mt-6 text-sm md:text-base font-bold !rounded-xl shadow-lg shadow-blue-500/30 shrink-0"
            :disabled="phieuNhap.items.length === 0 || !phieuNhap.maNCC"
            @click="submitPhieuNhap"
          >
            <el-icon class="mr-2"><Check /></el-icon> HOÀN TẤT NHẬP KHO
          </el-button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Box, FullScreen, DocumentAdd, Delete, Check, List } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import api from '../../services/api';
import { useAuthStore } from '../auth/auth.store';

const authStore = useAuthStore();
const router = useRouter();

// --- STATE ---
const dbSanPham = ref([]);
const dbNhaCungCap = ref([]);

const phieuNhap = reactive({ maNCC: null, items: [] });
const currentItem = reactive({ maSP: '', tenSP: '', giaNhap: 0, serials: [] });
const scanSerial = ref('');
const isSubmitting = ref(false);

// --- TẢI DỮ LIỆU THẬT TỪ API ---
const loadInitialData = async () => {
  try {
    const [resSP, resNCC] = await Promise.all([
      api.get('/inventory/sanpham?limit=1000'),
      api.get('/inventory/ncc/active')
    ]);
    dbSanPham.value = resSP.data || [];
    dbNhaCungCap.value = resNCC.data || [];
  } catch (error) {
    ElMessage.error('Lỗi khi tải dữ liệu Sản phẩm / NCC!');
  }
};

onMounted(() => {
  loadInitialData();
});

// --- COMPUTED & LOGIC THÊM SẢN PHẨM ---
const totalMachines = computed(() => phieuNhap.items.reduce((sum, item) => sum + item.serials.length, 0));
const totalCost = computed(() => phieuNhap.items.reduce((sum, item) => sum + (item.giaNhap * item.serials.length), 0));
const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const giaNhapDisplay = computed({
  get: () => {
    if (!currentItem.giaNhap) return '';
    return new Intl.NumberFormat('vi-VN').format(currentItem.giaNhap);
  },
  set: (val) => {
    currentItem.giaNhap = Number(val.replace(/[^0-9]/g, '')) || 0;
  }
});

const handleSelectProduct = (maSP) => {
  const sp = dbSanPham.value.find(s => s.maSP === maSP); // Đổi dbSanPham thành dbSanPham.value
  if (sp) { currentItem.tenSP = sp.tenSP; currentItem.giaNhap = sp.giaNhap || 0; currentItem.serials = []; }
};

const addSerial = () => {
  const sn = scanSerial.value.trim().toUpperCase();
  if (!sn) return;
  if (currentItem.serials.includes(sn)) { ElMessage.warning('Đã quét mã này!'); scanSerial.value = ''; return; }
  currentItem.serials.push(sn);
  scanSerial.value = '';
};

const generateRandomSerials = () => {
  if (!currentItem.maSP) return;
  const prefix = `SP${currentItem.maSP}`;
  for(let i=0; i<5; i++) {
    const fakeSerial = `SN-${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    if (!currentItem.serials.includes(fakeSerial)) currentItem.serials.push(fakeSerial);
  }
};

const removeSerial = (index) => currentItem.serials.splice(index, 1);

const saveItemToPhieu = () => {
  const existingItem = phieuNhap.items.find(i => i.maSP === currentItem.maSP);
  if (existingItem) existingItem.serials.push(...currentItem.serials);
  else phieuNhap.items.push(JSON.parse(JSON.stringify(currentItem)));
  ElMessage.success(`Đã thêm ${currentItem.serials.length} máy!`);
  currentItem.maSP = ''; currentItem.tenSP = ''; currentItem.giaNhap = 0; currentItem.serials = [];
};

const removeItemFromPhieu = (index) => phieuNhap.items.splice(index, 1);

// --- ĐƯA API LƯU PHIẾU NHẬP VÀO DATABASE ---
const submitPhieuNhap = () => {
  ElMessageBox.confirm(
    `Xác nhận nhập <b>${totalMachines.value} máy</b>. Tổng giá trị: <b class="text-blue-600">${formatPrice(totalCost.value)} đ</b>?`,
    'Chốt Phiếu Nhập Kho',
    { confirmButtonText: 'Xác nhận Nhập kho', cancelButtonText: 'Xem lại', type: 'warning', dangerouslyUseHTMLString: true }
  ).then(async () => {
    
    isSubmitting.value = true;
    try {
      // Đóng gói Payload theo đúng yêu cầu của Backend mới
      const payload = {
        maNCC: phieuNhap.maNCC,
        maNhanVien: authStore.user?.maNhanVien || authStore.user?.id || 1,
        tongTien: totalCost.value,
        danhSachSanPham: phieuNhap.items.map(item => ({
          maSP: item.maSP,
          soLuong: item.serials.length,
          donGiaNhap: item.giaNhap,
          serials: item.serials 
        }))
      };

      // Gọi API POST
      await api.post('/inventory/nhapkho', payload);

      ElMessage.success({ message: `Đã nhập kho thành công!`, duration: 3000 });
      
      // Reset Form
      phieuNhap.maNCC = null; 
      phieuNhap.items = [];
      
      // Chuyển hướng sang trang Lịch sử nhập để xem thành quả
      router.push('/inventory/history');

    } catch (error) {
      ElMessage.error(error.response?.data?.message || 'Lỗi khi lưu phiếu nhập!');
      console.error(error);
    } finally {
      isSubmitting.value = false;
    }

  }).catch(() => {});
};
</script>

<style scoped>
/* Custom thanh cuộn trên PC, nhưng ẩn đi trên Mobile */
@media (min-width: 1024px) {
  .custom-scrollbar::-webkit-scrollbar { width: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
}

/* Đổi viền Select khi focus cho đẹp */
:deep(.custom-select .el-input__wrapper) { box-shadow: 0 0 0 1px #e2e8f0 inset !important; }
:deep(.custom-select .el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #3b82f6 inset !important; }
</style>