<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Nhà Cung Cấp</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Quản lý đối tác và nguồn cung ứng sản phẩm</p>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
        <el-input 
          v-model="searchQuery" 
          placeholder="Tìm tên NCC, SĐT..." 
          :prefix-icon="Search"
          class="w-full sm:!w-64 md:!w-72"
          size="large"
          clearable
        />
        <el-button 
          v-if="authStore.hasPermission(CHUCNANG.SAN_PHAM, 'quyenThem')"
          type="primary" 
          :icon="Plus" 
          size="large"
          class="!rounded-lg font-bold w-full sm:w-auto shadow-lg shadow-blue-500/30 shrink-0 m-0" 
          @click="openAddDialog"
        >
          Thêm đối tác
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <el-table :data="filteredSuppliers" v-loading="loading" style="width: 100%" size="large" stripe border class="min-w-[800px]">
        
        <el-table-column prop="maNCC" label="Mã NCC" width="90" align="center" fixed="left">
          <template #default="scope">
            <span class="font-bold text-blue-600 whitespace-nowrap">NCC{{ scope.row.maNCC }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenNCC" label="Tên Nhà Cung Cấp" min-width="200" fixed="left">
          <template #default="scope">
            <span class="font-bold text-slate-800 line-clamp-2" :title="scope.row.tenNCC">{{ scope.row.tenNCC }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="sdt" label="Số điện thoại" min-width="140">
          <template #default="scope">
            <div class="flex items-center gap-2 text-slate-600 whitespace-nowrap">
              <el-icon><Phone /></el-icon> <span class="font-medium">{{ scope.row.sdt || '---' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="Email" min-width="180">
          <template #default="scope">
            <div class="flex items-center gap-2 text-slate-600 truncate" :title="scope.row.email">
              <el-icon><Message /></el-icon> <span class="truncate">{{ scope.row.email || '---' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="diaChi" label="Địa chỉ" min-width="220">
          <template #default="scope">
            <span class="text-xs md:text-sm text-slate-600 line-clamp-2" :title="scope.row.diaChi">{{ scope.row.diaChi || '---' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" width="130" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.trangThai === 1 ? 'success' : 'danger'" effect="plain" round class="font-bold border-none whitespace-nowrap">
              {{ scope.row.trangThai === 1 ? 'Đang hợp tác' : 'Ngừng cung cấp' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              link 
              @click="openEditDialog(scope.row)"
              :disabled="!authStore.hasPermission(CHUCNANG.SAN_PHAM, 'quyenSua')"
            >
              <el-icon class="text-xl"><EditPen /></el-icon>
            </el-button>

            <el-button 
              type="danger" 
              link 
              @click="handleDelete(scope.row)"
              :disabled="!authStore.hasPermission(CHUCNANG.SAN_PHAM, 'quyenXoa')"
            >
              <el-icon class="text-xl"><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditMode ? 'Cập nhật Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'" 
      width="500px"
      destroy-on-close
      class="custom-dialog responsive-dialog"
    >
        <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
            <el-form-item label="Tên nhà cung cấp / Doanh nghiệp" prop="tenNCC">
                <el-input v-model="formData.tenNCC" placeholder="VD: Công ty TNHH Laptop ABC" size="large" />
            </el-form-item>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-4">
                <el-form-item label="Số điện thoại" prop="sdt">
                    <el-input v-model="formData.sdt" placeholder="SĐT liên hệ" size="large" />
                </el-form-item>

                <el-form-item label="Email" prop="email">
                    <el-input v-model="formData.email" placeholder="Email liên hệ" size="large" />
                </el-form-item>
            </div>

            <el-form-item label="Địa chỉ" prop="diaChi">
                <el-input v-model="formData.diaChi" type="textarea" :rows="3" placeholder="Địa chỉ chi tiết..." />
            </el-form-item>

            <el-form-item label="Trạng thái hợp tác" class="mt-2 border-t border-slate-100 pt-4 mb-0" v-if="isEditMode">
                <el-switch 
                    v-model="formData.trangThai" 
                    :active-value="1"
                    :inactive-value="0"
                    active-text="Đang hợp tác" 
                    inactive-text="Ngừng cung cấp"
                    inline-prompt
                    size="large"
                    style="--el-switch-on-color: #10b981; --el-switch-off-color: #ef4444"
                />
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="flex flex-col sm:flex-row justify-end gap-2 md:gap-3">
                <el-button @click="dialogVisible = false" size="large" class="w-full sm:w-auto">Hủy bỏ</el-button>
                <el-button type="primary" @click="handleSubmit(formRef)" :loading="isSubmitting" size="large" class="font-bold w-full sm:w-auto m-0">
                    LƯU THÔNG TIN
                </el-button>
            </div>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Search, Plus, EditPen, Delete, Phone, Message } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../../services/api';
import { useAuthStore } from '../auth/auth.store';
import { CHUCNANG } from '../../utils/constants';

const authStore = useAuthStore();

// --- STATE ---
const suppliers = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const dialogVisible = ref(false);
const isEditMode = ref(false);
const isSubmitting = ref(false);
const formRef = ref(null);

const formData = reactive({ 
  maNCC: null, 
  tenNCC: '', 
  sdt: '', 
  diaChi: '', 
  email: '',
  trangThai: 1 // Mặc định là 1 (Đang hợp tác)
});

const rules = reactive({
  tenNCC: [{ required: true, message: 'Tên nhà cung cấp không được để trống', trigger: 'blur' }]
});

// --- LẤY DỮ LIỆU ---
// GIẢ SỬ BASE ROUTE CỦA BẠN LÀ /inventory/ncc
const fetchSuppliers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/inventory/ncc'); // 👉 Điều chỉnh lại prefix nếu file backend của bạn đặt khác
    suppliers.value = res.data?.data || res.data || [];
  } catch (error) {
    ElMessage.error('Lỗi tải danh sách nhà cung cấp');
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchSuppliers());

// --- LỌC ---
const filteredSuppliers = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return suppliers.value.filter(s => 
    s.tenNCC?.toLowerCase().includes(query) || s.sdt?.includes(query)
  );
});

// --- HÀNH ĐỘNG ---
const openAddDialog = () => {
  isEditMode.value = false;
  if (formRef.value) formRef.value.resetFields();
  Object.assign(formData, { maNCC: null, tenNCC: '', sdt: '', diaChi: '', email: '', trangThai: 1 });
  dialogVisible.value = true;
};

const openEditDialog = (row) => {
  isEditMode.value = true;
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleSubmit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      try {
        if (isEditMode.value) {
          await api.put(`/inventory/ncc/${formData.maNCC}`, formData);
          ElMessage.success('Cập nhật thành công!');
        } else {
          await api.post('/inventory/ncc', formData);
          ElMessage.success('Thêm nhà cung cấp thành công!');
        }
        dialogVisible.value = false;
        fetchSuppliers();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra!');
      } finally {
        isSubmitting.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa nhà cung cấp "${row.tenNCC}" không?`,
    'Xác nhận xóa',
    { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'danger' }
  ).then(async () => {
    try {
      await api.delete(`/inventory/ncc/${row.maNCC}`);
      ElMessage.success('Đã xóa thành công!');
      fetchSuppliers();
    } catch (error) {
      ElMessage.error('Lỗi khi xóa nhà cung cấp!');
    }
  }).catch(() => {});
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) { :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; } }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }

/* Bóp Dialog tự động trên Mobile */
:deep(.responsive-dialog) { max-width: 95vw !important; }

/* Tùy chỉnh Scrollbar cho bảng mượt mà hơn */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.overflow-x-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>