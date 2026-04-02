<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Bảng Chấm Công Hằng Ngày</h2>
        <p class="text-slate-500">Quản lý giờ ra/vào, đi trễ và trạng thái làm việc của nhân viên</p>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-slate-600 font-semibold">Chọn ngày xem:</span>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="Chọn ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          :clearable="false"
          class="!w-48"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" v-loading="loading">
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-blue-50 text-blue-600 rounded-lg"><el-icon class="text-2xl"><UserFilled /></el-icon></div>
        <div><p class="text-sm text-slate-500">Tổng nhân viên</p><p class="text-xl font-bold">{{ totalEmployees }}</p></div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><el-icon class="text-2xl"><Check /></el-icon></div>
        <div><p class="text-sm text-slate-500">Có mặt / Đi làm</p><p class="text-xl font-bold">{{ countPresent }}</p></div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-amber-50 text-amber-600 rounded-lg"><el-icon class="text-2xl"><Warning /></el-icon></div>
        <div><p class="text-sm text-slate-500">Vi phạm (Trễ/Sớm)</p><p class="text-xl font-bold">{{ countLateEarly }}</p></div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div class="p-3 bg-slate-50 text-slate-600 rounded-lg"><el-icon class="text-2xl"><Remove /></el-icon></div>
        <div><p class="text-sm text-slate-500">Nghỉ phép</p><p class="text-xl font-bold">{{ countLeave }}</p></div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <el-input 
        v-model="searchKeyword" 
        placeholder="Tìm tên hoặc Mã nhân viên..." 
        clearable 
        class="w-full md:w-80"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="filterStatus" placeholder="Lọc theo trạng thái" clearable class="w-full md:w-56">
        <el-option label="Tất cả trạng thái" value="" />
        <el-option label="Đúng giờ" value="Đúng giờ" />
        <el-option label="Đi trễ / Về sớm" value="Vi phạm" />
        <el-option label="Tăng ca" value="Tăng ca" />
        <el-option label="Nghỉ phép" value="Nghỉ có phép" /> 
        <el-option label="Chưa chấm công" value="Chưa chấm công" />
      </el-select>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredAttendanceList" style="width: 100%" size="large" stripe>
        
        <el-table-column prop="maNhanVien" label="Mã NV" width="100" align="center">
          <template #default="scope">
            <span class="font-bold text-slate-600 font-mono">NV{{ scope.row.maNhanVien }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Họ và Tên" min-width="200">
          <template #default="scope">
            <span class="font-bold text-slate-800">{{ scope.row.hoTen }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="gioVao" label="Giờ Vào" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.gioVao" :type="isLate(scope.row.gioVao) ? 'danger' : 'success'" effect="plain" class="font-mono font-bold text-sm">
              {{ scope.row.gioVao }}
            </el-tag>
            <span v-else class="text-slate-400 italic text-sm">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="gioRa" label="Giờ Ra" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.gioRa" type="info" effect="plain" class="font-mono font-bold text-sm">
              {{ scope.row.gioRa }}
            </el-tag>
            <span v-else class="text-slate-400 italic text-sm">-</span>
          </template>
        </el-table-column>

        <el-table-column label="Tổng giờ" width="100" align="center">
          <template #default="scope">
            <span v-if="scope.row.soGioLam > 0" class="font-black text-blue-600">{{ scope.row.soGioLam }}h</span>
            <span v-else class="text-slate-300">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" min-width="180" align="center">
          <template #default="scope">
            <el-tag 
              :type="getStatusType(scope.row.trangThai)" 
              effect="dark" 
              class="font-bold border-none"
              :class="scope.row.trangThai === 'Chưa chấm công' ? 'bg-slate-100 text-slate-400' : ''"
            >
              {{ scope.row.trangThai }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              link 
              @click="openEditModal(scope.row)"
              :disabled="scope.row.trangThai && scope.row.trangThai.includes('Nghỉ')"
              :title="(scope.row.trangThai && scope.row.trangThai.includes('Nghỉ')) ? 'Không thể sửa thủ công ngày nghỉ theo đơn' : ''"
            >
              <el-icon class="text-xl"><EditPen /></el-icon> Sửa
            </el-button>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="ĐIỀU CHỈNH CHẤM CÔNG" width="400px" destroy-on-close class="custom-dialog">
      <div v-if="editingRecord" class="space-y-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm mb-4">
          <p class="text-slate-500 mb-1">Nhân viên:</p>
          <p class="font-bold text-lg text-blue-600 mb-2">{{ editingRecord.hoTen }} (NV{{ editingRecord.maNhanVien }})</p>
          <p class="text-slate-500 mb-1">Ngày chấm công:</p>
          <p class="font-bold text-slate-800">{{ formatDateVN(selectedDate) }}</p>
        </div>

        <el-form label-position="top">
          <div class="grid grid-cols-2 gap-4">
            <el-form-item label="Giờ Check-in">
              <el-time-picker v-model="formTime.gioVao" format="HH:mm" value-format="HH:mm:ss" placeholder="--:--" class="!w-full" />
            </el-form-item>
            <el-form-item label="Giờ Check-out">
              <el-time-picker v-model="formTime.gioRa" format="HH:mm" value-format="HH:mm:ss" placeholder="--:--" class="!w-full" />
            </el-form-item>
          </div>
          <div class="text-xs text-orange-500 bg-orange-50 p-3 rounded-lg flex items-start gap-2">
            <el-icon class="mt-0.5"><Warning /></el-icon>
            <p>Trạng thái (Đi trễ, Tăng ca...) và Tổng giờ làm sẽ được hệ thống <b>tự động tính toán</b> lại dựa trên giờ bạn nhập.</p>
          </div>
        </el-form>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="dialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="saveAttendance" class="font-bold">LƯU THAY ĐỔI</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { UserFilled, Check, Warning, Remove, EditPen, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api'; 

// --- STATE ---
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
const currentDay = String(today.getDate()).padStart(2, '0');
const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;

const selectedDate = ref(todayStr);
const searchKeyword = ref(''); 
const filterStatus = ref('');  

const dialogVisible = ref(false);
const editingRecord = ref(null);
const loading = ref(false);

const formTime = ref({ gioVao: '', gioRa: '' }); 

const STANDARD_START_TIME = '08:00:00';

const dbNhanVien = ref([]);
const dbChamCong = ref([]); 

// --- FETCH DATA ---
const fetchData = async () => {
  loading.value = true;
  try {
    const nvRes = await api.get('/hr/nhanvien?limit=1000');
    let dsNhanVien = [];
    if (nvRes.data?.data?.data && Array.isArray(nvRes.data.data.data)) {
        dsNhanVien = nvRes.data.data.data;
    } else if (Array.isArray(nvRes.data?.data)) dsNhanVien = nvRes.data.data;
    else if (Array.isArray(nvRes.data)) dsNhanVien = nvRes.data;
    dbNhanVien.value = dsNhanVien;

    const [year, month] = selectedDate.value.split('-');
    const ccRes = await api.get(`/hr/chamcong?thang=${parseInt(month)}&nam=${year}`);
    
    let dsChamCong = [];
    const ccData = ccRes.data || ccRes;
    if (Array.isArray(ccData.data)) dsChamCong = ccData.data;
    else if (Array.isArray(ccData)) dsChamCong = ccData;
    dbChamCong.value = dsChamCong;

  } catch (error) {
    console.error("Lỗi lấy dữ liệu:", error);
    ElMessage.error('Không tải được dữ liệu chấm công!');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

watch(selectedDate, (newVal, oldVal) => {
  const newMonth = newVal.substring(0, 7); 
  const oldMonth = oldVal.substring(0, 7);
  if (newMonth !== oldMonth) {
    fetchData();
  }
});

// --- COMPUTED: Dữ liệu Gốc ---
const attendanceList = computed(() => {
  return dbNhanVien.value.map(nv => {
    const cc = dbChamCong.value.find(c => {
      if (!c.ngayLamViec) return false;
      const cDate = new Date(c.ngayLamViec);
      const cStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
      return Number(c.maNhanVien) === Number(nv.maNhanVien) && cStr === selectedDate.value;
    });
    
    // Nếu không có dữ liệu (cc bị undefined), tự động gán trạng thái là "Chưa chấm công"
    return {
      maNhanVien: nv.maNhanVien,
      hoTen: nv.hoTen,
      gioVao: cc?.gioVao || null,
      gioRa: cc?.gioRa || null,
      soGioLam: cc?.soGioLam || 0,
      trangThai: cc?.trangThai || 'Chưa chấm công'
    };
  });
});

// --- COMPUTED: Dữ liệu sau khi Tìm kiếm & Lọc ---
const filteredAttendanceList = computed(() => {
  return attendanceList.value.filter(item => {
    // 1. Lọc theo tên hoặc mã NV
    const keyword = searchKeyword.value.toLowerCase();
    const matchSearch = item.hoTen.toLowerCase().includes(keyword) || 
                        `nv${item.maNhanVien}`.includes(keyword);

    // 2. Lọc theo trạng thái
    let matchStatus = true;
    if (filterStatus.value) {
      if (filterStatus.value === 'Vi phạm') {
        matchStatus = item.trangThai.includes('Đi trễ') || item.trangThai.includes('Về sớm');
      } else {
        matchStatus = item.trangThai.includes(filterStatus.value);
      }
    }

    return matchSearch && matchStatus;
  });
});

// --- THỐNG KÊ NHANH ---
const totalEmployees = computed(() => dbNhanVien.value.length);
const countPresent = computed(() => attendanceList.value.filter(item => item.gioVao !== null || item.trangThai.includes('Đúng giờ')).length);
const countLateEarly = computed(() => attendanceList.value.filter(item => item.trangThai.includes('Đi trễ') || item.trangThai.includes('Về sớm')).length);
// 👉 ĐÃ SỬA: Đếm chuẩn "Nghỉ có phép"
const countLeave = computed(() => attendanceList.value.filter(item => item.trangThai.includes('Nghỉ có phép')).length);

// --- METHODS ---
const formatDateVN = (dateStr) => {
  if(!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const isLate = (gioVao) => {
  if (!gioVao) return false;
  return gioVao > STANDARD_START_TIME;
};

const getStatusType = (status) => {
  if (!status || status === 'Chưa chấm công') return 'info';
  // 👉 ĐÃ SỬA: Bắt chuẩn chuỗi "Nghỉ có phép"
  if (status.includes('Nghỉ có phép')) return 'info';
  if (status.includes('Đi trễ') && status.includes('Về sớm')) return 'danger'; 
  if (status.includes('Đi trễ') || status.includes('Về sớm')) return 'warning'; 
  if (status.includes('Tăng ca')) return 'primary'; 
  if (status.includes('Đúng giờ')) return 'success'; 
  return '';
};

const openEditModal = (row) => {
  editingRecord.value = row;
  formTime.value = { 
    gioVao: row.gioVao ? row.gioVao : '', 
    gioRa: row.gioRa ? row.gioRa : ''
  };
  dialogVisible.value = true;
};

const saveAttendance = async () => {
  try {
    const payload = {
      maNhanVien: editingRecord.value.maNhanVien,
      ngayLamViec: selectedDate.value,
      gioVao: formTime.value.gioVao,
      gioRa: formTime.value.gioRa
    };

    const res = await api.put('/hr/chamcong/admin', payload);
    const resultData = res.data || res;
    
    if (resultData.success) {
      ElMessage.success(resultData.message);
      dialogVisible.value = false;
      await fetchData(); 
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi lưu thay đổi!');
  }
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
</style>