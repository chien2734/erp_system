<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <el-icon class="text-blue-600"><Avatar /></el-icon> Quản lý Khách Hàng
        </h2>
        <p class="text-slate-500 mt-1">Lưu trữ thông tin liên hệ và theo dõi lịch sử mua sắm của khách hàng</p>
      </div>
      <el-button type="primary" size="large" @click="openAddModal" class="font-bold shadow-lg shadow-blue-500/30">
        <el-icon class="mr-2"><Plus /></el-icon> THÊM KHÁCH HÀNG
      </el-button>
    </div>

    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
      <el-input 
        v-model="searchQuery" 
        placeholder="Tìm theo Tên hoặc Số điện thoại..." 
        class="!w-80"
        clearable
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <div class="ml-auto text-sm text-slate-500 font-semibold">
        Tổng số: <span class="text-blue-600 font-bold text-lg">{{ filteredCustomers.length }}</span> khách hàng
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredCustomers" style="width: 100%" size="large" stripe border>
        
        <el-table-column label="Khách hàng" min-width="220" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <el-avatar :size="40" class="bg-blue-50 text-blue-600 font-bold">
                {{ getInitials(scope.row.tenKH) }}
              </el-avatar>
              <div>
                <p class="font-bold text-slate-800">{{ scope.row.tenKH }}</p>
                <p class="text-xs text-slate-500 font-mono mt-0.5">KH{{ String(scope.row.maKH).padStart(4, '0') }}</p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="sdt" label="Số điện thoại" width="150" align="center">
          <template #default="scope">
            <span class="font-semibold text-blue-600">{{ scope.row.sdt }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="diaChi" label="Địa chỉ" min-width="250">
          <template #default="scope">
            <span class="text-sm text-slate-600 truncate block" :title="scope.row.diaChi">{{ scope.row.diaChi }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="150" align="center" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? 'CẬP NHẬT THÔNG TIN' : 'THÊM KHÁCH HÀNG MỚI'" width="500px" class="custom-dialog">
      <el-form label-position="top">
        <el-form-item label="Tên khách hàng (*)">
          <el-input v-model="formCustomer.tenKH" placeholder="VD: Nguyễn Văn A" />
        </el-form-item>
        <el-form-item label="Số điện thoại (*)">
          <el-input v-model="formCustomer.sdt" placeholder="VD: 0988123456" />
        </el-form-item>
        <el-form-item label="Địa chỉ giao hàng/Hóa đơn">
          <el-input v-model="formCustomer.diaChi" type="textarea" :rows="3" placeholder="Số nhà, Tên đường, Quận/Huyện..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="saveCustomer" class="font-bold">LƯU KHÁCH HÀNG</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyVisible" :title="`LỊCH SỬ MUA HÀNG: ${selectedCustomer?.tenKH}`" width="700px" class="custom-dialog">
      <div v-if="selectedCustomer" class="space-y-4">
        <el-table :data="customerInvoices" style="width: 100%" border stripe size="small">
          <el-table-column prop="maHD" label="Mã HD" width="100">
            <template #default="scope"><span class="font-bold text-blue-600">HD{{ scope.row.maHD }}</span></template>
          </el-table-column>
          <el-table-column prop="ngayMua" label="Ngày mua" width="120" align="center" />
          <el-table-column prop="sanPham" label="Sản phẩm tiêu biểu" min-width="200" />
          <el-table-column prop="tongTien" label="Tổng tiền" width="130" align="right">
            <template #default="scope"><span class="font-semibold">{{ formatPrice(scope.row.tongTien) }}</span></template>
          </el-table-column>
        </el-table>
        <p v-if="customerInvoices.length === 0" class="text-center text-slate-500 py-4 italic">Khách hàng này chưa có giao dịch nào.</p>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search, Plus, EditPen, ShoppingBag, Avatar } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// --- MOCK DATABASE TỐI GIẢN ---
const dbKhachHang = ref([
  { maKH: 1, tenKH: 'Trương Vô Kỵ', sdt: '0901234567', diaChi: 'Quận 1, TP.HCM' },
  { maKH: 2, tenKH: 'Triệu Mẫn', sdt: '0988654321', diaChi: 'Quận 7, TP.HCM' }
]);

const dbHoaDon = ref([
  { maHD: 1001, maKH: 1, ngayMua: '15/01/2026', tongTien: 35000000, sanPham: 'MacBook Pro M3 14-inch' },
  { maHD: 1003, maKH: 2, ngayMua: '10/03/2026', tongTien: 55000000, sanPham: 'ROG Strix SCAR 16' },
]);

// --- STATE ---
const searchQuery = ref('');
const dialogVisible = ref(false);
const isEdit = ref(false);
const formCustomer = ref({ maKH: null, tenKH: '', sdt: '', diaChi: '' });
const historyVisible = ref(false);
const selectedCustomer = ref(null);
const customerInvoices = ref([]);

// --- COMPUTED ---
const filteredCustomers = computed(() => {
  return dbKhachHang.value.filter(kh => {
    return kh.tenKH.toLowerCase().includes(searchQuery.value.toLowerCase()) || kh.sdt.includes(searchQuery.value);
  });
});

// --- METHODS ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
const getInitials = (name) => {
  const words = name.split(' ');
  return words.length > 1 ? words[words.length - 2][0] + words[words.length - 1][0] : name.substring(0, 2).toUpperCase();
};

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

const saveCustomer = () => {
  if (!formCustomer.value.tenKH || !formCustomer.value.sdt) {
    ElMessage.error('Vui lòng nhập Tên và Số điện thoại!');
    return;
  }
  
  if (isEdit.value) {
    const index = dbKhachHang.value.findIndex(kh => kh.maKH === formCustomer.value.maKH);
    if (index !== -1) dbKhachHang.value[index] = { ...formCustomer.value };
    ElMessage.success('Cập nhật thông tin khách hàng thành công!');
  } else {
    const newId = dbKhachHang.value.length > 0 ? Math.max(...dbKhachHang.value.map(kh => kh.maKH)) + 1 : 1;
    dbKhachHang.value.unshift({ ...formCustomer.value, maKH: newId });
    ElMessage.success('Đã thêm khách hàng mới!');
  }
  dialogVisible.value = false;
};

const openHistory = (row) => {
  selectedCustomer.value = row;
  customerInvoices.value = dbHoaDon.value.filter(hd => hd.maKH === row.maKH);
  historyVisible.value = true;
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
</style>