<template>
  <div class="space-y-6">
    <div class="flex justify-between items-end">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Báo Cáo Tồn Kho</h2>
        <p class="text-slate-500 mt-1">Thống kê số lượng và giá trị tài sản trong kho</p>
      </div>
      
      <el-button type="success" size="large" :icon="Download" @click="exportToExcel" :loading="isExporting" class="font-bold shadow-md">
        {{ isExporting ? 'ĐANG XUẤT FILE...' : 'XUẤT BÁO CÁO EXCEL' }}
      </el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" v-loading="loading">
      <div class="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
        <p class="text-blue-600 font-semibold mb-1">Tổng Mẫu Sản Phẩm</p>
        <h3 class="text-3xl font-black text-blue-700">{{ summary.tongSanPham }} <span class="text-lg font-medium">mẫu</span></h3>
      </div>
      <div class="bg-amber-50 border border-amber-100 p-5 rounded-2xl">
        <p class="text-amber-600 font-semibold mb-1">Tổng Số Lượng Tồn</p>
        <h3 class="text-3xl font-black text-amber-700">{{ summary.tongSoLuongTon }} <span class="text-lg font-medium">máy</span></h3>
      </div>
      <div class="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
        <p class="text-emerald-600 font-semibold mb-1">Ước Tính Giá Trị Kho</p>
        <h3 class="text-3xl font-black text-emerald-700">{{ formatPrice(summary.tongGiaTriKho) }}</h3>
      </div>
    </div>

    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div class="flex gap-4 mb-6">
        <el-select v-model="filterHang" placeholder="Tất cả hãng sản xuất" clearable class="w-64" @change="fetchReport">
          <el-option v-for="h in listHang" :key="h.maHang" :label="h.tenHang" :value="h.maHang" />
        </el-select>
        <el-input v-model="searchQuery" placeholder="Tìm tên sản phẩm nhanh (Local)..." :prefix-icon="Search" class="w-80" clearable />
      </div>

      <el-table :data="filteredData" style="width: 100%" v-loading="loading" border stripe height="500">
        <el-table-column type="index" label="STT" width="60" align="center" />
        
        <el-table-column prop="maSP" label="Mã SP" width="100" align="center">
          <template #default="scope"><span class="font-bold text-slate-600">SP{{ scope.row.maSP }}</span></template>
        </el-table-column>
        
        <el-table-column prop="tenSP" label="Tên Sản Phẩm" min-width="250" />
        
        <el-table-column prop="tenHang" label="Hãng" width="120" align="center">
          <template #default="scope"><el-tag effect="plain">{{ scope.row.tenHang }}</el-tag></template>
        </el-table-column>
        
        <el-table-column prop="soLuongTon" label="Tồn Kho" width="120" align="center" sortable>
          <template #default="scope">
            <span :class="scope.row.soLuongTon < 5 ? 'text-rose-600 font-black' : 'text-emerald-600 font-bold'">
              {{ scope.row.soLuongTon }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="giaVonTrungBinh" label="Giá vốn bình quân" width="180" align="right">
          <template #default="scope">{{ formatPrice(scope.row.giaVonTrungBinh) }}</template>
        </el-table-column>
        
        <el-table-column prop="tongGiaTriTon" label="Tổng Giá Trị Tồn" width="180" align="right" sortable>
          <template #default="scope"><span class="font-black text-slate-800">{{ formatPrice(scope.row.tongGiaTriTon) }}</span></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Download, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ExcelJS from 'exceljs'; // Chuyển sang dùng ExcelJS
import api from '../../services/api';

const loading = ref(false);
const isExporting = ref(false); // Thêm cờ loading cho lúc xuất file
const reportData = ref([]);
const summary = ref({ tongSanPham: 0, tongSoLuongTon: 0, tongGiaTriKho: 0 });

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

// Gọi API Báo cáo
const fetchReport = async () => {
  loading.value = true;
  try {
    let url = '/inventory/report/inventory';
    if (filterHang.value) url += `?maHang=${filterHang.value}`;
    
    const res = await api.get(url);
    
    // Vì res đã là object { success, summary, data } rồi, nên ta gọi thẳng res.data và res.summary
    reportData.value = res.data || res || [];
    summary.value = res.summary || { tongSanPham: 0, tongSoLuongTon: 0, tongGiaTriKho: 0 };
    
  } catch (error) {
    ElMessage.error('Lỗi khi tải báo cáo tồn kho!');
  } finally {
    loading.value = false;
  }
};

// ==========================================
// HÀM XUẤT EXCEL (SỬ DỤNG EXCELJS)
// ==========================================
const exportToExcel = async () => {
  if (filteredData.value.length === 0) {
    ElMessage.warning('Không có dữ liệu để xuất!');
    return;
  }

  isExporting.value = true;
  try {
    // 1. Khởi tạo Workbook và Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo Tồn kho');

    // 2. Định nghĩa các cột (Header, Key ánh xạ và Độ rộng cột)
    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã SP', key: 'maSP', width: 12 },
      { header: 'Tên Sản Phẩm', key: 'tenSP', width: 45 },
      { header: 'Thương Hiệu', key: 'tenHang', width: 18 },
      { header: 'Số Lượng Tồn', key: 'soLuongTon', width: 15 },
      { header: 'Đơn Giá Nhập (VND)', key: 'giaNhap', width: 22 },
      { header: 'Tổng Giá Trị Tồn (VND)', key: 'tongGiaTri', width: 25 },
    ];

    // Style cho dòng Header (In đậm, nền xám nhạt)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 3. Đổ dữ liệu vào các dòng
    filteredData.value.forEach((item, index) => {
      worksheet.addRow({
        stt: index + 1,
        maSP: `SP${item.maSP}`,
        tenSP: item.tenSP,
        tenHang: item.tenHang,
        soLuongTon: Number(item.soLuongTon),
        giaNhap: Number(item.giaNhapGanNhat),
        tongGiaTri: Number(item.tongGiaTriTon)
      });
    });

    // 4. Thêm dòng Tổng Cộng ở cuối
    const summaryRow = worksheet.addRow({
      stt: '',
      maSP: '',
      tenSP: 'TỔNG CỘNG:',
      tenHang: '',
      soLuongTon: Number(summary.value.tongSoLuongTon),
      giaNhap: '',
      tongGiaTri: Number(summary.value.tongGiaTriKho)
    });
    
    // Style cho dòng Tổng cộng (In đậm, màu xanh)
    summaryRow.font = { bold: true, color: { argb: 'FF1D4ED8' } };
    summaryRow.getCell('tenSP').alignment = { horizontal: 'right' };

    // 5. Format hiển thị số tiền có dấu phẩy (vd: 15,000,000)
    worksheet.getColumn('giaNhap').numFmt = '#,##0';
    worksheet.getColumn('tongGiaTri').numFmt = '#,##0';
    worksheet.getColumn('soLuongTon').numFmt = '#,##0';

    // 6. Xuất file bằng trình duyệt (Buffer -> Blob)
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.download = `BaoCao_TonKho_${dateStr}.xlsx`;
    
    document.body.appendChild(link);
    link.click();
    
    // Dọn dẹp
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