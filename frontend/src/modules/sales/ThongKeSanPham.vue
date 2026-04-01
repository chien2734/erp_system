<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Báo Cáo Sản Phẩm Đã Xuất</h2>
        <p class="text-slate-500">Thống kê số lượng xuất, doanh thu và lợi nhuận theo tháng, quý hoặc năm.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <el-radio-group v-model="selectedType" size="default" class="mr-3">
          <el-radio-button label="month">Theo tháng</el-radio-button>
          <el-radio-button label="quarter">Theo quý</el-radio-button>
          <el-radio-button label="year">Theo năm</el-radio-button>
        </el-radio-group>

        <el-date-picker
          v-if="selectedType === 'month'"
          v-model="selectedMonth"
          type="month"
          placeholder="Chọn tháng"
          format="MM/YYYY"
          value-format="YYYY-MM"
          :clearable="false"
          class="w-44"
        />

        <div v-if="selectedType === 'quarter'" class="flex items-center gap-2">
          <el-select v-model="selectedQuarter" placeholder="Chọn quý" class="w-32">
            <el-option v-for="quy in [1,2,3,4]" :key="quy" :label="`Quý ${quy}`" :value="quy" />
          </el-select>
          <el-date-picker
            v-model="selectedYear"
            type="year"
            placeholder="Chọn năm"
            format="YYYY"
            value-format="YYYY"
            :clearable="false"
            class="w-32"
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
          class="w-32!"
        />

        <el-button type="primary" size="large" @click="loadReport" :loading="fetching" class="font-bold shadow-md shadow-blue-500/30">
          Xem báo cáo
        </el-button>
        <el-button type="success" size="large" plain @click="exportExcel" :disabled="reportList.length === 0">
          <el-icon class="mr-2"><Download /></el-icon> Xuất Excel
        </el-button>
        <el-button type="info" size="large" plain @click="handlePrint" :disabled="reportList.length === 0">
          <el-icon class="mr-2"><Printer /></el-icon> In báo cáo
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" v-loading="fetching">
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-sm text-slate-500 font-semibold mb-1">Tổng sản phẩm xuất</p>
        <p class="text-2xl font-black text-blue-600">{{ summary.tongSoLuong }}</p>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-sm text-slate-500 font-semibold mb-1">Tổng doanh thu</p>
        <p class="text-xl font-bold text-emerald-600">{{ formatPrice(summary.tongDoanhThu) }}</p>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-sm text-slate-500 font-semibold mb-1">Tổng giá vốn</p>
        <p class="text-xl font-bold text-slate-800">{{ formatPrice(summary.tongGiaVon) }}</p>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <p class="text-sm text-slate-500 font-semibold mb-1">Tổng lợi nhuận</p>
        <p class="text-2xl font-black text-rose-600">{{ formatPrice(summary.tongLoiNhuan) }}</p>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" v-loading="fetching">
      <el-table :data="reportList" style="width: 100%" size="large" stripe border>
        <el-table-column prop="tenSP" label="Sản phẩm" min-width="240" />
        <el-table-column prop="soLuongDaXuat" label="Số lượng xuất" width="150" align="center">
          <template #default="{ row }">
            <span class="font-bold">{{ row.soLuongDaXuat }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="doanhThu" label="Doanh thu" width="180" align="right">
          <template #default="{ row }">{{ formatPrice(row.doanhThu) }}</template>
        </el-table-column>
        <el-table-column prop="tongGiaVon" label="Giá vốn" width="180" align="right">
          <template #default="{ row }">{{ formatPrice(row.tongGiaVon) }}</template>
        </el-table-column>
        <el-table-column prop="loiNhuan" label="Lợi nhuận" width="180" align="right">
          <template #default="{ row }">{{ formatPrice(row.loiNhuan) }}</template>
        </el-table-column>
      </el-table>
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
</style>
