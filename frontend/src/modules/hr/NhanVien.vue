<template>
  <div class="space-y-6 relative">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Danh sách nhân viên</h2>
        <p class="text-slate-500">Quản lý hồ sơ, phòng ban và thông tin liên lạc</p>
      </div>
      <div class="flex gap-3">
        <el-input 
          v-model="searchQuery" 
          placeholder="Tìm tên, Mã NV hoặc SĐT..." 
          :prefix-icon="Search"
          class="!w-72"
          clearable
        />
        <el-button type="primary" :icon="Plus" class="!rounded-lg font-semibold" @click="openAddDialog">
          Thêm nhân viên
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredEmployees" v-loading="loading" :row-class-name="tableRowClassName" style="width: 100%" size="large">
        
        <el-table-column prop="maNhanVien" label="Mã NV" width="100" fixed="left">
          <template #default="scope">
            <span class="font-bold text-blue-600">{{ scope.row.maNhanVien || 'Đang chờ' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="hoTen" label="Nhân viên" min-width="240" fixed="left">
          <template #default="scope">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" :class="scope.row.gioiTinh === 'Nữ' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'">
                {{ scope.row.hoTen.charAt(0) }}
              </el-avatar>
              <div>
                <p class="font-semibold text-slate-800 leading-tight">
                  {{ scope.row.hoTen }} 
                  <el-icon v-if="scope.row.gioiTinh === 'Nam'" class="text-blue-500 text-xs ml-1"><Male /></el-icon>
                  <el-icon v-if="scope.row.gioiTinh === 'Nữ'" class="text-pink-500 text-xs ml-1"><Female /></el-icon>
                </p>
                <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <el-icon><Phone /></el-icon> {{ scope.row.sdt }}
                </p>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="Email liên hệ" min-width="200" show-overflow-tooltip>
          <template #default="scope">
             <span class="text-slate-600">{{ scope.row.email }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="ngaySinh" label="Ngày sinh" min-width="120" align="center">
          <template #default="scope">
            <span class="text-slate-600">{{ formatDate(scope.row.ngaySinh) }}</span>
          </template>
        </el-table-column>

        <!-- <el-table-column prop="phongBan" label="Phòng ban" min-width="160">
          <template #default="scope">
            <el-tag :type="getDepartmentTag(scope.row.phongBan)" effect="light" round>
              {{ scope.row.phongBan }}
            </el-tag>
          </template>
        </el-table-column> -->

        <el-table-column prop="tenChucVu" label="Chức vụ" min-width="140" />
        
        <el-table-column prop="ngayVaoLam" label="Ngày vào làm" min-width="130">
          <template #default="scope">
            {{ formatDate(scope.row.ngayVaoLam) }}
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" min-width="140" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.trangThai ? 'success' : 'info'" effect="plain" round class="border-none font-bold">
              <span class="flex items-center gap-1.5">
                <span :class="`w-2 h-2 rounded-full ${scope.row.trangThai ? 'bg-emerald-500' : 'bg-slate-400'}`"></span>
                {{ scope.row.trangThai ? 'Đang làm việc' : 'Đã nghỉ' }}
              </span>
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="diaChi" label="Địa chỉ" min-width="200" show-overflow-tooltip />
        
        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button :icon="Edit" circle size="small" type="primary" plain @click="openEditDialog(scope.row)" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditMode ? 'Cập nhật hồ sơ nhân sự' : 'Thêm nhân viên mới'" 
      width="700px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" size="large">
        
        <el-alert 
          v-if="isEditMode" 
          :title="`Mã Nhân Viên: ${formData.maNhanVien}`" 
          type="info" 
          show-icon 
          :closable="false" 
          class="mb-6" 
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <el-form-item label="Họ và tên đầy đủ" prop="hoTen">
            <el-input v-model="formData.hoTen" placeholder="VD: Nguyễn Văn A" :prefix-icon="User" />
          </el-form-item>
          
          <el-form-item label="Giới tính" prop="gioiTinh">
            <el-radio-group v-model="formData.gioiTinh">
              <el-radio label="Nam" border>Nam</el-radio>
              <el-radio label="Nữ" border>Nữ</el-radio>
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

          <el-form-item label="Email cá nhân/Công việc" prop="email">
            <el-input v-model="formData.email" placeholder="VD: nguyenvan@laptop.com" :prefix-icon="Message" />
          </el-form-item>

          <el-form-item label="Chức vụ đảm nhiệm" prop="maChucVu" class="md:col-span-2">
            <el-select v-model="formData.maChucVu" placeholder="Chọn chức vụ cho nhân viên" class="w-full" size="large">
              <el-option 
                v-for="cv in dbChucVu" 
                :key="cv.maChucVu" 
                :label="cv.tenChucVu" 
                :value="cv.maChucVu" 
              />
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
          </el-form-item>

          <el-form-item label="Địa chỉ thường trú" prop="diaChi" class="md:col-span-2">
            <el-input 
              v-model="formData.diaChi" 
              type="textarea" 
              :rows="2" 
              placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố" 
            />
          </el-form-item>
        </div>

        <el-form-item label="Trạng thái làm việc" class="mt-2 border-t pt-4">
          <el-switch 
            v-model="formData.trangThai" 
            active-text="Đang làm việc" 
            inactive-text="Đã nghỉ"
            inline-prompt
            style="--el-switch-on-color: #10b981; --el-switch-off-color: #ef4444"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <el-button @click="dialogVisible = false" size="large">Hủy bỏ</el-button>
          <el-button type="primary" size="large" @click="handleSubmit(formRef)" :loading="isSubmitting">
            {{ isEditMode ? 'Lưu thông tin' : 'Tạo nhân viên' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Search, Plus, Edit, User, Phone, Message, Male, Female } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import api from '../../services/api'; // Import api từ thư mục services

// --- STATE QUẢN LÝ DỮ LIỆU ---
const employees = ref([]);
const dbChucVu = ref([]); 
const loading = ref(false);
const searchQuery = ref('');

// --- STATE QUẢN LÝ DIALOG ---
const dialogVisible = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const formRef = ref(null);

// --- FORM DATA KHỚP DATABASE ---
const formData = reactive({
  maNhanVien: null,
  hoTen: '',
  gioiTinh: 'Nam',
  ngaySinh: '', 
  ngayVaoLam: '',
  sdt: '',
  email: '',
  diaChi: '',
  maChucVu: null, // Dùng maChucVu thay vì chuỗi phongBan/chucVu
  trangThai: true // Database lưu 1 hoặc 0, ta sẽ convert lúc gửi API
});

// --- RULES VALIDATE ---
const rules = reactive({
  hoTen: [{ required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' }],
  gioiTinh: [{ required: true, message: 'Vui lòng chọn giới tính', trigger: 'change' }],
  ngayVaoLam: [{ required: true, message: 'Vui lòng chọn ngày vào làm', trigger: 'change' }],
  sdt: [
    { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' },
    { pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: 'SĐT không hợp lệ', trigger: 'blur' }
  ],
  maChucVu: [{ required: true, message: 'Vui lòng chọn chức vụ', trigger: 'change' }]
});

// --- FETCH DATA TỪ BACKEND ---
const loadInitialData = async () => {
  loading.value = true;
  try {
    // Gọi song song 2 API: Lấy Nhân viên & Lấy Chức vụ
    const [resNV, resCV] = await Promise.all([
      api.get('/hr/nhanvien?limit=1000'), // Lấy nhiều xíu vì có search local
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

// --- LỌC DỮ LIỆU HIỂN THỊ ---
const filteredEmployees = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return employees.value.filter(emp => 
    emp.hoTen?.toLowerCase().includes(query) ||
    emp.sdt?.includes(query) ||
    emp.maNhanVien?.toString().includes(query)
  );
});

// --- FORMATTERS ---
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa cập nhật';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

const getDepartmentTag = (chucVuName) => {
  if (!chucVuName) return 'info';
  const cv = chucVuName.toLowerCase();
  if (cv.includes('giám đốc')) return 'danger';
  if (cv.includes('kinh doanh') || cv.includes('bán hàng')) return 'success';
  if (cv.includes('kế toán')) return 'warning';
  return 'primary';
};

// --- QUẢN LÝ FORM ---
const resetForm = () => {
  if (formRef.value) formRef.value.resetFields();
  Object.assign(formData, {
    maNhanVien: null, hoTen: '', gioiTinh: 'Nam', ngaySinh: '', ngayVaoLam: '', sdt: '', email: '', diaChi: '', maChucVu: null, trangThai: true
  });
};

const openAddDialog = () => {
  isEditMode.value = false;
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (row) => {
  isEditMode.value = true;
  // Convert trangThai từ số (1/0) sang boolean (true/false) cho cái switch
  Object.assign(formData, { ...row, trangThai: row.trangThai === 1 });
  dialogVisible.value = true;
};

const tableRowClassName = ({ row }) => {
  // Nếu trạng thái là 0 (Đã nghỉ), thêm class 'inactive-row'
  if (row.trangThai === 0) {
    return 'inactive-row';
  }
  return '';
};

// --- GỌI API THÊM/SỬA NHÂN VIÊN ---
const handleSubmit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        // Format lại payload cho chuẩn Database
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
        
        loadInitialData(); // Load lại data từ Server
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
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}
:deep(.el-dialog__header) {
  background-color: #f8fafc;
  margin-right: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
:deep(.el-dialog__title) {
  font-weight: 700;
  color: #0f172a;
}
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
}
/* Tuỳ chỉnh Radio button cho đẹp hơn */
:deep(.el-radio.is-bordered) {
  border-radius: 8px;
}
:deep(.el-table .inactive-row) {
  background-color: #f1f5f9; /* Màu nền xám nhạt */
  color: #94a3b8; /* Chữ mờ đi */
}
:deep(.el-table .inactive-row img), 
:deep(.el-table .inactive-row .el-avatar) {
  filter: grayscale(100%); /* Avatar cũng xám luôn */
  opacity: 0.6;
}
</style>