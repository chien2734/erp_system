<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 gap-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-slate-900">Bảng Tính Lương Tổng Hợp</h2>
          <p class="text-xs md:text-sm text-slate-500 mt-1">Quản lý lương, thưởng, phụ cấp và các khoản khấu trừ</p>
        </div>
        <div class="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
          <el-button type="success" size="large" plain @click="exportExcel" class="w-full md:w-auto font-bold shrink-0 m-0">
            <el-icon class="mr-2"><Download /></el-icon> Xuất Excel
          </el-button>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
        
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="font-semibold text-slate-700 text-sm whitespace-nowrap">Kỳ lương:</span>
          <el-radio-group v-model="selectedPeriodType" size="large" class="shrink-0">
            <el-radio-button label="month">Tháng</el-radio-button>
            <el-radio-button label="year">Năm</el-radio-button>
          </el-radio-group>
        </div>

        <el-date-picker
          v-if="selectedPeriodType === 'month'"
          v-model="selectedMonth"
          type="month"
          placeholder="Chọn tháng"
          format="MM/YYYY"
          value-format="YYYY-MM"
          :clearable="false"
          size="large"
          class="w-full sm:!w-32"
        />
        <el-date-picker
          v-else
          v-model="selectedYear"
          type="year"
          placeholder="Chọn năm"
          format="YYYY"
          value-format="YYYY"
          :clearable="false"
          size="large"
          class="w-full sm:!w-28"
        />
        
        <el-input 
          v-model="searchQuery" 
          placeholder="Tìm Tên, Mã NV..." 
          :prefix-icon="Search"
          size="large"
          class="w-full sm:!w-48"
          clearable
        />

        <el-select v-model="filterChucVu" placeholder="Lọc chức vụ" clearable size="large" class="w-full sm:!w-48">
          <el-option v-for="cv in uniqueChucVuList" :key="cv" :label="cv" :value="cv" />
        </el-select>
        
        <el-button 
          type="primary" 
          size="large" 
          @click="calculatePayroll" 
          :loading="loading" 
          :disabled="isFinalized" 
          class="w-full sm:w-auto font-bold shadow-md shadow-blue-500/30 m-0"
        >
          <el-icon class="mr-2"><Refresh /></el-icon> TÍNH LẠI
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" v-loading="fetching">
      <div class="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-xs md:text-sm text-slate-500 font-semibold mb-1 uppercase">Tổng quỹ thực lãnh</p>
        <p class="text-xl md:text-2xl font-black text-blue-600">{{ formatPrice(totalThucLanh) }}</p>
      </div>
      <div class="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-xs md:text-sm text-slate-500 font-semibold mb-1 uppercase">Phụ cấp & thưởng</p>
        <p class="text-lg md:text-xl font-bold text-emerald-600">+ {{ formatPrice(totalPhuCap) }}</p>
      </div>
      <div class="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-xs md:text-sm text-slate-500 font-semibold mb-1 uppercase">Khấu trừ (Phạt+BH)</p>
        <p class="text-lg md:text-xl font-bold text-rose-600">- {{ formatPrice(totalKhauTru) }}</p>
      </div>
      <div class="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-[11px] md:text-xs text-slate-500 font-semibold mb-1.5 uppercase tracking-wide">Trạng thái</p>
          <el-tag :type="isFinalized ? 'success' : 'warning'" effect="dark" class="font-bold border-none">
            {{ isFinalized ? 'ĐÃ CHỐT' : 'CHƯA CHỐT' }}
          </el-tag>
        </div>
        <el-button 
          v-if="!isFinalized && payrollList.length > 0" 
          type="danger" 
          @click="finalizePayroll" 
          class="font-bold shadow-md shadow-rose-500/20 m-0"
        >
          CHỐT SỔ
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto" v-loading="fetching">
      <el-table 
        :key="selectedPeriodType"
        :data="paginatedData" 
        style="width: 100%" 
        size="large" 
        stripe 
        border
        show-summary
        :summary-method="getSummaries"
        class="min-w-[1200px] custom-table"
      >
        <el-table-column label="Nhân viên" min-width="200" fixed="left">
          <template #default="scope">
            <p class="font-bold text-slate-800 line-clamp-1" :title="scope.row.hoTen">{{ scope.row.hoTen }}</p>
            <p class="text-[11px] md:text-xs text-slate-500 font-mono mt-0.5">NV{{ scope.row.maNhanVien }} • {{ scope.row.tenChucVu }}</p>
          </template>
        </el-table-column>

        <el-table-column v-if="selectedPeriodType === 'year'" prop="thang" label="Tháng" width="80" align="center" fixed="left">
          <template #default="scope">
            <span class="font-semibold text-slate-700">{{ scope.row.thang }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="luongTheoGio" label="Lương/Giờ" min-width="110" align="right">
          <template #default="scope">
            <span class="font-semibold text-slate-700 whitespace-nowrap">{{ formatPrice(scope.row.luongTheoGio) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="soGioLamBinhThuong" label="Giờ làm" min-width="85" align="center">
          <template #default="scope"><span class="font-semibold text-slate-700">{{ scope.row.soGioLamBinhThuong }}h</span></template>
        </el-table-column>

        <el-table-column prop="soGioTangCa" label="Giờ TC" min-width="85" align="center">
          <template #default="scope">
            <span class="font-semibold text-amber-600">{{ scope.row.soGioTangCa }}h</span>
          </template>
        </el-table-column>

        <el-table-column label="CÁC KHOẢN THU NHẬP (+)" align="center">
          <el-table-column prop="luongCoBan" label="Lương CB" min-width="120" align="right">
            <template #default="scope"><span class="font-semibold text-slate-700 whitespace-nowrap">{{ formatPrice(scope.row.luongCoBan) }}</span></template>
          </el-table-column>
          <el-table-column prop="tongTienTangCa" label="Tiền TC" min-width="110" align="right">
            <template #default="scope"><span class="font-semibold text-emerald-600 whitespace-nowrap">{{ formatPrice(scope.row.tongTienTangCa) }}</span></template>
          </el-table-column>
          <el-table-column prop="phuCapChucVu" label="PC Chức vụ" min-width="110" align="right">
            <template #default="scope"><span class="font-semibold text-slate-700 whitespace-nowrap">{{ formatPrice(scope.row.phuCapChucVu) }}</span></template>
          </el-table-column>
          <el-table-column prop="phuCapKhac" label="PC & Thưởng" min-width="120" align="right">
            <template #default="scope">
              <span class="font-semibold text-emerald-600 whitespace-nowrap">{{ formatPrice(scope.row.phuCapKhac) }}</span>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="CÁC KHOẢN KHẤU TRỪ (-)" align="center">
          <el-table-column prop="tongTienPhat" label="Phạt trễ" min-width="100" align="right">
            <template #default="scope">
              <span class="font-semibold text-rose-500 whitespace-nowrap">{{ formatPrice(scope.row.tongTienPhat) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="truBaoHiem" label="Trừ BH" min-width="100" align="right">
            <template #default="scope">
              <span class="font-semibold text-rose-500 whitespace-nowrap">{{ formatPrice(scope.row.truBaoHiem) }}</span>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column prop="thucLanh" label="THỰC LÃNH" min-width="140" align="right" fixed="right">
          <template #default="scope">
            <span class="font-bold text-blue-700 text-base md:text-lg whitespace-nowrap">{{ formatPrice(scope.row.thucLanh) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="70" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditModal(scope.row)" :disabled="isFinalized" title="Điều chỉnh thưởng">
              <el-icon class="text-lg md:text-xl"><EditPen /></el-icon>
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
      title="ĐIỀU CHỈNH THƯỞNG/TRUY LĨNH" 
      width="450px"
      destroy-on-close
      class="custom-dialog responsive-dialog"
    >
      <div v-if="editingRecord" class="space-y-4">
        <div class="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 text-sm mb-4">
          <p class="font-bold text-base md:text-lg text-blue-600 mb-1">{{ editingRecord.hoTen }}</p>
          <p class="text-slate-500">Mã NV: NV{{ editingRecord.maNhanVien }} <span v-if="selectedPeriodType === 'year'">- Tháng {{ editingRecord.thang }}</span></p>
          <p class="text-[11px] md:text-xs text-slate-400 mt-2 italic leading-relaxed">Lưu ý: Chỉ điều chỉnh khoản Thưởng/Truy lĩnh (+). Hệ thống sẽ tự động cộng dồn vào Thực lãnh.</p>
        </div>

        <el-form label-position="top">
          <el-form-item label="Số tiền thưởng thêm / Truy lĩnh (VNĐ):" class="mb-0">
            <el-input-number v-model="formEdit.thuong" :min="0" :step="50000" class="!w-full !text-left" size="large" controls-position="right" />
            <p class="text-[10px] text-slate-400 mt-1 italic">* Để xóa thưởng, hãy nhập 0 và nhấn Lưu.</p>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t border-slate-100">
          <el-button @click="dialogVisible = false" size="large" class="w-full sm:w-auto">Hủy bỏ</el-button>
          <el-button type="primary" @click="saveEdit" :loading="saving" size="large" class="font-bold w-full sm:w-auto m-0">LƯU ĐIỀU CHỈNH</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Refresh, Download, EditPen, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../../services/api';
import { usePagination } from '../../composables/usePagination';

// --- STATE ---
const today = new Date();
const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

const selectedPeriodType = ref('month');
const selectedMonth = ref(currentMonthStr);
const selectedYear = ref(`${today.getFullYear()}`);
const loading = ref(false);     
const fetching = ref(false);    
const saving = ref(false);      
const isFinalized = ref(false);
const dialogVisible = ref(false);

const editingRecord = ref(null);
const formEdit = ref({ thuong: 0 });
const searchQuery = ref('');
const filterChucVu = ref(''); // State bộ lọc mới

// DATA TỪ BACKEND
const payrollList = ref([]);

// --- FETCH DATA ---
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
    
    if (payrollList.value.length > 0) {
      isFinalized.value = Number(payrollList.value[0].trangThai) === 1;
    } else {
      isFinalized.value = false;
    }

  } catch (error) {
    ElMessage.error('Lỗi tải dữ liệu bảng lương!');
  } finally {
    fetching.value = false;
  }
};

onMounted(() => {
  loadPayrollData();
});

watch([selectedPeriodType, selectedMonth, selectedYear], () => {
  loadPayrollData();
});

// --- LỌC DỮ LIỆU ---
// Lấy danh sách chức vụ Unique để hiển thị trên Filter
const uniqueChucVuList = computed(() => {
  const roles = payrollList.value.map(item => item.tenChucVu).filter(Boolean);
  return [...new Set(roles)];
});

// Hàm lọc gộp Search và Chức vụ
const filteredPayrollList = computed(() => {
  const q = (searchQuery.value || '').toLowerCase().trim();
  const roleFilter = filterChucVu.value;

  return payrollList.value.filter(item => {
    let matchQuery = true;
    if (q) {
      matchQuery = (item.hoTen && item.hoTen.toLowerCase().includes(q)) || 
                   (item.maNhanVien && item.maNhanVien.toString().includes(q));
    }
    
    let matchRole = true;
    if (roleFilter) {
      matchRole = item.tenChucVu === roleFilter;
    }

    return matchQuery && matchRole;
  });
});

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData
} = usePagination(filteredPayrollList, 10);

// --- THỐNG KÊ ---
const totalThucLanh = computed(() => filteredPayrollList.value.reduce((sum, item) => sum + Number(item.thucLanh || 0), 0));
const totalPhuCap = computed(() => filteredPayrollList.value.reduce((sum, item) => sum + Number(item.phuCapChucVu || 0) + Number(item.phuCapKhac || 0), 0));
const totalKhauTru = computed(() => filteredPayrollList.value.reduce((sum, item) => sum + Number(item.tongTienPhat || 0) + Number(item.truBaoHiem || 0), 0));

// --- API ACTIONS ---
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
      await loadPayrollData();
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi hệ thống khi tính lương!');
  } finally {
    loading.value = false;
  }
};

const openEditModal = (row) => {
  editingRecord.value = row;
  formEdit.value = { thuong: row.thuong || 0 }; 
  dialogVisible.value = true;
};

const saveEdit = async () => {
  saving.value = true;
  try {
    // Sửa thông minh: Bốc tháng từ dòng record nếu xem theo năm, nếu xem theo tháng thì bốc từ select
    const targetMonth = editingRecord.value.thang || parseInt(selectedMonth.value.split('-')[1]);
    const targetYear = editingRecord.value.nam || parseInt(selectedYear.value);
    
    const payload = {
      thang: parseInt(targetMonth),
      nam: parseInt(targetYear),
      dsNhanVien: [editingRecord.value.maNhanVien],
      thuong: formEdit.value.thuong
    };

    const res = await api.put('/hr/luong-thuong', payload);
    const responseData = res.data || res;

    if (responseData.success) {
      ElMessage.success('Đã cập nhật tiền thưởng thành công!');
      dialogVisible.value = false;
      await loadPayrollData(); 
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi lưu tiền thưởng!');
  } finally {
    saving.value = false;
  }
};

const finalizePayroll = () => {
  ElMessageBox.confirm(
    'Xác nhận chốt sổ? Lương đã chốt sẽ KHÔNG THỂ tính toán lại hay điều chỉnh.',
    'Chốt Lương',
    { confirmButtonText: 'Xác Nhận Chốt', cancelButtonText: 'Hủy', type: 'warning' }
  ).then(async () => {
    try {
      fetching.value = true;
      const [year, month] = selectedMonth.value.split('-');
      
      const res = await api.put('/hr/luong/chot', {
        thang: parseInt(month),
        nam: parseInt(year)
      });
      
      const responseData = res.data || res;
      if (responseData.success) {
        ElMessage.success(responseData.message || 'Đã chốt sổ lương thành công!');
        await loadPayrollData(); 
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.message || 'Lỗi khi chốt lương!');
    } finally {
      fetching.value = false;
    }
  }).catch(() => {});
};

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

// XUẤT EXCEL (Đã nâng cấp cột Tháng)
const exportExcel = async () => {
  if (filteredPayrollList.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất!');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BangLuong');

  // Khai báo mảng cột động
  const columns = [
    { header: 'Mã NV', key: 'maNV', width: 10 },
    { header: 'Họ và Tên', key: 'hoTen', width: 25 },
    { header: 'Chức vụ', key: 'chucVu', width: 20 },
  ];

  // Nếu xuất theo năm, chèn thêm cột Tháng
  if (selectedPeriodType.value === 'year') {
    columns.push({ header: 'Tháng', key: 'thang', width: 10 });
  }

  columns.push(
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
  );

  worksheet.columns = columns;

  filteredPayrollList.value.forEach(nv => {
    const rowData = {
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
    };
    
    // Đẩy giá trị tháng vào nếu có
    if (selectedPeriodType.value === 'year') {
      rowData.thang = nv.thang || '---';
    }

    worksheet.addRow(rowData);
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
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) { :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; } }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
:deep(.responsive-dialog) { max-width: 95vw !important; }

/* Làm đậm dòng tổng cộng cuối bảng */
:deep(.el-table__footer-wrapper tbody td) { background-color: #f8fafc !important; font-weight: 800; color: #0f172a; }

/* Thanh cuộn mượt cho bảng */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>