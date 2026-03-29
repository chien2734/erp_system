<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Tạo Phiếu Nhập Kho</h2>
        <p class="text-slate-500">Nhập hàng hóa từ Nhà cung cấp và ghi nhận Số Serial</p>
      </div>
      <el-button type="primary" plain size="large" @click="$router.push('/inventory/history')">
        <el-icon class="mr-2"><List /></el-icon> Lịch sử nhập hàng
      </el-button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <div class="lg:col-span-7 space-y-6">
        
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <el-icon class="text-blue-500"><Box /></el-icon> Thông tin lô hàng
          </h3>
          <el-form-item label="Nhà cung cấp (*)" class="mb-0">
            <el-select v-model="phieuNhap.maNCC" placeholder="Chọn nhà cung cấp" class="w-full" size="large">
              <el-option v-for="ncc in dbNhaCungCap" :key="ncc.maNCC" :label="ncc.tenNCC" :value="ncc.maNCC" />
            </el-select>
          </el-form-item>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <el-icon class="text-blue-500"><Monitor /></el-icon> Chi tiết hàng nhập
          </h3>
          
          <div class="flex flex-col md:flex-row gap-4 items-start mb-6">
            <div class="flex-1 w-full">
              <label class="block text-sm font-semibold text-slate-600 mb-2">
                1. Chọn sản phẩm cần nhập 
                <span v-if="!phieuNhap.maNCC" class="text-red-500 font-normal italic text-xs ml-2">(Vui lòng chọn Nhà cung cấp trước)</span>
              </label>
              <el-select 
                v-model="currentItem.maSP" 
                :placeholder="phieuNhap.maNCC ? 'Tìm theo tên hoặc mã SP...' : 'Khóa: Đợi chọn Nhà cung cấp'" 
                class="w-full custom-select" 
                size="large" filterable @change="handleSelectProduct"
                :disabled="!phieuNhap.maNCC" 
              >
                <el-option v-for="sp in dbSanPham" :key="sp.maSP" :label="sp.tenSP" :value="sp.maSP">
                  <span class="float-left font-bold">{{ sp.tenSP }}</span>
                  <span class="float-right text-slate-400 text-sm pl-4 font-mono">Mã: {{ sp.maSP }}</span>
                </el-option>
              </el-select>
            </div>

            <div class="w-full md:w-48">
              <label class="block text-sm font-semibold text-slate-600 mb-2">2. Đơn giá nhập</label>
              <el-input-number 
                v-model="currentItem.giaNhap" 
                size="large" 
                class="w-full !text-left" 
                :min="0" 
                :step="100000"
                controls-position="right"
                :disabled="!currentItem.maSP"
              />
            </div>
          </div>

          <div v-if="currentItem.maSP" class="p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all">
            <label class="block text-sm font-semibold text-slate-700 mb-2">3. Quét mã Serial (maMay) trên từng hộp máy</label>
            
            <el-alert v-if="currentItem.giaNhap <= 0" title="Vui lòng nhập Đơn giá nhập lớn hơn 0 để bắt đầu quét mã!" type="warning" show-icon :closable="false" class="mb-4" />

            <div class="flex gap-3 mb-4">
              <el-input 
                v-model="scanSerial" 
                placeholder="Quét mã vạch Serial và nhấn Enter..." 
                size="large" class="flex-1 font-mono" @keyup.enter="addSerial" :prefix-icon="FullScreen"
                :disabled="currentItem.giaNhap <= 0"
              />
              <el-button type="success" plain size="large" @click="addSerial" :disabled="currentItem.giaNhap <= 0">Thêm Serial</el-button>
              <el-button type="warning" plain size="large" @click="generateRandomSerials" :disabled="currentItem.giaNhap <= 0">Tạo 5 mã (Test)</el-button>
            </div>

            <div class="min-h-[80px] bg-white border border-dashed border-slate-300 rounded-lg p-3">
              <p v-if="currentItem.serials.length === 0" class="text-sm text-slate-400 text-center mt-2 italic">Chưa có Serial nào được quét</p>
              <div class="flex flex-wrap gap-2">
                <el-tag 
                  v-for="(sn, index) in currentItem.serials" :key="sn" 
                  closable @close="removeSerial(index)" type="primary" effect="light" class="font-mono font-bold" size="large"
                >
                  {{ sn }}
                </el-tag>
              </div>
            </div>
            
            <div class="mt-4 flex justify-end">
              <el-button type="primary" size="large" @click="saveItemToPhieu" :disabled="currentItem.serials.length === 0">
                Đưa vào Phiếu Nhập ({{ currentItem.serials.length }} máy)
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-5">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
          <h3 class="font-bold text-slate-800 text-lg mb-4 border-b border-slate-100 pb-3">Danh sách hàng chuẩn bị nhập</h3>
          
          <div v-if="phieuNhap.items.length === 0" class="py-10 text-center text-slate-400">
            <el-icon class="text-5xl mb-2 opacity-50"><DocumentAdd /></el-icon>
            <p>Phiếu nhập đang trống</p>
          </div>

          <div class="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="(item, index) in phieuNhap.items" :key="item.maSP" class="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
              <el-button type="danger" link :icon="Delete" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" @click="removeItemFromPhieu(index)"/>
              <h4 class="font-bold text-slate-800 text-sm pr-6">{{ item.tenSP }}</h4>
              <p class="text-xs text-slate-500 mb-2">Đơn giá: {{ formatPrice(item.giaNhap) }}</p>
              <div class="flex justify-between items-center text-sm">
                <span class="font-semibold text-blue-600">SL: {{ item.serials.length }} máy</span>
                <span class="font-bold text-slate-800">Thành tiền: {{ formatPrice(item.giaNhap * item.serials.length) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div class="flex justify-between text-sm text-slate-600">
              <span>Tổng số máy nhập:</span>
              <span class="font-bold">{{ totalMachines }}</span>
            </div>
            <div class="flex justify-between text-lg border-t border-slate-200 pt-2 mt-2">
              <span class="font-bold text-slate-800">TỔNG TIỀN NHẬP:</span>
              <span class="font-black text-blue-600">{{ formatPrice(totalCost) }}</span>
            </div>
          </div>

          <el-button 
            type="primary" class="w-full !h-14 mt-6 text-lg font-bold !rounded-xl shadow-lg shadow-blue-500/30"
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
      api.get('/inventory/ncc')
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
        maNhanVien: 1, 
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
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
:deep(.custom-select .el-input__wrapper) { box-shadow: 0 0 0 1px #e2e8f0 inset !important; }
:deep(.custom-select .el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #3b82f6 inset !important; }
</style>