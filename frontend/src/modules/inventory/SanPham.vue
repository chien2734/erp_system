<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Danh mục Sản phẩm</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Quản lý thông tin máy tính, cấu hình và giá bán</p>
      </div>
      <el-button type="primary" size="large" @click="openAddModal" class="w-full md:w-auto font-bold shadow-lg shadow-blue-500/30 shrink-0">
        <el-icon class="mr-2"><Plus /></el-icon> THÊM SẢN PHẨM
      </el-button>
    </div>

    <div class="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
      <el-input 
        v-model="searchQuery" 
        placeholder="Tìm theo Mã hoặc Tên sản phẩm..." 
        :prefix-icon="Search" 
        class="w-full sm:!w-80" 
        size="large"
        clearable
      />
      <el-select v-model="filterHang" placeholder="Lọc theo Hãng" clearable class="w-full sm:!w-48" size="large">
        <el-option v-for="hang in dbHangSP" :key="hang.maHang" :label="hang.tenHang" :value="hang.maHang" />
      </el-select>
    </div>

    <div class="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <el-table :data="paginatedData" style="width: 100%" size="large" v-loading="loading" class="min-w-[900px]">

        <el-table-column label="Hình ảnh" width="90" align="center" fixed="left">
          <template #default="scope">
            <el-avatar shape="square" :size="50" :src="getImageUrl(scope.row.hinhAnh)" class="bg-slate-100 border border-slate-200">
              <el-icon :size="20" class="text-slate-300"><Monitor /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column prop="maSP" label="Mã SP" width="100" align="center" fixed="left">
          <template #default="scope">
            <span class="font-bold text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded whitespace-nowrap">SP{{ scope.row.maSP }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tenSP" label="Tên Sản Phẩm" min-width="250">
          <template #default="scope">
            <p class="font-bold text-slate-800 line-clamp-1" :title="scope.row.tenSP">{{ scope.row.tenSP }}</p>
            <p class="text-xs text-slate-500 mt-1 line-clamp-1" :title="scope.row.cauHinh">{{ scope.row.cauHinh }}</p>
          </template>
        </el-table-column>
        
        <el-table-column prop="maHang" label="Hãng" width="120">
          <template #default="scope">
            <el-tag type="info" effect="plain" class="font-bold whitespace-nowrap">{{ getTenHang(scope.row.maHang) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="moTa" label="Mô tả" min-width="200">
          <template #default="scope">
            <span class="text-xs text-slate-600 leading-relaxed line-clamp-2" :title="scope.row.moTa">{{ scope.row.moTa || 'Chưa có mô tả' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Giá bán" width="140" align="right">
          <template #default="scope">
            <span class="font-bold text-blue-600 whitespace-nowrap">{{ formatPrice(scope.row.giaBan) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="soLuongTon" label="Tồn kho" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.soLuongTon > 0 ? 'success' : 'danger'" effect="dark" class="font-bold border-none">{{ scope.row.soLuongTon }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="trangThai" label="Kinh doanh" width="100" align="center">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.trangThai" 
              :active-value="1" 
              :inactive-value="0" 
              style="--el-switch-on-color: #10b981; --el-switch-off-color: #ef4444" 
              @change="toggleStatus(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="80" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditModal(scope.row)"><el-icon class="text-xl"><Edit /></el-icon></el-button>
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
      :title="isEditMode ? 'CẬP NHẬT SẢN PHẨM' : 'THÊM SẢN PHẨM MỚI'" 
      width="750px" 
      destroy-on-close 
      class="custom-dialog responsive-dialog"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-position="top" class="mt-2">
        <div class="flex flex-col md:flex-row gap-4 md:gap-6">
          
          <div class="w-full md:w-48 flex-shrink-0 flex flex-col items-center pt-2 bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border border-slate-100 md:border-0 mb-2 md:mb-0">
            <label class="block text-sm font-semibold text-slate-600 mb-3 w-full text-center">Hình ảnh sản phẩm</label>
            
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept="image/jpeg,image/png,image/webp"
            >
              <img v-if="formData.hinhAnh" :src="getImageUrl(formData.hinhAnh)" class="avatar-preview" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <p class="text-[11px] md:text-xs text-slate-400 mt-3 text-center leading-relaxed">Chấp nhận JPG/PNG/WEBP.<br class="hidden md:block">Tối đa 2MB.</p>
            <el-button v-if="formData.hinhAnh" type="danger" link size="small" class="mt-2" @click="formData.hinhAnh = ''">Xóa ảnh</el-button>
          </div>

          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1">
            
            <el-form-item v-if="isEditMode" label="Mã Sản Phẩm (ID)" prop="maSP">
              <el-input-number v-model="formData.maSP" disabled class="!w-full" controls-position="right" size="large" />
            </el-form-item>
            
            <el-form-item label="Hãng Sản Xuất" prop="maHang" :class="!isEditMode ? 'col-span-1 sm:col-span-2' : ''">
              <el-select v-model="formData.maHang" placeholder="Chọn hãng" class="w-full" size="large">
                <el-option v-for="hang in dbHangSP" :key="hang.maHang" :label="hang.tenHang" :value="hang.maHang" />
              </el-select>
            </el-form-item>

            <el-form-item label="Tên Sản Phẩm" prop="tenSP" class="col-span-1 sm:col-span-2">
              <el-input v-model="formData.tenSP" placeholder="VD: Dell XPS 13 Plus 9320" size="large" />
            </el-form-item>

            <el-form-item label="Cấu hình (CPU/RAM/SSD)" prop="cauHinh" class="col-span-1 sm:col-span-2">
              <el-input v-model="formData.cauHinh" placeholder="VD: Core i7 12th / 16GB RAM / 512GB SSD" size="large" />
            </el-form-item>

            <el-form-item label="Giá Bán (VND)" prop="giaBan">
              <el-input-number v-model="formData.giaBan" :min="0" :step="1000000" class="!w-full" controls-position="right" size="large" />
            </el-form-item>

            <el-form-item label="Số Lượng Tồn Kho">
              <el-input-number v-model="formData.soLuongTon" class="!w-full" disabled size="large" />
            </el-form-item>

            <el-form-item label="Trạng Thái Kinh Doanh" prop="trangThai" class="col-span-1 sm:col-span-2">
              <el-radio-group v-model="formData.trangThai" class="w-full !flex">
                <el-radio :label="1" border class="flex-1 !mr-0">Bán</el-radio>
                <el-radio :label="0" border class="flex-1 !mr-0">Ngừng</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="Mô tả chi tiết" prop="moTa" class="col-span-1 sm:col-span-2 mb-0">
              <el-input v-model="formData.moTa" type="textarea" :rows="3" placeholder="Nhập mô tả sản phẩm..." />
            </el-form-item>
          </div>
        </div>
      </el-form>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t border-slate-100">
          <el-button @click="dialogVisible = false" size="large" class="w-full sm:w-32">Hủy bỏ</el-button>
          <el-button type="primary" size="large" @click="saveProduct" :loading="saving" class="w-full sm:w-auto px-8 font-bold m-0">
            {{ isEditMode ? 'LƯU THAY ĐỔI' : 'TẠO SẢN PHẨM' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, Edit, Monitor } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api'; 
import { usePagination } from '../../composables/usePagination';

// --- STATE: DỮ LIỆU TỪ API ---
const dbHangSP = ref([]);
const dbSanPham = ref([]);
const dbMayTinh = ref([]);

// --- STATE: UI & FORM ---
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const filterHang = ref('');
const dialogVisible = ref(false);
const isEditMode = ref(false);
const formRef = ref(null);

const initialForm = {
  maSP: null, maHang: null, tenSP: '', moTa: '', cauHinh: '', 
  hinhAnh: '', soLuongTon: 0, giaNhap: 0, giaBan: 0, trangThai: 1
};
const formData = ref({ ...initialForm });
const selectedFile = ref(null); // Biến chứa file ảnh thật để gửi lên Server

const rules = {
  maHang: [{ required: true, message: 'Vui lòng chọn Hãng', trigger: 'change' }],
  tenSP: [{ required: true, message: 'Vui lòng nhập Tên SP', trigger: 'blur' }],
  giaBan: [{ required: true, message: 'Vui lòng nhập Giá Bán', trigger: 'blur' }],
};

const loadData = async () => {
  loading.value = true;
  try {
    const [resHang, resSP, resMayTinh] = await Promise.all([
      api.get('/inventory/hangsp'),
      api.get('/inventory/sanpham?limit=1000'),
      api.get('/inventory/maytinh?limit=10000') 
    ]);

    dbHangSP.value = resHang.result || [];
    dbMayTinh.value = resMayTinh.data || [];
    
    const rawProducts = resSP.data || [];

    dbSanPham.value = rawProducts.map(sp => {
      const realCount = dbMayTinh.value.filter(mt => 
        Number(mt.maSP) === Number(sp.maSP) && mt.trangThai === 'Trong kho'
      ).length;

      return { ...sp, soLuongTon: realCount };
    });

  } catch (error) {
    ElMessage.error('Không thể tải dữ liệu!');
  } finally {
    loading.value = false;
  }
};

onMounted(() => { loadData(); });

const filteredProducts = computed(() => {
  return dbSanPham.value.filter(sp => {
    const maSanPham = sp.maSP ? sp.maSP.toString() : '';
    const tenSanPham = sp.tenSP ? sp.tenSP.toLowerCase() : '';
    const keyword = searchQuery.value.toLowerCase();

    const matchQuery = tenSanPham.includes(keyword) || maSanPham.includes(keyword); 
    const matchHang = filterHang.value ? sp.maHang === filterHang.value : true;
    return matchQuery && matchHang;
  });
});

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(filteredProducts, 10);

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const getTenHang = (maHang) => {
  const hang = dbHangSP.value.find(h => h.maHang === maHang);
  return hang ? hang.tenHang : 'Khác';
};

// ==========================================
// 3. XỬ LÝ LỰA CHỌN FILE ẢNH
// ==========================================
const handleFileChange = (uploadFile) => {
  if (uploadFile.size / 1024 / 1024 > 2) {
    ElMessage.error('Dung lượng ảnh không được vượt quá 2MB!');
    return false;
  }
  
  selectedFile.value = uploadFile.raw; // Lưu file gốc để tí nữa gửi API

  // Tạo URL tạm thời để hiển thị Preview trên màn hình ngay lập tức
  formData.value.hinhAnh = URL.createObjectURL(uploadFile.raw);
};

// ==========================================
// 4. MỞ DIALOG THÊM / SỬA
// ==========================================
const openAddModal = () => {
  isEditMode.value = false;
  formData.value = { ...initialForm };
  selectedFile.value = null; // Xóa file cũ
  if (formRef.value) formRef.value.clearValidate();
  dialogVisible.value = true;
};

const openEditModal = (row) => {
  isEditMode.value = true;
  formData.value = { ...row };
  selectedFile.value = null; // Reset file
  if (formRef.value) formRef.value.clearValidate();
  dialogVisible.value = true;
};

// ==========================================
// 5. LƯU SẢN PHẨM (DÙNG FORMDATA ĐỂ CHỨA FILE)
// ==========================================

// Lấy link API từ cấu hình
const BASE_API_URL = api.defaults.baseURL.replace('/api/v1', '');

// Ảnh mặc định khi sản phẩm chưa có hình hoặc link bị hỏng
const DEFAULT_IMAGE = 'https://play-lh.googleusercontent.com/Od_uEStv5JnUgzNuWd1ljzyavnP_eaET5XDOtDpfUXG5qHp7xoFsa5B0l0sBnSQfZnc=w480-h960-rw';

const getImageUrl = (path) => {
  // 1. Nếu path rỗng, null hoặc undefined -> Trả về ảnh mặc định
  if (!path || path === '' || path === 'null') return DEFAULT_IMAGE; 

  // 2. Thêm điều kiện nhận diện link 'blob:' (Preview) và 'data:' (Base64)
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path; 
  }

  // 3. Nếu là link tương đối (ảnh local cũ /uploads/...) -> Nối với domain Backend
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_API_URL}${safePath}`; 
};

const saveProduct = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        // Tạo đối tượng FormData để chứa cả text và file
        const payload = new FormData();
        payload.append('maHang', formData.value.maHang);
        payload.append('tenSP', formData.value.tenSP);
        payload.append('cauHinh', formData.value.cauHinh || '');
        payload.append('moTa', formData.value.moTa || '');
        payload.append('giaBan', formData.value.giaBan || 0);
        payload.append('trangThai', formData.value.trangThai);
        
        // Nếu có chọn ảnh mới thì nhét file vào
        if (selectedFile.value) {
            payload.append('hinhAnhFile', selectedFile.value);
        } else {
            // Nếu không chọn ảnh mới, gửi lại link ảnh cũ (để không bị mất ảnh khi sửa tên)
            payload.append('hinhAnh', formData.value.hinhAnh || '');
        }

        // Khai báo Header cho Axios biết đây là upload file
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };

        if (isEditMode.value) {
          await api.put(`/inventory/sanpham/${formData.value.maSP}`, payload, config);
          ElMessage.success('Cập nhật sản phẩm thành công!');
        } else {
          await api.post('/inventory/sanpham', payload, config);
          ElMessage.success('Tạo sản phẩm mới thành công!');
        }
        
        dialogVisible.value = false;
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Lỗi khi lưu sản phẩm!');
      } finally {
        saving.value = false;
      }
    }
  });
};

const toggleStatus = async (row) => {
  const previousStatus = row.trangThai === 1 ? 0 : 1; 
  try {
    const payload = {
      maHang: row.maHang,
      tenSP: row.tenSP,
      cauHinh: row.cauHinh, 
      moTa: row.moTa,
      hinhAnh: row.hinhAnh, // Trạng thái cập nhật nhanh không cần gửi file, chỉ gửi link cũ
      giaBan: row.giaBan || 0,
      trangThai: row.trangThai
    };

    await api.put(`/inventory/sanpham/${row.maSP}`, payload);
    const statusText = row.trangThai === 1 ? 'Đang kinh doanh' : 'Ngừng kinh doanh';
    ElMessage.success(`Cập nhật trạng thái thành: ${statusText}`);
    
  } catch (error) {
    row.trangThai = previousStatus; 
    ElMessage.error('Lỗi Server: Không thể lưu trạng thái!');
  }
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

/* CSS cho khung Upload ảnh */
.avatar-uploader {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  background-color: white;
}
@media (min-width: 768px) {
  .avatar-uploader { width: 170px; height: 170px; }
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