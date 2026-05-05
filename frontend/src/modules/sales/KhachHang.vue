<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <el-icon class="text-blue-600"><Avatar /></el-icon> Quản Lý Khách Hàng
        </h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Lưu trữ thông tin liên hệ và theo dõi lịch sử mua sắm của khách hàng</p>
      </div>
      <el-button type="primary" size="large" @click="openAddModal" class="w-full md:w-auto font-bold shadow-lg shadow-blue-500/30 shrink-0">
        <el-icon class="mr-2"><Plus /></el-icon> THÊM KHÁCH HÀNG
      </el-button>
    </div>

    <div class="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center">
      <el-input 
        v-model="searchQuery" 
        placeholder="Tìm theo Tên hoặc Số điện thoại..." 
        class="w-full sm:!w-80"
        size="large"
        clearable
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      
      <div class="sm:ml-auto text-xs md:text-sm text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-slate-100 w-full sm:w-auto text-center sm:text-right">
        Tổng số: <span class="text-blue-600 font-bold text-base md:text-lg">{{ filteredCustomers.length }}</span> khách hàng
      </div>
    </div>

    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <el-table :data="paginatedData" style="width: 100%" size="large" stripe border class="min-w-[700px]">
        
        <el-table-column label="Khách hàng" min-width="220" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <el-avatar :size="40" class="bg-blue-50 text-blue-600 font-bold shrink-0">
                {{ getInitials(scope.row.tenKH) }}
              </el-avatar>
              <div class="min-w-0">
                <p class="font-bold text-slate-800 truncate" :title="scope.row.tenKH">{{ scope.row.tenKH }}</p>
                <p class="text-xs text-slate-500 font-mono mt-0.5 truncate">KH{{ String(scope.row.maKH).padStart(4, '0') }}</p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="sdt" label="Số điện thoại" min-width="130" align="center">
          <template #default="scope">
            <span class="font-semibold text-blue-600 whitespace-nowrap">{{ scope.row.sdt }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="diaChi" label="Địa chỉ" min-width="250">
          <template #default="scope">
            <span class="text-sm text-slate-600 line-clamp-2" :title="scope.row.diaChi">{{ scope.row.diaChi || 'Chưa cập nhật' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button type="success" link @click="openHistory(scope.row)" title="Lịch sử mua hàng">
              <el-icon class="text-xl"><ShoppingBag /></el-icon>
            </el-button>
            <el-button type="primary" link @click="openEditModal(scope.row)" title="Sửa thông tin">
              <el-icon class="text-xl"><EditPen /></el-icon>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? 'CẬP NHẬT THÔNG TIN' : 'THÊM KHÁCH HÀNG MỚI'" width="500px" class="custom-dialog responsive-dialog">
      <el-form label-position="top">
        <el-form-item label="Tên khách hàng (*)">
          <el-input v-model="formCustomer.tenKH" placeholder="VD: Nguyễn Văn A" size="large" />
        </el-form-item>
        <el-form-item label="Số điện thoại (*)">
          <el-input v-model="formCustomer.sdt" placeholder="VD: 0988123456" size="large" />
        </el-form-item>
        <el-form-item label="Địa chỉ giao hàng / Hóa đơn">
          <el-input v-model="formCustomer.diaChi" type="textarea" :rows="3" placeholder="Số nhà, Tên đường, Quận/Huyện..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2">
          <el-button @click="dialogVisible = false" class="w-full sm:w-auto">Hủy</el-button>
          <el-button type="primary" @click="saveCustomer" class="font-bold w-full sm:w-auto m-0">LƯU KHÁCH HÀNG</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="historyVisible" :title="`LỊCH SỬ MUA HÀNG`" width="700px" class="custom-dialog responsive-dialog">
      <div v-if="selectedCustomer" class="space-y-4">
        
        <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3">
          <el-avatar :size="40" class="bg-blue-600 text-white font-bold shrink-0">{{ getInitials(selectedCustomer.tenKH) }}</el-avatar>
          <div class="min-w-0">
            <p class="font-bold text-blue-900 truncate">{{ selectedCustomer.tenKH }}</p>
            <p class="text-xs text-blue-600 truncate">{{ selectedCustomer.sdt }}</p>
          </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-slate-200" v-loading="historyLoading">
          <el-table :data="customerInvoices" style="width: 100%" border stripe size="small" class="min-w-[400px]">
            <el-table-column prop="maHD" label="Mã HD" min-width="90" align="center">
              <template #default="scope"><span class="font-bold text-blue-600 whitespace-nowrap">HD{{ scope.row.maHD }}</span></template>
            </el-table-column>
            
            <el-table-column prop="ngayMua" label="Ngày mua" min-width="110" align="center">
               <template #default="scope"><span class="whitespace-nowrap">{{ scope.row.ngayMua }}</span></template>
            </el-table-column>
            
            <el-table-column prop="tongTien" label="Tổng tiền" min-width="130" align="right">
              <template #default="scope"><span class="font-semibold text-slate-800 whitespace-nowrap">{{ formatPrice(scope.row.tongTien) }}</span></template>
            </el-table-column>
          </el-table>
        </div>
        
        <div v-if="customerInvoices.length === 0 && !historyLoading" class="text-center bg-slate-50 border border-dashed border-slate-300 rounded-lg py-8">
          <el-icon class="text-3xl text-slate-300 mb-2"><ShoppingCart /></el-icon>
          <p class="text-sm text-slate-500 font-medium">Khách hàng này chưa có giao dịch nào.</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="historyVisible = false" class="w-full sm:w-auto">Đóng</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, EditPen, ShoppingBag, Avatar } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api';
import { usePagination } from '../../composables/usePagination';


// --- STATE ---
const dbKhachHang = ref([]);
const loading = ref(false);
const historyLoading = ref(false);

const searchQuery = ref('');
const dialogVisible = ref(false);
const isEdit = ref(false);
const formCustomer = ref({ maKH: null, tenKH: '', sdt: '', diaChi: '' });
const historyVisible = ref(false);
const selectedCustomer = ref(null);
const customerInvoices = ref([]);

// --- FETCH DATA TỪ BACKEND ---
const loadCustomers = async () => {
  loading.value = true;
  try {
    // Thêm limit cao để lấy hết (do backend bạn đang có phân trang)
    const res = await api.get('/sales/khachhang?limit=1000');
    // Backend trả về dạng { success: true, data: [...], pagination: {...} }
    dbKhachHang.value = res.data || [];
  } catch (error) {
    ElMessage.error('Không thể tải danh sách khách hàng từ máy chủ!');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCustomers();
});

// --- COMPUTED ---
const filteredCustomers = computed(() => {
  return dbKhachHang.value.filter(kh => {
    return kh.tenKH.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
           kh.sdt.includes(searchQuery.value);
  });
});

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(filteredCustomers, 10);

// --- METHODS ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const getInitials = (name) => {
  if (!name) return 'KH';
  const words = name.trim().split(' ');
  return words.length > 1 
    ? (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase() 
    : name.substring(0, 2).toUpperCase();
};

// --- QUẢN LÝ MODAL THÊM/SỬA ---
const openAddModal = () => {
  isEdit.value = false;
  formCustomer.value = { maKH: null, tenKH: '', sdt: '', diaChi: '' };
  dialogVisible.value = true;
};

const openEditModal = (row) => {
  isEdit.value = true;
  formCustomer.value = { ...row };
  dialogVisible.value = true;
};

// --- GỌI API LƯU KHÁCH HÀNG ---
const saveCustomer = async () => {
  if (!formCustomer.value.tenKH || !formCustomer.value.sdt) {
    ElMessage.error('Vui lòng nhập Tên và Số điện thoại!');
    return;
  }
  
  try {
    if (isEdit.value) {
      await api.put(`/sales/khachhang/${formCustomer.value.maKH}`, formCustomer.value);
      ElMessage.success('Cập nhật thông tin khách hàng thành công!');
      loadCustomers(); // Load lại danh sách mới nhất từ DB
    } else {
      await api.post('/sales/khachhang', formCustomer.value);
      ElMessage.success('Đã thêm khách hàng mới vào hệ thống!');
      loadCustomers(); 
    }
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi lưu thông tin khách hàng!');
  }
};

// --- GỌI API LỊCH SỬ MUA HÀNG ---
const openHistory = async (row) => {
  selectedCustomer.value = row;
  historyVisible.value = true;
  historyLoading.value = true;
  
  try {
    // Tận dụng API Lấy danh sách hóa đơn để lọc ra các hóa đơn của khách này
    const res = await api.get('/sales/hoadon');
    const allInvoices = res.data.data || res.data || [];
    
    // Lọc và map lại dữ liệu cho khớp với bảng lịch sử
    customerInvoices.value = allInvoices
      .filter(hd => hd.maKH === row.maKH)
      .map(hd => ({
        maHD: hd.maHoaDon,
        ngayMua: new Date(hd.ngayLap).toLocaleDateString('vi-VN'),
        tongTien: hd.thanhTien,
      }));
  } catch (error) {
    ElMessage.error('Không thể tải lịch sử mua hàng!');
  } finally {
    historyLoading.value = false;
  }
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) {
  :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; }
}
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }

/* Bọc thép Dialog cho Mobile */
:deep(.responsive-dialog) { max-width: 95vw !important; }

/* Custom Scrollbar cho bảng */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>