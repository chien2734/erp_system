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
        placeholder="Quét mã vạch hoặc nhập Serial..." 
        :prefix-icon="FullScreen"
        class="!w-72 font-mono"
        clearable
      />
      
      <el-select v-model="filterSP" placeholder="Lọc theo Sản phẩm" clearable class="!w-64" filterable>
        <el-option v-for="sp in dbSanPham" :key="sp.maSP" :label="sp.tenSP" :value="sp.maSP" />
      </el-select>

      <el-select v-model="filterStatus" placeholder="Trạng thái máy" clearable class="!w-48">
        <el-option label="Trong kho" value="Trong kho" />
        <el-option label="Đã bán" value="Đã bán" />
        <el-option label="Đang bảo hành" value="Đang bảo hành" />
        <el-option label="Hư hỏng" value="Hư hỏng" />
      </el-select>

      <div class="ml-auto text-sm text-slate-500">
        Hiển thị: <span class="font-bold text-blue-600">{{ filteredSerials.length }}</span> máy
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredSerials" style="width: 100%" size="large" stripe v-loading="loading">
        
        <el-table-column prop="maMay" label="Mã Máy (Serial)" width="180" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-2">
              <el-icon class="text-slate-400"><Cpu /></el-icon>
              <span class="font-bold text-slate-800 font-mono">{{ scope.row.maMay }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Sản phẩm" min-width="230">
          <template #default="scope">
            <span class="font-semibold text-slate-700">{{ scope.row.tenSP || getTenSP(scope.row.maSP) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="maPhieuNhap" label="Phiếu Nhập" width="120" align="center">
          <template #default="scope">
            <el-tag type="info" effect="plain" class="font-mono">PN-{{ scope.row.maPhieuNhap }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Giá Nhập" width="140" align="right">
          <template #default="scope">
            <span class="font-bold text-emerald-600">{{ formatPrice(scope.row.donGiaNhap) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="maHoaDon" label="Hóa Đơn Xuất" width="140" align="center">
          <template #default="scope">
            <el-button 
              v-if="scope.row.maHoaDon" 
              type="warning" 
              plain 
              size="small" 
              class="font-mono font-bold w-full"
              @click="viewInvoice(scope.row.maHoaDon)"
            >
              <el-icon class="mr-1"><Document /></el-icon>
              {{ scope.row.maHoaDon }}
            </el-button>
            <span v-else class="text-xs text-slate-400 italic">Chưa bán</span>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" width="140" align="center">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.trangThai)" effect="dark" class="font-bold w-full max-w-[110px]">
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
      title="CẬP NHẬT TRẠNG THÁI MÁY" 
      width="450px" destroy-on-close class="custom-dialog"
    >
      <div v-if="selectedMachine" class="space-y-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
          <p class="text-slate-500 mb-1">Mã Serial:</p>
          <p class="font-bold text-lg text-blue-600 font-mono mb-3">{{ selectedMachine.maMay }}</p>
          <p class="text-slate-500 mb-1">Sản phẩm:</p>
          <p class="font-bold text-slate-800">{{ selectedMachine.tenSP || getTenSP(selectedMachine.maSP) }}</p>
        </div>

        <el-form label-position="top">
          <el-form-item label="Trạng thái hiện tại của máy:">
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
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="saveStatus" :loading="saving" class="font-bold">LƯU TRẠNG THÁI</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="invoiceDialogVisible" 
      title="THÔNG TIN HÓA ĐƠN XUẤT" 
      width="400px" 
      destroy-on-close 
      class="custom-dialog"
    >
      <div v-loading="loadingInvoice" class="space-y-3 text-sm">
        <div v-if="currentInvoice" class="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div class="flex justify-between border-b border-slate-200 pb-2 mb-2">
            <span class="text-slate-500">Mã Hóa Đơn:</span>
            <span class="font-bold text-blue-600 font-mono">{{ currentInvoice.maHoaDon }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-slate-500">Ngày bán:</span>
            <span class="font-semibold">{{ currentInvoice.ngayLap }}</span>
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-slate-500">Khách hàng:</span>
            <span class="font-semibold">{{ currentInvoice.tenKhachHang || 'Khách lẻ' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Tổng tiền HĐ:</span>
            <span class="font-bold text-emerald-600">{{ formatPrice(currentInvoice.thanhTien) }}</span>
          </div>
        </div>
        <el-alert v-else-if="!loadingInvoice" title="Không tìm thấy dữ liệu hóa đơn này!" type="error" :closable="false" />
      </div>
      <template #footer>
        <el-button @click="invoiceDialogVisible = false">Đóng lại</el-button>
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
    // TẠM THỜI GIẢ LẬP DỮ LIỆU (Vì chúng ta chưa làm API lấy 1 hóa đơn)
    // Sau này làm xong Backend phần Hóa đơn, bạn chỉ cần mở comment dòng dưới:
    // const res = await api.get(`/sales/hoadon/${maHoaDon}`);
    // currentInvoice.value = res.data;
    
    // Giả lập độ trễ mạng 0.5s
    setTimeout(() => {
      currentInvoice.value = {
        maHoaDon: maHoaDon,
        ngayLap: new Date().toLocaleDateString('vi-VN'),
        tenKhachHang: 'Nguyễn Văn A',
        thanhTien: 45000000
      };
      loadingInvoice.value = false;
    }, 500);

  } catch (error) {
    ElMessage.error('Lỗi khi tải thông tin hóa đơn');
    loadingInvoice.value = false;
  }
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
</style>