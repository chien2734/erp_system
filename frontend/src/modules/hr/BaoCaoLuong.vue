<template>
  <div class="space-y-6">
    <div class="flex justify-between items-end">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Dashboard Báo Cáo Quỹ Lương</h2>
        <p class="text-slate-500 mt-1">Phân tích chuyên sâu chi phí nhân sự và dòng tiền</p>
      </div>
      
      <div class="flex items-center gap-4">
        <el-date-picker
          v-model="filterMonth"
          type="month"
          placeholder="Chọn kỳ lương"
          format="MM/YYYY"
          value-format="YYYY-MM"
          :clearable="false"
          class="!w-48"
          @change="fetchReport"
        />
        <el-button type="success" size="large" :icon="Download" @click="exportToExcel" :loading="isExporting" class="font-bold shadow-md">
          {{ isExporting ? 'ĐANG XUẤT...' : 'XUẤT EXCEL' }}
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" v-loading="loading">
      <div class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <p class="text-slate-500 font-semibold text-sm mb-1">Tổng Số Lượng Nhân Sự</p>
        <h3 class="text-3xl font-black text-slate-700">{{ summary.tongNhanVien }} <span class="text-sm font-medium text-slate-400">người</span></h3>
      </div>
      <div class="bg-blue-600 p-5 rounded-2xl shadow-md text-white">
        <p class="text-blue-200 font-semibold text-sm mb-1">Tổng Thực Lãnh (Dòng tiền ra)</p>
        <h3 class="text-3xl font-black">{{ formatPrice(summary.tongQuyLuong) }}</h3>
      </div>
      <div class="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm">
        <p class="text-amber-600 font-semibold text-sm mb-1">Tổng Chi OT & Phụ Cấp</p>
        <h3 class="text-3xl font-black text-amber-700">{{ formatPrice(structureStats.tongOT + structureStats.tongPhuCap) }}</h3>
      </div>
      <div class="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm">
        <p class="text-rose-600 font-semibold text-sm mb-1">Tổng Khấu Trừ & Thu Hồi</p>
        <h3 class="text-3xl font-black text-rose-700">{{ formatPrice(summary.tongKhauTru) }}</h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-loading="loading">
      
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 class="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
          <el-icon class="text-blue-500"><PieChart /></el-icon> Cơ cấu quỹ lương
        </h3>
        
        <div class="space-y-5">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-semibold text-slate-700">Lương cơ bản (Cố định)</span>
              <span class="font-bold text-slate-800">{{ formatPrice(structureStats.tongLuongCoBan) }}</span>
            </div>
            <el-progress :percentage="calcPercent(structureStats.tongLuongCoBan, structureStats.tongThuNhap)" :stroke-width="12" color="#3b82f6" />
          </div>
          
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-semibold text-slate-700">Phụ cấp & Thưởng (Biến phí)</span>
              <span class="font-bold text-slate-800">{{ formatPrice(structureStats.tongPhuCap) }}</span>
            </div>
            <el-progress :percentage="calcPercent(structureStats.tongPhuCap, structureStats.tongThuNhap)" :stroke-width="12" color="#10b981" />
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="font-semibold text-slate-700">Chi phí Tăng ca (OT)</span>
              <span class="font-bold text-slate-800">{{ formatPrice(structureStats.tongOT) }}</span>
            </div>
            <el-progress :percentage="calcPercent(structureStats.tongOT, structureStats.tongThuNhap)" :stroke-width="12" color="#f59e0b" />
          </div>

          <div class="pt-4 mt-2 border-t border-dashed border-slate-200">
            <div class="flex justify-between text-sm text-rose-600 mb-1">
              <span class="font-semibold">Khấu trừ Bảo hiểm & Phạt (-)</span>
              <span class="font-bold">{{ formatPrice(summary.tongKhauTru) }}</span>
            </div>
            <el-progress :percentage="calcPercent(summary.tongKhauTru, structureStats.tongThuNhap)" :stroke-width="8" color="#e11d48" />
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 class="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
          <el-icon class="text-emerald-500"><DataLine /></el-icon> Phân bổ quỹ lương theo Chức vụ
        </h3>
        
        <div class="space-y-4 max-h-[250px] overflow-y-auto pr-2">
          <div v-for="(item, index) in roleStats" :key="index" class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                {{ calcPercent(item.totalLanh, summary.tongQuyLuong) }}%
              </div>
              <div>
                <p class="font-bold text-slate-700">{{ item.tenChucVu }}</p>
                <p class="text-xs text-slate-500">{{ item.count }} nhân sự</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-black text-slate-800">{{ formatPrice(item.totalLanh) }}</p>
            </div>
          </div>
          
          <div v-if="roleStats.length === 0" class="text-center text-slate-400 py-4 italic">Không có dữ liệu</div>
        </div>
      </div>

    </div>

    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-lg text-slate-800">Bảng Đối Soát Chi Tiết</h3>
        <el-input v-model="searchQuery" placeholder="Tìm tên nhân viên..." :prefix-icon="Search" class="w-64" clearable />
      </div>

      <el-table :data="filteredData" style="width: 100%" v-loading="loading" border stripe height="350">
        <el-table-column type="index" label="STT" width="60" align="center" />
        <el-table-column prop="hoTen" label="Nhân Viên" min-width="180">
          <template #default="scope">
            <span class="font-bold text-slate-800">{{ scope.row.hoTen }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tenChucVu" label="Chức Vụ" width="130" align="center">
          <template #default="scope"><el-tag effect="plain" type="info">{{ scope.row.tenChucVu || 'Chưa rõ' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="Lương CB + OT" width="150" align="right">
          <template #default="scope"><span class="text-slate-600">{{ formatPrice(Number(scope.row.luongCoBan) + Number(scope.row.tongTienTangCa)) }}</span></template>
        </el-table-column>
        <el-table-column label="Phụ Cấp & Thưởng" width="150" align="right">
          <template #default="scope"><span class="text-emerald-600">+ {{ formatPrice(Number(scope.row.phuCapChucVu) + Number(scope.row.phuCapKhac) + Number(scope.row.thuong)) }}</span></template>
        </el-table-column>
        <el-table-column label="Khấu Trừ" width="120" align="right">
          <template #default="scope"><span class="text-rose-600">- {{ formatPrice(Number(scope.row.tongTienPhat) + Number(scope.row.truBaoHiem)) }}</span></template>
        </el-table-column>
        <el-table-column prop="thucLanh" label="Thực Lãnh" width="150" align="right" sortable>
          <template #default="scope"><span class="font-black text-blue-600">{{ formatPrice(scope.row.thucLanh) }}</span></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Download, Search, PieChart, DataLine } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ExcelJS from 'exceljs'; 
import api from '../../services/api';

const loading = ref(false);
const isExporting = ref(false);
const reportData = ref([]);
const summary = ref({ tongNhanVien: 0, tongQuyLuong: 0, tongKhauTru: 0 });

const filterMonth = ref('');
const searchQuery = ref('');

// Tiện ích Format
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
const calcPercent = (part, total) => total > 0 ? Math.round((part / total) * 100) : 0;

// ==========================================
// THUẬT TOÁN PHÂN TÍCH DATA CHO DASHBOARD
// ==========================================

// 1. Phân tích Cơ cấu Dòng tiền
const structureStats = computed(() => {
  let tongLuongCoBan = 0;
  let tongOT = 0;
  let tongPhuCap = 0;

  reportData.value.forEach(item => {
    tongLuongCoBan += Number(item.luongCoBan) || 0;
    tongOT += Number(item.tongTienTangCa) || 0;
    tongPhuCap += (Number(item.phuCapChucVu) + Number(item.phuCapKhac) + Number(item.thuong)) || 0;
  });

  const tongThuNhap = tongLuongCoBan + tongOT + tongPhuCap; // Tổng trước khi trừ
  return { tongLuongCoBan, tongOT, tongPhuCap, tongThuNhap };
});

// 2. Phân nhóm Quỹ lương theo Chức vụ
const roleStats = computed(() => {
  const groups = {};
  reportData.value.forEach(item => {
    const role = item.tenChucVu || 'Chưa phân bổ';
    if (!groups[role]) {
      groups[role] = { tenChucVu: role, totalLanh: 0, count: 0 };
    }
    groups[role].totalLanh += Number(item.thucLanh) || 0;
    groups[role].count += 1;
  });

  // Chuyển Object thành Mảng và sắp xếp giảm dần theo Tiền
  return Object.values(groups).sort((a, b) => b.totalLanh - a.totalLanh);
});

// 3. Lọc danh sách đối soát
const filteredData = computed(() => {
  if (!searchQuery.value) return reportData.value;
  return reportData.value.filter(item => 
    item.hoTen.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    item.maNhanVien.toString().includes(searchQuery.value)
  );
});

// ==========================================
// GỌI API & EXCEL (GIỮ NGUYÊN)
// ==========================================
const fetchReport = async () => {
  if (!filterMonth.value) return;

  loading.value = true;
  try {
    const [nam, thang] = filterMonth.value.split('-');
    const res = await api.get(`/hr/report/salary?thang=${thang}&nam=${nam}`);
    
    reportData.value = res.result || res.data || res || [];
    summary.value = res.summary || { tongNhanVien: 0, tongQuyLuong: 0, tongKhauTru: 0 };
    
  } catch (error) {
    ElMessage.error('Lỗi khi tải báo cáo lương!');
  } finally {
    loading.value = false;
  }
};

const exportToExcel = async () => {
  // ... [Toàn bộ logic xuất Excel giữ nguyên như phiên bản trước, không thay đổi] ...
  // Để code gọn, bạn cứ dán lại nguyên cái hàm exportToExcel của lần trước vào đây nhé!
  if (filteredData.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất!');
    return;
  }

  isExporting.value = true;
  try {
    const [nam, thang] = filterMonth.value.split('-');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Lương T${thang}-${nam}`);

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã NV', key: 'maNhanVien', width: 12 },
      { header: 'Tên Nhân Viên', key: 'hoTen', width: 35 },
      { header: 'Chức Vụ', key: 'tenChucVu', width: 20 },
      { header: 'Lương Cơ Bản', key: 'luongCoBan', width: 18 },
      { header: 'Tiền OT', key: 'tienOT', width: 15 },
      { header: 'Tổng Phụ Cấp & Thưởng', key: 'phuCap', width: 25 },
      { header: 'Tiền Phạt', key: 'tienPhat', width: 15 },
      { header: 'Trừ BHXH/BHYT', key: 'truBH', width: 18 },
      { header: 'THỰC LÃNH (VND)', key: 'thucLanh', width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    filteredData.value.forEach((item, index) => {
      worksheet.addRow({
        stt: index + 1,
        maNhanVien: item.maNhanVien,
        hoTen: item.hoTen,
        tenChucVu: item.tenChucVu || '',
        luongCoBan: Number(item.luongCoBan),
        tienOT: Number(item.tongTienTangCa),
        phuCap: Number(item.phuCapChucVu) + Number(item.phuCapKhac) + Number(item.thuong),
        tienPhat: Number(item.tongTienPhat),
        truBH: Number(item.truBaoHiem),
        thucLanh: Number(item.thucLanh)
      });
    });

    const summaryRow = worksheet.addRow({
      stt: '', maNhanVien: '', hoTen: 'TỔNG CỘNG QUỸ LƯƠNG:', tenChucVu: '', luongCoBan: '',
      tienOT: '', phuCap: '', tienPhat: '', truBH: Number(summary.value.tongKhauTru), thucLanh: Number(summary.value.tongQuyLuong)
    });
    
    summaryRow.font = { bold: true, color: { argb: 'FF1D4ED8' } };
    summaryRow.getCell('hoTen').alignment = { horizontal: 'right' };

    const moneyColumns = ['luongCoBan', 'tienOT', 'phuCap', 'tienPhat', 'truBH', 'thucLanh'];
    moneyColumns.forEach(col => { worksheet.getColumn(col).numFmt = '#,##0'; });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    link.download = `QuyLuong_T${thang}_${nam}.xlsx`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('Xuất file Excel thành công!');

  } catch (error) {
    console.error(error);
    ElMessage.error('Lỗi khi xuất file!');
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  filterMonth.value = `${y}-${m}`;
  fetchReport();
});
</script>