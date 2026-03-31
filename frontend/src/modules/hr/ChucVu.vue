<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Quản lý Chức vụ & Cấp bậc</h2>
        <p class="text-slate-500">Thiết lập chức danh, mức lương cơ sở theo giờ và phụ cấp trách nhiệm</p>
      </div>
      <el-button type="primary" size="large" @click="openModal(null)" class="font-bold shadow-md shadow-blue-500/30">
        <el-icon class="mr-2"><Plus /></el-icon> THÊM CHỨC VỤ MỚI
      </el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" v-loading="loading">
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-sm text-blue-700 font-semibold mb-1">Tổng số chức vụ</p>
          <p class="text-3xl font-black text-blue-600">{{ chucVuList.length }}</p>
        </div>
        <div class="p-3 bg-blue-100 text-blue-600 rounded-full"><el-icon class="text-3xl"><Medal /></el-icon></div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 font-semibold mb-1">Lương theo giờ trung bình</p>
          <p class="text-2xl font-bold text-slate-800">{{ formatPrice(avgHourlyRate) }} /h</p>
        </div>
        <div class="p-3 bg-slate-50 text-slate-500 rounded-full"><el-icon class="text-2xl"><Money /></el-icon></div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" v-loading="loading">
      <el-table :data="chucVuList" style="width: 100%" size="large" stripe>
        
        <el-table-column prop="maChucVu" label="ID" width="80" align="center">
          <template #default="scope">
            <span class="font-bold text-slate-400">#{{ scope.row.maChucVu }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenChucVu" label="Tên Chức Vụ" min-width="200">
          <template #default="scope">
            <span class="font-bold text-slate-800 text-base">{{ scope.row.tenChucVu }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="luongTheoGio" label="Mức Lương / Giờ" width="180" align="right">
          <template #default="scope">
            <span class="font-bold text-blue-600">{{ formatPrice(scope.row.luongTheoGio) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="phuCapTrachNhiem" label="Phụ cấp Trách nhiệm / Tháng" width="250" align="right">
          <template #default="scope">
            <span class="font-semibold text-emerald-600" v-if="scope.row.phuCapTrachNhiem > 0">
              + {{ formatPrice(scope.row.phuCapTrachNhiem) }}
            </span>
            <span class="text-slate-400 italic" v-else>Không có</span>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" align="center" fixed="right">
          <template #default="scope">
            <div class="flex justify-center gap-2">
              <el-button type="primary" link title="Chỉnh sửa" @click="openModal(scope.row)">
                <el-icon class="text-xl"><EditPen /></el-icon>
              </el-button>
              <el-button type="danger" link title="Xóa" @click="handleDelete(scope.row)">
                <el-icon class="text-xl"><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? 'CẬP NHẬT CHỨC VỤ' : 'THÊM CHỨC VỤ MỚI'" 
      width="450px"
      destroy-on-close
      class="custom-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="mt-2">
        <el-form-item label="Tên chức vụ" prop="tenChucVu">
          <el-input v-model="form.tenChucVu" placeholder="Ví dụ: Trưởng phòng Marketing" size="large" />
        </el-form-item>

        <el-form-item label="Mức lương cơ bản theo giờ (VNĐ)" prop="luongTheoGio">
          <el-input-number 
            v-model="form.luongTheoGio" 
            :min="10000" 
            :step="5000" 
            size="large" 
            class="!w-full" 
            controls-position="right" 
          />
        </el-form-item>

        <el-form-item label="Phụ cấp trách nhiệm / Tháng (Nếu có)" prop="phuCapTrachNhiem">
          <el-input-number 
            v-model="form.phuCapTrachNhiem" 
            :min="0" 
            :step="100000" 
            size="large" 
            class="!w-full" 
            controls-position="right" 
          />
        </el-form-item>
      </el-form>
      
      <div v-if="isEdit" class="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg mb-2">
        <el-icon><WarningFilled /></el-icon> Lưu ý: Mức lương mới sẽ được áp dụng cho toàn bộ nhân viên thuộc chức vụ này từ kỳ lương tiếp theo.
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <el-button @click="dialogVisible = false" size="large">Hủy bỏ</el-button>
          <el-button type="primary" @click="submitForm" :loading="saving" size="large" class="font-bold">
            {{ isEdit ? 'LƯU THAY ĐỔI' : 'TẠO MỚI' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus, EditPen, Delete, Medal, Money, WarningFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../../services/api';

// --- STATE ---
const chucVuList = ref([]);
const loading = ref(false);
const saving = ref(false);

// Modal
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);

const form = ref({
  maChucVu: null,
  tenChucVu: '',
  luongTheoGio: 30000,
  phuCapTrachNhiem: 0
});

const rules = {
  tenChucVu: [{ required: true, message: 'Vui lòng nhập tên chức vụ', trigger: 'blur' }],
  luongTheoGio: [{ required: true, message: 'Vui lòng nhập mức lương theo giờ', trigger: 'blur' }]
};

// --- COMPUTED ---
const avgHourlyRate = computed(() => {
  if (chucVuList.value.length === 0) return 0;
  const total = chucVuList.value.reduce((sum, cv) => sum + Number(cv.luongTheoGio), 0);
  return Math.round(total / chucVuList.value.length);
});

// --- METHODS TẢI DỮ LIỆU ---
const fetchChucVu = async () => {
  loading.value = true;
  try {
    const res = await api.get('/hr/chucvu');
    
    console.log("API Chức vụ trả về:", res);

    const resData = res.data || res;
    
    let dsChucVu = [];
    if (resData?.data?.data && Array.isArray(resData.data.data)) {
        dsChucVu = resData.data.data;
    } else if (resData?.data && Array.isArray(resData.data)) {
        dsChucVu = resData.data;
    } else if (Array.isArray(resData)) {
        dsChucVu = resData;
    }

    chucVuList.value = dsChucVu;
  } catch (error) {
    console.error("Lỗi lấy danh sách chức vụ:", error);
    ElMessage.error('Không tải được danh sách chức vụ');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchChucVu();
});

// --- METHODS THAO TÁC MODAL ---
const openModal = (row) => {
  if (row) {
    // Chế độ Sửa
    isEdit.value = true;
    form.value = { ...row };
  } else {
    // Chế độ Thêm mới
    isEdit.value = false;
    form.value = { maChucVu: null, tenChucVu: '', luongTheoGio: 30000, phuCapTrachNhiem: 0 };
  }
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        const payload = {
          tenChucVu: form.value.tenChucVu,
          luongTheoGio: form.value.luongTheoGio,
          phuCapTrachNhiem: form.value.phuCapTrachNhiem
        };

        if (isEdit.value) {
          await api.put(`/hr/chucvu/${form.value.maChucVu}`, payload);
          ElMessage.success('Cập nhật chức vụ thành công!');
        } else {
          await api.post('/hr/chucvu', payload);
          ElMessage.success('Thêm chức vụ mới thành công!');
        }

        dialogVisible.value = false;
        fetchChucVu(); // Tải lại danh sách
      } catch (error) {
        console.error("Lỗi lưu chức vụ:", error);
        ElMessage.error(error.response?.data?.message || 'Lỗi hệ thống khi lưu chức vụ');
      } finally {
        saving.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa chức vụ "${row.tenChucVu}" không?`,
    'Cảnh báo xóa',
    { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'danger' }
  ).then(async () => {
    try {
      const res = await api.delete(`/hr/chucvu/${row.maChucVu}`);
      const resData = res.data || res;
      if (resData.success) {
        ElMessage.success('Đã xóa chức vụ thành công');
        fetchChucVu();
      }
    } catch (error) {
      // Backend sẽ trả về lỗi nếu dính Foreign Key (Đang có nhân viên mang chức vụ này)
      ElMessage.error(error.response?.data?.message || 'Không thể xóa chức vụ này');
    }
  }).catch(() => {});
};

// --- TIỆN ÍCH ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
</style>