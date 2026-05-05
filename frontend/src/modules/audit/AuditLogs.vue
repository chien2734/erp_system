<template>
  <div class="p-2 md:p-4 lg:p-6 min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto space-y-4 md:space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
            LỊCH SỬ HỆ THỐNG
          </h1>
          <p class="text-xs md:text-sm text-slate-500 mt-1">Theo dõi hoạt động nhạy cảm trên hệ thống</p>
        </div>
        <div class="flex items-center gap-2">
          <el-button :icon="Refresh" @click="fetchLogs" circle />
          <el-button type="primary" :icon="Download" @click="exportExcel" class="!px-4">
            <span class="hidden sm:inline">Xuất Excel</span>
            <span class="sm:hidden">Xuất</span>
          </el-button>
        </div>
      </div>

      <!-- Filters & Stats -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <el-card shadow="never" class="!border-none !bg-gradient-to-br from-blue-600 to-indigo-700 text-white !rounded-xl shadow-lg shadow-blue-500/20">
          <div class="flex items-center gap-4">
            <div class="p-2 md:p-3 bg-white/20 rounded-lg text-xl md:text-2xl"><el-icon><Histogram /></el-icon></div>
            <div>
              <p class="text-[10px] md:text-xs opacity-80 uppercase font-bold tracking-wider">Tổng hoạt động</p>
              <p class="text-xl md:text-2xl font-black">{{ totalLogs }}</p>
            </div>
          </div>
        </el-card>
        
        <div class="lg:col-span-3 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <el-input 
                v-model="searchKeyword" 
                placeholder="Tìm nhân viên, hành động..." 
                class="sm:!w-64" 
                :prefix-icon="Search"
                clearable
            />
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                start-placeholder="Từ ngày"
                end-placeholder="Đến ngày"
                class="!w-full sm:!w-72"
            />
        </div>
      </div>

      <!-- Main Table -->
      <el-card shadow="never" class="!border-none !rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <el-table 
            v-loading="loading" 
            :data="paginatedData" 
            style="width: 100%"
            :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '800', fontSize: '11px' }"
            class="audit-table"
          >
            <el-table-column label="THỜI GIAN" min-width="110">
              <template #default="{ row }">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-700 text-[11px] sm:text-sm">{{ formatDate(row.ngayTao) }}</span>
                  <span class="text-[10px] text-slate-400 font-mono hidden sm:block">{{ formatTime(row.ngayTao) }}</span>
                  <span class="text-[9px] text-slate-400 font-mono sm:hidden">{{ dayjs(row.ngayTao).format('HH:mm') }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="NHÂN VIÊN" min-width="120">
              <template #default="{ row }">
                <div class="flex items-center gap-2">
                  <div class="flex flex-col min-w-0">
                    <span class="font-bold text-slate-800 leading-tight truncate text-[11px] sm:text-sm">{{ row.tenNhanVien || 'N/A' }}</span>
                    <span class="text-[10px] text-slate-500 truncate hidden sm:block">@{{ row.username || 'unknown' }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="HÀNH ĐỘNG" min-width="160" class-name="hidden-xs-only">
              <template #default="{ row }">
                <el-tag :type="getActionTagType(row.hanhDong)" effect="dark" class="!font-bold !text-[9px] !px-1.5 !h-5">
                  {{ row.hanhDong.toUpperCase() }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="MÔ TẢ HOẠT ĐỘNG" min-width="200">
              <template #default="{ row }">
                <div class="flex items-start gap-1.5 py-0.5">
                  <div :class="['mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', getStatusColorClass(row.hanhDong)]"></div>
                  <span class="text-[11px] sm:text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                    {{ generateSummary(row) }}
                  </span>
                </div>
              </template>
            </el-table-column>

            <el-table-column width="60" align="center" fixed="right">
              <template #default="{ row }">
                <el-button :icon="InfoFilled" link @click="showDetail(row)" class="!p-0" />
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
        
      </el-card>
    </div>

    <!-- Detail Dialog -->
    <el-dialog 
      v-model="detailVisible" 
      title="CHI TIẾT HOẠT ĐỘNG" 
      :width="isMobile ? '90%' : '500px'" 
      custom-class="audit-detail-dialog"
    >
      <div v-if="selectedLog" class="space-y-4">
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-100">
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
             <div>
               <p class="text-slate-400 font-bold uppercase text-[10px]">Thời gian</p>
               <p class="font-bold">{{ formatDate(selectedLog.ngayTao) }} {{ formatTime(selectedLog.ngayTao) }}</p>
             </div>
             <div>
               <p class="text-slate-400 font-bold uppercase text-[10px]">Hành động</p>
               <p class="font-bold text-blue-600">{{ selectedLog.hanhDong }}</p>
             </div>
             <div class="sm:col-span-2">
               <p class="text-slate-400 font-bold uppercase text-[10px]">Người thực hiện</p>
               <p class="font-bold">{{ selectedLog.tenNhanVien }} (@{{ selectedLog.username }})</p>
             </div>
           </div>
        </div>
        <div>
           <p class="text-slate-400 font-bold uppercase text-[10px] mb-3">Dữ liệu chi tiết</p>
           <div class="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="(val, key) in parseChiTiet(selectedLog.chiTiet)" :key="key" 
                   class="flex flex-col p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-blue-200 transition-all">
                <div class="flex items-center gap-2 mb-1">
                  <el-icon class="text-blue-400 text-xs"><InfoFilled /></el-icon>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ getFriendlyKey(key) }}</span>
                </div>
                <span class="text-sm font-bold text-slate-800 break-words">{{ formatFriendlyValue(val, key) }}</span>
              </div>
              <div v-if="!selectedLog.chiTiet" class="text-center py-12">
                <el-icon class="text-4xl text-slate-200"><Document /></el-icon>
                <p class="text-slate-300 italic text-sm mt-2">Không có dữ liệu chi tiết kèm theo</p>
              </div>
           </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Timer, Refresh, Download, Search, InfoFilled, Histogram } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { usePagination } from '../../composables/usePagination';

const loading = ref(false);
const logs = ref([]);
const totalLogs = ref(0);
const searchKeyword = ref('');
const dateRange = ref([]);

const detailVisible = ref(false);
const selectedLog = ref(null);

const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);

const updateWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', updateWidth);
  fetchLogs();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
});

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await api.get('/audit/logs');
    logs.value = res.data || [];
    totalLogs.value = res.total || 0;
  } catch (error) {
    ElMessage.error('Không thể tải lịch sử hệ thống');
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
    let result = [...logs.value];
    if (searchKeyword.value) {
        const k = searchKeyword.value.toLowerCase();
        result = result.filter(l => 
            l.hanhDong.toLowerCase().includes(k) || 
            (l.tenNhanVien && l.tenNhanVien.toLowerCase().includes(k)) ||
            (l.username && l.username.toLowerCase().includes(k))
        );
    }
    // Filter by date range
    if (dateRange.value && dateRange.value.length === 2) {
      const start = dayjs(dateRange.value[0]).startOf('day');
      const end = dayjs(dateRange.value[1]).endOf('day');
      result = result.filter(l => {
        const d = dayjs(l.ngayTao);
        return d.isAfter(start) && d.isBefore(end);
      });
    }
    return result;
});

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(filteredLogs, 7);

const formatDate = (d) => dayjs(d).format('DD/MM/YYYY');
const formatTime = (d) => dayjs(d).format('HH:mm:ss');

const getActionTagType = (action) => {
    if (action.includes('Thêm')) return 'success';
    if (action.includes('Cập nhật') || action.includes('Sửa')) return 'warning';
    if (action.includes('Xóa')) return 'danger';
    if (action.includes('Đăng nhập')) return 'primary';
    return 'info';
};

// Hàm tạo câu tóm tắt thân thiện với người dùng
const generateSummary = (row) => {
    const action = row.hanhDong || '';
    const details = parseChiTiet(row.chiTiet);
    
    // Các giá trị nhận diện chung
    const id = details.maSP || details.maHang || details.maHoaDon || details.maNhanVien || details.id || details.maNV || '';
    const name = details.tenSP || details.hoTen || details.username || details.tenHang || '';
    const identifier = name ? `"${name}"` : (id ? `mã số #${id}` : '');

    if (action.includes('Đăng nhập')) return 'Đã đăng nhập vào hệ thống thành công.';
    if (action.includes('Đổi mật khẩu')) return 'Đã thực hiện thay đổi mật khẩu tài khoản.';
    
    // Xử lý Sản phẩm
    if (action.toLowerCase().includes('sản phẩm') || action.toLowerCase().includes('hãng')) {
        if (action.includes('Thêm')) return `Đã tạo mới ${identifier} vào danh mục hệ thống.`;
        if (action.includes('Cập nhật')) return `Đã chỉnh sửa thông tin cho ${identifier}.`;
        if (action.includes('Xóa')) return `Đã gỡ bỏ ${identifier} khỏi hệ thống.`;
    }

    // Xử lý Hóa đơn / Giao dịch
    if (action.toLowerCase().includes('hóa đơn') || action.toLowerCase().includes('đơn hàng') || action.toLowerCase().includes('thanh toán')) {
        const total = details.tongTien || details.amount || 0;
        const formattedTotal = total ? new Intl.NumberFormat('vi-VN').format(total) + 'đ' : '';
        if (action.includes('Thêm')) return `Đã lập hóa đơn mới #${id} với tổng trị giá ${formattedTotal}.`;
        if (action.includes('Thanh toán')) return `Đã xác nhận thanh toán thành công ${formattedTotal} cho hóa đơn #${id}.`;
        return `Đã cập nhật trạng thái cho hóa đơn #${id}.`;
    }

    // Xử lý Nhân sự & Tài khoản
    if (action.toLowerCase().includes('nhân viên') || action.toLowerCase().includes('tài khoản')) {
        if (action.includes('Thêm')) return `Đã cấp tài khoản/hồ sơ mới cho ${identifier}.`;
        if (action.includes('Cập nhật') || action.includes('Đổi')) return `Đã điều chỉnh thông tin hoặc quyền hạn của ${identifier}.`;
        if (action.includes('Reset')) return `Đã đặt lại mật khẩu về mặc định cho ${identifier}.`;
    }

    // Xử lý Lương thưởng
    if (action.toLowerCase().includes('lương') || action.toLowerCase().includes('thưởng')) {
        const month = details.thang;
        const year = details.nam;
        if (action.includes('Tính')) return `Đã thực hiện tính toán bảng lương cho tháng ${month}/${year}.`;
        if (action.includes('Chốt')) return `Đã chốt sổ lương tháng ${month}/${year}.`;
        return `Đã điều chỉnh khoản thưởng/phạt cho nhân viên ${identifier}.`;
    }

    // Xử lý Chấm công
    if (action.toLowerCase().includes('chấm công') || action.toLowerCase().includes('check')) {
        return `Đã thực hiện ghi nhận giờ làm việc (Check-in/out).`;
    }

    // Mặc định
    if (!row.chiTiet) return action;
    return `${action} ${identifier ? 'cho ' + identifier : ''}.`;
};

const getStatusColorClass = (action) => {
    if (action.includes('Thêm')) return 'bg-emerald-500';
    if (action.includes('Cập nhật') || action.includes('Sửa')) return 'bg-amber-500';
    if (action.includes('Xóa')) return 'bg-rose-500';
    if (action.includes('Thanh toán')) return 'bg-blue-500';
    return 'bg-slate-400';
};

const parseChiTiet = (str) => {
    if (!str) return {};
    try {
        const obj = JSON.parse(str);
        return typeof obj === 'object' ? obj : { info: obj };
    } catch (e) {
        return { thongTin: str };
    }
};

const getFriendlyKey = (key) => {
    const map = {
        maSP: 'Mã sản phẩm',
        tenSP: 'Tên sản phẩm',
        maHang: 'Mã hãng',
        giaBan: 'Giá bán niêm yết',
        soLuongTon: 'Số lượng tồn kho',
        maNCC: 'Mã nhà cung cấp',
        tenNCC: 'Tên nhà cung cấp',
        maNV: 'Mã nhân viên',
        maNhanVien: 'Mã nhân viên',
        hoTen: 'Họ và tên',
        maNhomQuyen: 'Mã nhóm quyền',
        trangThai: 'Trạng thái hoạt động',
        maMay: 'Mã máy (Số Serial/IMEI)',
        maPhieuNhap: 'Mã số phiếu nhập',
        tongTien: 'Tổng giá trị (VND)',
        donGia: 'Đơn giá đơn vị',
        donGiaNhap: 'Giá nhập kho',
        maHoaDon: 'Mã số hóa đơn',
        tenHang: 'Tên thương hiệu',
        username: 'Tên tài khoản',
        sdt: 'Số điện thoại liên hệ',
        email: 'Địa chỉ Email',
        diaChi: 'Địa chỉ liên lạc',
        maChucVu: 'Mã chức vụ',
        tenChucVu: 'Tên chức vụ',
        luongCoBan: 'Mức lương cơ bản',
        ngayApDung: 'Ngày bắt đầu áp dụng',
        amount: 'Số tiền giao dịch',
        paymentMethod: 'Phương thức thanh toán',
        vnp_TransactionNo: 'Mã giao dịch từ VNPay',
        count: 'Số lượng thực hiện',
        moTa: 'Mô tả chi tiết',
        cauHinh: 'Thông số cấu hình',
        hinhAnh: 'Đường dẫn hình ảnh',
        ghiChu: 'Ghi chú thêm',
        thang: 'Tháng báo cáo',
        nam: 'Năm báo cáo',
        thuong: 'Tiền thưởng thêm',
        phat: 'Tiền phạt khấu trừ',
        lyDoPhat: 'Lý do bị phạt',
        maDon: 'Mã đơn nghỉ phép'
    };
    return map[key] || key;
};

const formatFriendlyValue = (val, key) => {
    if (val === null || val === undefined || val === '') return '---';
    
    // Format tiền cho các key liên quan đến tiền
    const moneyKeys = ['giaBan', 'tongTien', 'donGia', 'donGiaNhap', 'amount', 'luongCoBan', 'thuong', 'phat'];
    if (moneyKeys.includes(key) || (typeof val === 'number' && val > 50000)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    }

    if (typeof val === 'boolean') return val ? 'Đang bật' : 'Đang tắt';
    
    // Format trạng thái
    if (key === 'trangThai') {
        if (val === 1 || val === '1') return 'Đang hoạt động / Kinh doanh';
        if (val === 0 || val === '0') return 'Ngừng hoạt động / Tắt';
        return val;
    }

    // Format ngày tháng nếu là chuỗi ISO
    if (typeof val === 'string' && val.length > 15 && !isNaN(Date.parse(val))) {
        return dayjs(val).format('DD/MM/YYYY HH:mm:ss');
    }

    return val;
};

const formatJson = (str) => {
    try {
        return JSON.stringify(JSON.parse(str), null, 2);
    } catch (e) { return str; }
};

const showDetail = (row) => {
    selectedLog.value = row;
    detailVisible.value = true;
};

const exportExcel = async () => {
    if (logs.value.length === 0) {
        ElMessage.warning('Không có dữ liệu để xuất');
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Lịch sử hệ thống');

        // Define columns
        worksheet.columns = [
            { header: 'Thời gian', key: 'ngayTao', width: 20 },
            { header: 'Nhân viên', key: 'tenNhanVien', width: 25 },
            { header: 'Tài khoản', key: 'username', width: 15 },
            { header: 'Hành động', key: 'hanhDong', width: 25 },
            { header: 'Chi tiết', key: 'chiTiet', width: 50 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data
        filteredLogs.value.forEach(log => {
            worksheet.addRow({
                ngayTao: dayjs(log.ngayTao).format('DD/MM/YYYY HH:mm:ss'),
                tenNhanVien: log.tenNhanVien || 'N/A',
                username: log.username || 'unknown',
                hanhDong: log.hanhDong,
                chiTiet: log.chiTiet
            });
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        const filename = `AuditLogs_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
        saveAs(new Blob([buffer]), filename);
        
        ElMessage.success('Đã xuất file Excel thành công');
    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
        ElMessage.error('Lỗi khi xuất file Excel');
    }
};

onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
:deep(.audit-detail-dialog) {
    border-radius: 16px;
    overflow: hidden;
}
:deep(.audit-table .el-table__row) {
    cursor: pointer;
}
@media (max-width: 640px) {
  :deep(.el-date-editor--daterange) {
    width: 100% !important;
  }
}
</style>
