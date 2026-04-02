<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
      
      <el-avatar :size="90" class="bg-blue-100 text-blue-600 font-bold text-3xl border-4 border-white shadow-md">
        {{ getInitials(currentUser.hoTen) }}
      </el-avatar>
      
      <div class="text-center md:text-left flex-1">
        <h2 class="text-3xl font-bold text-slate-800">{{ currentUser.hoTen }}</h2>
        <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-sm text-slate-500 font-medium">
          <span class="bg-slate-100 px-3 py-1 rounded-full"><el-icon class="mr-1"><User /></el-icon> Mã NV: {{ currentUser.maNhanVien }}</span>
          <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full"><el-icon class="mr-1"><Medal /></el-icon> {{ currentUser.tenChucVu }}</span>
          <span><el-icon class="mr-1"><Calendar /></el-icon> Vào làm: {{ formatDateVN(currentUser.ngayVaoLam) }}</span>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 custom-tabs">
      
      <el-tab-pane label="THÔNG TIN & BẢO MẬT" name="info">
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-4">
            <h3 class="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-4">Thông tin liên hệ</h3>
            <el-form label-position="top">
              <el-form-item label="Số điện thoại cá nhân">
                <el-input v-model="formProfile.sdt" placeholder="09xxxx..." />
              </el-form-item>
              <el-form-item label="Địa chỉ Email">
                <el-input v-model="formProfile.email" placeholder="email@congty.com" />
              </el-form-item>
              <el-form-item label="Địa chỉ thường trú">
                <el-input v-model="formProfile.diaChi" type="textarea" :rows="2" />
              </el-form-item>
              <el-button type="primary" @click="updateProfile" :loading="updatingInfo" class="mt-2 font-bold">
                CẬP NHẬT THÔNG TIN
              </el-button>
            </el-form>
          </div>

          <div class="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 class="font-bold text-lg text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
              <el-icon class="text-amber-500"><Key /></el-icon> Đổi mật khẩu
            </h3>
            <el-form label-position="top">
              <el-form-item label="Mật khẩu hiện tại">
                <el-input v-model="formPassword.oldPass" type="password" show-password placeholder="Nhập mật khẩu cũ..." />
              </el-form-item>
              <el-form-item label="Mật khẩu mới">
                <el-input v-model="formPassword.newPass" type="password" show-password placeholder="Ít nhất 6 ký tự..." />
              </el-form-item>
              <el-form-item label="Xác nhận mật khẩu mới">
                <el-input v-model="formPassword.confirmPass" type="password" show-password placeholder="Nhập lại mật khẩu mới..." />
              </el-form-item>
              <el-button type="warning" @click="changePassword" :loading="changingPass" class="w-full font-bold">
                XÁC NHẬN ĐỔI MẬT KHẨU
              </el-button>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="LỊCH SỬ CHẤM CÔNG" name="attendance">
        <div class="p-4">
          
          <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div class="flex items-center gap-3">
              <span class="font-bold text-slate-700">Tra cứu tháng:</span>
              <el-date-picker
                v-model="selectedAttendanceMonth"
                type="month"
                placeholder="Chọn tháng"
                format="MM/YYYY"
                value-format="YYYY-MM"
                :clearable="false"
                class="!w-40"
              />
            </div>
            
            <div class="flex flex-wrap justify-center gap-3 text-sm font-semibold">
              <span class="text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                <el-icon class="mr-1"><CircleCheck /></el-icon> Đúng giờ: {{ countAttendanceStatus('Đúng giờ') }}
              </span>
              <span class="text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                <el-icon class="mr-1"><Warning /></el-icon> Đi trễ: {{ countAttendanceStatus('Đi trễ') }}
              </span>
              <span class="text-slate-600 bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300">
                <el-icon class="mr-1"><Remove /></el-icon> Nghỉ: {{ countAttendanceStatus('Nghỉ') }}
              </span>
            </div>
          </div>

          <el-table :data="filteredAttendance" style="width: 100%" border stripe size="large">
            <el-table-column prop="ngayLamViec" label="Ngày làm việc" width="150" align="center">
              <template #default="scope"><span class="font-bold">{{ formatDateVN(scope.row.ngayLamViec) }}</span></template>
            </el-table-column>
            
            <el-table-column prop="gioVao" label="Giờ vào (Check-in)" align="center">
              <template #default="scope">
                <span :class="scope.row.gioVao > '08:00:00' ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'">
                  {{ scope.row.gioVao || '--:--' }}
                </span>
              </template>
            </el-table-column>
            
            <el-table-column prop="gioRa" label="Giờ ra (Check-out)" align="center">
              <template #default="scope"><span class="font-bold text-slate-700">{{ scope.row.gioRa || '--:--' }}</span></template>
            </el-table-column>
            
            <el-table-column prop="soGioLam" label="Tổng giờ làm" align="center">
              <template #default="scope"><span class="font-black text-blue-600">{{ scope.row.soGioLam }}h</span></template>
            </el-table-column>
            
            <el-table-column label="Trạng thái" align="center" width="220">
              <template #default="scope">
                <el-tag :type="getAttendanceTagColor(scope.row)" effect="dark" class="font-bold w-full">
                  {{ scope.row.trangThai || 'Chưa xác định' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="filteredAttendance.length === 0" class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 mt-4">
            <el-icon class="text-4xl text-slate-300 mb-2"><Calendar /></el-icon>
            <p class="text-slate-500 font-medium">Không có dữ liệu chấm công trong tháng {{ selectedAttendanceMonth.split('-').reverse().join('/') }}</p>
          </div>

        </div>
      </el-tab-pane>

      <el-tab-pane label="PHIẾU LƯƠNG (PAYSLIP)" name="payslip">
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="slip in myPayslips" :key="slip.maLuong" 
            class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
            @click="openPayslipDetail(slip)"
          >
            <div class="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Đã thanh toán</div>
            <div class="flex items-center gap-3 mb-4">
              <div class="p-3 bg-blue-50 text-blue-600 rounded-xl"><el-icon class="text-2xl"><Money /></el-icon></div>
              <div>
                <p class="text-sm text-slate-500 font-semibold">Kỳ lương tháng</p>
                <p class="text-xl font-bold text-slate-800">{{ slip.thang }}/{{ slip.nam }}</p>
              </div>
            </div>
            <div class="flex justify-between items-end border-t border-slate-100 pt-3">
              <span class="text-sm text-slate-500">Thực lãnh:</span>
              <span class="text-xl font-black text-blue-600">{{ formatPrice(slip.thucLanh) }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="GỬI ĐƠN TỪ" name="leave">
        <div class="p-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-slate-800">Lịch sử xin nghỉ phép / Thai sản</h3>
            <el-button type="primary" @click="dialogLeaveVisible = true"><el-icon class="mr-2"><DocumentAdd /></el-icon> TẠO ĐƠN MỚI</el-button>
          </div>
          <el-table :data="myLeaves" style="width: 100%" stripe border>
            <el-table-column prop="loaiDon" label="Loại Đơn" width="150">
              <template #default="scope"><span class="font-bold text-slate-700">{{ scope.row.loaiDon }}</span></template>
            </el-table-column>
            <el-table-column label="Thời gian nghỉ" width="220" align="center">
              <template #default="scope">
                <span class="text-sm">{{ formatDateVN(scope.row.ngayBatDau) }} - {{ formatDateVN(scope.row.ngayKetThuc) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="lyDo" label="Lý do chi tiết" min-width="200">
              <template #default="scope"><span class="text-slate-600">{{ scope.row.lyDo }}</span></template>
            </el-table-column>
            <el-table-column label="Ngày tạo đơn" width="150" align="center">
              <template #default="scope">
                <div class="flex items-center justify-center gap-1 text-slate-500 text-sm">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDateVN(scope.row.ngayTao) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="trangThai" label="Trạng thái duyệt" width="150" align="center">
              <template #default="scope">
                <el-tag :type="getLeaveStatusColor(scope.row.trangThai)" effect="dark" class="font-bold w-24">
                  {{ scope.row.trangThai }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogLeaveVisible" title="TẠO ĐƠN XIN NGHỈ PHÉP" width="500px" class="custom-dialog">
      <el-form label-position="top">
        <el-form-item label="Loại đơn xin nghỉ">
          <el-select v-model="formLeave.loaiDon" class="w-full" size="large">
            <el-option label="Nghỉ phép năm (Hưởng 100% lương)" value="Nghỉ phép năm" />
            <el-option label="Nghỉ không hưởng lương" value="Nghỉ không lương" />
            <el-option label="Nghỉ ốm / Khám bệnh (BHXH chi trả)" value="Nghỉ ốm" />
            <el-option label="Nghỉ thai sản (BHXH chi trả)" value="Nghỉ thai sản" />
            <el-option label="Nghỉ việc riêng (Hiếu, hỉ - Có lương)" value="Nghỉ việc riêng" />
          </el-select>
        </el-form-item>

        <el-form-item label="Thời gian xin nghỉ">
          <el-date-picker v-model="formLeave.dateRange" type="daterange" range-separator="Đến" start-placeholder="Ngày bắt đầu" end-placeholder="Ngày đi làm lại" format="DD/MM/YYYY" value-format="YYYY-MM-DD" class="!w-full" />
        </el-form-item>

        <el-form-item label="Lý do chi tiết">
          <el-input v-model="formLeave.lyDo" type="textarea" :rows="3" placeholder="Ghi rõ lý do để Quản lý dễ duyệt..." />
        </el-form-item>
      </el-form>
  
      <template #footer>
        <el-button @click="dialogLeaveVisible = false">Hủy</el-button>
        <el-button type="primary" @click="submitLeave" class="font-bold">GỬI ĐƠN</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogPayslipVisible" :title="`CHI TIẾT PHIẾU LƯƠNG THÁNG ${selectedPayslip?.thang}/${selectedPayslip?.nam}`" width="650px" class="custom-dialog payslip-dialog">
      <div v-if="selectedPayslip" class="p-2 space-y-5">
        
        <div class="text-center border-b border-dashed border-slate-300 pb-4">
          <h2 class="font-black text-2xl text-slate-800 uppercase tracking-wide">Laptop Store ERP</h2>
          <p class="text-sm text-slate-500 mt-1">Phiếu Lương Cá Nhân - Bảo Mật</p>
          
          <div class="mt-5 text-left bg-gradient-to-r from-slate-50 to-blue-50/30 p-4 rounded-xl flex justify-between items-center border border-slate-100">
            <div>
              <p class="font-bold text-lg text-slate-800">{{ currentUser.hoTen }}</p>
              <p class="text-sm text-slate-500 mt-0.5">Mã NV: <span class="font-semibold text-slate-700">{{ currentUser.maNhanVien }}</span> • {{ currentUser.tenChucVu }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-500 mb-1">Mức lương cơ sở:</p>
              <p class="text-lg font-bold text-blue-600">{{ formatPrice(selectedPayslip.luongTheoGio) }}/h</p>
            </div>
          </div>
        </div>

        <div class="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
          <h3 class="font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-3 flex items-center gap-2">
            <el-icon><Plus /></el-icon> 1. CÁC KHOẢN THU NHẬP 
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-slate-700 font-semibold text-sm">Lương hành chính</p>
                <p class="text-xs text-slate-500 italic mt-0.5">Công thức: {{ selectedPayslip.soGioLamBinhThuong }}h × {{ formatPrice(selectedPayslip.luongTheoGio) }}</p>
              </div>
              <span class="font-bold text-slate-800">{{ formatPrice(selectedPayslip.luongCoBan) }}</span>
            </div>
            
            <div class="flex justify-between items-center" v-if="selectedPayslip.soGioTangCa > 0">
              <div>
                <p class="text-slate-700 font-semibold text-sm">Tiền tăng ca (OT)</p>
                <p class="text-xs text-slate-500 italic mt-0.5">Công thức: {{ selectedPayslip.soGioTangCa }}h × {{ formatPrice(selectedPayslip.luongTheoGio) }} × {{ selectedPayslip.heSoTangCa }} (Hệ số)</p>
              </div>
              <span class="font-bold text-emerald-600">+ {{ formatPrice(selectedPayslip.tongTienTangCa) }}</span>
            </div>

            <div class="flex justify-between items-center" v-if="selectedPayslip.phuCapChucVu > 0">
              <p class="text-slate-700 font-semibold text-sm">Phụ cấp chức vụ</p>
              <span class="font-bold text-emerald-600">+ {{ formatPrice(selectedPayslip.phuCapChucVu) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <p class="text-slate-700 font-semibold text-sm">Phụ cấp cố định (Cơm, Xăng xe)</p>
              <span class="font-bold text-emerald-600">+ {{ formatPrice(selectedPayslip.phuCapKhac) }}</span>
            </div>
            <div class="flex justify-between items-center" v-if="selectedPayslip.thuong > 0">
              <p class="text-slate-700 font-semibold text-sm">Thưởng ngoại lệ</p>
              <span class="font-bold text-emerald-600">+ {{ formatPrice(selectedPayslip.thuong) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
          <h3 class="font-bold text-rose-800 border-b border-rose-200 pb-2 mb-3 flex items-center gap-2">
            <el-icon><Minus /></el-icon> 2. CÁC KHOẢN KHẤU TRỪ
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-slate-700 font-semibold text-sm">Phạt đi trễ</p>
                <p class="text-xs text-rose-500 italic mt-0.5" v-if="selectedPayslip.soPhutDiTre > 0">
                  Công thức: {{ selectedPayslip.soPhutDiTre }} phút × {{ formatPrice(selectedPayslip.tienPhatDiTre) }}
                </p>
                <p class="text-xs text-emerald-500 italic mt-0.5" v-else>Không có vi phạm</p>
              </div>
              <span class="font-bold text-rose-600" v-if="selectedPayslip.tongTienPhat > 0">- {{ formatPrice(selectedPayslip.tongTienPhat) }}</span>
              <span class="font-bold text-slate-400" v-else>0 ₫</span>
            </div>

            <div class="flex justify-between items-center">
              <div>
                <p class="text-slate-700 font-semibold text-sm">Khấu trừ Bảo hiểm (BHXH, BHYT)</p>
                <p class="text-xs text-slate-500 italic mt-0.5">Trích % theo mức lương cơ sở quy định</p>
              </div>
              <span class="font-bold text-rose-600">- {{ formatPrice(selectedPayslip.truBaoHiem) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-600 p-5 rounded-xl text-white mt-4 flex justify-between items-center shadow-md shadow-blue-500/30">
          <div>
            <p class="text-blue-100 text-sm font-medium">TỔNG TIỀN THỰC LÃNH</p>
            <p class="text-xs text-blue-200 mt-1 italic">(Đã làm tròn và trừ các khoản thuế/phí)</p>
          </div>
          <span class="font-black text-3xl">{{ formatPrice(selectedPayslip.thucLanh) }}</span>
        </div>
        
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { User, Medal, Calendar, Key, Money, DocumentAdd, CircleCheck, Warning, Remove } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../../services/api';

// --- STATE QUẢN LÝ TÀI KHOẢN ---
const currentUser = ref({});
const activeTab = ref('attendance');

// Form Đổi thông tin
const updatingInfo = ref(false);
const formProfile = ref({ sdt: '', email: '', diaChi: '' });

// Form Đổi mật khẩu
const changingPass = ref(false);
const formPassword = ref({ oldPass: '', newPass: '', confirmPass: '' });

// State cho các Tab khác
const myAttendance = ref([]);
const selectedAttendanceMonth = ref(''); // Sẽ tự set là tháng hiện tại khi mounted

const myPayslips = ref([]);
const dialogPayslipVisible = ref(false);
const selectedPayslip = ref(null);

const myLeaves = ref([]);
const dialogLeaveVisible = ref(false);
const formLeave = ref({ loaiDon: 'Nghỉ phép năm', dateRange: [], lyDo: '' });

// ==========================================
// 1. TẢI DỮ LIỆU BAN ĐẦU
// ==========================================
const loadAllData = async () => {
  try {
    // A. Lấy thông tin cá nhân
    const resProfile = await api.get('/hr/profile/me');
    const profileData = resProfile.data?.data || resProfile.data;
    currentUser.value = profileData;
    formProfile.value = { sdt: profileData.sdt, email: profileData.email, diaChi: profileData.diaChi };

    // Set mặc định tháng chấm công là tháng hiện tại
    const today = new Date();
    selectedAttendanceMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Tải các phần khác
    await fetchAttendance();
    await fetchPayslips();
    await fetchLeaves();

  } catch (error) {
    console.error("Lỗi tải Profile:", error);
    ElMessage.error('Không thể tải dữ liệu cá nhân');
  }
};

onMounted(() => {
  loadAllData();
});


// ==========================================
// 2. TAB THÔNG TIN & BẢO MẬT
// ==========================================
const updateProfile = async () => {
  updatingInfo.value = true;
  try {
    const res = await api.put('/hr/profile/update-info', formProfile.value);
    if (res.data?.success || res.success) {
      ElMessage.success('Cập nhật thông tin thành công!');
      // Cập nhật lại UI tạm thời
      currentUser.value.sdt = formProfile.value.sdt;
      currentUser.value.email = formProfile.value.email;
      currentUser.value.diaChi = formProfile.value.diaChi;
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi cập nhật');
  } finally {
    updatingInfo.value = false;
  }
};

const changePassword = async () => {
  if (formPassword.value.newPass.length < 6) {
    ElMessage.error('Mật khẩu mới phải từ 6 ký tự!'); return;
  }
  if (formPassword.value.newPass !== formPassword.value.confirmPass) {
    ElMessage.error('Mật khẩu xác nhận không khớp!'); return;
  }
  
  changingPass.value = true;
  try {
    // Trỏ về đúng route của module Auth và đổi key cho khớp Backend
    const res = await api.put('/auth/change-password', {
      oldPassword: formPassword.value.oldPass, 
      newPassword: formPassword.value.newPass
    });
    
    if (res.data?.success || res.success) {
      ElMessage.success('Đổi mật khẩu thành công!');
      formPassword.value = { oldPass: '', newPass: '', confirmPass: '' };
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi đổi mật khẩu');
  } finally {
    changingPass.value = false;
  }
};

// ==========================================
// 3. TAB LỊCH SỬ CHẤM CÔNG
// ==========================================
const fetchAttendance = async () => {
  if (!selectedAttendanceMonth.value) return;
  const [nam, thang] = selectedAttendanceMonth.value.split('-');
  
  try {
    // Gọi API bạn đã có: getLichSuChamCong
    const res = await api.get(`/hr/chamcong?thang=${thang}&nam=${nam}&maNhanVien=${currentUser.value.maNhanVien}`);
    
    // Bóc tách lưới 3 lớp (chuẩn như mình đã làm ở trang trước)
    let ds = [];
    const raw = res.data || res;
    if (raw?.data?.data && Array.isArray(raw.data.data)) ds = raw.data.data;
    else if (raw?.data && Array.isArray(raw.data)) ds = raw.data;
    else if (Array.isArray(raw)) ds = raw;
    
    myAttendance.value = ds;
  } catch (error) {
    console.error(error);
  }
};

// Gọi lại API chấm công khi user đổi tháng
watch(selectedAttendanceMonth, () => {
  fetchAttendance();
});

const getResolvedStatus = (row) => {
  if (row.trangThai !== 'Đi làm') return row.trangThai;
  if (row.gioVao && row.gioVao > '08:00:00') return 'Đi trễ';
  return 'Đi làm (Đúng giờ)';
};

// --- LOGIC LỌC THÁNG VÀ XỬ LÝ TRẠNG THÁI (ĐÃ FIX CHUẨN) ---

// 1. Hàm gán màu thẻ Tag dựa vào giờ vào thực tế
const getAttendanceTagColor = (row) => {
  if (!row.gioVao) return 'info'; // Không có giờ vào -> Các loại Nghỉ (Màu xám)
  if (row.gioVao > '08:00:00') return 'warning'; // Trễ (Màu cam)
  return 'success'; // Đúng giờ (Màu xanh)
};

// 2. Computed Lọc dữ liệu theo Tháng đã chọn
const filteredAttendance = computed(() => {
  return myAttendance.value.filter(a => a.ngayLamViec.startsWith(selectedAttendanceMonth.value));
});

// 3. Hàm đếm số lượng thống kê trên thẻ (Đếm cực chuẩn)
const countAttendanceStatus = (type) => {
  return filteredAttendance.value.filter(a => {
    const hasCheckedIn = !!a.gioVao; // Biến boolean kiểm tra xem có đi làm không
    
    if (type === 'Đúng giờ') return hasCheckedIn && a.gioVao <= '08:00:00';
    if (type === 'Đi trễ') return hasCheckedIn && a.gioVao > '08:00:00';
    if (type === 'Nghỉ') return !hasCheckedIn; // Không có giờ vào chắc chắn là nghỉ
  }).length;
};


// ==========================================
// 4. TAB PHIẾU LƯƠNG
// ==========================================
const fetchPayslips = async () => {
  try {
    const res = await api.get(`/hr/luong/${currentUser.value.maNhanVien}`);
    const raw = res.data || res;
    let ds = [];
    if (raw?.data?.data && Array.isArray(raw.data.data)) ds = raw.data.data;
    else if (raw?.data && Array.isArray(raw.data)) ds = raw.data;
    else if (Array.isArray(raw)) ds = raw;
    
    myPayslips.value = ds;
  } catch (error) {
    console.error(error);
  }
};
const openPayslipDetail = (slip) => { selectedPayslip.value = slip; dialogPayslipVisible.value = true; };


// ==========================================
// 5. TAB GỬI ĐƠN TỪ
// ==========================================
const fetchLeaves = async () => {
  try {
    const res = await api.get('/hr/dontu/canhan');
    const raw = res.data || res;
    let ds = [];
    if (raw?.data?.data && Array.isArray(raw.data.data)) ds = raw.data.data;
    else if (raw?.data && Array.isArray(raw.data)) ds = raw.data;
    else if (Array.isArray(raw)) ds = raw;
    
    myLeaves.value = ds;
  } catch (error) {
    console.error(error);
  }
};

const submitLeave = async () => {
  if (!formLeave.value.dateRange || formLeave.value.dateRange.length === 0) { ElMessage.error('Vui lòng chọn thời gian!'); return; }
  
  try {
    const payload = {
      loaiDon: formLeave.value.loaiDon,
      ngayBatDau: formLeave.value.dateRange[0],
      ngayKetThuc: formLeave.value.dateRange[1],
      lyDo: formLeave.value.lyDo
    };
    const res = await api.post('/hr/dontu', payload);
    if (res.data?.success || res.success) {
      ElMessage.success('Gửi đơn xin nghỉ thành công!');
      dialogLeaveVisible.value = false; 
      formLeave.value = { loaiDon: 'Nghỉ phép năm', dateRange: [], lyDo: '' };
      fetchLeaves();
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi gửi đơn');
  }
};


// ==========================================
// TIỆN ÍCH DÙNG CHUNG
// ==========================================
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
const formatDateVN = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  
  // Tránh lỗi nếu chuỗi ngày không hợp lệ
  if (isNaN(d.getTime())) return ''; 

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};
const getInitials = (name) => {
  if (!name) return 'NV';
  const words = name.split(' ');
  return words.length > 1 ? words[words.length - 2][0] + words[words.length - 1][0] : name.substring(0, 2).toUpperCase();
};
const getLeaveStatusColor = (status) => status === 'Đã duyệt' ? 'success' : (status === 'Từ chối' ? 'danger' : 'warning');
</script>

<style scoped>
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
:deep(.payslip-dialog .el-dialog__body) { padding-top: 10px; padding-bottom: 30px; }
:deep(.custom-tabs .el-tabs__nav-wrap::after) { background-color: transparent; }
:deep(.custom-tabs .el-tabs__item) { font-weight: 600; font-size: 15px; color: #64748b; padding: 0 24px; }
:deep(.custom-tabs .el-tabs__item.is-active) { color: #2563eb; }
:deep(.custom-tabs .el-tabs__active-bar) { background-color: #2563eb; height: 3px; border-radius: 3px; }
</style>