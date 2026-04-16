<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Quản lý Hóa Đơn Bán Hàng</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Tra cứu lịch sử giao dịch, chi tiết đơn hàng và số Serial đã xuất</p>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
        <el-input 
          v-model="searchQuery" 
          placeholder="Mã HĐ hoặc SĐT..." 
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
      <el-table :data="paginatedData" style="width: 100%" size="large" stripe class="min-w-[700px]">
        
        <el-table-column prop="maHoaDon" label="Mã Hóa Đơn" min-width="120" fixed="left">
          <template #default="scope">
            <span class="font-bold text-blue-600 font-mono">HD{{ String(scope.row.maHoaDon).padStart(4, '0') }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="ngayLap" label="Ngày Lập" min-width="150" align="center">
          <template #default="scope">
            <div class="flex justify-center items-center gap-1.5 text-slate-600 text-sm whitespace-nowrap">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(scope.row.ngayLap) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Khách Hàng" min-width="160">
          <template #default="scope">
            <p class="font-bold text-slate-800 truncate" :title="scope.row.tenKH">{{ scope.row.tenKH }}</p>
          </template>
        </el-table-column>

        <el-table-column label="Số điện thoại" min-width="130" align="center">
          <template #default="scope">
            <p class="font-bold text-slate-500 whitespace-nowrap">{{ scope.row.sdt }}</p>
          </template>
        </el-table-column>

        <el-table-column label="Thanh Toán" min-width="150" align="right">
          <template #default="scope">
            <span class="font-black text-emerald-600 whitespace-nowrap">{{ formatPrice(scope.row.thanhTien) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" plain size="small" @click="openDetail(scope.row)" class="w-full">
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
      title="CHI TIẾT GIAO DỊCH" 
      width="850px"
      destroy-on-close
      class="custom-dialog responsive-dialog"
    >
      <div v-if="selectedHoaDon" class="space-y-4 md:space-y-6" v-loading="detailLoading">
        
        <div class="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div class="flex justify-between sm:block border-b border-slate-200 sm:border-0 pb-2 sm:pb-0">
            <p class="text-slate-500 mb-1">Mã Hóa Đơn:</p>
            <p class="font-bold text-base md:text-lg text-blue-600 font-mono">HD-{{ selectedHoaDon.maHoaDon }}</p>
          </div>
          <div class="flex justify-between sm:block border-b border-slate-200 sm:border-0 pb-2 sm:pb-0">
            <p class="text-slate-500 mb-1">Ngày bán:</p>
            <p class="font-bold text-slate-800">{{ formatDate(selectedHoaDon.ngayLap) }}</p>
          </div>
          <div class="sm:border-t border-slate-200 sm:pt-3">
            <p class="text-slate-500 mb-1 hidden sm:block">Khách hàng:</p>
            <p class="font-bold text-slate-800 flex justify-between sm:block">
              <span class="sm:hidden text-slate-500 font-normal">Khách:</span>
              {{ selectedHoaDon.tenKH }}
            </p>
            <p class="text-slate-600 text-right sm:text-left">{{ selectedHoaDon.sdt }}</p>
          </div>
          <div class="sm:border-t border-slate-200 sm:pt-3 border-t pt-2">
            <p class="text-slate-500 mb-1 hidden sm:block">Nhân viên thu ngân:</p>
            <p class="font-bold text-slate-800 flex justify-between sm:block">
               <span class="sm:hidden text-slate-500 font-normal">Thu ngân:</span>
               <span><el-icon class="mr-1 text-blue-500 align-middle"><User /></el-icon> {{ selectedHoaDon.tenNhanVien || 'Không xác định' }}</span>
            </p>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-slate-800 mb-2 md:mb-3">Sản phẩm đã mua</h3>
          <div class="overflow-x-auto rounded-lg border border-slate-200">
            <el-table :data="selectedHoaDon.chiTiet" style="width: 100%" border class="min-w-[500px]">
              
              <el-table-column type="expand">
                <template #default="props">
                  <div class="p-2 md:p-4 bg-slate-50 border-y border-slate-200 shadow-inner">
                    <p class="text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 md:mb-2 uppercase tracking-wider">Số Serial (S/N) xuất cho khách:</p>
                    <div class="flex flex-wrap gap-1.5 md:gap-2">
                      <el-tag 
                        v-for="sn in props.row.serials" 
                        :key="sn" 
                        type="success" 
                        effect="light" 
                        class="font-mono text-[10px] md:text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                      >
                        <el-icon class="mr-1"><FullScreen /></el-icon> {{ sn }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="tenSP" label="Tên Sản Phẩm" min-width="180">
                <template #default="scope"><span class="font-semibold text-slate-800 text-sm line-clamp-2">{{ scope.row.tenSP }}</span></template>
              </el-table-column>

              <el-table-column prop="donGia" label="Đơn giá" min-width="110" align="right">
                <template #default="scope"><span class="whitespace-nowrap">{{ formatPrice(scope.row.donGia) }}</span></template>
              </el-table-column>

              <el-table-column prop="soLuong" label="SL" width="60" align="center">
                <template #default="scope"><span class="font-bold">{{ scope.row.soLuong }}</span></template>
              </el-table-column>

              <el-table-column label="Thành tiền" min-width="130" align="right">
                <template #default="scope"><span class="font-bold text-blue-600 whitespace-nowrap">{{ formatPrice(scope.row.thanhTien) }}</span></template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="flex justify-end pt-3 md:pt-4 border-t border-slate-100">
          <div class="text-right space-y-1 w-full sm:w-auto">
            <div class="flex justify-between gap-4 md:gap-8 text-sm text-slate-500 px-2 sm:px-0">
              <span>Tổng cộng:</span>
              <span>{{ formatPrice(selectedHoaDon.tongTien) }}</span>
            </div>
            <div class="flex justify-between gap-4 md:gap-8 text-lg md:text-xl mt-2 pt-2 border-t border-slate-200 bg-emerald-50/50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
              <span class="font-bold text-slate-800">KHÁCH ĐÃ TRẢ:</span>
              <span class="font-black text-emerald-600">{{ formatPrice(selectedHoaDon.thanhTien) }}</span>
            </div>
          </div>
        </div>

      </div>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-2">
          <el-button @click="dialogVisible = false" size="large" class="w-full sm:w-auto">Đóng</el-button>
          
          <el-button type="primary" size="large" @click="handlePrintAgain" class="w-full sm:w-auto m-0 font-bold">
            <el-icon class="mr-2"><Printer /></el-icon> In Lại Hóa Đơn
          </el-button>
        </div>
      </template>
    </el-dialog>

    <BillPrintDialog ref="billDialogRef" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Calendar, Phone, FullScreen, Printer, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api';
import BillPrintDialog from './BillPrintDialog.vue';
import { usePagination } from '../../composables/usePagination';

// --- STATE ---
const dbHoaDon = ref([]);
const loading = ref(false);
const detailLoading = ref(false);

const searchQuery = ref('');
const dateRange = ref('');
const dialogVisible = ref(false);
const selectedHoaDon = ref(null);

// Biến tham chiếu tới Component In Bill
const billDialogRef = ref(null);

// --- FETCH DATA TỪ BACKEND ---
const loadData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/sales/hoadon');
    dbHoaDon.value = res.data || [];
  } catch (error) {
    ElMessage.error('Lỗi tải danh sách hóa đơn từ máy chủ!');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

// --- COMPUTED ---
const filteredHoaDon = computed(() => {
  return dbHoaDon.value.filter(hd => {
    const query = searchQuery.value.toLowerCase();
    const matchSearch = hd.maHoaDon.toString().includes(query) || 
                        (hd.sdt && hd.sdt.includes(query)) ||
                        (hd.tenKH && hd.tenKH.toLowerCase().includes(query));
                        
    if (dateRange.value && dateRange.value.length === 2) {
      const pDate = new Date(hd.ngayLap).getTime();
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
} = usePagination(filteredHoaDon, 10);

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

const openDetail = async (hoadon) => {
  dialogVisible.value = true;
  selectedHoaDon.value = { ...hoadon, chiTiet: [] }; 
  detailLoading.value = true;

  try {
    const res = await api.get(`/sales/hoadon/${hoadon.maHoaDon}`);
    selectedHoaDon.value = res.data || hoadon;
  } catch (error) {
    ElMessage.error('Không thể tải chi tiết hóa đơn!');
    dialogVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
};

// BÓC DỮ LIỆU ĐẨY VÀO COMPONENT IN BILL
const handlePrintAgain = () => {
  if (!selectedHoaDon.value || !billDialogRef.value) return;

  const billPayload = {
    maHoaDon: selectedHoaDon.value.maHoaDon,
    tongTien: selectedHoaDon.value.tongTien,
    giamGia: selectedHoaDon.value.giamGia, 
    khachDua: selectedHoaDon.value.tienKhachDua, 
    tenKhachHang: selectedHoaDon.value.tenKH,
    tenThuNgan: selectedHoaDon.value.tenNhanVien, 
    items: selectedHoaDon.value.chiTiet.map(sp => ({
      tenSP: sp.tenSP,
      giaBan: sp.donGia,
      serials: sp.serials
    }))
  };

  dialogVisible.value = false;
  billDialogRef.value.openBill(billPayload);
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
</style>