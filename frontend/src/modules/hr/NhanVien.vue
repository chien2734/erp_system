<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Danh Sách Nhân Viên</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Quản lý hồ sơ, phòng ban và thông tin liên lạc</p>
      </div>
      <el-button type="primary" :icon="Plus" size="large" class="w-full md:w-auto font-bold shadow-lg shadow-blue-500/30 m-0 shrink-0" @click="openAddDialog">
        THÊM NHÂN VIÊN
      </el-button>
    </div>

    <div class="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-center">
        
        <el-input 
          v-model="searchQuery" 
          placeholder="Tìm tên, Mã NV, SĐT..." 
          :prefix-icon="Search"
          size="large"
          clearable
          class="w-full"
        />
        
        <el-select v-model="filterChucVu" placeholder="Tất cả chức vụ" clearable size="large" class="w-full">
          <el-option v-for="cv in dbChucVu" :key="cv.maChucVu" :label="cv.tenChucVu" :value="cv.maChucVu" />
        </el-select>
        
        <el-select v-model="filterStatus" placeholder="Trạng thái làm việc" clearable size="large" class="w-full">
          <el-option label="Đang làm việc" :value="1" />
          <el-option label="Đã nghỉ" :value="0" />
        </el-select>
        
        <div class="w-full text-xs md:text-sm text-slate-500 bg-slate-50 px-3 rounded-lg border border-slate-200 text-center font-medium h-[40px] flex items-center justify-center">
          Tổng danh sách: <span class="font-bold text-blue-600 text-base mx-1.5">{{ filteredEmployees.length }}</span> nhân viên
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <el-table :data="paginatedData" v-loading="loading" :row-class-name="tableRowClassName" style="width: 100%" size="large" class="min-w-[950px]">
        
        <el-table-column prop="maNhanVien" label="Mã NV" width="100" fixed="left" align="center">
          <template #default="scope">
            <span class="font-bold text-blue-600 font-mono whitespace-nowrap">{{ scope.row.maNhanVien || '---' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="hoTen" label="Thông tin nhân viên" min-width="260" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" :class="scope.row.gioiTinh === 'Nữ' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'" class="shrink-0 font-bold">
                {{ scope.row.hoTen ? scope.row.hoTen.charAt(0).toUpperCase() : '?' }}
              </el-avatar>
              <div class="min-w-0">
                <p class="font-semibold text-slate-800 leading-tight truncate" :title="scope.row.hoTen">
                  {{ scope.row.hoTen }} 
                  <el-icon v-if="scope.row.gioiTinh === 'Nam'" class="text-blue-500 text-xs ml-1"><Male /></el-icon>
                  <el-icon v-if="scope.row.gioiTinh === 'Nữ'" class="text-pink-500 text-xs ml-1"><Female /></el-icon>
                </p>
                <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1 whitespace-nowrap">
                  <el-icon><Phone /></el-icon> {{ scope.row.sdt || 'Chưa cập nhật' }}
                </p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="Email liên hệ" min-width="200">
          <template #default="scope">
             <span class="text-slate-600 text-sm truncate block" :title="scope.row.email">{{ scope.row.email || '---' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="ngaySinh" label="Ngày sinh" width="120" align="center">
          <template #default="scope">
            <span class="text-slate-600 text-sm whitespace-nowrap">{{ formatDate(scope.row.ngaySinh) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenChucVu" label="Chức vụ" min-width="160">
          <template #default="scope">
            <span class="font-medium text-slate-700">{{ scope.row.tenChucVu || 'Chưa phân công' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="ngayVaoLam" label="Ngày vào làm" width="130" align="center">
          <template #default="scope">
            <span class="text-sm whitespace-nowrap font-medium">{{ formatDate(scope.row.ngayVaoLam) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" width="140" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.trangThai ? 'success' : 'info'" effect="plain" round class="border-none font-bold whitespace-nowrap">
              <span class="flex items-center gap-1.5">
                <span :class="`w-2 h-2 rounded-full ${scope.row.trangThai ? 'bg-emerald-500' : 'bg-slate-400'}`"></span>
                {{ scope.row.trangThai ? 'Đang làm việc' : 'Đã nghỉ' }}
              </span>
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="90" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              :icon="Edit" 
              circle 
              size="small" 
              type="primary" 
              plain 
              @click="openEditDialog(scope.row)" 
              :disabled="authStore.getUserRole !== 1 && scope.row.maNhomQuyen === 1"
              :title="authStore.getUserRole !== 1 && scope.row.maNhomQuyen === 1 ? 'Không quyền sửa GĐ' : 'Cập nhật'"
            />
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

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditMode ? 'CẬP NHẬT HỒ SƠ' : 'THÊM NHÂN VIÊN MỚI'" 
      width="700px"
      destroy-on-close
      class="custom-dialog responsive-dialog"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" size="large" class="mt-2">
        
        <el-alert 
          v-if="isEditMode" 
          :title="`Mã Nhân Viên: NV${formData.maNhanVien}`" 
          type="info" 
          show-icon 
          :closable="false" 
          class="mb-4 md:mb-6 font-mono font-bold" 
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          <el-form-item label="Họ và tên đầy đủ" prop="hoTen">
            <el-input v-model="formData.hoTen" placeholder="VD: Nguyễn Văn A" :prefix-icon="User" />
          </el-form-item>
          
          <el-form-item label="Giới tính" prop="gioiTinh">
            <el-radio-group v-model="formData.gioiTinh" class="w-full flex">
              <el-radio label="Nam" border class="flex-1 !mr-0">Nam</el-radio>
              <el-radio label="Nữ" border class="flex-1 !mr-0 ml-2">Nữ</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Ngày sinh" prop="ngaySinh">
            <el-date-picker
              v-model="formData.ngaySinh"
              type="date"
              placeholder="Chọn ngày sinh"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              class="w-full"
            />
          </el-form-item>

          <el-form-item label="Số điện thoại" prop="sdt">
            <el-input v-model="formData.sdt" placeholder="VD: 0901234567" :prefix-icon="Phone" />
          </el-form-item>

          <el-form-item label="Email cá nhân/Công việc" prop="email" class="md:col-span-2">
            <el-input v-model="formData.email" placeholder="VD: nguyenvan@laptop.com" :prefix-icon="Message" />
          </el-form-item>

          <el-form-item label="Chức vụ đảm nhiệm" prop="maChucVu" class="md:col-span-2">
            <el-select v-model="formData.maChucVu" placeholder="Chọn chức vụ cho nhân viên" class="w-full" filterable>
              <el-option 
                v-for="cv in dbChucVu" 
                :key="cv.maChucVu" 
                :label="cv.tenChucVu" 
                :value="cv.maChucVu" 
                :disabled="authStore.getUserRole !== 1 && cv.tenChucVu.toLowerCase().includes('giám đốc')"
              >
                <span class="flex justify-between items-center w-full">
                  <span>{{ cv.tenChucVu }}</span>
                  <el-icon v-if="authStore.getUserRole !== 1 && cv.tenChucVu.toLowerCase().includes('giám đốc')" class="text-rose-500">
                    <Lock />
                  </el-icon>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="Ngày vào làm" prop="ngayVaoLam">
            <el-date-picker
              v-model="formData.ngayVaoLam"
              type="date"
              placeholder="Chọn ngày"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              class="w-full"
            />
            <p v-if="hasPayroll" class="text-[10px] text-orange-500 italic mt-1">
              * Đã có bảng lương, không thể sửa ngày vào làm lớn hơn kỳ lương sớm nhất ({{ earliestPayrollInfo?.thang }}/{{ earliestPayrollInfo?.nam }}).
            </p>
          </el-form-item>

          <el-form-item label="Trạng thái làm việc" class="md:pl-4">
            <el-switch 
              v-model="formData.trangThai" 
              active-text="Đang làm" 
              inactive-text="Đã nghỉ"
              inline-prompt
              style="--el-switch-on-color: #10b981; --el-switch-off-color: #ef4444"
              class="mt-2"
            />
          </el-form-item>

          <el-form-item label="Địa chỉ thường trú" prop="diaChi" class="md:col-span-2 mb-0">
            <el-input 
              v-model="formData.diaChi" 
              type="textarea" 
              :rows="3" 
              placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố" 
            />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t border-slate-100">
          <el-button @click="dialogVisible = false" size="large" class="w-full sm:w-32">Hủy bỏ</el-button>
          <el-button type="primary" size="large" @click="handleSubmit(formRef)" :loading="isSubmitting" class="w-full sm:w-auto font-bold px-8 m-0">
            {{ isEditMode ? 'LƯU HỒ SƠ' : 'TẠO NHÂN VIÊN' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Search, Plus, Edit, User, Phone, Message, Male, Female, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api'; 
import { useAuthStore } from '../auth/auth.store';
import { usePagination } from '../../composables/usePagination';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

// --- STATE QUẢN LÝ DỮ LIỆU ---
const employees = ref([]);
const dbChucVu = ref([]); 
const loading = ref(false);
const authStore = useAuthStore();

// --- STATE TÌM KIẾM VÀ LỌC ---
const searchQuery = ref('');
const filterChucVu = ref('');
const filterStatus = ref('');

// --- STATE QUẢN LÝ DIALOG ---
const dialogVisible = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const hasPayroll = ref(false); // Trạng thái nhân viên đã có lương
const earliestPayrollInfo = ref(null); // Thông tin kỳ lương sớm nhất
const formRef = ref(null);

// --- FORM DATA ---
const formData = reactive({
  maNhanVien: null, hoTen: '', gioiTinh: 'Nam', ngaySinh: '', ngayVaoLam: '', 
  sdt: '', email: '', diaChi: '', maChucVu: null, trangThai: true 
});

// --- RULES VALIDATE ---
const validateAge = (rule, value, callback) => {
  if (!value) return callback(new Error('Vui lòng chọn ngày sinh'));
  const age = dayjs().diff(dayjs(value), 'year');
  if (age < 18) {
    callback(new Error('Nhân viên phải từ 18 tuổi trở lên'));
  } else {
    callback();
  }
};

const rules = reactive({
  hoTen: [{ required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' }],
  gioiTinh: [{ required: true, message: 'Vui lòng chọn giới tính', trigger: 'change' }],
  ngaySinh: [{ required: true, validator: validateAge, trigger: 'change' }],
  ngayVaoLam: [{ required: true, message: 'Vui lòng chọn ngày vào làm', trigger: 'change' }],
  sdt: [
    { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' },
    { pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: 'SĐT không hợp lệ', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
    { type: 'email', message: 'Email không hợp lệ', trigger: ['blur', 'change'] }
  ],
  maChucVu: [{ required: true, message: 'Vui lòng chọn chức vụ', trigger: 'change' }]
});

// --- FETCH DATA TỪ BACKEND ---
const loadInitialData = async () => {
  loading.value = true;
  try {
    const [resNV, resCV] = await Promise.all([
      api.get('/hr/nhanvien?limit=1000'), 
      api.get('/hr/chucvu')
    ]);
    
    employees.value = resNV.data?.data || resNV.data || [];
    dbChucVu.value = resCV.data?.data || resCV.data || [];
  } catch (error) {
    ElMessage.error('Không thể tải dữ liệu từ máy chủ!');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadInitialData();
});

// ==========================================
// 1. TẠO BIẾN COMPUTED ĐỂ LỌC (FILTER) DATA CHUẨN
// ==========================================
const filteredEmployees = computed(() => {
  const query = (searchQuery.value || '').toLowerCase().trim();

  return employees.value.filter(emp => {
    let matchQuery = true;
    if (query) {
      matchQuery = (emp.hoTen?.toLowerCase() || '').includes(query) ||
                   (emp.sdt || '').includes(query) ||
                   (emp.maNhanVien?.toString() || '').includes(query);
    }

    let matchChucVu = true;
    if (filterChucVu.value !== undefined && filterChucVu.value !== null && filterChucVu.value !== '') {
      matchChucVu = emp.maChucVu === filterChucVu.value;
    }

    let matchStatus = true;
    if (typeof filterStatus.value === 'number') {
      matchStatus = emp.trangThai === filterStatus.value;
    }

    return matchQuery && matchChucVu && matchStatus;
  });
});

// ==========================================
// 2. GỌI COMPOSABLE PHÂN TRANG (Truyền biến computed ở trên vào)
// ==========================================
const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(filteredEmployees, 7);

// --- FORMATTERS ---
const formatDate = (dateString) => {
  if (!dateString) return '---';
  return dayjs(dateString).format('DD/MM/YYYY');
};

// --- QUẢN LÝ FORM ---
const resetForm = () => {
  if (formRef.value) formRef.value.resetFields();
  Object.assign(formData, {
    maNhanVien: null, hoTen: '', gioiTinh: 'Nam', ngaySinh: '', ngayVaoLam: '', 
    sdt: '', email: '', diaChi: '', maChucVu: null, trangThai: true
  });
};

const openAddDialog = () => {
  isEditMode.value = false;
  hasPayroll.value = false;
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = async (row) => {
  isEditMode.value = true;
  hasPayroll.value = false;
  
  // Sửa lỗi lệch múi giờ bằng cách format lại ngày tháng trước khi gán vào form
  const formattedRow = { 
    ...row, 
    trangThai: row.trangThai === 1,
    ngaySinh: row.ngaySinh ? dayjs(row.ngaySinh).format('YYYY-MM-DD') : '',
    ngayVaoLam: row.ngayVaoLam ? dayjs(row.ngayVaoLam).format('YYYY-MM-DD') : ''
  };
  
  Object.assign(formData, formattedRow);
  dialogVisible.value = true;

  // Kiểm tra bảng lương để hiển thị cảnh báo ngày vào làm
  try {
    const res = await api.get(`/hr/nhanvien/${row.maNhanVien}/check-payroll`);
    hasPayroll.value = res.data.hasPayroll;
    earliestPayrollInfo.value = res.data.earliestPayroll;
  } catch (e) {
    console.error("Lỗi check-payroll:", e);
  }
};

const tableRowClassName = ({ row }) => {
  if (row.trangThai === 0) return 'inactive-row';
  return '';
};

// --- GỌI API THÊM/SỬA NHÂN VIÊN ---
const handleSubmit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        const payload = {
          ...formData,
          trangThai: formData.trangThai ? 1 : 0
        };

        if (isEditMode.value) {
          await api.put(`/hr/nhanvien/${formData.maNhanVien}`, payload);
          ElMessage.success('Cập nhật thông tin nhân viên thành công!');
        } else {
          await api.post('/hr/nhanvien', payload);
          ElMessage.success('Đã thêm nhân viên mới vào hệ thống!');
        }
        
        loadInitialData(); 
        dialogVisible.value = false;
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu!');
      } finally {
        isSubmitting.value = false;
      }
    }
  });
};
</script>
<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) { :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; } }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }

/* Bóp Dialog tự động trên Mobile */
:deep(.responsive-dialog) { max-width: 95vw !important; }

/* Tuỳ chỉnh Scrollbar cho bảng mượt mà hơn */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* In đậm nhãn Form */
:deep(.el-form-item__label) { font-weight: 600; color: #475569; padding-bottom: 4px; }
/* Tuỳ chỉnh Radio button cho đẹp hơn */
:deep(.el-radio.is-bordered) { border-radius: 8px; }

/* Bôi mờ hàng dữ liệu Nhân viên đã nghỉ */
:deep(.el-table .inactive-row) { background-color: #f8fafc; }
:deep(.el-table .inactive-row td) { opacity: 0.6; }
:deep(.el-table .inactive-row .el-avatar) { filter: grayscale(100%); opacity: 0.8; }
</style><style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) { :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; } }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }

/* Bóp Dialog tự động trên Mobile */
:deep(.responsive-dialog) { max-width: 95vw !important; }

/* Tuỳ chỉnh Scrollbar cho bảng mượt mà hơn */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* In đậm nhãn Form */
:deep(.el-form-item__label) { font-weight: 600; color: #475569; padding-bottom: 4px; }
/* Tuỳ chỉnh Radio button cho đẹp hơn */
:deep(.el-radio.is-bordered) { border-radius: 8px; }

/* Bôi mờ hàng dữ liệu Nhân viên đã nghỉ */
:deep(.el-table .inactive-row) { background-color: #f8fafc; }
:deep(.el-table .inactive-row td) { opacity: 0.6; }
:deep(.el-table .inactive-row .el-avatar) { filter: grayscale(100%); opacity: 0.8; }
</style>