<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div class="shrink-0">
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Báo Cáo Sản Phẩm Đã Xuất</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Thống kê số lượng xuất, doanh thu và lợi nhuận theo kỳ.</p>
      </div>
      
      <div class="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-start xl:justify-end gap-3 w-full xl:w-auto">
        
        <div class="w-full sm:w-auto overflow-x-auto">
          <el-radio-group v-model="selectedType" size="default" class="whitespace-nowrap flex">
            <el-radio-button label="month">Theo tháng</el-radio-button>
            <el-radio-button label="quarter">Theo quý</el-radio-button>
            <el-radio-button label="year">Theo năm</el-radio-button>
          </el-radio-group>
        </div>

        <div class="flex gap-2 w-full sm:w-auto">
          <el-date-picker
            v-if="selectedType === 'month'"
            v-model="selectedMonth"
            type="month"
            placeholder="Chọn tháng"
            format="MM/YYYY"
            value-format="YYYY-MM"
            :clearable="false"
            class="!w-full sm:!w-32"
          />

          <div v-if="selectedType === 'quarter'" class="flex gap-2 w-full sm:w-auto">
            <el-select v-model="selectedQuarter" placeholder="Quý" class="flex-1 sm:!w-24">
              <el-option v-for="quy in [1,2,3,4]" :key="quy" :label="`Quý ${quy}`" :value="quy" />
            </el-select>
            <el-date-picker
              v-model="selectedYear"
              type="year"
              placeholder="Năm"
              format="YYYY"
              value-format="YYYY"
              :clearable="false"
              class="flex-1 sm:!w-24"
            />
          </div>

          <el-date-picker
            v-if="selectedType === 'year'"
            v-model="selectedYear"
            type="year"
            placeholder="Chọn năm"
            format="YYYY"
            value-format="YYYY"
            :clearable="false"
            class="!w-full sm:!w-28"
          />
        </div>

        <div class="flex gap-2 w-full sm:w-auto">
          <el-button type="primary" @click="loadReport" :loading="fetching" class="flex-1 sm:flex-none font-bold shadow-md shadow-blue-500/30">
            <el-icon class="mr-1 sm:mr-2"><RefreshRight /></el-icon> <span>Xem báo cáo</span>
          </el-button>
          <el-button type="success" plain @click="exportExcel" :disabled="reportList.length === 0" class="flex-1 sm:flex-none px-3">
            <el-icon><Download /></el-icon>
          </el-button>
          <el-button type="info" plain @click="handlePrint" :disabled="reportList.length === 0" class="flex-1 sm:flex-none px-3">
            <el-icon><Printer /></el-icon>
          </el-button>
        </div>

      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" v-loading="fetching">
      <div class="bg-white p-3 md:p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <p class="text-[11px] md:text-sm text-slate-500 font-semibold mb-1 truncate">Tổng sản phẩm xuất</p>
        <p class="text-xl md:text-2xl font-black text-blue-600 truncate" :title="summary.tongSoLuong">{{ summary.tongSoLuong }}</p>
      </div>
      <div class="bg-white p-3 md:p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <p class="text-[11px] md:text-sm text-slate-500 font-semibold mb-1 truncate">Tổng doanh thu</p>
        <p class="text-base md:text-xl font-bold text-emerald-600 truncate" :title="formatPrice(summary.tongDoanhThu)">{{ formatPrice(summary.tongDoanhThu) }}</p>
      </div>
      <div class="bg-white p-3 md:p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <p class="text-[11px] md:text-sm text-slate-500 font-semibold mb-1 truncate">Tổng giá vốn</p>
        <p class="text-base md:text-xl font-bold text-slate-800 truncate" :title="formatPrice(summary.tongGiaVon)">{{ formatPrice(summary.tongGiaVon) }}</p>
      </div>
      <div class="bg-white p-3 md:p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <p class="text-[11px] md:text-sm text-slate-500 font-semibold mb-1 truncate">Tổng lợi nhuận</p>
        <p class="text-xl md:text-2xl font-black text-rose-600 truncate" :title="formatPrice(summary.tongLoiNhuan)">{{ formatPrice(summary.tongLoiNhuan) }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto" v-loading="fetching">
      <el-table :data="reportList" style="width: 100%" size="large" stripe border class="min-w-[700px] print-table">
        <el-table-column prop="tenSP" label="Sản phẩm" min-width="200">
          <template #default="{ row }">
            <span class="font-semibold text-slate-800 text-xs md:text-sm line-clamp-2" :title="row.tenSP">{{ row.tenSP }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="soLuongDaXuat" label="Số lượng xuất" min-width="120" align="center">
          <template #default="{ row }">
            <span class="font-bold text-blue-600 text-sm md:text-base">{{ row.soLuongDaXuat }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="doanhThu" label="Doanh thu" min-width="140" align="right">
          <template #default="{ row }"><span class="whitespace-nowrap text-xs md:text-sm font-medium">{{ formatPrice(row.doanhThu) }}</span></template>
        </el-table-column>
        
        <el-table-column prop="tongGiaVon" label="Giá vốn" min-width="140" align="right">
          <template #default="{ row }"><span class="whitespace-nowrap text-xs md:text-sm font-medium text-slate-500">{{ formatPrice(row.tongGiaVon) }}</span></template>
        </el-table-column>
        
        <el-table-column prop="loiNhuan" label="Lợi nhuận" min-width="140" align="right">
          <template #default="{ row }">
            <span class="whitespace-nowrap text-xs md:text-sm font-bold" :class="row.loiNhuan < 0 ? 'text-red-500' : 'text-emerald-600'">
              {{ formatPrice(row.loiNhuan) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="reportList.length === 0 && !fetching" class="text-center py-12 bg-slate-50 border border-dashed border-slate-300">
         <el-icon class="text-4xl text-slate-300 mb-2"><DataAnalysis /></el-icon>
         <p class="text-slate-500 font-medium">Không có dữ liệu xuất bán trong kỳ này.</p>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Printer, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../../services/api';

const today = new Date();
const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

const selectedType = ref('month');
const selectedMonth = ref(currentMonthStr);
const selectedQuarter = ref(1);
const selectedYear = ref(`${today.getFullYear()}`);
const fetching = ref(false);

const reportList = ref([]);
const summary = ref({ tongSoLuong: 0, tongDoanhThu: 0, tongGiaVon: 0, tongLoiNhuan: 0 });

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

// normalizeResponse giúp chuẩn hóa dữ liệu trả về từ API
// Vì api.js interceptor có thể trả về response.data trực tiếp,
// chúng ta phải xử lý cả trường hợp response có dạng { success, data, summary }
const normalizeResponse = (res) => {
  if (!res) return {};
  if (typeof res === 'object' && res.hasOwnProperty('success') && res.hasOwnProperty('data')) {
    return res;
  }
  return res.data || res;
};

const loadReport = async () => {
  // Hiển thị loading khi chờ dữ liệu
  fetching.value = true;
  try {
    // Xây dựng query theo loại thống kê: tháng / quý / năm
    let query = `/sales/thongke/sanpham?type=${selectedType.value}&nam=${selectedYear.value}`;
    if (selectedType.value === 'month') {
      const [year, month] = selectedMonth.value.split('-');
      query = `/sales/thongke/sanpham?type=month&thang=${parseInt(month)}&nam=${year}`;
    } else if (selectedType.value === 'quarter') {
      query = `/sales/thongke/sanpham?type=quarter&quy=${selectedQuarter.value}&nam=${selectedYear.value}`;
    }

    // Gọi API lấy dữ liệu báo cáo
    const res = await api.get(query);
    const payload = normalizeResponse(res);

    // Nếu payload trả về data là mảng thì gán, còn không thì để trống
    reportList.value = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    // Lấy thông tin tổng hợp từ summary
    summary.value = payload.summary || { tongSoLuong: 0, tongDoanhThu: 0, tongGiaVon: 0, tongLoiNhuan: 0 };
  } catch (error) {
    console.error('Lỗi tải báo cáo sản phẩm:', error);
    ElMessage.error(error.response?.data?.message || 'Không thể tải báo cáo sản phẩm.');
  } finally {
    fetching.value = false;
  }
};

const exportExcel = async () => {
  if (reportList.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BaoCaoSanPham');

  worksheet.columns = [
    { header: 'Sản phẩm', key: 'tenSP', width: 40 },
    { header: 'SL xuất', key: 'soLuongDaXuat', width: 14 },
    { header: 'Doanh thu', key: 'doanhThu', width: 18 },
    { header: 'Giá vốn', key: 'tongGiaVon', width: 18 },
    { header: 'Lợi nhuận', key: 'loiNhuan', width: 18 }
  ];

  reportList.value.forEach(item => {
    worksheet.addRow({
      tenSP: item.tenSP,
      soLuongDaXuat: item.soLuongDaXuat,
      doanhThu: item.doanhThu,
      tongGiaVon: item.tongGiaVon,
      loiNhuan: item.loiNhuan
    });
  });

  worksheet.addRow([]);
  worksheet.addRow({ tenSP: 'TỔNG CỘNG', soLuongDaXuat: summary.value.tongSoLuong, doanhThu: summary.value.tongDoanhThu, tongGiaVon: summary.value.tongGiaVon, loiNhuan: summary.value.tongLoiNhuan });
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(reportList.value.length + 2).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const period = selectedType.value === 'month'
    ? selectedMonth.value.replace('-', '_')
    : selectedType.value === 'quarter'
      ? `Q${selectedQuarter.value}_${selectedYear.value}`
      : selectedYear.value;
  saveAs(blob, `BaoCaoSanPham_${selectedType.value}_${period}.xlsx`);

  ElMessage.success('Xuất báo cáo Excel thành công!');
};

const handlePrint = () => {
  window.print();
};

onMounted(() => {
  loadReport();
});

watch([selectedType, selectedMonth, selectedQuarter, selectedYear], () => {
  loadReport();
});
</script>

<style scoped>
:deep(.el-table__header) { background-color: #f8fafc; }

/* Tùy chỉnh Scrollbar ngang để người dùng biết có thể vuốt */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Css dành riêng cho chế độ In (Print) */
@media print {
  /* Ẩn header, các nút bấm và background màu mè khi in giấy */
  .flex-col.md\:flex-row { display: none !important; }
  .space-y-4 { margin: 0 !important; padding: 0 !important; }
  .shadow-sm { box-shadow: none !important; border: 1px solid #000 !important; }
  .print-table { border-collapse: collapse; width: 100%; margin-top: 20px; }
  body { background-color: #fff; }
}
</style><style scoped>
:deep(.el-table__header) { background-color: #f8fafc; }

/* Tùy chỉnh Scrollbar ngang để người dùng biết có thể vuốt */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Css dành riêng cho chế độ In (Print) */
@media print {
  /* Ẩn header, các nút bấm và background màu mè khi in giấy */
  .flex-col.md\:flex-row { display: none !important; }
  .space-y-4 { margin: 0 !important; padding: 0 !important; }
  .shadow-sm { box-shadow: none !important; border: 1px solid #000 !important; }
  .print-table { border-collapse: collapse; width: 100%; margin-top: 20px; }
  body { background-color: #fff; }
}
</style>