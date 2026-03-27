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
            <p class="text-xs text-slate-500 mt-1 line-clamp-1">{{ scope.row.cauHinh }}</p>
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

            <el-form-item label="Cấu hình (CPU/RAM/SSD)" prop="cauHinh" class="col-span-2">
              <el-input v-model="formData.cauHinh" placeholder="VD: Core i7 12th / 16GB RAM / 512GB SSD" />
            </el-form-item>

            <!-- <el-form-item label="Giá Nhập (VND)" prop="giaNhap">
              <el-input-number v-model="formData.giaNhap" :min="0" :step="1000000" class="!w-full" controls-position="right" />
            </el-form-item> -->

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
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, Edit, Monitor } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api'; // Import xe chở hàng Axios

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

const rules = {
  maHang: [{ required: true, message: 'Vui lòng chọn Hãng', trigger: 'change' }],
  tenSP: [{ required: true, message: 'Vui lòng nhập Tên SP', trigger: 'blur' }],
  giaBan: [{ required: true, message: 'Vui lòng nhập Giá Bán', trigger: 'blur' }],
};

// ==========================================
// 1. TẢI DỮ LIỆU TỪ BACKEND
// ==========================================
const loadData = async () => {
  loading.value = true;
  try {
    // Kéo thêm API maytinh để lấy số lượng thực tế
    const [resHang, resSP, resMayTinh] = await Promise.all([
      api.get('/inventory/hangsp'),
      api.get('/inventory/sanpham?limit=1000'),
      api.get('/inventory/maytinh?limit=10000') 
    ]);

    dbHangSP.value = resHang.result || [];
    dbMayTinh.value = resMayTinh.data || [];
    
    const rawProducts = resSP.data || [];

    // GHI ĐÈ SỐ LƯỢNG TỒN: Bỏ qua DB, tự đếm số máy tính có trạng thái 'Trong kho'
    dbSanPham.value = rawProducts.map(sp => {
      const realCount = dbMayTinh.value.filter(mt => 
        Number(mt.maSP) === Number(sp.maSP) && 
        mt.trangThai && 
        mt.trangThai.toString().trim() === 'Trong kho'
      ).length;

      return {
        ...sp,
        soLuongTon: realCount // Ép số lượng tồn hiển thị bằng đúng số đếm thực tế
      };
    });

  } catch (error) {
    ElMessage.error('Không thể tải dữ liệu từ máy chủ!');
    console.error("Lỗi tải dữ liệu:", error);
  } finally {
    loading.value = false;
  }
};

// Chạy hàm loadData ngay khi mở trang
onMounted(() => {
  loadData();
});

// ==========================================
// 2. TÍNH TOÁN & TÌM KIẾM
// ==========================================
const filteredProducts = computed(() => {
  return dbSanPham.value.filter(sp => {
    // Đảm bảo maSP không bị null/undefined khi gõ tìm kiếm
    const maSanPham = sp.maSP ? sp.maSP.toString() : '';
    const tenSanPham = sp.tenSP ? sp.tenSP.toLowerCase() : '';
    const keyword = searchQuery.value.toLowerCase();

    const matchQuery = tenSanPham.includes(keyword) || maSanPham.includes(keyword); 
    const matchHang = filterHang.value ? sp.maHang === filterHang.value : true;
    
    return matchQuery && matchHang;
  });
});

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const getTenHang = (maHang) => {
  const hang = dbHangSP.value.find(h => h.maHang === maHang);
  return hang ? hang.tenHang : 'Khác';
};

// ==========================================
// 3. XỬ LÝ ẢNH BASE64 (Dành cho việc lưu db tạm)
// ==========================================
const handleFileChange = (uploadFile) => {
  if (uploadFile.size / 1024 / 1024 > 2) {
    ElMessage.error('Dung lượng ảnh không được vượt quá 2MB!');
    return false;
  }
  const reader = new FileReader();
  reader.readAsDataURL(uploadFile.raw);
  reader.onload = () => {
    formData.value.hinhAnh = reader.result;
    ElMessage.success('Tải ảnh lên thành công!');
  };
};

// ==========================================
// 4. MỞ DIALOG THÊM / SỬA
// ==========================================
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

// ==========================================
// 5. GỌI API THÊM / SỬA / CẬP NHẬT TRẠNG THÁI
// ==========================================
const saveProduct = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        if (isEditMode.value) {
          // GỌI API PUT (CẬP NHẬT)
          await api.put(`/inventory/sanpham/${formData.value.maSP}`, formData.value);
          ElMessage.success('Cập nhật sản phẩm thành công!');
        } else {
          // GỌI API POST (THÊM MỚI)
          await api.post('/inventory/sanpham', formData.value);
          ElMessage.success('Tạo sản phẩm mới thành công!');
        }
        dialogVisible.value = false;
        
        // Cập nhật xong thì tải lại dữ liệu mới nhất từ CSDL
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
    // Sửa lại payload cho chuẩn 100% với Database
    const payload = {
      maHang: row.maHang,
      tenSP: row.tenSP,
      cauHinh: row.cauHinh, // <-- Đã sửa thành row.cauHinh
      moTa: row.moTa,
      hinhAnh: row.hinhAnh,
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