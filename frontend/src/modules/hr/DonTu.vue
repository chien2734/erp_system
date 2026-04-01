<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Quản lý Đơn từ & Nghỉ phép</h2>
        <p class="text-slate-500">Tiếp nhận, xét duyệt đơn xin nghỉ phép, nghỉ ốm, thai sản của nhân viên</p>
      </div>
      <el-button type="primary" @click="fetchLeaveRequests" :loading="loading" class="shadow-md shadow-blue-500/30 font-bold">
        <el-icon class="mr-2"><Refresh /></el-icon> LÀM MỚI
      </el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" v-loading="loading">
      <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-sm text-amber-700 font-semibold mb-1">Cần xử lý (Chờ duyệt)</p>
          <p class="text-3xl font-black text-amber-600">{{ countStatus('Chờ duyệt') }}</p>
        </div>
        <div class="p-3 bg-amber-100/50 text-amber-600 rounded-full"><el-icon class="text-3xl"><BellFilled /></el-icon></div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 font-semibold mb-1">Đã duyệt (Tháng này)</p>
          <p class="text-2xl font-bold text-emerald-600">{{ countApprovedThisMonth }}</p>
        </div>
        <div class="p-3 bg-emerald-50 text-emerald-500 rounded-full"><el-icon class="text-2xl"><CircleCheckFilled /></el-icon></div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 font-semibold mb-1">Từ chối (Tất cả)</p>
          <p class="text-2xl font-bold text-rose-600">{{ countStatus('Từ chối') }}</p>
        </div>
        <div class="p-3 bg-rose-50 text-rose-500 rounded-full"><el-icon class="text-2xl"><CircleCloseFilled /></el-icon></div>
      </div>
    </div>

    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
      <el-input 
        v-model="searchQuery" 
        placeholder="Tìm tên nhân viên..." 
        :prefix-icon="Search"
        class="!w-64"
        clearable
      />
      
      <el-select v-model="filterStatus" placeholder="Trạng thái" clearable class="!w-48">
        <el-option label="Chờ duyệt" value="Chờ duyệt" />
        <el-option label="Đã duyệt" value="Đã duyệt" />
        <el-option label="Từ chối" value="Từ chối" />
      </el-select>

      <el-select v-model="filterType" placeholder="Loại đơn" clearable class="!w-48">
        <el-option label="Nghỉ phép năm" value="Nghỉ phép năm" />
        <el-option label="Nghỉ không lương" value="Nghỉ không lương" />
        <el-option label="Nghỉ ốm" value="Nghỉ ốm" />
        <el-option label="Nghỉ thai sản" value="Nghỉ thai sản" />
        <el-option label="Nghỉ việc riêng" value="Nghỉ việc riêng" />
      </el-select>

      <el-date-picker
        v-model="filterCreatedDate"
        type="date"
        placeholder="Lọc theo ngày nộp đơn"
        format="DD/MM/YYYY"
        value-format="YYYY-MM-DD"
        class="!w-48"
        clearable
      />
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" v-loading="loading">
      <el-table :data="filteredLeaves" style="width: 100%" size="large" stripe>
        
        <el-table-column label="Người gửi" min-width="200" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" class="bg-slate-100 text-blue-600 font-bold text-xs">
                {{ getInitials(scope.row.hoTen) }}
              </el-avatar>
              <div>
                <p class="font-bold text-slate-800">{{ scope.row.hoTen }}</p>
                <p class="text-xs text-slate-500">Mã NV: {{ scope.row.maNhanVien }} • {{ scope.row.tenChucVu || 'Nhân viên' }}</p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="loaiDon" label="Loại Đơn" width="130">
          <template #default="scope">
            <span class="font-semibold text-slate-700">{{ scope.row.loaiDon }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thời gian nghỉ" width="220" align="center">
          <template #default="scope">
            <div class="text-sm">
              <p class="font-bold text-blue-600">{{ formatDateVN(scope.row.ngayBatDau) }} <span class="text-slate-400 font-normal">đến</span> {{ formatDateVN(scope.row.ngayKetThuc) }}</p>
              <p class="text-xs text-slate-500 mt-0.5">({{ calculateDays(scope.row.ngayBatDau, scope.row.ngayKetThuc) }} ngày)</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="lyDo" label="Lý do chi tiết" min-width="200">
          <template #default="scope">
            <span class="text-sm text-slate-600 line-clamp-2" :title="scope.row.lyDo">{{ scope.row.lyDo }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Ngày nộp" width="160">
          <template #default="scope">
            <div class="text-xs text-slate-500 font-medium">
              <p>{{ formatDateTimeVN(scope.row.ngayTao) }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" width="130" align="center">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.trangThai)" effect="dark" class="font-bold w-full border-none">
              {{ scope.row.trangThai }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Người duyệt" width="160" align="center">
          <template #default="scope">
            <span v-if="scope.row.tenNguoiDuyet" class="text-sm font-semibold text-slate-700">
              {{ scope.row.tenNguoiDuyet }}
            </span>
            <span v-else class="text-xs text-slate-400 italic">-- Chưa duyệt --</span>
          </template>
        </el-table-column>

        <el-table-column label="Xử lý" width="120" align="center" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.trangThai === 'Chờ duyệt'" class="flex justify-center gap-2">
              <el-button type="success" circle title="Duyệt đơn" @click="handleAction(scope.row, 'Đã duyệt')" :disabled="processingId === scope.row.maDon">
                <el-icon><Check /></el-icon>
              </el-button>
              <el-button type="danger" circle title="Từ chối" @click="handleAction(scope.row, 'Từ chối')" :disabled="processingId === scope.row.maDon">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <span v-else class="text-xs text-slate-400"><el-icon><Lock /></el-icon> Đã chốt</span>
          </template>
        </el-table-column>

      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, BellFilled, CircleCheckFilled, CircleCloseFilled, Check, Close, Lock, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../../services/api'; // Đường dẫn API của bạn

// --- STATE ---
const leaveRequests = ref([]);
const loading = ref(false);
const processingId = ref(null); // Tránh double click khi đang duyệt đơn

const searchQuery = ref('');
const filterStatus = ref('');
const filterType = ref('');
const filterCreatedDate = ref('');

// --- FETCH DATA TỪ BACKEND ---
const fetchLeaveRequests = async () => {
  loading.value = true;
  try {
    const res = await api.get('/hr/dontu');
    
    // 🔴 CAMERA BẮT LỖI: Mở F12 (DevTools) > Console lên để xem dòng này
    // console.log("API Đơn Từ trả về:", res);

    const resData = res.data || res;
    
    let dsDonTu = [];
    if (resData?.data?.data && Array.isArray(resData.data.data)) {
        dsDonTu = resData.data.data;
    } else if (resData?.data && Array.isArray(resData.data)) {
        dsDonTu = resData.data;
    } else if (Array.isArray(resData)) {
        dsDonTu = resData;
    }
    
    // Gán dữ liệu an toàn vào state
    leaveRequests.value = dsDonTu;
    
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn từ:", error);
    ElMessage.error('Không thể tải danh sách đơn từ!');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLeaveRequests();
});

// --- COMPUTED: TÌM KIẾM & LỌC ---
const filteredLeaves = computed(() => {
  return leaveRequests.value.filter(don => {
    const tenNV = (don.hoTen || '').toLowerCase();
    const matchSearch = tenNV.includes(searchQuery.value.toLowerCase());
    const matchStatus = filterStatus.value ? don.trangThai === filterStatus.value : true;
    const matchType = filterType.value ? don.loaiDon === filterType.value : true;
    
    // 👉 Logic lọc theo ngày nộp đơn
    let matchDate = true;
    if (filterCreatedDate.value && don.ngayTao) {
      const dateInDb = don.ngayTao.split('T')[0]; // Lấy phần YYYY-MM-DD
      matchDate = dateInDb === filterCreatedDate.value;
    }

    return matchSearch && matchStatus && matchType && matchDate;
  });
});

// --- THỐNG KÊ NHANH TRÊN HEADER ---
const countStatus = (status) => leaveRequests.value.filter(d => d.trangThai === status).length;

const countApprovedThisMonth = computed(() => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  return leaveRequests.value.filter(d => {
    if (d.trangThai !== 'Đã duyệt' || !d.ngayBatDau) return false;
    const startDate = new Date(d.ngayBatDau);
    return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
  }).length;
});

// --- METHODS TIỆN ÍCH ---
const getInitials = (name) => {
  if (!name) return 'NV';
  const words = name.split(' ');
  return words.length > 1 ? words[words.length - 2][0] + words[words.length - 1][0] : name.substring(0, 2).toUpperCase();
};

// Tự động cộng lại múi giờ địa phương
const formatDateVN = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  
  return `${d}/${m}/${y}`;
};

// Thêm hàm định dạng ngày giờ cho đẹp
const formatDateTimeVN = (dateTimeStr) => {
  if (!dateTimeStr) return 'Chưa có';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

// Đảm bảo không bị tính hụt ngày do lệch giờ
const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0); // Ép về 0h để trừ cho chuẩn
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(endDate - startDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; 
};

const getStatusColor = (status) => {
  if (status === 'Đã duyệt') return 'success';
  if (status === 'Từ chối') return 'danger';
  return 'warning'; 
};

// --- API: XỬ LÝ DUYỆT / TỪ CHỐI ĐƠN ---
const handleAction = (row, action) => {
  const actionText = action === 'Đã duyệt' ? 'DUYỆT' : 'TỪ CHỐI';
  const messageType = action === 'Đã duyệt' ? 'success' : 'error';

  ElMessageBox.confirm(
    `Xác nhận ${actionText} đơn xin ${row.loaiDon} của nhân viên ${row.hoTen}?`,
    'Xử lý Đơn từ',
    { confirmButtonText: 'Xác nhận', cancelButtonText: 'Hủy', type: messageType }
  ).then(async () => {
    processingId.value = row.maDon;
    try {
      // Gọi API gọi đến handleLeaveRequest ở Backend
      const res = await api.put(`/hr/dontu/${row.maDon}/xuly`, { trangThai: action });
      const resData = res.data || res;

      if (resData.success) {
        ElMessage.success(resData.message || `Đã ${action.toLowerCase()} đơn thành công!`);
        await fetchLeaveRequests(); // Tải lại danh sách để cập nhật UI
      }
    } catch (error) {
      console.error("Lỗi xử lý đơn:", error);
      ElMessage.error(error.response?.data?.message || 'Lỗi hệ thống khi xử lý đơn!');
    } finally {
      processingId.value = null;
    }
  }).catch(() => {});
};
</script>