<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Quản lý Đơn từ & Nghỉ phép</h2>
        <p class="text-slate-500">Tiếp nhận, xét duyệt đơn xin nghỉ phép, nghỉ ốm, thai sản của nhân viên</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <p class="text-2xl font-bold text-emerald-600">{{ countStatus('Đã duyệt') }}</p>
        </div>
        <div class="p-3 bg-emerald-50 text-emerald-500 rounded-full"><el-icon class="text-2xl"><CircleCheckFilled /></el-icon></div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 font-semibold mb-1">Từ chối (Tháng này)</p>
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
        <el-option label="Nghỉ phép" value="Nghỉ phép" />
        <el-option label="Nghỉ ốm" value="Nghỉ ốm" />
        <el-option label="Thai sản" value="Thai sản" />
        <el-option label="Việc riêng" value="Việc riêng" />
      </el-select>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredLeaves" style="width: 100%" size="large" stripe>
        
        <el-table-column label="Người gửi" min-width="200" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" class="bg-slate-100 text-blue-600 font-bold text-xs">
                {{ getInitials(getTenNhanVien(scope.row.maNhanVien)) }}
              </el-avatar>
              <div>
                <p class="font-bold text-slate-800">{{ getTenNhanVien(scope.row.maNhanVien) }}</p>
                <p class="text-xs text-slate-500">Mã NV: {{ scope.row.maNhanVien }}</p>
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
              <p class="text-xs text-slate-500 mt-0.5">({{ 2(scope.row.ngayBatDau, scope.row.ngayKetThuc) }} ngày)</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="lyDo" label="Lý do chi tiết" min-width="200">
          <template #default="scope">
            <span class="text-sm text-slate-600 line-clamp-2" :title="scope.row.lyDo">{{ scope.row.lyDo }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" width="130" align="center">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.trangThai)" effect="dark" class="font-bold w-full">
              {{ scope.row.trangThai }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Người duyệt" width="160" align="center">
          <template #default="scope">
            <span v-if="scope.row.maNguoiDuyet" class="text-sm font-semibold text-slate-700">
              {{ getTenNhanVien(scope.row.maNguoiDuyet) }}
            </span>
            <span v-else class="text-xs text-slate-400 italic">-- Chưa duyệt --</span>
          </template>
        </el-table-column>

        <el-table-column label="Xử lý" width="120" align="center" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.trangThai === 'Chờ duyệt'" class="flex justify-center gap-2">
              <el-button type="success" circle title="Duyệt đơn" @click="handleApprove(scope.row)">
                <el-icon><Check /></el-icon>
              </el-button>
              <el-button type="danger" circle title="Từ chối" @click="handleReject(scope.row)">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <span v-else class="text-xs text-slate-400"><el-icon><Lock /></el-icon> Đã khóa</span>
          </template>
        </el-table-column>

      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search, BellFilled, CircleCheckFilled, CircleCloseFilled, Check, Close, Lock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- MOCK DATABASE ---
// Giả định User đang đăng nhập là Admin (Mã NV: 1)
const CURRENT_ADMIN_ID = 1;

const dbNhanVien = ref([
  { maNhanVien: 1, hoTen: 'Nguyễn Văn Admin' },
  { maNhanVien: 2, hoTen: 'Trần Thị Sales' },
  { maNhanVien: 3, hoTen: 'Lê Văn Kho' },
]);

// Dữ liệu đơn từ (Bao gồm các đơn do Nhân viên gửi từ màn hình Profile)
const dbDonTu = ref([
  { maDon: 101, maNhanVien: 2, maNguoiDuyet: null, loaiDon: 'Nghỉ ốm', lyDo: 'Sốt xuất huyết, xin nghỉ đi khám', trangThai: 'Chờ duyệt', ngayBatDau: '2026-04-05', ngayKetThuc: '2026-04-06' },
  { maDon: 102, maNhanVien: 3, maNguoiDuyet: null, loaiDon: 'Nghỉ phép', lyDo: 'Về quê ăn giỗ', trangThai: 'Chờ duyệt', ngayBatDau: '2026-04-10', ngayKetThuc: '2026-04-11' },
  { maDon: 103, maNhanVien: 2, maNguoiDuyet: 1, loaiDon: 'Nghỉ phép', lyDo: 'Nhà có việc gia đình đột xuất', trangThai: 'Đã duyệt', ngayBatDau: '2026-03-26', ngayKetThuc: '2026-03-26' },
  { maDon: 104, maNhanVien: 3, maNguoiDuyet: 1, loaiDon: 'Việc riêng', lyDo: 'Đi du lịch', trangThai: 'Từ chối', ngayBatDau: '2026-03-15', ngayKetThuc: '2026-03-20' },
]);

// --- STATE ---
const searchQuery = ref('');
const filterStatus = ref('');
const filterType = ref('');

// --- COMPUTED ---
const filteredLeaves = computed(() => {
  return dbDonTu.value.filter(don => {
    const tenNV = getTenNhanVien(don.maNhanVien).toLowerCase();
    const matchSearch = tenNV.includes(searchQuery.value.toLowerCase());
    const matchStatus = filterStatus.value ? don.trangThai === filterStatus.value : true;
    const matchType = filterType.value ? don.loaiDon === filterType.value : true;
    return matchSearch && matchStatus && matchType;
  });
});

const countStatus = (status) => dbDonTu.value.filter(d => d.trangThai === status).length;

// --- METHODS ---
const getTenNhanVien = (id) => dbNhanVien.value.find(nv => nv.maNhanVien === id)?.hoTen || 'Unknown';

const getInitials = (name) => {
  const words = name.split(' ');
  return words.length > 1 ? words[words.length - 2][0] + words[words.length - 1][0] : name.substring(0, 2).toUpperCase();
};

const formatDateVN = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Hàm tính số ngày nghỉ dựa vào Ngày bắt đầu và kết thúc
const calculateDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Cộng 1 vì tính cả ngày bắt đầu
  return diffDays;
};

const getStatusColor = (status) => {
  if (status === 'Đã duyệt') return 'success';
  if (status === 'Từ chối') return 'danger';
  return 'warning'; // Chờ duyệt
};

// --- XỬ LÝ DUYỆT / TỪ CHỐI ĐƠN ---
const handleApprove = (row) => {
  ElMessageBox.confirm(
    `Xác nhận DUYỆT đơn xin ${row.loaiDon} của nhân viên ${getTenNhanVien(row.maNhanVien)}?`,
    'Phê duyệt Đơn',
    { confirmButtonText: 'Duyệt Đơn', cancelButtonText: 'Hủy', type: 'success' }
  ).then(() => {
    // 1. Đổi trạng thái
    row.trangThai = 'Đã duyệt';
    // 2. Ghi nhận người duyệt chính là Admin đang đăng nhập
    row.maNguoiDuyet = CURRENT_ADMIN_ID;
    
    ElMessage.success('Đã phê duyệt đơn thành công!');
    
    // TRONG THỰC TẾ: Backend lúc này sẽ tự động sinh ra các dòng dữ liệu 
    // mang trạng thái "Nghỉ phép" ném vào bảng ChamCong cho những ngày tương ứng.
  }).catch(() => {});
};

const handleReject = (row) => {
  ElMessageBox.prompt(
    'Vui lòng nhập lý do từ chối (Nhân viên sẽ nhìn thấy):',
    'Từ chối Đơn',
    { confirmButtonText: 'Xác nhận Từ chối', cancelButtonText: 'Hủy', type: 'error', inputPlaceholder: 'Công ty đang thiếu người...' }
  ).then(({ value }) => {
    row.trangThai = 'Từ chối';
    row.maNguoiDuyet = CURRENT_ADMIN_ID;
    // (Thực tế sẽ lưu cái `value` lý do từ chối này vào DB nếu có thiết kế cột lyDoTuChoi)
    
    ElMessage.warning('Đã từ chối đơn xin nghỉ!');
  }).catch(() => {});
};
</script>