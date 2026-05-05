<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Quản Lý Hãng Sản Phẩm</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Danh mục các thương hiệu laptop đang kinh doanh</p>
      </div>
      <el-button type="primary" size="large" @click="openAddModal" class="w-full md:w-auto font-bold shadow-lg shadow-blue-500/30 shrink-0">
        <el-icon class="mr-2"><Plus /></el-icon> THÊM HÃNG MỚI
      </el-button>
    </div>

    <!-- Search & Filter -->
    <div class="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
      <el-input 
        v-model="searchQuery" 
        placeholder="Tìm kiếm tên hãng..." 
        :prefix-icon="Search" 
        class="w-full sm:!w-80" 
        size="large"
        clearable
      />
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <el-table :data="paginatedData" style="width: 100%" size="large" v-loading="loading" class="min-w-[600px] custom-table">
        
        <el-table-column prop="maHang" label="Mã Hãng" width="120" align="center">
          <template #default="scope">
            <span class="font-bold text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded">H{{ scope.row.maHang }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenHang" label="Tên Hãng Sản Phẩm">
          <template #default="scope">
            <span class="font-bold text-slate-800 text-lg">{{ scope.row.tenHang }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="150" align="center">
          <template #default="scope">
            <div class="flex items-center justify-center gap-2">
              <el-button type="primary" link @click="openEditModal(scope.row)">
                <el-icon class="text-xl"><Edit /></el-icon>
              </el-button>
              <el-button type="danger" link @click="confirmDelete(scope.row)">
                <el-icon class="text-xl"><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <!-- Pagination -->
    <div class="flex flex-col sm:flex-row items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm mt-4 gap-4">
      <p class="text-sm text-slate-500 w-full sm:w-1/3 text-center sm:text-left">
        Đang hiển thị <span class="font-bold text-slate-800">{{ paginatedData.length }}</span> / {{ filteredData.length }} dòng
      </p>
      
      <div class="w-full sm:w-1/3 flex justify-center">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredData.length"
          background
          layout="prev, pager, next"
        />
      </div>

      <div class="hidden sm:block sm:w-1/3"></div>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditMode ? 'CẬP NHẬT HÃNG' : 'THÊM HÃNG SẢN PHẨM'" 
      width="450px" 
      destroy-on-close 
      class="custom-dialog"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="Tên Hãng Sản Phẩm" prop="tenHang">
          <el-input v-model="formData.tenHang" placeholder="VD: Dell, HP, Apple, ASUS..." size="large" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <el-button @click="dialogVisible = false" size="large">Hủy bỏ</el-button>
          <el-button type="primary" size="large" @click="handleSave" :loading="saving" class="px-8 font-bold">
            {{ isEditMode ? 'CẬP NHẬT' : 'THÊM MỚI' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../../services/api';

// State
const loading = ref(false);
const saving = ref(false);
const dbHangSP = ref([]);
const searchQuery = ref('');
const dialogVisible = ref(false);
const isEditMode = ref(false);
const formRef = ref(null);

const initialForm = {
  maHang: null,
  tenHang: ''
};
const formData = ref({ ...initialForm });

const rules = {
  tenHang: [{ required: true, message: 'Vui lòng nhập tên hãng', trigger: 'blur' }],
};

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

const filteredData = computed(() => {
  return dbHangSP.value.filter(item => 
    item.tenHang.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// Load data
const loadData = async () => {
  loading.value = true;
  try {
    const res = await api.get('/inventory/hangsp');
    dbHangSP.value = res.result || [];
  } catch (error) {
    ElMessage.error('Lỗi khi tải danh sách hãng sản phẩm');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

// Modal Actions
const openAddModal = () => {
  isEditMode.value = false;
  formData.value = { ...initialForm };
  if (formRef.value) formRef.value.clearValidate();
  dialogVisible.value = true;
};

const openEditModal = (row) => {
  isEditMode.value = true;
  formData.value = { ...row };
  if (formRef.value) formRef.value.clearValidate();
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        if (isEditMode.value) {
          await api.put(`/inventory/hangsp/${formData.value.maHang}`, formData.value);
          ElMessage.success('Cập nhật hãng thành công!');
        } else {
          await api.post('/inventory/hangsp', formData.value);
          ElMessage.success('Thêm hãng sản phẩm thành công!');
        }
        dialogVisible.value = false;
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu');
      } finally {
        saving.value = false;
      }
    }
  });
};

const confirmDelete = (row) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa hãng "${row.tenHang}"? Lưu ý: Chỉ xóa được nếu hãng này chưa có sản phẩm nào.`,
    'Cảnh báo xóa',
    {
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy bỏ',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await api.delete(`/inventory/hangsp/${row.maHang}`);
      ElMessage.success('Đã xóa hãng sản phẩm thành công!');
      loadData();
    } catch (error) {
      ElMessage.error(error.response?.data?.message || 'Không thể xóa hãng này (có thể do đang có sản phẩm liên kết)');
    }
  }).catch(() => {});
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 20px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }

.custom-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
}
</style>
