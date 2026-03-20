<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Quản lý Serial Máy tính</h2>
        <p class="text-slate-500">Tra cứu vòng đời, lịch sử xuất nhập và trạng thái của từng mã máy (Serial)</p>
      </div>
    </div>

    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
      <el-input 
        v-model="searchQuery" 
        placeholder="Tít mã vạch hoặc nhập Serial..." 
        :prefix-icon="FullScreen"
        class="!w-72 font-mono"
        clearable
    />
      
      <el-select v-model="filterSP" placeholder="Lọc theo Sản phẩm" clearable class="!w-64" filterable>
        <el-option v-for="sp in dbSanPham" :key="sp.maSP" :label="sp.tenSP" :value="sp.maSP" />
      </el-select>

      <el-select v-model="filterStatus" placeholder="Trạng thái máy" clearable class="!w-48">
        <el-option label="Sẵn sàng (Trong kho)" value="Sẵn sàng" />
        <el-option label="Đã bán" value="Đã bán" />
        <el-option label="Đang bảo hành" value="Đang bảo hành" />
        <el-option label="Hư hỏng / Lỗi" value="Hư hỏng" />
      </el-select>

      <div class="ml-auto text-sm text-slate-500">
        Hiển thị: <span class="font-bold text-blue-600">{{ filteredSerials.length }}</span> máy
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredSerials" style="width: 100%" size="large" stripe>
        
        <el-table-column prop="maMay" label="Mã Máy (Serial)" width="180" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-2">
              <el-icon class="text-slate-400"><Cpu /></el-icon>
              <span class="font-bold text-slate-800 font-mono">{{ scope.row.maMay }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Sản phẩm" min-width="250">
          <template #default="scope">
            <span class="font-semibold text-slate-700">{{ getTenSP(scope.row.maSP) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="maPhieuNhap" label="Phiếu Nhập" width="140" align="center">
          <template #default="scope">
            <el-tag type="info" effect="plain" class="font-mono">PN-{{ scope.row.maPhieuNhap }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="maHoaDon" label="Hóa Đơn Xuất" width="140" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.maHoaDon" type="warning" effect="plain" class="font-mono">
              {{ scope.row.maHoaDon }}
            </el-tag>
            <span v-else class="text-xs text-slate-400 italic">Chưa bán</span>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" width="150" align="center">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.trangThai)" effect="dark" class="font-bold w-28">
              {{ scope.row.trangThai }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              link 
              @click="openEditModal(scope.row)"
              :disabled="scope.row.trangThai === 'Đã bán'"
              :title="scope.row.trangThai === 'Đã bán' ? 'Máy đã bán không thể sửa' : 'Cập nhật trạng thái'"
            >
              <el-icon class="text-xl"><EditPen /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      title="CẬP NHẬT TRẠNG THÁI MÁY" 
      width="450px"
      destroy-on-close
      class="custom-dialog"
    >
      <div v-if="selectedMachine" class="space-y-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
          <p class="text-slate-500 mb-1">Mã Serial:</p>
          <p class="font-bold text-lg text-blue-600 font-mono mb-3">{{ selectedMachine.maMay }}</p>
          <p class="text-slate-500 mb-1">Sản phẩm:</p>
          <p class="font-bold text-slate-800">{{ getTenSP(selectedMachine.maSP) }}</p>
        </div>

        <el-form label-position="top">
          <el-form-item label="Trạng thái hiện tại của máy:">
            <el-select v-model="selectedMachine.trangThai" class="w-full" size="large">
              <el-option label="Sẵn sàng (Đưa lên kệ bán)" value="Sẵn sàng" />
              <el-option label="Hư hỏng (Lưu kho chờ xử lý)" value="Hư hỏng" />
              <el-option label="Đang bảo hành (Gửi hãng)" value="Đang bảo hành" />
              </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="saveStatus" class="font-bold">LƯU TRẠNG THÁI</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { FullScreen, Cpu, EditPen } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// --- MOCK DATABASE ---
const dbSanPham = ref([
  { maSP: 1, tenSP: 'MacBook Air M2 13 inch' },
  { maSP: 2, tenSP: 'Dell XPS 13 Plus 9320' },
  { maSP: 3, tenSP: 'Asus ROG Strix G15' },
]);

// Bảng Máy Tính (Khớp 100% DB của bạn)
const dbMayTinh = ref([
  { maMay: 'SN-MAC-11111', maSP: 1, maPhieuNhap: 827364, maHoaDon: null, trangThai: 'Sẵn sàng' },
  { maMay: 'SN-MAC-22222', maSP: 1, maPhieuNhap: 827364, maHoaDon: null, trangThai: 'Sẵn sàng' },
  { maMay: 'SN-MAC-33333', maSP: 1, maPhieuNhap: 827364, maHoaDon: 'HD-998877', trangThai: 'Đã bán' },
  { maMay: 'SN-DELL-99991', maSP: 2, maPhieuNhap: 192837, maHoaDon: null, trangThai: 'Sẵn sàng' },
  { maMay: 'SN-DELL-99992', maSP: 2, maPhieuNhap: 192837, maHoaDon: null, trangThai: 'Hư hỏng' },
]);

// --- STATE ---
const searchQuery = ref('');
const filterSP = ref('');
const filterStatus = ref('');
const dialogVisible = ref(false);
const selectedMachine = ref(null);

// --- COMPUTED ---
const filteredSerials = computed(() => {
  return dbMayTinh.value.filter(mt => {
    const matchQuery = mt.maMay.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchSP = filterSP.value ? mt.maSP === filterSP.value : true;
    const matchStatus = filterStatus.value ? mt.trangThai === filterStatus.value : true;
    return matchQuery && matchSP && matchStatus;
  });
});

// --- METHODS ---
const getTenSP = (maSP) => {
  const sp = dbSanPham.value.find(s => s.maSP === maSP);
  return sp ? sp.tenSP : 'Lỗi dữ liệu';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Sẵn sàng': return 'success';
    case 'Đã bán': return 'info';
    case 'Đang bảo hành': return 'warning';
    case 'Hư hỏng': return 'danger';
    default: return '';
  }
};

const openEditModal = (row) => {
  // Deep copy để lỡ bấm Hủy thì không bị đổi trên bảng
  selectedMachine.value = { ...row }; 
  dialogVisible.value = true;
};

const saveStatus = () => {
  // Cập nhật lại vào Mảng
  const index = dbMayTinh.value.findIndex(mt => mt.maMay === selectedMachine.value.maMay);
  if (index !== -1) {
    dbMayTinh.value[index].trangThai = selectedMachine.value.trangThai;
    ElMessage.success(`Đã cập nhật trạng thái máy ${selectedMachine.value.maMay} thành: ${selectedMachine.value.trangThai}`);
  }
  dialogVisible.value = false;
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
</style>