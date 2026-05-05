<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-800">Dashboard Báo Cáo Quỹ Lương</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Phân tích chuyên sâu chi phí nhân sự và dòng tiền</p>
      </div>
      
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="font-semibold text-slate-700 text-sm whitespace-nowrap">Kỳ báo cáo:</span>
          <el-radio-group v-model="selectedPeriodType" size="large" class="shrink-0" @change="handlePeriodChange">
            <el-radio-button label="month">Tháng</el-radio-button>
            <el-radio-button label="year">Năm</el-radio-button>
          </el-radio-group>
        </div>

        <el-date-picker
          v-if="selectedPeriodType === 'month'"
          v-model="filterMonth"
          type="month"
          placeholder="Chọn tháng"
          format="MM/YYYY"
          value-format="YYYY-MM"
          :clearable="false"
          class="w-full sm:!w-32"
          size="large"
          @change="fetchReport"
        />
        <el-date-picker
          v-else
          v-model="filterYear"
          type="year"
          placeholder="Chọn năm"
          format="YYYY"
          value-format="YYYY"
          :clearable="false"
          class="w-full sm:!w-28"
          size="large"
          @change="fetchReport"
        />

        <el-button type="success" size="large" :icon="Download" @click="exportToExcel" :loading="isExporting" class="w-full sm:w-auto font-bold shadow-md m-0">
          {{ isExporting ? 'ĐANG XUẤT...' : 'XUẤT EXCEL' }}
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" v-loading="loading">
      <div class="bg-white border border-slate-200 p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm">
        <p class="text-slate-500 font-semibold text-xs md:text-sm mb-1 uppercase">Tổng Số Lượng Nhân Sự</p>
        <h3 class="text-2xl md:text-3xl font-black text-slate-700">{{ uniqueEmployeeCount }} <span class="text-xs md:text-sm font-medium text-slate-400">người</span></h3>
      </div>
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-5 rounded-xl md:rounded-2xl shadow-md text-white">
        <p class="text-blue-100 font-semibold text-xs md:text-sm mb-1 uppercase">Tổng Thực Lãnh (Dòng tiền ra)</p>
        <h3 class="text-2xl md:text-3xl font-black">{{ formatPrice(summary.tongQuyLuong) }}</h3>
      </div>
      <div class="bg-amber-50 border border-amber-200 p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm">
        <p class="text-amber-600 font-semibold text-xs md:text-sm mb-1 uppercase">Tổng Chi OT & Phụ Cấp</p>
        <h3 class="text-2xl md:text-3xl font-black text-amber-700">{{ formatPrice(structureStats.tongOT + structureStats.tongPhuCap) }}</h3>
      </div>
      <div class="bg-rose-50 border border-rose-200 p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm">
        <p class="text-rose-600 font-semibold text-xs md:text-sm mb-1 uppercase">Tổng Khấu Trừ & Thu Hồi</p>
        <h3 class="text-2xl md:text-3xl font-black text-rose-700">{{ formatPrice(summary.tongKhauTru) }}</h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6" v-loading="loading">
      
      <div class="lg:col-span-5 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
        <h3 class="font-bold text-base md:text-lg text-slate-800 mb-2 flex items-center gap-2">
          <el-icon class="text-blue-500"><PieChart /></el-icon> Cơ cấu quỹ lương
        </h3>
        <div ref="pieChartRef" class="w-full h-[280px]"></div>
      </div>

      <div class="lg:col-span-7 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
        <h3 class="font-bold text-base md:text-lg text-slate-800 mb-2 flex items-center gap-2">
          <el-icon class="text-emerald-500"><DataLine /></el-icon> 
          {{ selectedPeriodType === 'year' ? 'Biến động dòng tiền Thực lãnh theo Tháng' : 'Phân bổ quỹ lương theo Chức vụ' }}
        </h3>
        
        <div v-show="selectedPeriodType === 'year'" ref="barChartRef" class="w-full h-[280px]"></div>
        
        <div v-show="selectedPeriodType === 'month'" class="space-y-3 md:space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar mt-4">
          <div v-for="(item, index) in roleStats" :key="index" class="bg-slate-50 p-2.5 md:p-3 rounded-lg md:rounded-xl border border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2 md:gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                {{ calcPercent(item.totalLanh, summary.tongQuyLuong) }}%
              </div>
              <div class="min-w-0">
                <p class="font-bold text-slate-700 text-sm md:text-base truncate">{{ item.tenChucVu }}</p>
                <p class="text-xs text-slate-500">{{ item.count }} nhân sự</p>
              </div>
            </div>
            <div class="text-right shrink-0 pl-2">
              <p class="font-black text-slate-800 text-base md:text-lg">{{ formatPrice(item.totalLanh) }}</p>
            </div>
          </div>
          <div v-if="roleStats.length === 0" class="text-center text-slate-400 py-8 italic text-sm">Không có dữ liệu cho kỳ báo cáo này</div>
        </div>
      </div>

    </div>

    <div class="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100" >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 class="font-bold text-base md:text-lg text-slate-800">Bảng Đối Soát Chi Tiết</h3>
        <el-input v-model="searchQuery" placeholder="Tìm tên nhân viên..." :prefix-icon="Search" class="w-full sm:!w-64" size="large" clearable />
      </div>

      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <el-table 
          :data="paginatedData" 
          style="width: 100%" 
          v-loading="loading" 
          stripe 
          class="min-w-[800px]"
          :default-sort="selectedPeriodType === 'year' ? { prop: 'thang', order: 'ascending' } : { prop: 'thucLanh', order: 'descending' }"
        >
          
          <el-table-column type="index" label="STT" width="50" align="center" fixed="left" />
        
          <el-table-column prop="hoTen" label="Nhân Viên" min-width="160" fixed="left" sortable>
            <template #default="scope">
              <span class="font-bold text-slate-800 text-sm line-clamp-1" :title="scope.row.hoTen">{{ scope.row.hoTen }}</span>
            </template>
          </el-table-column>

          <el-table-column v-if="selectedPeriodType === 'year'" prop="thang" label="Tháng" width="95" align="center" sortable>
            <template #default="scope"><span class="font-bold text-slate-600">Tháng {{ scope.row.thang }}</span></template>
          </el-table-column>

          <el-table-column prop="tenChucVu" label="Chức Vụ" min-width="130" align="center">
            <template #default="scope"><el-tag effect="plain" type="info" class="truncate max-w-[110px]" :title="scope.row.tenChucVu">{{ scope.row.tenChucVu || 'Chưa rõ' }}</el-tag></template>
          </el-table-column>
          
          <el-table-column label="Lương CB + OT" min-width="130" align="right">
            <template #default="scope"><span class="text-slate-600 font-medium whitespace-nowrap">{{ formatPrice(Number(scope.row.luongCoBan) + Number(scope.row.tongTienTangCa)) }}</span></template>
          </el-table-column>
          
          <el-table-column label="Phụ Cấp & Thưởng" min-width="140" align="right">
            <template #default="scope"><span class="text-emerald-600 font-medium whitespace-nowrap">+ {{ formatPrice(Number(scope.row.phuCapChucVu) + Number(scope.row.phuCapKhac) + Number(scope.row.thuong)) }}</span></template>
          </el-table-column>
          
          <el-table-column label="Khấu Trừ" min-width="110" align="right">
            <template #default="scope"><span class="text-rose-600 font-medium whitespace-nowrap">- {{ formatPrice(Number(scope.row.tongTienPhat) + Number(scope.row.truBaoHiem)) }}</span></template>
          </el-table-column>
          
          <el-table-column prop="thucLanh" label="Thực Lãnh" min-width="130" align="right" sortable fixed="right">
            <template #default="scope"><span class="font-black text-blue-700 whitespace-nowrap">{{ formatPrice(scope.row.thucLanh) }}</span></template>
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { Download, Search, PieChart, DataLine } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ExcelJS from 'exceljs'; 
import { saveAs } from 'file-saver';
import api from '../../services/api';
import * as echarts from 'echarts'; 
import { usePagination } from '../../composables/usePagination';

const loading = ref(false);
const isExporting = ref(false);
const reportData = ref([]);

// --- KỲ BÁO CÁO (THÁNG/NĂM) ---
const today = new Date();
const selectedPeriodType = ref('month');
const filterMonth = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
const filterYear = ref(`${today.getFullYear()}`);
const searchQuery = ref('');

// --- ECHARTS REFS ---
const pieChartRef = ref(null);
const barChartRef = ref(null);
let pieChartInstance = null;
let barChartInstance = null;

// Đổi loại kỳ (Reset data và load lại)
const handlePeriodChange = () => {
  reportData.value = []; 
  fetchReport();
};

// Tiện ích Format
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
const calcPercent = (part, total) => total > 0 ? Math.round((part / total) * 100) : 0;

// ==========================================
// ĐÃ FIX LỖI ĐẾM NHÂN SỰ
// ==========================================
// Đếm số nhân sự UNIQUE (Dù có 12 dòng lương trong năm thì vẫn chỉ tính là 1 người)
const uniqueEmployeeCount = computed(() => {
  const uniqueEmp = new Set(reportData.value.map(item => item.maNhanVien));
  return uniqueEmp.size;
});

// Tự tính lại Summary chuẩn xác từ reportData
const summary = computed(() => {
  const tongQuyLuong = reportData.value.reduce((sum, item) => sum + Number(item.thucLanh), 0);
  const tongKhauTru = reportData.value.reduce((sum, item) => sum + Number(item.tongTienPhat) + Number(item.truBaoHiem), 0);
  return { tongNhanVien: uniqueEmployeeCount.value, tongQuyLuong, tongKhauTru };
});

const structureStats = computed(() => {
  let tongLuongCoBan = 0; let tongOT = 0; let tongPhuCap = 0;
  reportData.value.forEach(item => {
    tongLuongCoBan += Number(item.luongCoBan) || 0;
    tongOT += Number(item.tongTienTangCa) || 0;
    tongPhuCap += (Number(item.phuCapChucVu) + Number(item.phuCapKhac) + Number(item.thuong)) || 0;
  });
  const tongThuNhap = tongLuongCoBan + tongOT + tongPhuCap; 
  return { tongLuongCoBan, tongOT, tongPhuCap, tongThuNhap };
});

// Gom nhóm theo chức vụ (Đã fix lỗi đếm nhân sự trùng lặp)
const roleStats = computed(() => {
  const groups = {};
  reportData.value.forEach(item => {
    const role = item.tenChucVu || 'Chưa phân bổ';
    if (!groups[role]) {
      groups[role] = { tenChucVu: role, totalLanh: 0, emps: new Set() }; // Dùng Set để chứa mã NV
    }
    groups[role].totalLanh += Number(item.thucLanh) || 0;
    groups[role].emps.add(item.maNhanVien); 
  });

  return Object.values(groups).map(g => ({
    tenChucVu: g.tenChucVu,
    totalLanh: g.totalLanh,
    count: g.emps.size // Chỉ đếm số lượng NV độc nhất
  })).sort((a, b) => b.totalLanh - a.totalLanh);
});

// Phân tích dòng tiền theo tháng (Dùng cho Biểu đồ Cột)
const monthlyStats = computed(() => {
  const months = Array.from({length: 12}, (_, i) => i + 1); // 1->12
  const data = new Array(12).fill(0);
  
  reportData.value.forEach(item => {
    if (item.thang) {
      data[item.thang - 1] += Number(item.thucLanh);
    }
  });
  return { months: months.map(m => `Tháng ${m}`), data };
});

const filteredData = computed(() => {
  if (!searchQuery.value) return reportData.value;
  return reportData.value.filter(item => 
    item.hoTen.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    item.maNhanVien.toString().includes(searchQuery.value)
  );
});

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(filteredData, 7);

// ==========================================
// VẼ BIỂU ĐỒ ECHARTS 
// ==========================================
const initCharts = () => {
  // 1. BIỂU ĐỒ TRÒN (PIE CHART)
  if (pieChartRef.value) {
    if (pieChartInstance) pieChartInstance.dispose();
    pieChartInstance = echarts.init(pieChartRef.value);
    
    pieChartInstance.setOption({
      tooltip: { 
        trigger: 'item',
        // Dùng hàm để format giá tiền thành dạng có dấu phẩy (VNĐ)
        formatter: (params) => {
          return `${params.marker} ${params.name}<br/>
                  <span style="font-weight:bold; margin-left: 14px;">${formatPrice(params.value)}</span> 
                  <span style="color:#64748b;">(${params.percent}%)</span>`;
        },
        // Ép tooltip luôn nằm bên phải con trỏ chuột 15px
        position: (point, params, dom, rect, size) => {
          return [point[0] + 15, point[1] - (size.contentSize[1] / 2)];
        }
      },
      legend: { bottom: '0%', left: 'center' },
      color: ['#3b82f6', '#10b981', '#f59e0b', '#e11d48'],
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: [
            { value: structureStats.value.tongLuongCoBan, name: 'Lương Cố định' },
            { value: structureStats.value.tongPhuCap, name: 'Biến phí (Thưởng/PC)' },
            { value: structureStats.value.tongOT, name: 'Tăng ca (OT)' },
            { value: summary.value.tongKhauTru, name: 'Khấu trừ (BH+Phạt)' }
          ]
        }
      ]
    });
  }

  // 2. BIỂU ĐỒ CỘT (BAR CHART) - Chỉ vẽ khi xem báo cáo năm
  if (selectedPeriodType.value === 'year' && barChartRef.value) {
    if (barChartInstance) barChartInstance.dispose();
    barChartInstance = echarts.init(barChartRef.value);
    
    barChartInstance.setOption({
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' },
        // Format tiền VND khi rê chuột vào cột
        formatter: (params) => {
          const data = params[0];
          return `${data.marker} ${data.name}<br/>
                  <span style="font-weight:bold; margin-left: 14px;">${formatPrice(data.value)}</span>`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: monthlyStats.value.months },
      yAxis: { 
        type: 'value', 
        splitLine: { lineStyle: { type: 'dashed' } },
        // Rút gọn các con số ở trục Y (Cột dọc bên trái) cho dễ nhìn
        axisLabel: {
          formatter: (value) => {
            if (value >= 1000000) return (value / 1000000) + ' Tr';
            return new Intl.NumberFormat('vi-VN').format(value);
          }
        }
      },
      series: [
        {
          name: 'Quỹ Thực Lãnh',
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1d4ed8' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          data: monthlyStats.value.data
        }
      ]
    });
  }
};

// Lắng nghe sự kiện Resize để biểu đồ tự co giãn
const handleResize = () => {
  if (pieChartInstance) pieChartInstance.resize();
  if (barChartInstance) barChartInstance.resize();
};

// ==========================================
// GỌI API
// ==========================================
const fetchReport = async () => {
  loading.value = true;
  try {
    let url = '';
    if (selectedPeriodType.value === 'month') {
      const [nam, thang] = filterMonth.value.split('-');
      url = `/hr/report/salary?thang=${parseInt(thang)}&nam=${nam}`;
    } else {
      url = `/hr/report/salary?nam=${filterYear.value}`;
    }

    const res = await api.get(url);
    reportData.value = res.result || res.data?.data || res.data || [];
    
    // Đợi DOM cập nhật rồi vẽ lại Chart
    await nextTick();
    initCharts();

  } catch (error) {
    ElMessage.error('Lỗi khi tải báo cáo quỹ lương!');
  } finally {
    loading.value = false;
  }
};

// ... XUẤT EXCEL ...
const exportToExcel = async () => {
  if (filteredData.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất!');
    return;
  }

  isExporting.value = true;
  try {
    const workbook = new ExcelJS.Workbook();
    const periodText = selectedPeriodType.value === 'month' ? filterMonth.value.replace('-', '_') : filterYear.value;
    const worksheet = workbook.addWorksheet(`QuyLuong_${periodText}`);

    // Dựng cột
    const columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã NV', key: 'maNhanVien', width: 12 },
      { header: 'Tên Nhân Viên', key: 'hoTen', width: 30 },
      { header: 'Chức Vụ', key: 'tenChucVu', width: 20 },
    ];
    
    if (selectedPeriodType.value === 'year') {
      columns.push({ header: 'Tháng', key: 'thang', width: 10 });
    }

    columns.push(
      { header: 'Lương Cơ Bản', key: 'luongCoBan', width: 18 },
      { header: 'Tiền OT', key: 'tienOT', width: 15 },
      { header: 'Tổng Phụ Cấp & Thưởng', key: 'phuCap', width: 25 },
      { header: 'Tiền Phạt', key: 'tienPhat', width: 15 },
      { header: 'Trừ BHXH/BHYT', key: 'truBH', width: 18 },
      { header: 'THỰC LÃNH (VND)', key: 'thucLanh', width: 25 }
    );
    worksheet.columns = columns;

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Đổ data
    filteredData.value.forEach((item, index) => {
      const rowData = {
        stt: index + 1,
        maNhanVien: `NV${item.maNhanVien}`,
        hoTen: item.hoTen,
        tenChucVu: item.tenChucVu || '',
        luongCoBan: Number(item.luongCoBan),
        tienOT: Number(item.tongTienTangCa),
        phuCap: Number(item.phuCapChucVu) + Number(item.phuCapKhac) + Number(item.thuong),
        tienPhat: Number(item.tongTienPhat),
        truBH: Number(item.truBaoHiem),
        thucLanh: Number(item.thucLanh)
      };
      if (selectedPeriodType.value === 'year') { rowData.thang = item.thang || '---'; }
      worksheet.addRow(rowData);
    });

    // Dòng summary
    const summaryRow = worksheet.addRow({
      stt: '', maNhanVien: '', hoTen: 'TỔNG CỘNG QUỸ LƯƠNG:', tenChucVu: '',
      luongCoBan: '', tienOT: '', phuCap: '', tienPhat: '', truBH: Number(summary.value.tongKhauTru), thucLanh: Number(summary.value.tongQuyLuong)
    });
    summaryRow.font = { bold: true, color: { argb: 'FF1D4ED8' } };
    summaryRow.getCell('hoTen').alignment = { horizontal: 'right' };

    // Format tiền
    const moneyCols = ['luongCoBan', 'tienOT', 'phuCap', 'tienPhat', 'truBH', 'thucLanh'];
    moneyCols.forEach(col => { worksheet.getColumn(col).numFmt = '#,##0'; });

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    link.download = selectedPeriodType.value === 'month' 
        ? `BaoCao_QuyLuong_Thang_${periodText}.xlsx` 
        : `BaoCao_QuyLuong_Nam_${periodText}.xlsx`;
        
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
  fetchReport();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (pieChartInstance) pieChartInstance.dispose();
  if (barChartInstance) barChartInstance.dispose();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

/* Tùy chỉnh Scrollbar ngang cho Bảng đối soát */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>