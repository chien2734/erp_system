<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Bảng Tính Lương Tổng Hợp</h2>
        <p class="text-slate-500">Quản lý lương, thưởng, phụ cấp và các khoản khấu trừ hằng tháng</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-semibold text-slate-700">Kỳ lương:</span>
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="Chọn tháng"
          format="MM/YYYY"
          value-format="YYYY-MM"
          :clearable="false"
          class="!w-40"
        />
        <el-button type="primary" size="large" @click="calculatePayroll" :loading="loading" class="font-bold shadow-md shadow-blue-500/30">
          <el-icon class="mr-2"><Refresh /></el-icon> TÍNH TOÁN LẠI
        </el-button>
        <el-button type="success" size="large" plain @click="exportExcel">
          <el-icon class="mr-2"><Download /></el-icon> Xuất Excel
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <el-button v-if="!isFinalized" type="danger" @click="finalizePayroll" size="small" class="font-bold">
          CHỐT LƯƠNG
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
              <el-tooltip content="Gồm PC Cơm, Xăng xe (Cấu hình) + Thưởng thêm" placement="top">
                <span>{{ formatPrice(scope.row.phuCapKhac) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="CÁC KHOẢN KHẤU TRƯ (-)" align="center">
          <el-table-column prop="tongTienPhat" label="Phạt đi trễ" width="120" align="right">
            <template #default="scope"><span class="text-rose-500">{{ formatPrice(scope.row.tongTienPhat) }}</span></template>
          </el-table-column>
          <el-table-column prop="truBaoHiem" label="Trừ BHXH, YT" width="130" align="right">
            <template #default="scope">
              <el-tooltip content="Dựa trên Lương cơ sở * %BH (Bảng Cấu hình)" placement="top">
                <span class="text-rose-500">{{ formatPrice(scope.row.truBaoHiem) }}</span>
              </el-tooltip>
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
      width="500px"
      destroy-on-close
      class="custom-dialog"
    >
      <div v-if="editingRecord" class="space-y-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm mb-4">
          <p class="font-bold text-lg text-blue-600 mb-1">{{ editingRecord.hoTen }}</p>
          <p class="text-slate-500">Mã NV: {{ editingRecord.maNhanVien }}</p>
          <p class="text-xs text-slate-400 mt-2 italic">Lưu ý: Các khoản cố định (BHXH, Ăn trưa, Phạt đi trễ) được hệ thống tự tính. Bạn chỉ nhập các khoản phát sinh ngoài quy định ở đây.</p>
        </div>

        <el-form label-position="top">
          <el-form-item label="Thưởng thêm / Truy lĩnh (+)">
            <el-input-number v-model="formEdit.thuongThem" :min="0" :step="100000" class="!w-full" controls-position="right" />
          </el-form-item>
          <el-form-item label="Khấu trừ khác / Truy thu (-)">
            <el-input-number v-model="formEdit.truThem" :min="0" :step="50000" class="!w-full" controls-position="right" />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="saveEdit" class="font-bold">LƯU ĐIỀU CHỈNH</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Refresh, Download, EditPen } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- STATE ---
const selectedMonth = ref('2026-03');
const loading = ref(false);
const isFinalized = ref(false);
const dialogVisible = ref(false);
const editingRecord = ref(null);
const formEdit = ref({ thuongThem: 0, truThem: 0 });

// --- MOCK DATABASE CẤU HÌNH (Rất quyền lực) ---
const dbCauHinh = {
  maCauHinh: 1,
  tienPhatDiTre: 2000, // 2k/phút
  heSoTangCa: 1.5,
  luongCoSo: 4680000, // Lương cơ sở vùng
  phanTramBHXH: 8.0,
  phanTramBHYT: 1.5,
  phuCapAnTrua: 730000,
  phuCapXangXe: 300000
};

// --- MOCK DATABASE BẢNG LƯƠNG ---
// Dữ liệu thô lấy từ các bảng NhanVien, ChucVu, ChamCong. Chưa qua tính toán.
const dbBangLuong = ref([
  {
    maNhanVien: 1, hoTen: 'Nguyễn Văn Admin', tenChucVu: 'Quản lý Cửa hàng',
    luongTheoGio: 40000, soGioLamBinhThuong: 200, soGioTangCa: 10, soPhutDiTre: 30,
    phuCapChucVu: 2000000, thuongThem: 0, truThem: 0 // Dành cho Dialog chỉnh sửa
  },
  {
    maNhanVien: 2, hoTen: 'Trần Thị Sales', tenChucVu: 'Nhân viên Bán hàng',
    luongTheoGio: 25000, soGioLamBinhThuong: 195, soGioTangCa: 5, soPhutDiTre: 120,
    phuCapChucVu: 0, thuongThem: 500000, truThem: 0
  }
]);

// --- COMPUTED: TÍNH TOÁN DỰA TRÊN BẢNG CẤU HÌNH ---
const payrollList = computed(() => {
  return dbBangLuong.value.map(nv => {
    // 1. Lương Cơ Bản
    const luongCoBan = nv.luongTheoGio * nv.soGioLamBinhThuong;
    
    // 2. Tăng ca (Quy chiếu Cấu hình)
    const tongTienTangCa = nv.soGioTangCa * (nv.luongTheoGio * dbCauHinh.heSoTangCa);
    
    // 3. Phạt đi trễ (Quy chiếu Cấu hình)
    const tongTienPhat = nv.soPhutDiTre * dbCauHinh.tienPhatDiTre;

    // 4. Phụ cấp cố định + Thưởng thêm
    const phuCapCoDinh = dbCauHinh.phuCapAnTrua + dbCauHinh.phuCapXangXe;
    const phuCapKhac = phuCapCoDinh + nv.thuongThem;

    // 5. Trừ Bảo Hiểm (Lương cơ sở * (BHXH + BHYT) / 100) + Trừ thêm
    const baoHiemCoDinh = dbCauHinh.luongCoSo * ((dbCauHinh.phanTramBHXH + dbCauHinh.phanTramBHYT) / 100);
    const truBaoHiem = baoHiemCoDinh + nv.truThem;

    // 6. Thực lãnh chốt
    const thucLanh = (luongCoBan + tongTienTangCa + nv.phuCapChucVu + phuCapKhac) - (tongTienPhat + truBaoHiem);

    return {
      ...nv,
      luongCoBan, tongTienTangCa, tongTienPhat, phuCapKhac, truBaoHiem, thucLanh
    };
  });
});

// Các biến cho thẻ Thống kê tổng quan
const totalThucLanh = computed(() => payrollList.value.reduce((sum, item) => sum + item.thucLanh, 0));
const totalPhuCap = computed(() => payrollList.value.reduce((sum, item) => sum + item.phuCapChucVu + item.phuCapKhac, 0));
const totalKhauTru = computed(() => payrollList.value.reduce((sum, item) => sum + item.tongTienPhat + item.truBaoHiem, 0));

// --- METHODS ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const getSummaries = (param) => {
  const { columns, data } = param;
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) { sums[index] = 'TỔNG CỘNG'; return; }
    const propertiesToSum = ['luongCoBan', 'tongTienTangCa', 'phuCapChucVu', 'phuCapKhac', 'tongTienPhat', 'truBaoHiem', 'thucLanh'];
    if (propertiesToSum.includes(column.property)) {
      const values = data.map(item => Number(item[column.property]));
      const sum = values.reduce((prev, curr) => prev + curr, 0);
      sums[index] = formatPrice(sum);
    } else { sums[index] = ''; }
  });
  return sums;
};

const calculatePayroll = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    ElMessage.success('Đã tải lại Cấu Hình và tính toán xong lương!');
  }, 1000);
};

const finalizePayroll = () => {
  ElMessageBox.confirm(
    'Xác nhận chốt sổ? Dữ liệu sẽ không thể thay đổi sau khi chốt.',
    'Chốt Lương',
    { confirmButtonText: 'Chốt Sổ', cancelButtonText: 'Hủy', type: 'warning' }
  ).then(() => {
    isFinalized.value = true;
    ElMessage.success('Đã chốt sổ lương thành công!');
  }).catch(() => {});
};

// XUẤT EXCEL CHUẨN BẢO MẬT (SỬ DỤNG EXCELJS)
const exportExcel = async () => {
  if (payrollList.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất!');
    return;
  }

  // 1. Khởi tạo file Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BangLuong');

  // 2. Định nghĩa các cột (Tự động canh độ rộng cho đẹp)
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
    { header: 'Phụ Cấp Khác', key: 'pcKhac', width: 15 },
    { header: 'Tiền Phạt Trễ', key: 'phatTre', width: 15 },
    { header: 'Trừ Bảo Hiểm', key: 'truBaoHiem', width: 15 },
    { header: 'THỰC LÃNH', key: 'thucLanh', width: 20 }
  ];

  // 3. Đổ dữ liệu vào từng dòng
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

  // 4. Làm đẹp Excel (In đậm dòng tiêu đề)
  worksheet.getRow(1).font = { bold: true };

  // 5. Chuyển đổi thành file và tải xuống
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const fileName = `Bang_Luong_Thang_${selectedMonth.value.replace('-', '_')}.xlsx`;
  saveAs(blob, fileName);

  ElMessage.success('Xuất file Excel thành công!');
};

// DIALOG SỬA NGOẠI LỆ
const openEditModal = (row) => {
  editingRecord.value = row;
  formEdit.value = { thuongThem: row.thuongThem, truThem: row.truThem };
  dialogVisible.value = true;
};

const saveEdit = () => {
  const index = dbBangLuong.value.findIndex(nv => nv.maNhanVien === editingRecord.value.maNhanVien);
  if (index !== -1) {
    dbBangLuong.value[index].thuongThem = formEdit.value.thuongThem;
    dbBangLuong.value[index].truThem = formEdit.value.truThem;
  }
  dialogVisible.value = false;
  ElMessage.success('Đã cập nhật khoản ngoại lệ!');
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
:deep(.el-table__footer-wrapper tbody td) { background-color: #f8fafc !important; font-weight: 800; color: #0f172a; }
</style>