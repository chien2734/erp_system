<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-800">Báo Cáo Tồn Kho</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Thống kê số lượng và giá trị tài sản trong kho theo kỳ</p>
      </div>
      
      <el-button type="success" size="large" :icon="Download" @click="exportToExcel" :loading="isExporting" class="w-full md:w-auto font-bold shadow-md shadow-emerald-500/30 m-0">
        {{ isExporting ? 'ĐANG XUẤT FILE...' : 'XUẤT EXCEL' }}
      </el-button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6" v-loading="loading">
      <div class="bg-blue-50 border border-blue-100 p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm">
        <p class="text-blue-600 font-semibold mb-1 text-xs md:text-sm uppercase tracking-wide">Tổng Mẫu Sản Phẩm</p>
        <h3 class="text-2xl md:text-3xl font-black text-blue-700">{{ summary.tongSanPham }} <span class="text-sm md:text-lg font-medium">mẫu</span></h3>
      </div>
      <div class="bg-amber-50 border border-amber-100 p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm">
        <p class="text-amber-600 font-semibold mb-1 text-xs md:text-sm uppercase tracking-wide">Tổng Số Lượng Tồn</p>
        <h3 class="text-2xl md:text-3xl font-black text-amber-700">{{ summary.tongSoLuongTon }} <span class="text-sm md:text-lg font-medium">máy</span></h3>
      </div>
      <div class="bg-emerald-50 border border-emerald-100 p-4 md:p-5 rounded-xl md:rounded-2xl shadow-sm">
        <p class="text-emerald-600 font-semibold mb-1 text-xs md:text-sm uppercase tracking-wide">Ước Tính Giá Trị Kho</p>
        <h3 class="text-xl md:text-3xl font-black text-emerald-700">{{ formatPrice(summary.tongGiaTriKho) }}</h3>
      </div>
    </div>

    <div class="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
      
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 mb-4 md:mb-6">
        
        <el-date-picker
          v-model="filterMonth"
          type="month"
          placeholder="Chọn tháng báo cáo..."
          format="MM/YYYY"
          value-format="YYYY-MM"
          class="w-full sm:!w-48"
          size="large"
          @change="fetchReport"
          clearable
        />

        <el-select v-model="filterHang" placeholder="Tất cả hãng sản xuất" clearable class="w-full sm:!w-48 md:!w-64" size="large" @change="fetchReport" filterable>
          <el-option v-for="h in listHang" :key="h.maHang" :label="h.tenHang" :value="h.maHang" />
        </el-select>
        
        <el-input v-model="searchQuery" placeholder="Tìm tên sản phẩm nhanh (Local)..." :prefix-icon="Search" class="w-full sm:flex-1" size="large" clearable />
      </div>

      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <el-table :data="paginatedData" @sort-change="handleSortChange" style="width: 100%" v-loading="loading" stripe class="min-w-[800px]">
          
          <el-table-column type="index" label="STT" width="60" align="center" fixed="left" />
          
          <el-table-column prop="maSP" label="Mã SP" width="90" align="center" fixed="left">
            <template #default="scope"><span class="font-bold text-slate-600 font-mono text-xs md:text-sm">SP{{ scope.row.maSP }}</span></template>
          </el-table-column>
          
          <el-table-column prop="tenSP" label="Tên Sản Phẩm" min-width="200" fixed="left">
            <template #default="scope">
              <span class="font-bold text-slate-800 text-sm line-clamp-2" :title="scope.row.tenSP">{{ scope.row.tenSP }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="tenHang" label="Hãng" width="110" align="center">
            <template #default="scope"><el-tag effect="plain" class="font-bold">{{ scope.row.tenHang }}</el-tag></template>
          </el-table-column>
          
          <el-table-column prop="soLuongTon" label="Tồn Kho" width="120" align="center" sortable>
            <template #default="scope">
              <span class="text-sm md:text-base" :class="scope.row.soLuongTon < 5 ? 'text-rose-600 font-black' : 'text-emerald-600 font-bold'">
                {{ scope.row.soLuongTon }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column prop="giaVonTrungBinh" label="Giá vốn bình quân" min-width="140" align="right" sortable>
            <template #default="scope"><span class="text-slate-600 font-medium">{{ formatPrice(scope.row.giaVonTrungBinh || scope.row.giaNhapGanNhat) }}</span></template>
          </el-table-column>
          
          <el-table-column label="Tổng Giá Trị Tồn" min-width="150" align="right" sortable  prop="tongGiaTriTon">
            <template #default="scope"><span class="font-black text-blue-700 text-sm md:text-base">{{ formatPrice(scope.row.tongGiaTriTon) }}</span></template>
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
import { ref, computed, onMounted } from 'vue';
import { Download, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ExcelJS from 'exceljs'; 
import api from '../../services/api';
import { usePagination } from '../../composables/usePagination';

const loading = ref(false);
const isExporting = ref(false); 
const reportData = ref([]);
const summary = ref({ tongSanPham: 0, tongSoLuongTon: 0, tongGiaTriKho: 0 });

const filterMonth = ref(''); // BIẾN LƯU THÁNG/NĂM
const filterHang = ref(null);
const listHang = ref([]);
const searchQuery = ref('');

// Lọc dữ liệu ngay trên Frontend
const filteredData = computed(() => {
  if (!searchQuery.value) return reportData.value;
  return reportData.value.filter(item => 
    item.tenSP.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Client-side sort (suitable for small report sizes)
const sortBy = ref('');
const sortOrder = ref('');

const sortedData = computed(() => {
  const src = filteredData.value || [];
  if (!sortBy.value) return src.slice();
  const arr = src.slice();
  const compare = (a, b) => {
    const va = a[sortBy.value];
    const vb = b[sortBy.value];
    if (va == null && vb == null) return 0;
    if (va == null) return -1;
    if (vb == null) return 1;
    const na = Number(va);
    const nb = Number(vb);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(va).localeCompare(String(vb), 'vi', { numeric: true });
  };
  arr.sort((x, y) => {
    const c = compare(x, y);
    return sortOrder.value === 'asc' ? c : -c;
  });
  return arr;
});

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(sortedData, 10);

const handleSortChange = ({ prop, order }) => {
  if (!prop || !order) {
    sortBy.value = '';
    sortOrder.value = '';
  } else {
    sortBy.value = prop;
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc';
  }
  currentPage.value = 1;
};

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

// Lấy danh sách Hãng để cho vào thẻ Select
const fetchHang = async () => {
  try {
    const res = await api.get('/inventory/hangsp');
    listHang.value = res.result || res.data || res || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách hãng:", error);
  }
};

// ==========================================
// GỌI API BÁO CÁO (KÈM THÁNG NĂM)
// ==========================================
const fetchReport = async () => {
  loading.value = true;
  try {
    // Dùng URLSearchParams để build query sạch đẹp
    const params = new URLSearchParams();
    
    if (filterHang.value) {
      params.append('maHang', filterHang.value);
    }
    
    if (filterMonth.value) {
      // Tách YYYY-MM thành year và month để gửi xuống Backend
      const [year, month] = filterMonth.value.split('-');
      params.append('month', month);
      params.append('year', year);
    }
    
    const res = await api.get(`/inventory/report/inventory?${params.toString()}`);
    
    reportData.value = res.data || res || [];
    summary.value = res.summary || { tongSanPham: 0, tongSoLuongTon: 0, tongGiaTriKho: 0 };
    
  } catch (error) {
    ElMessage.error('Lỗi khi tải báo cáo tồn kho!');
  } finally {
    loading.value = false;
  }
};

// ==========================================
// HÀM XUẤT EXCEL 
// ==========================================
const exportToExcel = async () => {
  if (filteredData.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất!');
    return;
  }

  isExporting.value = true;
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo Tồn kho');

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã SP', key: 'maSP', width: 12 },
      { header: 'Tên Sản Phẩm', key: 'tenSP', width: 45 },
      { header: 'Thương Hiệu', key: 'tenHang', width: 18 },
      { header: 'Số Lượng Tồn', key: 'soLuongTon', width: 15 },
      { header: 'Đơn Giá Nhập (VND)', key: 'giaNhap', width: 22 },
      { header: 'Tổng Giá Trị Tồn (VND)', key: 'tongGiaTri', width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    filteredData.value.forEach((item, index) => {
      worksheet.addRow({
        stt: index + 1,
        maSP: `SP${item.maSP}`,
        tenSP: item.tenSP,
        tenHang: item.tenHang,
        soLuongTon: Number(item.soLuongTon),
        giaNhap: Number(item.giaVonTrungBinh || item.giaNhapGanNhat || 0),
        tongGiaTri: Number(item.tongGiaTriTon)
      });
    });

    const summaryRow = worksheet.addRow({
      stt: '', maSP: '', tenSP: 'TỔNG CỘNG:', tenHang: '',
      soLuongTon: Number(summary.value.tongSoLuongTon), giaNhap: '', tongGiaTri: Number(summary.value.tongGiaTriKho)
    });
    
    summaryRow.font = { bold: true, color: { argb: 'FF1D4ED8' } };
    summaryRow.getCell('tenSP').alignment = { horizontal: 'right' };

    worksheet.getColumn('giaNhap').numFmt = '#,##0';
    worksheet.getColumn('tongGiaTri').numFmt = '#,##0';
    worksheet.getColumn('soLuongTon').numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Đổi tên file Excel nếu có chọn Tháng
    let fileName = `BaoCao_TonKho_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
    if (filterMonth.value) {
        const [y, m] = filterMonth.value.split('-');
        fileName = `BaoCao_TonKho_Thang_${m}_${y}.xlsx`;
    }
    
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('Xuất file Excel thành công!');

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    ElMessage.error('Có lỗi xảy ra khi xuất file!');
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  fetchHang();
  fetchReport();
});
</script>

<style scoped>
/* Tùy chỉnh Scrollbar ngang cho Table */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>