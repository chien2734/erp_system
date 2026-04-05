<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Nhà Cung Cấp</h2>
        <p class="text-slate-500">Quản lý đối tác và nguồn cung ứng sản phẩm</p>
      </div>
      <div class="flex gap-3">
        <el-input 
          v-model="searchQuery" 
          placeholder="Tìm tên NCC, SĐT..." 
          :prefix-icon="Search"
          class="!w-72"
          clearable
        />
        <el-button 
          v-if="authStore.hasPermission(CHUCNANG.SAN_PHAM, 'quyenThem')"
          type="primary" 
          :icon="Plus" 
          class="!rounded-lg font-semibold" 
          @click="openAddDialog"
        >
          Thêm đối tác
        </el-button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredSuppliers" v-loading="loading" style="width: 100%" size="large" stripe border>
        
        <el-table-column prop="maNCC" label="Mã NCC" width="100" align="center">
          <template #default="scope">
            <span class="font-bold text-blue-600">NCC{{ scope.row.maNCC }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenNCC" label="Tên Nhà Cung Cấp" min-width="220" fixed="left">
          <template #default="scope">
            <span class="font-bold text-slate-800">{{ scope.row.tenNCC }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="sdt" label="Số điện thoại" width="150">
          <template #default="scope">
            <div class="flex items-center gap-2 text-slate-600">
              <el-icon><Phone /></el-icon> {{ scope.row.sdt || '---' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="Email" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <div class="flex items-center gap-2 text-slate-600">
              <el-icon><Message /></el-icon> {{ scope.row.email || '---' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="diaChi" label="Địa chỉ" min-width="250" show-overflow-tooltip />

        <el-table-column prop="trangThai" label="Trạng thái" width="150" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.trangThai === 1 ? 'success' : 'danger'" effect="plain" round class="font-bold">
              {{ scope.row.trangThai === 1 ? 'Đang hợp tác' : 'Ngừng cung cấp' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
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
      class="custom-dialog"
    >
        <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
            <el-form-item label="Tên nhà cung cấp / Doanh nghiệp" prop="tenNCC">
                <el-input v-model="formData.tenNCC" placeholder="VD: Công ty TNHH Laptop ABC" />
            </el-form-item>

            <div class="grid grid-cols-2 gap-4">
                <el-form-item label="Số điện thoại" prop="sdt">
                    <el-input v-model="formData.sdt" placeholder="SĐT liên hệ" />
                </el-form-item>

                <el-form-item label="Email" prop="email">
                    <el-input v-model="formData.email" placeholder="Email liên hệ" />
                </el-form-item>
            </div>

            <el-form-item label="Địa chỉ" prop="diaChi">
                <el-input v-model="formData.diaChi" type="textarea" :rows="2" placeholder="Địa chỉ chi tiết..." />
            </el-form-item>

            <el-form-item label="Trạng thái hợp tác" class="mt-2 border-t pt-4" v-if="isEditMode">
                <el-switch 
                    v-model="formData.trangThai" 
                    :active-value="1"
                    :inactive-value="0"
                    active-text="Đang hợp tác" 
                    inactive-text="Ngừng cung cấp"
                    inline-prompt
                    style="--el-switch-on-color: #10b981; --el-switch-off-color: #ef4444"
                />
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="flex justify-end gap-3">
                <el-button @click="dialogVisible = false">Hủy</el-button>
                <el-button type="primary" @click="handleSubmit(formRef)" :loading="isSubmitting" class="font-bold">
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
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
</style>