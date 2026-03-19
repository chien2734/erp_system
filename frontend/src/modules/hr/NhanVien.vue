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
      <el-table :data="filteredEmployees" v-loading="hrStore.loading" style="width: 100%" size="large">
        
        <el-table-column prop="maNV" label="Mã NV" width="100" fixed="left">
          <template #default="scope">
            <span class="font-bold text-blue-600">{{ scope.row.maNV || 'Đang chờ' }}</span>
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
                  <el-icon><Phone /></el-icon> {{ scope.row.soDienThoai }}
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

        <el-table-column prop="phongBan" label="Phòng ban" min-width="160">
          <template #default="scope">
            <el-tag :type="getDepartmentTag(scope.row.phongBan)" effect="light" round>
              {{ scope.row.phongBan }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="chucVu" label="Chức vụ" min-width="140" />
        
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
            <el-button :icon="Delete" circle size="small" type="danger" plain @click="handleDelete(scope.row)" />
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
          :title="`Mã Nhân Viên: ${formData.maNV}`" 
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

          <el-form-item label="Số điện thoại" prop="soDienThoai">
            <el-input v-model="formData.soDienThoai" placeholder="VD: 0901234567" :prefix-icon="Phone" />
          </el-form-item>

          <el-form-item label="Email cá nhân/Công việc" prop="email">
            <el-input v-model="formData.email" placeholder="VD: nguyenvan@laptop.com" :prefix-icon="Message" />
          </el-form-item>

          <el-form-item label="Phòng ban" prop="phongBan">
            <el-select v-model="formData.phongBan" placeholder="Chọn phòng ban" class="w-full">
              <el-option label="Ban Giám Đốc" value="Ban Giám Đốc" />
              <el-option label="Kinh doanh" value="Kinh doanh" />
              <el-option label="Tài chính - Kế toán" value="Tài chính - Kế toán" />
              <el-option label="Kỹ thuật & Bảo hành" value="Kỹ thuật & Bảo hành" />
            </el-select>
          </el-form-item>

          <el-form-item label="Chức vụ" prop="chucVu">
            <el-select v-model="formData.chucVu" placeholder="Chọn chức vụ" class="w-full">
              <el-option label="Giám đốc" value="Giám đốc" />
              <el-option label="Trưởng phòng" value="Trưởng phòng" />
              <el-option label="Nhân viên" value="Nhân viên" />
              <el-option label="Thực tập sinh" value="Thực tập sinh" />
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
import { useHrStore } from './hr.store';
import { Search, Plus, Edit, Delete, User, Phone, Message, Male, Female } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';

const hrStore = useHrStore();
const searchQuery = ref('');

// Trạng thái Dialog
const dialogVisible = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const formRef = ref(null);

// Dữ liệu Form cập nhật thêm các trường mới
const formData = reactive({
  id: null,
  maNV: '',
  hoTen: '',
  gioiTinh: 'Nam', // Giá trị mặc định
  ngayVaoLam: '',
  soDienThoai: '',
  email: '',
  diaChi: '',
  phongBan: '',
  chucVu: '',
  trangThai: true
});

// Rules Validate
const rules = reactive({
  hoTen: [{ required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' }],
  gioiTinh: [{ required: true, message: 'Vui lòng chọn giới tính', trigger: 'change' }],
  ngayVaoLam: [{ required: true, message: 'Vui lòng chọn ngày vào làm', trigger: 'change' }],
  soDienThoai: [
    { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' },
    { pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: 'SĐT không hợp lệ', trigger: 'blur' }
  ],
  phongBan: [{ required: true, message: 'Vui lòng chọn phòng ban', trigger: 'change' }],
  chucVu: [{ required: true, message: 'Vui lòng chọn chức vụ', trigger: 'change' }]
});

// Fetch dữ liệu
onMounted(() => {
  hrStore.fetchEmployees();
});

// Lọc dữ liệu tìm kiếm (Tìm theo Tên, SĐT hoặc Mã NV)
const filteredEmployees = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return hrStore.employees.filter(emp => 
    emp.hoTen?.toLowerCase().includes(query) ||
    emp.soDienThoai?.includes(query) ||
    emp.maNV?.toLowerCase().includes(query)
  );
});

// Format hiển thị Ngày
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa cập nhật';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

// Helper: Màu sắc cho Tag Phòng ban
const getDepartmentTag = (dept) => {
  const map = {
    'Ban Giám Đốc': 'danger',
    'Kinh doanh': 'success',
    'Tài chính - Kế toán': 'warning',
    'Kỹ thuật & Bảo hành': 'info'
  };
  return map[dept] || 'primary';
};

// Reset Form
const resetForm = () => {
  if (formRef.value) formRef.value.resetFields();
  Object.assign(formData, {
    id: null, maNV: '', hoTen: '', gioiTinh: 'Nam', ngayVaoLam: '', soDienThoai: '', email: '', diaChi: '', phongBan: '', chucVu: '', trangThai: true
  });
};

// Mở Dialog Thêm mới
const openAddDialog = () => {
  isEditMode.value = false;
  resetForm();
  dialogVisible.value = true;
};

// Mở Dialog Chỉnh sửa
const openEditDialog = (row) => {
  isEditMode.value = true;
  Object.assign(formData, { ...row });
  dialogVisible.value = true;
};

// Xử lý Submit Form
const handleSubmit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        ElMessage.success(isEditMode.value ? 'Cập nhật thành công!' : 'Đã thêm nhân viên mới!');
        
        // Mô phỏng Backend tự tạo Mã NV khi thêm mới
        if (!isEditMode.value) {
          const fakeMaNV = Math.floor(1000 + Math.random() * 9000);
          hrStore.employees.unshift({ ...formData, id: Date.now(), maNV: fakeMaNV });
        } else {
          // Logic update cho Store (Tạm thời)
          const index = hrStore.employees.findIndex(e => e.id === formData.id);
          if(index !== -1) hrStore.employees[index] = { ...formData };
        }
        
        dialogVisible.value = false;
      } catch (error) {
        ElMessage.error('Có lỗi xảy ra!');
      } finally {
        isSubmitting.value = false;
      }
    }
  });
};

// Xóa nhân viên
const handleDelete = (row) => {
  ElMessageBox.confirm(`Xóa nhân viên <b class="text-red-500">${row.hoTen} (${row.maNV})</b>?`, 'Cảnh báo', {
    confirmButtonText: 'Xóa nhân viên',
    cancelButtonText: 'Hủy bỏ',
    type: 'warning',
    dangerouslyUseHTMLString: true,
  }).then(() => {
    hrStore.employees = hrStore.employees.filter(e => e.id !== row.id);
    ElMessage.success('Đã xóa thành công');
  }).catch(() => {});
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
</style>