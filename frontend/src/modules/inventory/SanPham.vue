<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Danh mục Sản phẩm</h2>
        <p class="text-slate-500">Quản lý thông tin máy tính, cấu hình và giá bán</p>
      </div>
      <el-button type="primary" size="large" @click="openAddModal" class="font-bold shadow-lg shadow-blue-500/30">
        <el-icon class="mr-2"><Plus /></el-icon> THÊM SẢN PHẨM MỚI
      </el-button>
    </div>

    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
      <el-input 
        v-model="searchQuery" 
        placeholder="Tìm theo Mã hoặc Tên sản phẩm..." 
        :prefix-icon="Search" class="!w-80" clearable
      />
      <el-select v-model="filterHang" placeholder="Lọc theo Hãng" clearable class="!w-48">
        <el-option v-for="hang in dbHangSP" :key="hang.maHang" :label="hang.tenHang" :value="hang.maHang" />
      </el-select>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table :data="filteredProducts" style="width: 100%" size="large" v-loading="loading">

        <el-table-column label="Hình ảnh" width="90" align="center">
          <template #default="scope">
            <el-avatar shape="square" :size="50" :src="scope.row.hinhAnh" class="bg-slate-100 border border-slate-200">
              <el-icon :size="20" class="text-slate-300"><Monitor /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column prop="maSP" label="Mã SP" width="100" align="center">
          <template #default="scope">
            <span class="font-bold text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded">{{ scope.row.maSP }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenSP" label="Tên Sản Phẩm" min-width="250">
          <template #default="scope">
            <p class="font-bold text-slate-800 line-clamp-1">{{ scope.row.tenSP }}</p>
            <p class="text-xs text-slate-500 mt-1 line-clamp-1">{{ scope.row.cauHinhSP }}</p>
          </template>
        </el-table-column>
        
        <el-table-column prop="maHang" label="Hãng" width="120">
          <template #default="scope">
            <el-tag type="info" effect="plain" class="font-bold">{{ getTenHang(scope.row.maHang) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column 
          prop="moTa" 
          label="Mô tả" 
          min-width="200" 
          show-overflow-tooltip
        >
          <template #default="scope">
            <span class="text-xs text-slate-600 leading-relaxed">{{ scope.row.moTa || 'Chưa có mô tả' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Giá bán" width="150" align="right">
          <template #default="scope">
            <span class="font-bold text-blue-600">{{ formatPrice(scope.row.giaBan) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="soLuongTon" label="Tồn kho" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.soLuongTon > 0 ? 'success' : 'danger'" effect="dark" class="font-bold">{{ scope.row.soLuongTon }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Trạng thái" width="140" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.trangThai" :active-value="1" :inactive-value="0" active-text="Bán" inactive-text="Ngừng" inline-prompt style="--el-switch-on-color: #10b981; --el-switch-off-color: #ef4444" @change="toggleStatus(scope.row)"/>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="80" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditModal(scope.row)"><el-icon class="text-xl"><Edit /></el-icon></el-button>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditMode ? 'CẬP NHẬT SẢN PHẨM' : 'THÊM SẢN PHẨM MỚI'" 
      width="750px" destroy-on-close class="custom-dialog"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-position="top" class="mt-2">
        <div class="flex gap-6">
          
          <div class="w-48 flex-shrink-0 flex flex-col items-center pt-2">
            <label class="block text-sm font-semibold text-slate-600 mb-3 w-full text-center">Hình ảnh sản phẩm</label>
            
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept="image/jpeg,image/png,image/webp"
            >
              <img v-if="formData.hinhAnh" :src="formData.hinhAnh" class="avatar-preview" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <p class="text-xs text-slate-400 mt-3 text-center leading-relaxed">Chấp nhận JPG/PNG/WEBP. Tối đa 2MB.</p>
            <el-button v-if="formData.hinhAnh" type="danger" link size="small" class="mt-2" @click="formData.hinhAnh = ''">Xóa ảnh</el-button>
          </div>

          <div class="flex-1 grid grid-cols-2 gap-x-5 gap-y-1">
            
            <el-form-item v-if="isEditMode" label="Mã Sản Phẩm (ID)" prop="maSP">
              <el-input-number v-model="formData.maSP" disabled class="!w-full" controls-position="right" />
            </el-form-item>
            
            <el-form-item label="Hãng Sản Xuất" prop="maHang" :class="!isEditMode ? 'col-span-2' : ''">
              <el-select v-model="formData.maHang" placeholder="Chọn hãng" class="w-full">
                <el-option v-for="hang in dbHangSP" :key="hang.maHang" :label="hang.tenHang" :value="hang.maHang" />
              </el-select>
            </el-form-item>

            <el-form-item label="Tên Sản Phẩm" prop="tenSP" class="col-span-2">
              <el-input v-model="formData.tenSP" placeholder="VD: Dell XPS 13 Plus 9320" />
            </el-form-item>

            <el-form-item label="Cấu hình (CPU/RAM/SSD)" prop="cauHinhSP" class="col-span-2">
              <el-input v-model="formData.cauHinhSP" placeholder="VD: Core i7 12th / 16GB RAM / 512GB SSD" />
            </el-form-item>

            <el-form-item label="Giá Nhập (VND)" prop="giaNhap">
              <el-input-number v-model="formData.giaNhap" :min="0" :step="1000000" class="!w-full" controls-position="right" />
            </el-form-item>

            <el-form-item label="Giá Bán (VND)" prop="giaBan">
              <el-input-number v-model="formData.giaBan" :min="0" :step="1000000" class="!w-full" controls-position="right" />
            </el-form-item>

            <el-form-item label="Số Lượng Tồn Kho">
              <el-input-number v-model="formData.soLuongTon" class="!w-full" disabled />
            </el-form-item>

            <el-form-item label="Trạng Thái Kinh Doanh" prop="trangThai">
              <el-radio-group v-model="formData.trangThai" class="w-full !flex">
                <el-radio :label="1" border class="flex-1 !mr-0">Bán</el-radio>
                <el-radio :label="0" border class="flex-1 !mr-0">Ngừng</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="Mô tả chi tiết" prop="moTa" class="col-span-2">
              <el-input v-model="formData.moTa" type="textarea" :rows="3" placeholder="Nhập mô tả sản phẩm..." />
            </el-form-item>
          </div>
        </div>
      </el-form>
      
      <template #footer>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <el-button @click="dialogVisible = false" size="large">Hủy bỏ</el-button>
          <el-button type="primary" size="large" @click="saveProduct" :loading="saving" class="px-8 font-bold">
            {{ isEditMode ? 'LƯU THAY ĐỔI' : 'TẠO SẢN PHẨM' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search, Plus, Edit, Monitor } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// --- MOCK DATABASE (maSP là INT) ---
const dbHangSP = ref([
  { maHang: 1, tenHang: 'Apple' }, { maHang: 2, tenHang: 'Dell' }, { maHang: 3, tenHang: 'Asus' }, { maHang: 4, tenHang: 'HP' },
]);

const dbSanPham = ref([
  { 
    maSP: 1, maHang: 1, tenSP: 'MacBook Air M2 13 inch', 
    cauHinhSP: 'Apple M2 / 8GB / 256GB', moTa: 'Laptop mỏng nhẹ...', hinhAnh: '',
    soLuongTon: 15, giaNhap: 22000000, giaBan: 26490000, trangThai: 1 
  },
  { 
    maSP: 2, maHang: 2, tenSP: 'Dell XPS 13 Plus 9320', 
    cauHinhSP: 'Core i7 / 16GB / 512GB', moTa: 'Laptop doanh nhân...', hinhAnh: '',
    soLuongTon: 3, giaNhap: 38000000, giaBan: 45000000, trangThai: 1 
  },
]);

// --- STATE ---
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const filterHang = ref('');
const dialogVisible = ref(false);
const isEditMode = ref(false);
const formRef = ref(null);

const initialForm = {
  maSP: null, maHang: null, tenSP: '', moTa: '', cauHinhSP: '', 
  hinhAnh: '', soLuongTon: 0, giaNhap: 0, giaBan: 0, trangThai: 1
};
const formData = ref({ ...initialForm });

const rules = {
  maHang: [{ required: true, message: 'Vui lòng chọn Hãng', trigger: 'change' }],
  tenSP: [{ required: true, message: 'Vui lòng nhập Tên SP', trigger: 'blur' }],
  giaBan: [{ required: true, message: 'Vui lòng nhập Giá Bán', trigger: 'blur' }],
};

// --- COMPUTED (Sửa lỗi tìm kiếm với maSP là INT) ---
const filteredProducts = computed(() => {
  return dbSanPham.value.filter(sp => {
    // Ép maSP về String để dùng hàm .includes() tìm kiếm
    const matchQuery = sp.tenSP.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                       sp.maSP.toString().includes(searchQuery.value); 
    const matchHang = filterHang.value ? sp.maHang === filterHang.value : true;
    return matchQuery && matchHang;
  });
});

// --- METHODS ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const getTenHang = (maHang) => {
  const hang = dbHangSP.value.find(h => h.maHang === maHang);
  return hang ? hang.tenHang : 'Khác';
};

// XỬ LÝ CHỌN FILE ẢNH (MỚI & QUAN TRỌNG)
const handleFileChange = (uploadFile) => {
  // 1. Kiểm tra dung lượng (VD: < 2MB)
  if (uploadFile.size / 1024 / 1024 > 2) {
    ElMessage.error('Dung lượng ảnh không được vượt quá 2MB!');
    return false;
  }

  // 2. GIẢ LẬP: Vì chưa có Backend, ta chuyển file ảnh thành chuỗi Base64
  // để hiển thị ngay lập tức (Preview)
  const reader = new FileReader();
  reader.readAsDataURL(uploadFile.raw); // Đọc file vật lý
  reader.onload = () => {
    formData.value.hinhAnh = reader.result; // Chuỗi Base64 dài ngoằng sẽ được gán vào đây
    ElMessage.success('Đã tải ảnh lên thành công (Giả lập)');
  };
};

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

const toggleStatus = (row) => {
  const statusText = row.trangThai === 1 ? 'Đang kinh doanh' : 'Ngừng kinh doanh';
  ElMessage.success(`Đã chuyển trạng thái ${row.maSP} thành: ${statusText}`);
};

const saveProduct = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid) => {
    if (valid) {
      saving.value = true;
      setTimeout(() => {
        if (isEditMode.value) {
          // UPDATE
          const index = dbSanPham.value.findIndex(sp => sp.maSP === formData.value.maSP);
          if (index !== -1) dbSanPham.value[index] = { ...formData.value };
          ElMessage.success('Cập nhật thành công!');
        } else {
          // INSERT - Tạo maSP tự tăng (INT)
          const newId = dbSanPham.value.length > 0 ? Math.max(...dbSanPham.value.map(s => s.maSP)) + 1 : 1;
          formData.value.maSP = newId;
          dbSanPham.value.unshift({ ...formData.value });
          ElMessage.success('Tạo sản phẩm mới thành công!');
        }
        saving.value = false;
        dialogVisible.value = false;
      }, 600);
    }
  });
};
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }

/* CSS cho khung Upload ảnh (MỚI) */
.avatar-uploader {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 170px;
  height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.avatar-uploader:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}
.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Giữ nguyên tỷ lệ ảnh */
}
</style>

