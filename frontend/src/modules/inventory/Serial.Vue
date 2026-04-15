<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Quản lý Serial Máy tính</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Tra cứu vòng đời, lịch sử xuất nhập và trạng thái của từng mã máy (S/N)</p>
      </div>
    </div>

    <div class="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 items-start sm:items-center">
      
      <el-input 
        v-model="searchQuery" 
        placeholder="Quét mã vạch hoặc nhập S/N..." 
        :prefix-icon="FullScreen"
        class="w-full sm:!w-64 md:!w-72 font-mono"
        size="large"
        clearable
      />
      
      <el-select v-model="filterSP" placeholder="Lọc theo Sản phẩm" clearable class="w-full sm:flex-1 md:!w-64" size="large" filterable>
        <el-option v-for="sp in dbSanPham" :key="sp.maSP" :label="sp.tenSP" :value="sp.maSP" />
      </el-select>

      <el-select v-model="filterStatus" placeholder="Trạng thái máy" clearable class="w-full sm:!w-40 md:!w-48" size="large">
        <el-option label="Trong kho" value="Trong kho" />
        <el-option label="Đã bán" value="Đã bán" />
        <el-option label="Đang bảo hành" value="Đang bảo hành" />
        <el-option label="Hư hỏng" value="Hư hỏng" />
      </el-select>

      <div class="w-full sm:w-auto text-xs md:text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-center font-medium mt-1 sm:mt-0">
        Hiển thị: <span class="font-bold text-blue-600 text-base">{{ filteredSerials.length }}</span> máy
      </div>
    </div>

    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <el-table :data="filteredSerials" style="width: 100%" size="large" stripe v-loading="loading" class="min-w-[900px]">
        
        <el-table-column prop="maMay" label="Mã Máy (S/N)" min-width="140" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-1.5 md:gap-2">
              <el-icon class="text-slate-400 hidden sm:inline-block"><Cpu /></el-icon>
              <span class="font-bold text-slate-800 font-mono text-xs md:text-sm">{{ scope.row.maMay }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Sản phẩm" min-width="200">
          <template #default="scope">
            <span class="font-semibold text-slate-700 text-xs md:text-sm line-clamp-2" :title="scope.row.tenSP || getTenSP(scope.row.maSP)">
              {{ scope.row.tenSP || getTenSP(scope.row.maSP) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="maPhieuNhap" label="Phiếu Nhập" min-width="110" align="center">
          <template #default="scope">
            <el-tag type="info" effect="plain" class="font-mono text-xs">PN-{{ scope.row.maPhieuNhap }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Giá Nhập" min-width="120" align="right">
          <template #default="scope">
            <span class="font-bold text-emerald-600 text-xs md:text-sm whitespace-nowrap">{{ formatPrice(scope.row.donGiaNhap) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="maHoaDon" label="Hóa Đơn Xuất" min-width="130" align="center">
          <template #default="scope">
            <el-button 
              v-if="scope.row.maHoaDon" 
              type="warning" 
              plain 
              size="small" 
              class="font-mono font-bold w-full max-w-[100px] !text-[11px] md:!text-xs"
              @click="viewInvoice(scope.row.maHoaDon)"
            >
              <el-icon class="mr-1"><Document /></el-icon>
              HD-{{ scope.row.maHoaDon }}
            </el-button>
            <span v-else class="text-[11px] md:text-xs text-slate-400 italic">Chưa bán</span>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" min-width="130" align="center">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.trangThai)" effect="dark" class="font-bold w-full max-w-[100px] md:max-w-[110px] text-[10px] md:text-xs border-none whitespace-nowrap">
              {{ scope.row.trangThai }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="80" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" link 
              @click="openEditModal(scope.row)"
              title="Cập nhật vòng đời máy"
            >
              <el-icon class="text-xl"><EditPen /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      title="CẬP NHẬT TRẠNG THÁI" 
      width="400px" destroy-on-close class="custom-dialog responsive-dialog"
    >
      <div v-if="selectedMachine" class="space-y-4">
        <div class="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 text-sm">
          <p class="text-slate-500 mb-1 text-xs">Mã Serial:</p>
          <p class="font-bold text-base md:text-lg text-blue-600 font-mono mb-2 md:mb-3 break-all">{{ selectedMachine.maMay }}</p>
          <p class="text-slate-500 mb-1 text-xs">Sản phẩm:</p>
          <p class="font-bold text-slate-800 leading-tight">{{ selectedMachine.tenSP || getTenSP(selectedMachine.maSP) }}</p>
        </div>

        <el-form label-position="top" class="mt-2">
          <el-form-item label="Trạng thái hiện tại của máy:" class="mb-0">
            <el-select v-model="selectedMachine.trangThai" class="w-full" size="large">
              <el-option 
                v-for="opt in availableStatusOptions" 
                :key="opt.value" 
                :label="opt.label" 
                :value="opt.value" 
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-2 border-t border-slate-100">
          <el-button @click="dialogVisible = false" size="large" class="w-full sm:w-auto">Hủy</el-button>
          <el-button type="primary" @click="saveStatus" :loading="saving" size="large" class="font-bold w-full sm:w-auto m-0">LƯU TRẠNG THÁI</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="invoiceDialogVisible" 
      title="THÔNG TIN HÓA ĐƠN BÁN" 
      width="450px" 
      destroy-on-close 
      class="custom-dialog responsive-dialog"
    >
      <div v-loading="loadingInvoice" class="space-y-4 text-sm min-h-[120px]">
        <div v-if="currentInvoice" class="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200">
          
          <div class="flex justify-between border-b border-slate-200 pb-2 md:pb-3 mb-3">
            <span class="text-slate-500">Mã Hóa Đơn:</span>
            <span class="font-bold text-blue-600 font-mono text-base">HD-{{ currentInvoice.maHoaDon }}</span>
          </div>
          
          <div class="space-y-2 mb-4">
            <div class="flex justify-between">
              <span class="text-slate-500">Ngày bán:</span>
              <span class="font-semibold text-slate-800">{{ currentInvoice.ngayLap ? new Date(currentInvoice.ngayLap).toLocaleString('vi-VN') : '' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Người lập:</span>
              <span class="font-semibold text-slate-800 truncate pl-4" :title="currentInvoice.tenNhanVien || 'Admin'">{{ currentInvoice.tenNhanVien || 'Admin' }}</span>
            </div>
          </div>

          <div class="bg-white p-3 rounded-lg border border-slate-100 mb-4 shadow-sm">
            <p class="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Khách hàng mua</p>
            <p class="font-bold text-slate-800 text-base leading-tight">{{ currentInvoice.tenKH || 'Khách lẻ' }}</p>
            <p class="text-slate-600 text-sm mt-0.5">{{ currentInvoice.sdt || '' }}</p>
          </div>

          <div class="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <span class="font-bold text-emerald-800 text-xs md:text-sm">TỔNG THANH TOÁN:</span>
            <span class="font-black text-emerald-600 text-lg md:text-xl">
              {{ new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentInvoice.thanhTien || 0) }}
            </span>
          </div>

        </div>
        
        <el-alert 
          v-else-if="!loadingInvoice" 
          title="Không tìm thấy dữ liệu hóa đơn này!" 
          type="error" 
          :closable="false" 
          show-icon
        />
      </div>
      
      <template #footer>
        <el-button @click="invoiceDialogVisible = false" size="large" class="w-full font-bold bg-slate-100">ĐÓNG LẠI</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { FullScreen, Cpu, EditPen } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api';

// --- STATE ---
const dbSanPham = ref([]);
const dbMayTinh = ref([]);
const loading = ref(false);
const saving = ref(false);

const searchQuery = ref('');
const filterSP = ref('');
const filterStatus = ref('');
const dialogVisible = ref(false);
const selectedMachine = ref(null);
const originalStatus = ref('');

const invoiceDialogVisible = ref(false);
const loadingInvoice = ref(false);
const currentInvoice = ref(null);

// --- LOAD DATA ---
const loadData = async () => {
  loading.value = true;
  try {
    const [resSP, resMayTinh] = await Promise.all([
      api.get('/inventory/sanpham?limit=1000'),
      api.get('/inventory/maytinh?limit=10000') // Lấy toàn bộ Serial
    ]);
    dbSanPham.value = resSP.data || [];
    dbMayTinh.value = resMayTinh.data || [];
  } catch (error) {
    ElMessage.error('Lỗi khi tải dữ liệu Serial');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

// --- COMPUTED ---
const filteredSerials = computed(() => {
  return dbMayTinh.value.filter(mt => {
    const matchQuery = mt.maMay.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchSP = filterSP.value ? mt.maSP === filterSP.value : true;
    const matchStatus = filterStatus.value ? mt.trangThai.trim() === filterStatus.value : true;
    return matchQuery && matchSP && matchStatus;
  });
});

const availableStatusOptions = computed(() => {
  // Tránh lỗi khi vừa mở trang lên chưa click vào máy nào
  if (!selectedMachine.value) return [];

  // KIỂM TRA BẰNG CHỨNG THÉP: Máy này có mã Hóa đơn hay không?
  // (!! biến giá trị thành true nếu có chữ, false nếu là null/rỗng)
  const daTungBan = !!selectedMachine.value.maHoaDon; 

  // Định nghĩa sẵn các nhãn (label) cho đẹp
  const optTrongKho = { label: "Trong kho (Sẵn sàng bán)", value: "Trong kho" };
  const optDaBan    = { label: "Đã bán (Khách đang sử dụng)", value: "Đã bán" };
  const optBaoHanh  = { label: "Đang bảo hành (Gửi hãng)", value: "Đang bảo hành" };
  const optHuHong   = { label: "Hư hỏng (Chờ xử lý/Hủy bỏ)", value: "Hư hỏng" };

  // PHÂN LUỒNG LOGIC DỰA TRÊN HÓA ĐƠN
  if (daTungBan) {
    // NHÓM 1: MÁY ĐÃ CÓ CHỦ (Khách đã mua)
    // TUYỆT ĐỐI CHẶN quay về "Trong kho". 
    // Máy chỉ có thể ở nhà khách (Đã bán), đem đi sửa (Bảo hành), hoặc nát bét (Hư hỏng).
    return [optDaBan, optBaoHanh, optHuHong]; 
    
  } else {
    // NHÓM 2: MÁY CHƯA TỪNG BÁN (Nằm ở kho)
    // TUYỆT ĐỐI CHẶN đổi thành "Đã bán" (Muốn bán thì mời ra màn hình POS thu tiền tạo Hóa đơn).
    // Máy chỉ có thể nằm chờ bán (Trong kho), phát hiện lỗi lúc bóc seal (Hư hỏng), hoặc gửi trả hãng (Bảo hành).
    return [optTrongKho, optBaoHanh, optHuHong];
  }
});

// --- METHODS ---
const formatPrice = (value) => value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : '---';

const getTenSP = (maSP) => {
  const sp = dbSanPham.value.find(s => Number(s.maSP) === Number(maSP));
  return sp ? sp.tenSP : 'Lỗi dữ liệu';
};

const getStatusColor = (status) => {
  if (!status) return '';
  switch (status.trim()) {
    case 'Trong kho': return 'success';
    case 'Đã bán': return 'info';
    case 'Đang bảo hành': return 'warning';
    case 'Hư hỏng': return 'danger';
    default: return '';
  }
};

const openEditModal = (row) => {
  selectedMachine.value = { ...row }; 
  originalStatus.value = row.trangThai; // BẮT BUỘC CÓ DÒNG NÀY: Ghi nhớ trạng thái gốc để tính toán
  dialogVisible.value = true;
};

const saveStatus = async () => {
  saving.value = true;
  try {
    // Gọi API cập nhật trạng thái máy
    await api.put(`/inventory/maytinh/${selectedMachine.value.maMay}`, {
      trangThai: selectedMachine.value.trangThai
    });
    
    ElMessage.success(`Cập nhật thành công!`);
    dialogVisible.value = false;
    loadData(); // Tải lại bảng
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi cập nhật trạng thái (Kiểm tra lại Backend API)');
  } finally {
    saving.value = false;
  }
};

// --- HÀM XEM HÓA ĐƠN ---
const viewInvoice = async (maHoaDon) => {
  invoiceDialogVisible.value = true;
  loadingInvoice.value = true;
  currentInvoice.value = null;

  try {
    // Gọi API sang phân hệ Sales để lấy chi tiết Hóa đơn
    const res = await api.get(`/sales/hoadon/${maHoaDon}`);
    
    // API của Backend trả về dạng { success: true, data: { ... } }
    // Nên ta lấy res.data.data
    currentInvoice.value = res.data.data || res.data; 

  } catch (error) {
    console.error("Lỗi tra cứu hóa đơn:", error);
    ElMessage.error('Không thể tải thông tin hóa đơn từ máy chủ!');
  } finally {
    loadingInvoice.value = false;
  }
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) { :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; } }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }

/* Bóp Dialog tự động trên Mobile */
:deep(.responsive-dialog) { max-width: 95vw !important; }

/* Tùy chỉnh Scrollbar cho bảng mượt mà hơn */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>