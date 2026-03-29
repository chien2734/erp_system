<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Quản lý Hóa Đơn Bán Hàng</h2>
        <p class="text-slate-500">Tra cứu lịch sử giao dịch, chi tiết đơn hàng và số Serial đã xuất</p>
      </div>
      <div class="flex gap-3">
        <el-input 
          v-model="searchQuery" 
          placeholder="Tìm Mã HĐ hoặc SĐT khách..." 
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
      <el-table :data="filteredHoaDon" style="width: 100%" size="large" stripe>
        
        <el-table-column prop="maHoaDon" label="Mã Hóa Đơn" width="140">
          <template #default="scope">
            <span class="font-bold text-blue-600 font-mono">{{ scope.row.maHoaDon }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="ngayLap" label="Ngày Lập" width="180">
          <template #default="scope">
            <div class="flex items-center gap-2 text-slate-600">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(scope.row.ngayLap) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Khách Hàng" min-width="200">
          <template #default="scope">
            <div>
              <p class="font-bold text-slate-800">{{ scope.row.tenKH }}</p>
              <!-- <p class="text-xs text-slate-500 font-mono mt-0.5"><el-icon><Phone /></el-icon> {{ scope.row.sdt }}</p> -->
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Số điện thoại" min-width="200">
          <template #default="scope">
            <div>
              <p class="font-bold text-slate-500">{{ scope.row.sdt }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Thanh Toán (Doanh thu)" width="250" align="right">
          <template #default="scope">
            <span class="font-black text-emerald-600">{{ formatPrice(scope.row.thanhTien) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="130" align="center" fixed="right">
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
      title="CHI TIẾT GIAO DỊCH" 
      width="850px"
      destroy-on-close
      class="custom-dialog"
    >
      <div v-if="selectedHoaDon" class="space-y-6">
        
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div>
            <p class="text-slate-500 mb-1">Mã Hóa Đơn:</p>
            <p class="font-bold text-lg text-blue-600 font-mono">HD-{{ selectedHoaDon.maHoaDon }}</p>
          </div>
          <div>
            <p class="text-slate-500 mb-1">Ngày bán:</p>
            <p class="font-bold text-slate-800">{{ formatDate(selectedHoaDon.ngayLap) }}</p>
          </div>
          <div class="border-t border-slate-200 pt-3">
            <p class="text-slate-500 mb-1">Khách hàng:</p>
            <p class="font-bold text-slate-800">{{ selectedHoaDon.tenKH }}</p>
            <p class="text-slate-600">{{ selectedHoaDon.sdt }}</p>
          </div>
          <div class="border-t border-slate-200 pt-3">
            <p class="text-slate-500 mb-1">Nhân viên bán hàng:</p>
            <p class="font-bold text-slate-800">
              <el-icon class="mr-1 text-blue-500"><User /></el-icon> 
              {{ selectedHoaDon.tenNhanVien || 'Không xác định' }}
            </p>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-slate-800 mb-3">Sản phẩm đã mua</h3>
          <el-table :data="selectedHoaDon.chiTiet" style="width: 100%" border>
            
            <el-table-column type="expand">
              <template #default="props">
                <div class="p-4 bg-slate-50 border-y border-slate-200 shadow-inner">
                  <p class="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Số Serial (maMay) đã xuất cho khách:</p>
                  <div class="flex flex-wrap gap-2">
                    <el-tag 
                      v-for="sn in props.row.serials" 
                      :key="sn" 
                      type="success" 
                      effect="light" 
                      class="font-mono text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                    >
                      <el-icon class="mr-1"><FullScreen /></el-icon> {{ sn }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="tenSP" label="Tên Sản Phẩm" min-width="200">
              <template #default="scope">
                <span class="font-semibold text-slate-800">{{ scope.row.tenSP }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="donGia" label="Đơn giá bán" width="130" align="right">
              <template #default="scope">
                {{ formatPrice(scope.row.donGia) }}
              </template>
            </el-table-column>

            <el-table-column prop="soLuong" label="SL" width="70" align="center">
              <template #default="scope">
                <span class="font-bold">{{ scope.row.soLuong }}</span>
              </template>
            </el-table-column>

            <el-table-column label="Thành tiền" width="150" align="right">
              <template #default="scope">
                <span class="font-bold text-blue-600">{{ formatPrice(scope.row.thanhTien) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <div class="text-right space-y-1">
            <div class="flex justify-between gap-8 text-sm text-slate-500">
              <span>Tổng cộng:</span>
              <span>{{ formatPrice(selectedHoaDon.tongTien) }}</span>
            </div>
            <div class="flex justify-between gap-8 text-xl mt-2 pt-2 border-t border-slate-200">
              <span class="font-bold text-slate-800">KHÁCH ĐÃ TRẢ:</span>
              <span class="font-black text-emerald-600">{{ formatPrice(selectedHoaDon.thanhTien) }}</span>
            </div>
          </div>
        </div>

      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="dialogVisible = false" size="large">Đóng</el-button>
          <el-button type="primary" size="large" @click="handlePrint">
            <el-icon class="mr-2"><Printer /></el-icon> In Lại Hóa Đơn
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Calendar, Phone, FullScreen, Printer, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api';

// --- STATE ---
const dbHoaDon = ref([]);
const loading = ref(false);
const detailLoading = ref(false);

const searchQuery = ref('');
const dateRange = ref('');
const dialogVisible = ref(false);
const selectedHoaDon = ref(null);

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
                        
    // Lọc theo ngày (nếu có chọn)
    if (dateRange.value && dateRange.value.length === 2) {
      const pDate = new Date(hd.ngayLap).getTime();
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

// Gọi API lấy Chi tiết Hóa đơn (Gồm Tên NV, Tên KH và Mảng Serial)
const openDetail = async (hoadon) => {
  dialogVisible.value = true;
  // Gán tạm thông tin cơ bản để hiện khung xương
  selectedHoaDon.value = { ...hoadon, chiTiet: [] }; 
  detailLoading.value = true;

  try {
    const res = await api.get(`/sales/hoadon/${hoadon.maHoaDon}`);
    // Đắp dữ liệu full từ Backend trả về
    selectedHoaDon.value = res.data || hoadon;
  } catch (error) {
    ElMessage.error('Không thể tải chi tiết hóa đơn!');
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
:deep(.el-table__expanded-cell) {
  padding: 0 !important;
}
</style>