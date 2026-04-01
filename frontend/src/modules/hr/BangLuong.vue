<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Bảng Tính Lương Tổng Hợp</h2>
        <p class="text-slate-500">Quản lý lương, thưởng, phụ cấp và các khoản khấu trừ hằng tháng</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <span class="font-semibold text-slate-700">Kỳ lương:</span>
        <el-radio-group v-model="selectedPeriodType" size="medium" class="mr-3">
          <el-radio-button label="month">Theo tháng</el-radio-button>
          <el-radio-button label="year">Theo năm</el-radio-button>
        </el-radio-group>

        <el-date-picker
          v-if="selectedPeriodType === 'month'"
          v-model="selectedMonth"
          type="month"
          placeholder="Chọn tháng"
          format="MM/YYYY"
          value-format="YYYY-MM"
          :clearable="false"
          class="w-40"
        />
        <el-date-picker
          v-else
          v-model="selectedYear"
          type="year"
          placeholder="Chọn năm"
          format="YYYY"
          value-format="YYYY"
          :clearable="false"
          class="w-32"
        />

        <el-button type="primary" size="large" @click="calculatePayroll" :loading="loading" class="font-bold shadow-md shadow-blue-500/30">
          <el-icon class="mr-2"><Refresh /></el-icon> TÍNH TOÁN LẠI
        </el-button>
        <el-button type="success" size="large" plain @click="exportExcel">
          <el-icon class="mr-2"><Download /></el-icon> Xuất Excel
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" v-loading="fetching">
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-sm text-slate-500 font-semibold mb-1">Tổng quỹ lương thực lãnh</p>
        <p class="text-2xl font-black text-blue-600">{{ formatPrice(totalThucLanh) }}</p>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-sm text-slate-500 font-semibold mb-1">Tổng phụ cấp & thưởng</p>
        <p class="text-xl font-bold text-emerald-600">+ {{ formatPrice(totalPhuCap) }}</p>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-sm text-slate-500 font-semibold mb-1">Tổng khấu trừ (Phạt + BH)</p>
        <p class="text-xl font-bold text-rose-600">- {{ formatPrice(totalKhauTru) }}</p>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 font-semibold mb-1">Trạng thái kỳ lương</p>
          <el-tag :type="isFinalized ? 'success' : 'warning'" effect="dark" class="font-bold">
            {{ isFinalized ? 'ĐÃ CHỐT SỔ' : 'ĐANG TÍNH TOÁN' }}
          </el-tag>
        </div>
        <el-button v-if="!isFinalized && payrollList.length > 0" type="danger" @click="finalizePayroll" size="small" class="font-bold">
          CHỐT LƯƠNG
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" v-loading="fetching">
      <el-table 
        :data="payrollList" 
        style="width: 100%" 
        size="large" 
        stripe 
        border
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column label="Nhân viên" min-width="200" fixed="left">
          <template #default="scope">
            <p class="font-bold text-slate-800">{{ scope.row.hoTen }}</p>
            <p class="text-xs text-slate-500 font-mono mt-0.5">NV{{ scope.row.maNhanVien }} • {{ scope.row.tenChucVu }}</p>
          </template>
        </el-table-column>

        <el-table-column prop="luongTheoGio" label="Lương/Giờ" width="120" align="right">
          <template #default="scope">{{ formatPrice(scope.row.luongTheoGio) }}</template>
        </el-table-column>
        
        <el-table-column prop="soGioLamBinhThuong" label="Giờ làm" width="90" align="center">
          <template #default="scope"><span class="font-bold">{{ scope.row.soGioLamBinhThuong }}h</span></template>
        </el-table-column>

        <el-table-column prop="soGioTangCa" label="Giờ tăng ca" width="100" align="center">
          <template #default="scope">
            <span class="font-bold text-amber-600">{{ scope.row.soGioTangCa }}h</span>
          </template>
        </el-table-column>

        <el-table-column label="CÁC KHOẢN THU NHẬP (+)" align="center">
          <el-table-column prop="luongCoBan" label="Lương Cơ Bản" width="130" align="right">
            <template #default="scope"><span class="font-semibold">{{ formatPrice(scope.row.luongCoBan) }}</span></template>
          </el-table-column>
          <el-table-column prop="tongTienTangCa" label="Tiền Tăng Ca" width="120" align="right">
            <template #default="scope"><span class="text-emerald-600">{{ formatPrice(scope.row.tongTienTangCa) }}</span></template>
          </el-table-column>
          <el-table-column prop="phuCapChucVu" label="PC Chức vụ" width="120" align="right">
            <template #default="scope">{{ formatPrice(scope.row.phuCapChucVu) }}</template>
          </el-table-column>
          <el-table-column prop="phuCapKhac" label="PC Cố định & Thưởng" width="160" align="right">
            <template #default="scope">
              <el-tooltip content="Bao gồm: PC Cơm, Xăng xe + Tiền Thưởng ngoại lệ" placement="top">
                <span class="text-emerald-600 font-semibold">{{ formatPrice(scope.row.phuCapKhac) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="CÁC KHOẢN KHẤU TRƯ (-)" align="center">
          <el-table-column prop="tongTienPhat" label="Phạt đi trễ" width="120" align="right">
            <template #default="scope">
              <el-tooltip :content="`Đi trễ tổng cộng ${scope.row.soPhutDiTre} phút`" placement="top">
                <span class="text-rose-500 font-semibold">{{ formatPrice(scope.row.tongTienPhat) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="truBaoHiem" label="Trừ BHXH, YT" width="130" align="right">
            <template #default="scope">
              <span class="text-rose-500">{{ formatPrice(scope.row.truBaoHiem) }}</span>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column prop="thucLanh" label="THỰC LÃNH" width="160" align="right" fixed="right">
          <template #default="scope">
            <span class="font-black text-blue-600 text-lg">{{ formatPrice(scope.row.thucLanh) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="90" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditModal(scope.row)" :disabled="isFinalized">
              <el-icon class="text-xl"><EditPen /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      title="ĐIỀU CHỈNH LƯƠNG NGOẠI LỆ" 
      width="450px"
      destroy-on-close
      class="custom-dialog"
    >
      <div v-if="editingRecord" class="space-y-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm mb-4">
          <p class="font-bold text-lg text-blue-600 mb-1">{{ editingRecord.hoTen }}</p>
          <p class="text-slate-500">Mã NV: {{ editingRecord.maNhanVien }}</p>
          <p class="text-xs text-slate-400 mt-2 italic">Lưu ý: Bạn chỉ được cấp quyền thêm tiền thưởng/truy lĩnh cho nhân viên.</p>
        </div>

        <el-form label-position="top">
          <el-form-item label="Thưởng thêm / Truy lĩnh (+)">
            <el-input-number v-model="formEdit.thuong" :min="0" :step="100000" class="w-full" controls-position="right" />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="saveEdit" :loading="saving" class="font-bold">LƯU ĐIỀU CHỈNH</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Refresh, Download, EditPen } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../../services/api'; // Đường dẫn API

// --- STATE ---
const today = new Date();
const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

const selectedPeriodType = ref('month');
const selectedMonth = ref(currentMonthStr);
const selectedYear = ref(`${today.getFullYear()}`);
const loading = ref(false);     // Loading cho nút Tính toán lại
const fetching = ref(false);    // Loading cho bảng
const saving = ref(false);      // Loading cho nút Lưu Modal
const isFinalized = ref(false);
const dialogVisible = ref(false);

const editingRecord = ref(null);
const formEdit = ref({ thuong: 0 });

// DATA TỪ BACKEND
const payrollList = ref([]);

// --- FETCH DATA (GET /hr/luong) ---
const loadPayrollData = async () => {
  fetching.value = true;
  try {
    let res;
    if (selectedPeriodType.value === 'month') {
      const [year, month] = selectedMonth.value.split('-');
      res = await api.get(`/hr/luong?thang=${parseInt(month)}&nam=${year}`);
    } else {
      res = await api.get(`/hr/luong?nam=${selectedYear.value}`);
    }

    // 🔴 CAMERA 1: IN RA CONSOLE TRÌNH DUYỆT ĐỂ XEM API TRẢ VỀ CÁI GÌ
    console.log("Dữ liệu Lương từ Backend trả về:", res);

    // Bóc tách data bọc thép (Chống mọi trường hợp undefined)
    let dsBangLuong = [];
    const resData = res.data || res;
    
    if (resData?.data?.data && Array.isArray(resData.data.data)) {
        dsBangLuong = resData.data.data;
    } else if (resData?.data && Array.isArray(resData.data)) {
        dsBangLuong = resData.data;
    } else if (Array.isArray(resData)) {
        dsBangLuong = resData;
    }

    payrollList.value = dsBangLuong;
    
    // Kiểm tra trạng thái chốt sổ
    if (payrollList.value.length > 0) {
      isFinalized.value = payrollList.value[0].trangThai === 'Đã thanh toán';
    } else {
      isFinalized.value = false;
    }

  } catch (error) {
    console.error("Lỗi lấy bảng lương:", error);
    ElMessage.error('Lỗi tải dữ liệu bảng lương!');
  } finally {
    fetching.value = false;
  }
};

// Gọi ngay khi load trang
onMounted(() => {
  loadPayrollData();
});

// Tự động load lại khi thay đổi kỳ lương
watch([selectedPeriodType, selectedMonth, selectedYear], () => {
  loadPayrollData();
});

// --- API ACTIONS ---

// 1. Nút "TÍNH TOÁN LẠI" (POST /hr/luong)
const calculatePayroll = async () => {
  loading.value = true;
  try {
    let res;
    if (selectedPeriodType.value === 'month') {
      const [year, month] = selectedMonth.value.split('-');
      res = await api.post(`/hr/luong?thang=${parseInt(month)}&nam=${year}`);
    } else {
      res = await api.post(`/hr/luong?type=year&nam=${selectedYear.value}`);
    }

    const responseData = res.data || res;

    if (responseData.success) {
      ElMessage.success(responseData.message || 'Đã tính toán xong bảng lương!');
      await loadPayrollData(); // Gọi lại GET để cập nhật UI
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi hệ thống khi tính lương!');
  } finally {
    loading.value = false;
  }
};

// 2. Mở Modal & Lưu Tiền Thưởng (PUT /hr/luong-thuong)
const openEditModal = (row) => {
  editingRecord.value = row;
  formEdit.value = { thuong: row.thuong || 0 }; // Map đúng biến thuong của DB
  dialogVisible.value = true;
};

const saveEdit = async () => {
  saving.value = true;
  try {
    const [year, month] = selectedMonth.value.split('-');
    
    // Cấu trúc payload theo đúng Controller Backend của bạn
    const payload = {
      thang: parseInt(month),
      nam: parseInt(year),
      dsNhanVien: [editingRecord.value.maNhanVien], // Đưa vào mảng
      thuong: formEdit.value.thuong
    };

    const res = await api.put('/hr/luong-thuong', payload);
    const responseData = res.data || res;

    if (responseData.success) {
      ElMessage.success('Đã cập nhật tiền thưởng thành công!');
      dialogVisible.value = false;
      await loadPayrollData(); // Load lại data để thấy tiền Thực Lãnh thay đổi
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi lưu tiền thưởng!');
  } finally {
    saving.value = false;
  }
};

// --- THỐNG KÊ (Dựa trên mảng payrollList lấy từ API) ---
const totalThucLanh = computed(() => payrollList.value.reduce((sum, item) => sum + Number(item.thucLanh), 0));
const totalPhuCap = computed(() => payrollList.value.reduce((sum, item) => sum + Number(item.phuCapChucVu) + Number(item.phuCapKhac), 0));
const totalKhauTru = computed(() => payrollList.value.reduce((sum, item) => sum + Number(item.tongTienPhat) + Number(item.truBaoHiem), 0));

// --- TIỆN ÍCH ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const getSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) { sums[index] = 'TỔNG CỘNG'; return; }
    const propertiesToSum = ['luongCoBan', 'tongTienTangCa', 'phuCapChucVu', 'phuCapKhac', 'tongTienPhat', 'truBaoHiem', 'thucLanh'];
    if (propertiesToSum.includes(column.property)) {
      const values = data.map(item => Number(item[column.property] || 0));
      const sum = values.reduce((prev, curr) => prev + curr, 0);
      sums[index] = formatPrice(sum);
    } else { sums[index] = ''; }
  });
  return sums;
};

// Nút chốt lương (Hiện tại làm giả lập, nếu bạn có API cập nhật trạng thái thì thay vào)
const finalizePayroll = () => {
  ElMessageBox.confirm(
    'Xác nhận chốt sổ? Lương đã chốt sẽ không thể chỉnh sửa tiền thưởng hoặc tính toán lại.',
    'Chốt Lương',
    { confirmButtonText: 'Chốt Sổ', cancelButtonText: 'Hủy', type: 'warning' }
  ).then(() => {
    isFinalized.value = true;
    ElMessage.success('Đã chốt sổ lương thành công!');
  }).catch(() => {});
};

// XUẤT EXCEL (Đã map với biến DB thật)
const exportExcel = async () => {
  if (payrollList.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất!');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BangLuong');

  worksheet.columns = [
    { header: 'Mã NV', key: 'maNV', width: 10 },
    { header: 'Họ và Tên', key: 'hoTen', width: 25 },
    { header: 'Chức vụ', key: 'chucVu', width: 20 },
    { header: 'Lương/Giờ', key: 'luongTheoGio', width: 15 },
    { header: 'Giờ Làm', key: 'gioLam', width: 10 },
    { header: 'Giờ Tăng Ca', key: 'gioTangCa', width: 15 },
    { header: 'Lương Cơ Bản', key: 'luongCoBan', width: 15 },
    { header: 'Tiền Tăng Ca', key: 'tienTangCa', width: 15 },
    { header: 'Phụ Cấp Chức Vụ', key: 'pcChucVu', width: 18 },
    { header: 'PC & Thưởng', key: 'pcKhac', width: 15 },
    { header: 'Tiền Phạt Trễ', key: 'phatTre', width: 15 },
    { header: 'Trừ Bảo Hiểm', key: 'truBaoHiem', width: 15 },
    { header: 'THỰC LÃNH', key: 'thucLanh', width: 20 }
  ];

  payrollList.value.forEach(nv => {
    worksheet.addRow({
      maNV: `NV${nv.maNhanVien}`,
      hoTen: nv.hoTen,
      chucVu: nv.tenChucVu,
      luongTheoGio: nv.luongTheoGio,
      gioLam: nv.soGioLamBinhThuong,
      gioTangCa: nv.soGioTangCa,
      luongCoBan: nv.luongCoBan,
      tienTangCa: nv.tongTienTangCa,
      pcChucVu: nv.phuCapChucVu,
      pcKhac: nv.phuCapKhac,
      phatTre: nv.tongTienPhat,
      truBaoHiem: nv.truBaoHiem,
      thucLanh: nv.thucLanh
    });
  });

  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const periodText = selectedPeriodType.value === 'month' ? selectedMonth.value.replace('-', '_') : selectedYear.value;
  const fileName = selectedPeriodType.value === 'month'
    ? `Bang_Luong_Thang_${periodText}.xlsx`
    : `Bang_Luong_Nam_${periodText}.xlsx`;
  saveAs(blob, fileName);

  ElMessage.success('Xuất file Excel thành công!');
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
:deep(.el-table__footer-wrapper tbody td) { background-color: #f8fafc !important; font-weight: 800; color: #0f172a; }
</style>