<template>
  <div class="space-y-6 relative">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <el-button link @click="$router.push('/inventory/stock')" class="!p-0 text-slate-400 hover:text-blue-500">
            <el-icon class="text-xl"><Back /></el-icon>
          </el-button>
          <h2 class="text-2xl font-bold text-slate-900">Lịch sử Nhập kho</h2>
        </div>
        <p class="text-slate-500 ml-7">Tra cứu các phiếu nhập hàng và chi tiết mã Serial</p>
      </div>
      <div class="flex gap-3">
        <el-input 
          v-model="searchQuery" 
          placeholder="Tìm theo Mã phiếu..." 
          :prefix-icon="Search"
          class="!w-64"
          clearable
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="Đến"
          start-placeholder="Từ ngày"
          end-placeholder="Đến ngày"
          format="DD/MM/YYYY"
          class="!w-72"
        />
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredPhiếu" style="width: 100%" size="large" stripe>
        
        <el-table-column prop="maPhieuNhap" label="Mã Phiếu" width="150">
          <template #default="scope">
            <span class="font-bold text-blue-600 font-mono">PN-{{ scope.row.maPhieuNhap }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="ngayNhap" label="Ngày Nhập" width="180">
          <template #default="scope">
            <div class="flex items-center gap-2 text-slate-600">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(scope.row.ngayNhap) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="tenNCC" label="Nhà Cung Cấp" min-width="250">
          <template #default="scope">
            <span class="font-semibold text-slate-800">{{ scope.row.tenNCC }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenNhanVien" label="Người Lập Phiếu" min-width="160">
          <template #default="scope">
            <div class="flex items-center gap-2">
              <el-avatar :size="24" class="bg-blue-100 text-blue-600 font-bold text-xs">
                {{ scope.row.tenNhanVien ? scope.row.tenNhanVien.charAt(0).toUpperCase() : '?' }}
              </el-avatar>
              <span class="font-semibold text-slate-700">{{ scope.row.tenNhanVien || 'Admin' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="tongTien" label="Tổng Giá Trị" min-width="180" align="right">
          <template #default="scope">
            <span class="font-bold text-emerald-600">{{ formatPrice(scope.row.tongTien) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" plain size="small" @click="openDetail(scope.row)">
              Xem chi tiết
            </el-button>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      title="CHI TIẾT PHIẾU NHẬP KHO" 
      width="850px"
      destroy-on-close
      class="custom-dialog"
    >
      <div v-if="selectedPhieu" class="space-y-6">
        
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-slate-500 mb-1">Mã phiếu nhập:</p>
            <p class="font-bold text-lg text-blue-600 font-mono">PN-{{ selectedPhieu.maPhieuNhap }}</p>
          </div>
          <div>
            <p class="text-slate-500 mb-1">Ngày lập phiếu:</p>
            <p class="font-bold text-slate-800">{{ formatDate(selectedPhieu.ngayNhap) }}</p>
          </div>
          <div>
            <p class="text-slate-500 mb-1">Người lập phiếu:</p>
            <p class="font-bold text-slate-800 flex items-center gap-1">
              <el-icon class="text-blue-500"><User /></el-icon> 
              {{ selectedPhieu.tenNhanVien || 'Admin' }}
            </p>
          </div>
          <div class="col-span-3 border-t border-slate-200 pt-3">
            <p class="text-slate-500 mb-1">Nhà cung cấp:</p>
            <p class="font-bold text-slate-800">{{ selectedPhieu.tenNCC }}</p>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-slate-800 mb-3">Danh sách sản phẩm nhập ({{ selectedPhieu.chiTiet.length }} mã)</h3>
          <el-table :data="selectedPhieu.chiTiet" style="width: 100%" border>
            
            <el-table-column type="expand">
              <template #default="props">
                <div class="p-4 bg-slate-50 border-y border-slate-200 shadow-inner">
                  <p class="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Danh sách Số Serial (maMay) đã nhập:</p>
                  <div class="flex flex-wrap gap-2">
                    <el-tag 
                      v-for="sn in props.row.serials" 
                      :key="sn" 
                      type="info" 
                      effect="plain" 
                      class="font-mono text-xs border-slate-300 text-slate-700 bg-white"
                    >
                      <el-icon class="mr-1"><FullScreen /></el-icon> {{ sn }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="maSP" label="Mã SP" width="140">
              <template #default="scope">
                <span class="font-mono text-slate-600 text-xs font-bold">{{ scope.row.maSP }}</span>
              </template>
            </el-table-column>
            
            <el-table-column prop="tenSP" label="Tên Sản Phẩm" min-width="200">
              <template #default="scope">
                <span class="font-semibold text-slate-800">{{ scope.row.tenSP }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="donGiaNhap" label="Đơn giá nhập" width="130" align="right">
              <template #default="scope">
                {{ formatPrice(scope.row.donGiaNhap) }}
              </template>
            </el-table-column>

            <el-table-column prop="soLuong" label="SL" width="70" align="center">
              <template #default="scope">
                <span class="font-bold">{{ scope.row.soLuong }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Thành tiền" width="150" align="right">
              <template #default="scope">
                <span class="font-bold text-emerald-600">{{ formatPrice(scope.row.donGiaNhap * scope.row.soLuong) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <div class="text-right">
            <p class="text-slate-500 text-sm mb-1">TỔNG GIÁ TRỊ PHIẾU NHẬP</p>
            <p class="text-2xl font-black text-blue-600">{{ formatPrice(selectedPhieu.tongTien) }}</p>
          </div>
        </div>

      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="dialogVisible = false" size="large">Đóng</el-button>
          <el-button type="primary" size="large" @click="handlePrint">
            <el-icon class="mr-2"><Printer /></el-icon> In Phiếu
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Calendar, Back, FullScreen, Printer, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api';

// --- STATE ---
const dbPhieuNhap = ref([]);
const loading = ref(false);
const detailLoading = ref(false);

const searchQuery = ref('');
const dateRange = ref('');
const dialogVisible = ref(false);
const selectedPhieu = ref(null);

// --- LOAD DATA TỪ API ---
const loadData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/inventory/nhapkho');
    dbPhieuNhap.value = res.data || [];
  } catch (error) {
    ElMessage.error('Không thể tải lịch sử nhập kho');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

// --- COMPUTED ---
const filteredPhiếu = computed(() => {
  return dbPhieuNhap.value.filter(phieu => {
    const matchSearch = phieu.maPhieuNhap.toString().includes(searchQuery.value);
    // Tích hợp lọc theo Ngày (nếu có chọn DateRange)
    if (dateRange.value && dateRange.value.length === 2) {
      const pDate = new Date(phieu.ngayNhap).getTime();
      const start = new Date(dateRange.value[0]).getTime();
      const end = new Date(dateRange.value[1]).setHours(23, 59, 59, 999);
      return matchSearch && (pDate >= start && pDate <= end);
    }
    return matchSearch;
  });
});

// --- METHODS ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('vi-VN', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit'
  });
};

// Gọi API lấy chi tiết mỗi khi bấm "Xem chi tiết" (Tối ưu hiệu năng, không tải nặng từ đầu)
const openDetail = async (phieu) => {
  dialogVisible.value = true;
  selectedPhieu.value = { ...phieu, chiTiet: [] }; // Hiển thị khung sườn trước
  detailLoading.value = true;

  try {
    const res = await api.get(`/inventory/ctnhapkho/${phieu.maPhieuNhap}`);
    // Đắp data chi tiết vào phiếu đang chọn
    selectedPhieu.value.chiTiet = res.data || [];
  } catch (error) {
    ElMessage.error('Lỗi khi tải chi tiết phiếu nhập!');
    dialogVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
};

const handlePrint = () => {
  window.print(); 
};
</script>

<style scoped>
/* Bo tròn Dialog cho hiện đại */
:deep(.custom-dialog) {
  border-radius: 16px;
  overflow: hidden;
}
:deep(.custom-dialog .el-dialog__header) {
  background-color: #f8fafc;
  margin-right: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
:deep(.custom-dialog .el-dialog__title) {
  font-weight: 800;
  color: #0f172a;
}
/* Tuỳ chỉnh hàng mở rộng (Expand row) của Table */
:deep(.el-table__expanded-cell) {
  padding: 0 !important;
}
</style>