<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto p-2 sm:p-4 md:p-0" v-loading="loadingData">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900">Quản Lý Tài khoản & Phân Quyền</h2>
        <p class="text-xs md:text-sm text-slate-500 mt-1">Cấp quyền truy cập hệ thống và thiết lập vai trò (Role) cho nhân viên</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="bg-white p-2 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 custom-tabs">
      
      <el-tab-pane label="TÀI KHOẢN NHÂN VIÊN" name="accounts">
        <div class="p-2 md:p-4">
          
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            
            <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
              <el-input v-model="searchAccount" placeholder="Tìm Username hoặc Tên NV..." class="w-full sm:!w-64" size="large" clearable>
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              
              <el-select v-model="filterRole" placeholder="Lọc theo Nhóm quyền" class="w-full sm:!w-48" size="large" clearable>
                <el-option label="Tất cả quyền" value="" />
                <el-option v-for="role in rolesList" :key="role.maNhomQuyen" :label="role.tenNhomQuyen" :value="role.maNhomQuyen" />
              </el-select>
            </div>

            <el-button type="primary" @click="openAddAccount" class="w-full sm:w-auto font-bold shrink-0" size="large">
              <el-icon class="mr-2"><Plus /></el-icon> CẤP TÀI KHOẢN MỚI
            </el-button>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <el-table :data="paginatedData" style="width: 100%" size="large" border stripe class="min-w-[850px]">
              <el-table-column label="Nhân viên" min-width="220" fixed="left">
                <template #default="scope">
                  <div class="flex items-center gap-3">
                    <el-avatar :size="36" class="bg-blue-100 text-blue-600 font-bold shrink-0">{{ scope.row.hoTen?.charAt(0) || 'NV' }}</el-avatar>
                    <div class="min-w-0">
                      <p class="font-bold text-slate-800 truncate" :title="scope.row.hoTen">{{ scope.row.hoTen }}</p>
                      <p class="text-xs text-slate-500 truncate">Mã NV: {{ scope.row.maNhanVien }}</p>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="username" label="Username (Đăng nhập)" min-width="180">
                <template #default="scope">
                  <span class="font-bold text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded whitespace-nowrap">{{ scope.row.username }}</span>
                </template>
              </el-table-column>

              <el-table-column label="Nhóm Quyền (Role)" min-width="160" align="center">
                <template #default="scope">
                  <el-tag :type="getRoleColor(scope.row.maNhomQuyen)" effect="dark" class="font-bold whitespace-nowrap">
                    {{ scope.row.tenNhomQuyen }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="trangThai" label="Trạng thái" width="120" align="center">
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

              <el-table-column label="Thao tác" width="120" align="center" fixed="right">
                <template #default="scope">
                  <el-button type="primary" link @click="openEditAccount(scope.row)" title="Đổi Quyền">
                    <el-icon class="text-xl"><EditPen /></el-icon>
                  </el-button>
                  <el-button type="warning" link @click="resetPassword(scope.row)" title="Reset Mật khẩu">
                    <el-icon class="text-xl"><Key /></el-icon>
                  </el-button>
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

        </div>
      </el-tab-pane>

      <el-tab-pane label="MA TRẬN PHÂN QUYỀN (ROLES)" name="roles">
        <div class="flex flex-col lg:flex-row gap-4 lg:gap-6 p-2 md:p-4">
          
          <div class="w-full lg:w-1/3 space-y-3 md:space-y-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold text-slate-800 text-sm md:text-base">Danh sách Vai trò</h3>
              <el-button type="primary" link @click="openAddRole" class="font-bold">
                <el-icon class="mr-1"><Plus /></el-icon> Thêm Role
              </el-button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[400px] lg:max-h-[600px] overflow-y-auto custom-scrollbar pr-1 md:pr-2">
              <div 
                v-for="role in rolesList" :key="role.maNhomQuyen"
                @click="selectRole(role)"
                class="p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col"
                :class="selectedRole?.maNhomQuyen === role.maNhomQuyen ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 bg-white hover:border-blue-300'"
              >
                <h4 class="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                  <el-icon :class="getRoleColorText(role.maNhomQuyen)"><User /></el-icon> {{ role.tenNhomQuyen }}
                </h4>
                <p class="text-[11px] md:text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed flex-1">{{ role.moTa }}</p>
              </div>
            </div>
          </div>

          <div class="w-full lg:w-2/3 bg-slate-50 p-3 md:p-6 rounded-xl md:rounded-2xl border border-slate-200" v-if="selectedRole">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
              <div>
                <h3 class="font-bold text-base md:text-lg text-slate-800">Chi tiết quyền: <span class="text-blue-600">{{ selectedRole.tenNhomQuyen }}</span></h3>
                <p class="text-[11px] md:text-sm text-slate-500 mt-1" v-if="selectedRole.maNhomQuyen === 1">Tài khoản Admin hệ thống có mặc định tất cả quyền hạn.</p>
                <p class="text-[11px] md:text-sm text-slate-500 mt-1" v-else>Tích chọn các hành động được phép thực hiện.</p>
              </div>
              <el-button type="primary" @click="savePermissions" :disabled="selectedRole.maNhomQuyen === 1" class="w-full sm:w-auto font-bold shrink-0">
                <el-icon class="mr-2"><Check /></el-icon> LƯU PHÂN QUYỀN
              </el-button>
            </div>

            <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <el-table :data="permissionMatrix" style="width: 100%" border size="default" class="min-w-[500px]">
                <el-table-column prop="tenChucNang" label="Module (Chức năng)" min-width="160" fixed="left">
                  <template #default="scope">
                    <span class="font-bold text-slate-700 text-xs md:text-sm whitespace-nowrap">{{ scope.row.tenChucNang }}</span>
                  </template>
                </el-table-column>
                
                <el-table-column label="Xem (View)" min-width="80" align="center">
                  <template #default="scope"><el-checkbox v-model="scope.row.quyenXem" :true-value="1" :false-value="0" :disabled="selectedRole.maNhomQuyen === 1" size="large" /></template>
                </el-table-column>
                <el-table-column label="Thêm (Add)" min-width="80" align="center">
                  <template #default="scope"><el-checkbox v-model="scope.row.quyenThem" :true-value="1" :false-value="0" :disabled="selectedRole.maNhomQuyen === 1" size="large" /></template>
                </el-table-column>
                <el-table-column label="Sửa (Edit)" min-width="80" align="center">
                  <template #default="scope"><el-checkbox v-model="scope.row.quyenSua" :true-value="1" :false-value="0" :disabled="selectedRole.maNhomQuyen === 1" size="large" /></template>
                </el-table-column>
                <el-table-column label="Xóa (Delete)" min-width="80" align="center">
                  <template #default="scope"><el-checkbox v-model="scope.row.quyenXoa" :true-value="1" :false-value="0" :disabled="selectedRole.maNhomQuyen === 1" size="large" /></template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          
          <div v-else class="w-full lg:w-2/3 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed py-16 px-4 text-center mt-4 lg:mt-0">
            <el-icon class="text-4xl md:text-5xl text-slate-300 mb-3"><User /></el-icon>
            <p class="text-slate-500 font-semibold text-sm md:text-base">Vui lòng chọn một Nhóm Quyền bên trái để xem và chỉnh sửa chi tiết.</p>
          </div>

        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogAccountVisible" :title="isEditAccount ? 'CẬP NHẬT TÀI KHOẢN' : 'CẤP TÀI KHOẢN MỚI'" width="500px" class="custom-dialog responsive-dialog">
      <el-form label-position="top">
        <el-form-item label="Chọn Nhân viên" v-if="!isEditAccount">
          <el-select v-model="formAccount.maNhanVien" class="w-full" filterable placeholder="Gõ tên hoặc mã NV..." size="large">
            <el-option v-for="nv in freeEmployees" :key="nv.maNhanVien" :label="`${nv.hoTen} (NV${nv.maNhanVien})`" :value="nv.maNhanVien" />
          </el-select>
        </el-form-item>

        <el-form-item label="Tên đăng nhập (Username)">
          <el-input v-model="formAccount.username" :disabled="isEditAccount" placeholder="VD: nguyenvan_admin" size="large" />
          <span v-if="!isEditAccount" class="text-[11px] md:text-xs text-slate-400 mt-1 block leading-tight">Mật khẩu mặc định sẽ là: <b>123456</b> (Yêu cầu đổi khi đăng nhập)</span>
        </el-form-item>

        <el-form-item label="Nhóm Quyền (Role)">
          <el-select v-model="formAccount.maNhomQuyen" class="w-full" size="large">
            <el-option v-for="role in rolesList" :key="role.maNhomQuyen" :label="role.tenNhomQuyen" :value="role.maNhomQuyen" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2">
          <el-button @click="dialogAccountVisible = false" class="w-full sm:w-auto">Hủy</el-button>
          <el-button type="primary" @click="saveAccount" class="font-bold w-full sm:w-auto m-0">LƯU TÀI KHOẢN</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogRoleVisible" title="THÊM NHÓM QUYỀN MỚI" width="450px" class="custom-dialog responsive-dialog">
      <el-form label-position="top">
        <el-form-item label="Tên Nhóm Quyền (Role)">
          <el-input v-model="formRole.tenNhomQuyen" placeholder="VD: Thực tập sinh Kho" size="large" />
        </el-form-item>
        <el-form-item label="Mô tả chi tiết">
          <el-input v-model="formRole.moTa" type="textarea" :rows="3" placeholder="Mô tả ngắn gọn về quyền hạn của nhóm này..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2">
          <el-button @click="dialogRoleVisible = false" class="w-full sm:w-auto">Hủy</el-button>
          <el-button type="primary" @click="saveRole" class="font-bold w-full sm:w-auto m-0">TẠO NHÓM QUYỀN</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, EditPen, Key, User, Check } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../../services/api';
import { usePagination } from '../../composables/usePagination';

// --- STATE ---
const loadingData = ref(false);
const activeTab = ref('accounts');

// Data Lists từ Backend
const accountsList = ref([]);
const rolesList = ref([]);
const functionsList = ref([]);
const freeEmployees = ref([]); // Những nhân viên chưa có tài khoản

// State cho Tab 1 (Tài khoản)
const searchAccount = ref('');
const filterRole = ref('');
const dialogAccountVisible = ref(false);
const isEditAccount = ref(false);
const formAccount = ref({ maNhanVien: null, username: '', maNhomQuyen: null });

// State cho Tab 2 (Nhóm quyền)
const selectedRole = ref(null);
const permissionMatrix = ref([]);
const dialogRoleVisible = ref(false);
const formRole = ref({ tenNhomQuyen: '', moTa: '' });

// --- COMPUTED ---
// --- COMPUTED ---
const filteredAccounts = computed(() => {
  const query = searchAccount.value.toLowerCase();
  
  return accountsList.value.filter(tk => {
    const matchSearch = tk.username.toLowerCase().includes(query) || 
                        (tk.hoTen && tk.hoTen.toLowerCase().includes(query));
    
    const matchRole = filterRole.value ? tk.maNhomQuyen === filterRole.value : true;
    
    return matchSearch && matchRole;
  });
});

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(filteredAccounts, 10);

// --- LIFECYCLE ---
onMounted(async () => {
  loadingData.value = true;
  await Promise.all([
    fetchAccounts(),
    fetchRoles(),
    fetchFunctions(),
    fetchFreeEmployees()
  ]);
  loadingData.value = false;
});

// --- API CALLS (Đã bọc thép hứng data và thêm tiền tố /auth) ---
const fetchAccounts = async () => {
  try { 
    const res = await api.get('/auth/admin/accounts'); 
    // Hứng trực tiếp res.data vì api.js đã return response.data
    accountsList.value = res.data || []; 
  } catch (e) { console.error("Lỗi fetchAccounts:", e); }
};

const fetchRoles = async () => {
  try { 
    const res = await api.get('/auth/admin/roles'); 
    rolesList.value = res.data || []; 
  } catch (e) { console.error("Lỗi fetchRoles:", e); }
};

const fetchFunctions = async () => {
  try { 
    const res = await api.get('/auth/admin/functions'); 
    functionsList.value = res.data || []; 
  } catch (e) { console.error("Lỗi fetchFunctions:", e); }
};

const fetchFreeEmployees = async () => {
  try { 
    const res = await api.get('/auth/admin/free-employees'); 
    freeEmployees.value = res.data || []; 
  } catch (e) { console.error("Lỗi fetchFreeEmployees:", e); }
};

// --- METHODS (TÀI KHOẢN) ---
const getRoleColor = (id) => {
  if (id === 1) return 'danger'; if (id === 2) return 'success';
  if (id === 3) return 'warning'; return 'info';
};
const getRoleColorText = (id) => `text-${getRoleColor(id)}-600`;

const toggleStatus = async (row) => {
  try {
    await api.put(`/auth/admin/accounts/${row.maNhanVien}/status`, { trangThai: row.trangThai });
    ElMessage.success(`Đã cập nhật trạng thái tài khoản ${row.username}`);
  } catch (error) {
    row.trangThai = row.trangThai === 1 ? 0 : 1; // Rollback nếu lỗi
    ElMessage.error(error.response?.data?.message || 'Lỗi khi đổi trạng thái');
  }
};

const openAddAccount = () => {
  isEditAccount.value = false;
  formAccount.value = { maNhanVien: null, username: '', maNhomQuyen: null };
  dialogAccountVisible.value = true;
};

const openEditAccount = (row) => {
  isEditAccount.value = true;
  formAccount.value = { maNhanVien: row.maNhanVien, username: row.username, maNhomQuyen: row.maNhomQuyen };
  dialogAccountVisible.value = true;
};

const saveAccount = async () => {
  try {
    if (isEditAccount.value) {
      await api.put(`/auth/admin/accounts/${formAccount.value.maNhanVien}`, formAccount.value);
      ElMessage.success('Cập nhật quyền thành công!');
    } else {
      if (!formAccount.value.maNhanVien || !formAccount.value.username) return ElMessage.warning("Vui lòng điền đủ thông tin");
      await api.post(`/auth/admin/accounts`, formAccount.value);
      ElMessage.success('Cấp tài khoản mới thành công!');
      fetchFreeEmployees(); // Reload lại nhân viên rảnh
    }
    dialogAccountVisible.value = false;
    fetchAccounts(); // Reload lại bảng
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Có lỗi xảy ra');
  }
};

const resetPassword = (row) => {
  ElMessageBox.confirm(`Đưa mật khẩu của ${row.username} về mặc định (123456)?`, 'Reset Mật Khẩu', {
    confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy', type: 'warning'
  }).then(async () => {
    try {
      await api.put(`/auth/admin/accounts/${row.maNhanVien}/reset-password`);
      ElMessage.success(`Đã reset mật khẩu cho ${row.username}`);
    } catch (error) { 
      ElMessage.error(error.response?.data?.message || 'Lỗi reset mật khẩu'); 
    }
  }).catch(() => {});
};

// --- METHODS (PHÂN QUYỀN) ---
const openAddRole = () => {
  formRole.value = { tenNhomQuyen: '', moTa: '' };
  dialogRoleVisible.value = true;
};

const saveRole = async () => {
  if (!formRole.value.tenNhomQuyen.trim()) return ElMessage.error('Vui lòng nhập tên Nhóm Quyền!');
  try {
    await api.post('/auth/admin/roles', formRole.value);
    ElMessage.success('Tạo Nhóm Quyền mới thành công!');
    dialogRoleVisible.value = false;
    fetchRoles(); // Reload bảng Role
  } catch (error) { 
    ElMessage.error(error.response?.data?.message || 'Lỗi tạo nhóm quyền'); 
  }
};

const selectRole = async (role) => {
  selectedRole.value = role;
  try {
    const res = await api.get(`/auth/admin/roles/${role.maNhomQuyen}/permissions`);
    const rolePerms = res.data || [];
    
    permissionMatrix.value = functionsList.value.map(func => {
      const p = rolePerms.find(x => x.maChucNang === func.maChucNang);
      const isAdmin = role.maNhomQuyen === 1; // Role Admin luôn Full quyền
      
      return {
        maChucNang: func.maChucNang,
        tenChucNang: func.tenChucNang,
        quyenXem: isAdmin ? 1 : (p ? p.quyenXem : 0),
        quyenThem: isAdmin ? 1 : (p ? p.quyenThem : 0),
        quyenSua: isAdmin ? 1 : (p ? p.quyenSua : 0),
        quyenXoa: isAdmin ? 1 : (p ? p.quyenXoa : 0),
      };
    });
  } catch (e) {
    ElMessage.error('Không tải được chi tiết phân quyền');
  }
};

const savePermissions = async () => {
  try {
    await api.put(`/auth/admin/roles/${selectedRole.value.maNhomQuyen}/permissions`, {
      permissions: permissionMatrix.value
    });
    ElMessage.success(`Đã lưu phân quyền cho: ${selectedRole.value.tenNhomQuyen}`);
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi lưu phân quyền');
  }
};
</script>

<style scoped>
/* DIALOGS */
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) {
  :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; }
}
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
:deep(.responsive-dialog) { max-width: 95vw !important; }

/* TABS CUỘN NGANG TRÊN MOBILE */
:deep(.custom-tabs .el-tabs__nav-wrap::after) { background-color: transparent; }
:deep(.custom-tabs .el-tabs__nav-scroll) { overflow-x: auto; overflow-y: hidden; }
:deep(.custom-tabs .el-tabs__nav) { white-space: nowrap; }
:deep(.custom-tabs .el-tabs__item) { font-weight: 600; font-size: 13px; color: #64748b; padding: 0 16px; }
@media (min-width: 768px) {
  :deep(.custom-tabs .el-tabs__item) { font-size: 15px; padding: 0 24px; }
}
:deep(.custom-tabs .el-tabs__item.is-active) { color: #2563eb; }
:deep(.custom-tabs .el-tabs__active-bar) { background-color: #2563eb; height: 3px; border-radius: 3px; }
:deep(.custom-tabs .el-tabs__nav-scroll::-webkit-scrollbar) { display: none; }

/* THANH CUỘN CHO DANH SÁCH ROLE BÊN TRÁI */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>