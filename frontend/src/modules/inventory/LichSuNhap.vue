<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <el-button link @click="$router.push('/inventory/stock')" class="!p-0 text-slate-400 hover:text-blue-500">
            <el-icon class="text-xl"><Back /></el-icon>
          </el-button>
          <h2 class="text-xl md:text-2xl font-bold text-slate-900">Lịch sử Nhập kho</h2>
        </div>
        <p class="text-xs md:text-sm text-slate-500 ml-6 md:ml-7">Tra cứu các phiếu nhập hàng và chi tiết mã Serial</p>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
        <el-input 
          v-model="searchQuery" 
          placeholder="Tìm theo Mã phiếu..." 
          :prefix-icon="Search"
          class="w-full sm:!w-48 md:!w-64"
          size="large"
          clearable
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="Từ ngày"
          end-placeholder="Đến ngày"
          format="DD/MM/YYYY"
          class="!w-full sm:!w-60 md:!w-72"
          size="large"
        />
      </div>
    </div>

    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <el-table :data="paginatedData" style="width: 100%" size="large" stripe class="min-w-[800px]">
        
        <el-table-column prop="maPhieuNhap" label="Mã Phiếu" width="120" fixed="left">
          <template #default="scope">
            <span class="font-bold text-blue-600 font-mono whitespace-nowrap">PN-{{ scope.row.maPhieuNhap }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="ngayNhap" label="Ngày Nhập" min-width="150" align="center">
          <template #default="scope">
            <div class="flex justify-center items-center gap-1.5 text-slate-600 text-sm whitespace-nowrap">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(scope.row.ngayNhap) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="tenNCC" label="Nhà Cung Cấp" min-width="200">
          <template #default="scope">
            <span class="font-semibold text-slate-800 line-clamp-2" :title="scope.row.tenNCC">{{ scope.row.tenNCC }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenNhanVien" label="Người Lập Phiếu" min-width="160">
          <template #default="scope">
            <div class="flex items-center gap-2 whitespace-nowrap">
              <el-avatar :size="24" class="bg-blue-100 text-blue-600 font-bold text-xs shrink-0">
                {{ scope.row.tenNhanVien ? scope.row.tenNhanVien.charAt(0).toUpperCase() : '?' }}
              </el-avatar>
              <span class="font-semibold text-slate-700 truncate" :title="scope.row.tenNhanVien || 'Admin'">{{ scope.row.tenNhanVien || 'Admin' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="tongTien" label="Tổng Giá Trị" min-width="150" align="right">
          <template #default="scope">
            <span class="font-bold text-emerald-600 whitespace-nowrap">{{ formatPrice(scope.row.tongTien) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" plain size="small" @click="openDetail(scope.row)" class="w-full font-bold">
              Chi tiết
            </el-button>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm mt-4 gap-4">
      <p class="text-sm text-slate-500 w-full sm:w-1/3 text-center sm:text-left">
        Đang hiển thị <span class="font-bold text-slate-800">{{ paginatedData.length }}</span> / {{ totalItems }} dòng
      </p>
      
      <div class="w-full sm:w-1/3 flex justify-center">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalItems"
          background
          layout="prev, pager, next"
        />
      </div>

      <div class="hidden sm:block sm:w-1/3"></div>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      title="CHI TIẾT PHIẾU NHẬP KHO" 
      width="850px"
      destroy-on-close
      class="custom-dialog responsive-dialog print-dialog"
    >
      <div id="printable-invoice" v-if="selectedPhieu" class="space-y-4 md:space-y-6" v-loading="detailLoading">
        
        <div class="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-sm print-header">
          <div class="flex justify-between sm:block border-b border-slate-200 sm:border-0 pb-2 sm:pb-0">
            <p class="text-slate-500 mb-1">Mã phiếu nhập:</p>
            <p class="font-bold text-base md:text-lg text-blue-600 font-mono">PN-{{ selectedPhieu.maPhieuNhap }}</p>
          </div>
          <div class="flex justify-between sm:block border-b border-slate-200 sm:border-0 pb-2 sm:pb-0">
            <p class="text-slate-500 mb-1">Ngày lập phiếu:</p>
            <p class="font-bold text-slate-800">{{ formatDate(selectedPhieu.ngayNhap) }}</p>
          </div>
          <div class="flex justify-between sm:block sm:border-t md:border-0 border-slate-200 sm:pt-3 md:pt-0">
            <p class="text-slate-500 mb-1 hidden sm:block">Người lập phiếu:</p>
            <p class="font-bold text-slate-800 flex items-center justify-between sm:justify-start gap-1 w-full sm:w-auto">
              <span class="sm:hidden text-slate-500 font-normal">Người lập:</span>
              <span><el-icon class="text-blue-500 align-middle"><User /></el-icon> {{ selectedPhieu.tenNhanVien || 'Admin' }}</span>
            </p>
          </div>
          <div class="sm:col-span-2 md:col-span-3 border-t border-slate-200 pt-3 border-dashed">
            <p class="text-slate-500 mb-1 hidden sm:block">Nhà cung cấp:</p>
            <p class="font-bold text-slate-800 flex justify-between sm:block w-full">
              <span class="sm:hidden text-slate-500 font-normal">Nhà cung cấp:</span>
              <span class="text-right sm:text-left">{{ selectedPhieu.tenNCC }}</span>
            </p>
          </div>
        </div>

        <div class="print-table-wrapper">
          <h3 class="font-bold text-slate-800 mb-2 md:mb-3 text-sm md:text-base">Danh sách sản phẩm nhập ({{ selectedPhieu.chiTiet.length }} mã)</h3>
          <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <el-table :data="selectedPhieu.chiTiet" style="width: 100%" border class="min-w-[600px]">
              
              <el-table-column type="expand">
                <template #default="props">
                  <div class="p-2 md:p-4 bg-slate-50 border-y border-slate-200 shadow-inner">
                    <p class="text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 md:mb-2 uppercase tracking-wider">Danh sách Số Serial (S/N) đã nhập:</p>
                    <div class="flex flex-wrap gap-1.5 md:gap-2">
                      <el-tag 
                        v-for="sn in props.row.serials" 
                        :key="sn" 
                        type="info" 
                        effect="plain" 
                        class="font-mono text-[10px] md:text-xs border-slate-300 text-slate-700 bg-white"
                      >
                        <el-icon class="mr-0.5"><FullScreen /></el-icon> {{ sn }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="maSP" label="Mã SP" width="80" align="center">
                <template #default="scope">
                  <span class="font-mono text-slate-600 text-xs font-bold">SP{{ scope.row.maSP }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="tenSP" label="Tên Sản Phẩm" min-width="200">
                <template #default="scope">
                  <span class="font-semibold text-slate-800 text-xs md:text-sm line-clamp-2" :title="scope.row.tenSP">{{ scope.row.tenSP }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="donGiaNhap" label="Đơn giá" min-width="110" align="right">
                <template #default="scope"><span class="whitespace-nowrap">{{ formatPrice(scope.row.donGiaNhap) }}</span></template>
              </el-table-column>

              <el-table-column prop="soLuong" label="SL" width="60" align="center">
                <template #default="scope"><span class="font-bold">{{ scope.row.soLuong }}</span></template>
              </el-table-column>

              <el-table-column label="Thành tiền" min-width="120" align="right">
                <template #default="scope">
                  <span class="font-bold text-emerald-600 whitespace-nowrap">{{ formatPrice(scope.row.donGiaNhap * scope.row.soLuong) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="flex justify-end pt-3 md:pt-4 border-t border-slate-100 print-total">
          <div class="text-right w-full sm:w-auto flex justify-between sm:block items-center bg-blue-50/50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
            <p class="text-slate-500 text-sm mb-0 sm:mb-1 font-medium">TỔNG GIÁ TRỊ PHIẾU:</p>
            <p class="text-xl md:text-2xl font-black text-blue-600">{{ formatPrice(selectedPhieu.tongTien) }}</p>
          </div>
        </div>

      </div>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-2">
          <el-button @click="dialogVisible = false" size="large" class="w-full sm:w-auto">Đóng</el-button>
          <el-button type="primary" size="large" @click="handlePrint" class="w-full sm:w-auto m-0 font-bold">
            <el-icon class="mr-2"><Printer /></el-icon> In Phiếu Nhập
          </el-button>
        </div>
      </template>
    </el-dialog>

    <PhieuNhapPrintDialog ref="printRef" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Calendar, Back, FullScreen, Printer, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api';
import PhieuNhapPrintDialog from './PhieuNhapPrintDialog.vue';
import { usePagination } from '../../composables/usePagination';

// --- STATE ---
const dbPhieuNhap = ref([]);
const loading = ref(false);
const detailLoading = ref(false);
const printRef = ref(null);
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
const filteredPhieu = computed(() => {
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

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(filteredPhieu, 10);

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

// Hàm handlePrint in phiếu nhập
const handlePrint = () => {
  if (!selectedPhieu.value || !printRef.value) return;

  dialogVisible.value = false;

  // Đẩy dữ liệu sang form in
  printRef.value.openPrint({
    maPhieuNhap: selectedPhieu.value.maPhieuNhap,
    ngayNhap: selectedPhieu.value.ngayNhap,
    tenNCC: selectedPhieu.value.tenNCC,
    tenNhanVien: selectedPhieu.value.tenNhanVien,
    items: selectedPhieu.value.chiTiet, 
    tongTien: selectedPhieu.value.tongTien
  });
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) { :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; } }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
:deep(.el-table__expanded-cell) { padding: 0 !important; }

/* Bóp chiều rộng Dialog trên màn hình nhỏ */
:deep(.responsive-dialog) { max-width: 95vw !important; }

/* Custom Scrollbar cho bảng */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* SỨC MẠNH CSS DÀNH CHO VIỆC IN ẤN (PRINT MEDIA) */
@media print {
  /* 1. Ẩn toàn bộ giao diện web */
  body * {
    visibility: hidden;
  }
  
  /* 2. Chỉ hiển thị vùng có ID #printable-invoice */
  #printable-invoice, #printable-invoice * {
    visibility: visible;
  }
  
  /* 3. Đưa phiếu in lên góc trái tờ giấy */
  #printable-invoice {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
    background: white;
    color: black !important;
  }

  .print-header { border: 1px solid #000; background: #fff !important; }
  .print-table-wrapper { width: 100%; overflow: visible !important; }
  
  /* ======================================================== */
  /* 4. PHÁ BẪY CHIỀU CAO CỦA EL-TABLE */
  /* ======================================================== */
  .overflow-x-auto { overflow: visible !important; }
  
  .el-table, 
  .el-table__inner-wrapper, 
  .el-table__body-wrapper, 
  .el-table__header-wrapper,
  .el-scrollbar__wrap,
  .el-scrollbar__view {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    position: static !important;
  }

  /* Định dạng lại viền bảng cho rõ nét */
  .el-table { width: 100% !important; border: 1px solid #000; border-bottom: none; }
  .el-table th, .el-table td { border-bottom: 1px solid #000 !important; color: black !important; }
  
  /* Ép bảng không được cắt ngang 1 dòng dữ liệu khi rớt qua trang 2 */
  .el-table tr { page-break-inside: avoid; }
  
  /* 5. Ép bung tất cả các hàng Serial ra giấy */
  .el-table__expand-icon { display: none !important; } 
  .el-table__expanded-cell { display: table-cell !important; } 
  
  /* Đổi thẻ Tag thành khung viền đen trắng */
  .el-tag { border: 1px solid #000 !important; color: #000 !important; background: transparent !important; }
}
</style>