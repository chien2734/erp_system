<template>
  <div class="space-y-4 md:space-y-6 max-w-6xl mx-auto p-2 sm:p-4 md:p-0">
    
    <div class="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4 md:gap-6 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-full h-1.5 md:h-2 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
      
      <el-avatar :size="70" class="md:w-[90px] md:h-[90px] bg-blue-100 text-blue-600 font-bold text-2xl md:text-3xl border-2 md:border-4 border-white shadow-md">
        {{ getInitials(currentUser.hoTen) }}
      </el-avatar>
      
      <div class="text-center md:text-left flex-1 w-full">
        <h2 class="text-xl md:text-3xl font-bold text-slate-800">{{ currentUser.hoTen }}</h2>
        <div class="flex flex-col sm:flex-row flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 mt-2 md:mt-3 text-xs md:text-sm text-slate-500 font-medium">
          <span class="bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap"><el-icon class="mr-1 align-middle"><User /></el-icon> Mã NV: {{ currentUser.maNhanVien }}</span>
          <span class="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full whitespace-nowrap"><el-icon class="mr-1 align-middle"><Medal /></el-icon> {{ currentUser.tenChucVu }}</span>
          <span class="whitespace-nowrap"><el-icon class="mr-1 align-middle"><Calendar /></el-icon> Vào làm: {{ formatDateVN(currentUser.ngayVaoLam) }}</span>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="bg-white p-2 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 custom-tabs">
      
      <el-tab-pane label="THÔNG TIN CÁ NHÂN" name="info">
        <div class="p-2 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div class="space-y-4">
            <h3 class="font-bold text-base md:text-lg text-slate-800 border-b border-slate-100 pb-2 mb-4">Thông tin liên hệ</h3>
            <el-form label-position="top">
              <el-form-item label="Số điện thoại cá nhân">
                <el-input v-model="formProfile.sdt" placeholder="09xxxx..." size="large" />
              </el-form-item>
              <el-form-item label="Địa chỉ Email">
                <el-input v-model="formProfile.email" placeholder="email@congty.com" size="large" />
              </el-form-item>
              <el-form-item label="Địa chỉ thường trú">
                <el-input v-model="formProfile.diaChi" type="textarea" :rows="3" />
              </el-form-item>
              <el-button type="primary" @click="updateProfile" :loading="updatingInfo" class="mt-2 font-bold w-full md:w-auto" size="large">
                CẬP NHẬT THÔNG TIN
              </el-button>
            </el-form>
          </div>

          <div class="space-y-4 bg-slate-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200">
            <h3 class="font-bold text-base md:text-lg text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
              <el-icon class="text-amber-500"><Key /></el-icon> Đổi mật khẩu
            </h3>
            <el-form label-position="top">
              <el-form-item label="Mật khẩu hiện tại">
                <el-input v-model="formPassword.oldPass" type="password" show-password placeholder="Nhập mật khẩu cũ..." size="large" />
              </el-form-item>
              <el-form-item label="Mật khẩu mới">
                <el-input v-model="formPassword.newPass" type="password" show-password placeholder="Ít nhất 6 ký tự..." size="large" />
              </el-form-item>
              <el-form-item label="Xác nhận mật khẩu mới">
                <el-input v-model="formPassword.confirmPass" type="password" show-password placeholder="Nhập lại mật khẩu mới..." size="large" />
              </el-form-item>
              <el-button type="warning" @click="changePassword" :loading="changingPass" class="w-full font-bold" size="large">
                XÁC NHẬN ĐỔI MẬT KHẨU
              </el-button>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="LỘ TRÌNH CÔNG TÁC" name="career">
        <div class="p-2 md:p-4">
          <div class="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
              <el-icon class="text-blue-500"><Trophy /></el-icon> Lịch sử thăng tiến & Công tác
            </h3>
            
            <div class="px-2 md:px-6">
              <el-timeline v-if="myCareer.length > 0">
                <el-timeline-item
                  v-for="(item, index) in myCareer"
                  :key="index"
                  :timestamp="formatDateVN(item.ngayBatDau)"
                  placement="top"
                  :color="index === 0 ? '#3b82f6' : '#cbd5e1'"
                  :hollow="index !== 0"
                  :size="index === 0 ? 'large' : 'normal'"
                >
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                    <h4 class="font-bold text-base md:text-lg text-slate-800">{{ item.tenChucVu }}</h4>
                    <p class="text-sm text-slate-600 mt-1 flex items-start gap-2">
                      <el-icon class="mt-0.5 text-slate-400"><CollectionTag /></el-icon>
                      {{ item.ghiChu || 'Tiếp nhận công việc' }}
                    </p>
                  </div>
                </el-timeline-item>
              </el-timeline>
              
              <div v-else class="text-center py-8">
                <el-empty description="Chưa có dữ liệu lộ trình" :image-size="100" />
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="LỊCH SỬ CHẤM CÔNG" name="attendance">
        <div class="p-2 md:p-4">
          
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 md:mb-6 gap-4 bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <span class="font-bold text-slate-700 whitespace-nowrap">Tra cứu:</span>
              <div class="flex gap-2 w-full sm:w-auto">
                <el-date-picker
                  v-model="selectedAttendanceMonth"
                  type="month"
                  placeholder="Chọn tháng"
                  format="MM/YYYY"
                  value-format="YYYY-MM"
                  :clearable="false"
                  class="flex-1 sm:!w-32"
                />
                <el-select v-model="filterAttendanceStatus" placeholder="Trạng thái" class="flex-1 sm:!w-36">
                  <el-option label="Tất cả" value="" />
                  <el-option label="Đúng giờ" value="Đúng giờ" />
                  <el-option label="Đi trễ" value="Đi trễ" />
                  <el-option label="Nghỉ" value="Nghỉ" />
                </el-select>
              </div>
            </div>
            
            <div class="flex flex-wrap justify-start lg:justify-center gap-2 text-[11px] md:text-sm font-semibold w-full lg:w-auto">
              <span class="text-emerald-700 bg-emerald-100 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-emerald-200">
                <el-icon class="mr-1 align-middle"><CircleCheck /></el-icon> Đúng giờ: {{ countAttendanceStatus('Đúng giờ') }}
              </span>
              <span class="text-amber-700 bg-amber-100 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-amber-200">
                <el-icon class="mr-1 align-middle"><Warning /></el-icon> Đi trễ: {{ countAttendanceStatus('Đi trễ') }}
              </span>
              <span class="text-slate-600 bg-slate-200 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-slate-300">
                <el-icon class="mr-1 align-middle"><Remove /></el-icon> Nghỉ: {{ countAttendanceStatus('Nghỉ') }}
              </span>
            </div>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <el-table :data="paginatedData" style="width: 100%" stripe size="large" class="min-w-[750px]">
              
              <el-table-column prop="ngayLamViec" label="Ngày làm việc" min-width="150" align="center">
                <template #default="scope"><span class="font-bold whitespace-nowrap">{{ formatDateVN(scope.row.ngayLamViec) }}</span></template>
              </el-table-column>
              
              <el-table-column prop="gioVao" label="Giờ vào (In)" align="center" min-width="120">
                <template #default="scope">
                  <span :class="scope.row.gioVao > '08:00:00' ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'">
                    {{ scope.row.gioVao || '--:--' }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column prop="gioRa" label="Giờ ra (Out)" align="center" min-width="120">
                <template #default="scope"><span class="font-bold text-slate-700">{{ scope.row.gioRa || '--:--' }}</span></template>
              </el-table-column>
              
              <el-table-column prop="soGioLam" label="Tổng giờ" align="center" min-width="110">
                <template #default="scope"><span class="font-black text-blue-600">{{ scope.row.soGioLam }}h</span></template>
              </el-table-column>
              
              <el-table-column label="Trạng thái" align="center" min-width="180">
                <template #default="scope">
                  <el-tag :type="getAttendanceTagColor(scope.row)" effect="dark" class="font-bold w-full border-none whitespace-nowrap">
                    {{ scope.row.trangThai || 'Chưa xác định' }}
                  </el-tag>
                </template>
              </el-table-column>
              
            </el-table>
          </div>

          <div v-if="paginatedData.length === 0" class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 mt-4">
            <el-icon class="text-3xl md:text-4xl text-slate-300 mb-2"><Calendar /></el-icon>
            <p class="text-sm md:text-base text-slate-500 font-medium">Không có dữ liệu phù hợp với bộ lọc</p>
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

      <el-tab-pane label="PHIẾU LƯƠNG" name="payslip">
        <div class="p-2 md:p-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4 bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200">
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <span class="font-bold text-slate-700 whitespace-nowrap">Năm:</span>
              <el-date-picker
                v-model="selectedPayslipYear"
                type="year"
                placeholder="Chọn năm"
                format="YYYY"
                value-format="YYYY"
                :clearable="true"
                class="!w-full sm:!w-32"
              />
            </div>
            
            <el-button type="success" :icon="Printer" @click="printYearlySummary" class="font-bold w-full sm:w-auto" plain>
              IN TỔNG KẾT NĂM {{ selectedPayslipYear || '' }}
            </el-button>
          </div>

          <div id="printable-year-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div 
              v-for="slip in filteredPayslips" :key="slip.maLuong" 
              class="bg-white p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
              @click="openPayslipDetail(slip)"
            >
              <div class="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-bl-lg">Đã thanh toán</div>
              <div class="flex items-center gap-3 mb-3 md:mb-4">
                <div class="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl"><el-icon class="text-xl md:text-2xl"><Money /></el-icon></div>
                <div>
                  <p class="text-xs md:text-sm text-slate-500 font-semibold">Kỳ lương tháng</p>
                  <p class="text-lg md:text-xl font-bold text-slate-800">{{ slip.thang }}/{{ slip.nam }}</p>
                </div>
              </div>
              <div class="flex justify-between items-end border-t border-slate-100 pt-2 md:pt-3">
                <span class="text-xs md:text-sm text-slate-500">Thực lãnh:</span>
                <span class="text-lg md:text-xl font-black text-blue-600">{{ formatPrice(slip.thucLanh) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="filteredPayslips.length === 0" class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 mt-4">
            <p class="text-slate-500 font-medium text-sm md:text-base">Không tìm thấy dữ liệu lương trong năm này</p>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="GỬI ĐƠN TỪ" name="leave">
        <div class="p-2 md:p-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 class="font-bold text-slate-800 text-base md:text-lg">Lịch sử xin nghỉ phép / Thai sản</h3>
            <el-button type="primary" @click="dialogLeaveVisible = true" class="w-full sm:w-auto"><el-icon class="mr-2"><DocumentAdd /></el-icon> TẠO ĐƠN MỚI</el-button>
          </div>
          
          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <el-table :data="myLeaves" style="width: 100%" stripe class="min-w-[700px]">
              <el-table-column prop="loaiDon" label="Loại Đơn" width="150">
                <template #default="scope"><span class="font-bold text-slate-700 whitespace-nowrap">{{ scope.row.loaiDon }}</span></template>
              </el-table-column>
              <el-table-column label="Thời gian nghỉ" width="200" align="center">
                <template #default="scope">
                  <span class="text-xs md:text-sm whitespace-nowrap">{{ formatDateVN(scope.row.ngayBatDau) }} - {{ formatDateVN(scope.row.ngayKetThuc) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="lyDo" label="Lý do chi tiết" min-width="180">
                <template #default="scope"><span class="text-slate-600 text-xs md:text-sm line-clamp-2">{{ scope.row.lyDo }}</span></template>
              </el-table-column>
              <el-table-column label="Ngày tạo đơn" width="130" align="center">
                <template #default="scope">
                  <span class="text-slate-500 text-xs font-medium whitespace-nowrap">{{ formatDateVN(scope.row.ngayTao) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="trangThai" label="Trạng thái duyệt" width="130" align="center" fixed="right">
                <template #default="scope">
                  <el-tag :type="getLeaveStatusColor(scope.row.trangThai)" effect="dark" class="font-bold w-full text-[10px] md:text-xs">
                    {{ scope.row.trangThai }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogLeaveVisible" title="TẠO ĐƠN XIN NGHỈ PHÉP" width="600px" class="custom-dialog responsive-dialog">
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
          <el-date-picker v-model="formLeave.dateRange" type="daterange" range-separator="Đến" start-placeholder="Bắt đầu" end-placeholder="Kết thúc" format="DD/MM/YYYY" value-format="YYYY-MM-DD" class="!w-full" size="large" />
        </el-form-item>
        <el-form-item label="Lý do chi tiết">
          <el-input v-model="formLeave.lyDo" type="textarea" :rows="3" placeholder="Ghi rõ lý do..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2">
          <el-button @click="dialogLeaveVisible = false" class="w-full sm:w-auto">Hủy</el-button>
          <el-button type="primary" @click="submitLeave" class="font-bold w-full sm:w-auto m-0">GỬI ĐƠN</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogPayslipVisible" :title="`CHI TIẾT LƯƠNG T${selectedPayslip?.thang}/${selectedPayslip?.nam}`" width="650px" class="custom-dialog payslip-dialog responsive-dialog">
      <div id="printable-payslip" v-if="selectedPayslip" class="p-0 md:p-2 space-y-4 md:space-y-5">
        <div class="text-center border-b border-dashed border-slate-300 pb-3 md:pb-4">
          <h2 class="font-black text-xl md:text-2xl text-slate-800 uppercase tracking-wide">Laptop Store ERP</h2>
          <div class="mt-4 md:mt-5 text-left bg-gradient-to-r from-slate-50 to-blue-50/30 p-3 md:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border border-slate-100 print-border">
            <div>
              <p class="font-bold text-base md:text-lg text-slate-800">{{ currentUser.hoTen }}</p>
              <p class="text-xs md:text-sm text-slate-500 mt-0.5">Mã NV: <span class="font-semibold text-slate-700">{{ currentUser.maNhanVien }}</span> • {{ currentUser.tenChucVu }}</p>
            </div>
            <div class="sm:text-right mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 w-full sm:w-auto">
              <p class="text-[11px] md:text-xs text-slate-500 mb-0.5">Mức lương cơ sở:</p>
              <p class="text-base md:text-lg font-bold text-blue-600">{{ formatPrice(selectedPayslip.luongTheoGio) }}/h</p>
            </div>
          </div>
        </div>

        <div class="bg-emerald-50/50 p-3 md:p-4 rounded-xl border border-emerald-100 print-border">
          <h3 class="font-bold text-sm md:text-base text-emerald-800 border-b border-emerald-200 pb-2 mb-3 flex items-center gap-2"><el-icon><Plus /></el-icon> 1. CÁC KHOẢN THU NHẬP</h3>
          <div class="space-y-2 md:space-y-3">
            <div class="flex justify-between items-start gap-2">
              <div>
                <p class="text-slate-700 font-semibold text-xs md:text-sm">Lương hành chính</p>
                <p class="text-[10px] md:text-xs text-slate-500 italic mt-0.5">Công thức: {{ selectedPayslip.soGioLamBinhThuong }}h × {{ formatPrice(selectedPayslip.luongTheoGio) }}</p>
              </div>
              <span class="font-bold text-slate-800 text-sm md:text-base whitespace-nowrap">{{ formatPrice(selectedPayslip.luongCoBan) }}</span>
            </div>
            <div class="flex justify-between items-start gap-2" v-if="selectedPayslip.soGioTangCa > 0">
              <div>
                <p class="text-slate-700 font-semibold text-xs md:text-sm">Tiền tăng ca (OT)</p>
                <p class="text-[10px] md:text-xs text-slate-500 italic mt-0.5">Công thức: {{ selectedPayslip.soGioTangCa }}h × {{ formatPrice(selectedPayslip.luongTheoGio) }} × {{ selectedPayslip.heSoTangCa }}</p>
              </div>
              <span class="font-bold text-emerald-600 text-sm md:text-base whitespace-nowrap">+ {{ formatPrice(selectedPayslip.tongTienTangCa) }}</span>
            </div>
            <div class="flex justify-between items-center" v-if="selectedPayslip.phuCapChucVu > 0">
              <p class="text-slate-700 font-semibold text-xs md:text-sm">Phụ cấp chức vụ</p>
              <span class="font-bold text-emerald-600 text-sm md:text-base whitespace-nowrap">+ {{ formatPrice(selectedPayslip.phuCapChucVu) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <p class="text-slate-700 font-semibold text-xs md:text-sm">Phụ cấp cố định</p>
              <span class="font-bold text-emerald-600 text-sm md:text-base whitespace-nowrap">+ {{ formatPrice(selectedPayslip.phuCapKhac) }}</span>
            </div>
            <div class="flex justify-between items-center" v-if="selectedPayslip.thuong > 0">
              <p class="text-slate-700 font-semibold text-xs md:text-sm">Thưởng ngoại lệ</p>
              <span class="font-bold text-emerald-600 text-sm md:text-base whitespace-nowrap">+ {{ formatPrice(selectedPayslip.thuong) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-rose-50/50 p-3 md:p-4 rounded-xl border border-rose-100 print-border">
          <h3 class="font-bold text-sm md:text-base text-rose-800 border-b border-rose-200 pb-2 mb-3 flex items-center gap-2"><el-icon><Minus /></el-icon> 2. CÁC KHOẢN KHẤU TRỪ</h3>
          <div class="space-y-2 md:space-y-3">
            <div class="flex justify-between items-start gap-2">
              <div>
                <p class="text-slate-700 font-semibold text-xs md:text-sm">Phạt đi trễ</p>
                <p class="text-[10px] md:text-xs text-rose-500 italic mt-0.5" v-if="selectedPayslip.soPhutDiTre > 0">
                  {{ selectedPayslip.soPhutDiTre }} phút × {{ formatPrice(selectedPayslip.tienPhatDiTre) }}
                </p>
                <p class="text-[10px] md:text-xs text-emerald-500 italic mt-0.5" v-else>Không có vi phạm</p>
              </div>
              <span class="font-bold text-rose-600 text-sm md:text-base whitespace-nowrap" v-if="selectedPayslip.tongTienPhat > 0">- {{ formatPrice(selectedPayslip.tongTienPhat) }}</span>
              <span class="font-bold text-slate-400 text-sm md:text-base" v-else>0 ₫</span>
            </div>
            <div class="flex justify-between items-start gap-2">
              <div>
                <p class="text-slate-700 font-semibold text-xs md:text-sm">Khấu trừ Bảo hiểm</p>
              </div>
              <span class="font-bold text-rose-600 text-sm md:text-base whitespace-nowrap">- {{ formatPrice(selectedPayslip.truBaoHiem) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-600 p-4 md:p-5 rounded-xl text-white mt-4 flex justify-between items-center shadow-md shadow-blue-500/30 print-highlight">
          <div>
            <p class="text-blue-100 text-xs md:text-sm font-medium">THỰC LÃNH</p>
          </div>
          <span class="font-black text-2xl md:text-3xl">{{ formatPrice(selectedPayslip.thucLanh) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2 mt-2">
          <el-button @click="dialogPayslipVisible = false" class="w-full sm:w-auto">Đóng</el-button>
          <el-button type="primary" :icon="Printer" @click="printMonthlyPayslip" class="font-bold w-full sm:w-auto m-0">IN PHIẾU NÀY</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { User, Medal, Calendar, Key, Money, DocumentAdd, CircleCheck, Warning, Remove, Printer, Plus, Minus, Trophy, CollectionTag } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../../services/api';
import { usePagination } from '../../composables/usePagination';

// --- STATE QUẢN LÝ TÀI KHOẢN ---
const currentUser = ref({});
const activeTab = ref('attendance');

// STATE MỚI: DỮ LIỆU LỊCH SỬ THĂNG TIẾN
const myCareer = ref([]);

// Form Đổi thông tin
const updatingInfo = ref(false);
const formProfile = ref({ sdt: '', email: '', diaChi: '' });

// Form Đổi mật khẩu
const changingPass = ref(false);
const formPassword = ref({ oldPass: '', newPass: '', confirmPass: '' });

// State cho các Tab khác
const myAttendance = ref([]);
const selectedAttendanceMonth = ref(''); 
const filterAttendanceStatus = ref(''); 

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
    const resProfile = await api.get('/hr/profile/me');
    const profileData = resProfile.data?.data || resProfile.data;
    currentUser.value = profileData;
    formProfile.value = { sdt: profileData.sdt, email: profileData.email, diaChi: profileData.diaChi };

    const today = new Date();
    selectedAttendanceMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Gọi tải dữ liệu các tab
    await fetchAttendance();
    await fetchCareer(); // GỌI API LỊCH SỬ THĂNG TIẾN
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
// 1.5. TẢI LỊCH SỬ THĂNG TIẾN
// ==========================================
const fetchCareer = async () => {
  try {
    // Gọi route mà ta vừa khai báo ở backend
    const res = await api.get(`/hr/nhanvien/${currentUser.value.maNhanVien}/lichsu`);
    const raw = res.data || res;
    myCareer.value = raw?.data || raw || [];
  } catch (error) {
    console.error('Lỗi tải lộ trình công tác:', error);
  }
};

// ==========================================
// 2. TAB THÔNG TIN & BẢO MẬT
// ==========================================
const updateProfile = async () => {
  updatingInfo.value = true;
  try {
    const res = await api.put('/hr/profile/update-info', formProfile.value);
    if (res.data?.success || res.success) {
      ElMessage.success('Cập nhật thông tin thành công!');
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
  if (formPassword.value.newPass.length < 6) { ElMessage.error('Mật khẩu mới phải từ 6 ký tự!'); return; }
  if (formPassword.value.newPass !== formPassword.value.confirmPass) { ElMessage.error('Mật khẩu xác nhận không khớp!'); return; }
  
  changingPass.value = true;
  try {
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
    const res = await api.get(`/hr/chamcong?thang=${thang}&nam=${nam}&maNhanVien=${currentUser.value.maNhanVien}`);
    let ds = [];
    const raw = res.data || res;
    if (raw?.data?.data && Array.isArray(raw.data.data)) ds = raw.data.data;
    else if (raw?.data && Array.isArray(raw.data)) ds = raw.data;
    else if (Array.isArray(raw)) ds = raw;
    myAttendance.value = ds;
  } catch (error) { console.error(error); }
};

watch(selectedAttendanceMonth, () => { fetchAttendance(); });

const getAttendanceTagColor = (row) => {
  if (!row.gioVao) return 'info'; 
  if (row.gioVao > '08:00:00') return 'warning'; 
  return 'success'; 
};

const filteredAttendance = computed(() => {
  return myAttendance.value.filter(a => {
    const dateObj = new Date(a.ngayLamViec);
    const localYYYYMM = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const matchMonth = localYYYYMM === selectedAttendanceMonth.value;

    let matchStatus = true;
    if (filterAttendanceStatus.value) {
      const hasCheckedIn = !!a.gioVao;
      if (filterAttendanceStatus.value === 'Đúng giờ') {
        matchStatus = hasCheckedIn && a.gioVao <= '08:00:00';
      } else if (filterAttendanceStatus.value === 'Đi trễ') {
        matchStatus = hasCheckedIn && a.gioVao > '08:00:00';
      } else if (filterAttendanceStatus.value === 'Nghỉ') {
        matchStatus = !hasCheckedIn; 
      }
    }
    return matchMonth && matchStatus;
  });
});

const { 
  currentPage, 
  pageSize, 
  totalItems, 
  paginatedData 
} = usePagination(filteredAttendance, 10);

const countAttendanceStatus = (type) => {
  const listInMonth = myAttendance.value.filter(a => {
    const dateObj = new Date(a.ngayLamViec);
    const localYYYYMM = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    return localYYYYMM === selectedAttendanceMonth.value;
  });
  return listInMonth.filter(a => {
    const hasCheckedIn = !!a.gioVao; 
    if (type === 'Đúng giờ') return hasCheckedIn && a.gioVao <= '08:00:00';
    if (type === 'Đi trễ') return hasCheckedIn && a.gioVao > '08:00:00';
    if (type === 'Nghỉ') return !hasCheckedIn; 
  }).length;
};

// ==========================================
// 4. TAB PHIẾU LƯƠNG & ĐƠN TỪ (Giữ nguyên logic của bạn)
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
  } catch (error) {}
};
const openPayslipDetail = (slip) => { selectedPayslip.value = slip; dialogPayslipVisible.value = true; };
const selectedPayslipYear = ref(new Date().getFullYear().toString());
const filteredPayslips = computed(() => {
  if (!selectedPayslipYear.value) return myPayslips.value;
  return myPayslips.value.filter(slip => slip.nam.toString() === selectedPayslipYear.value.toString());
});
const printMonthlyPayslip = () => {
  localStorage.setItem('print_payslip_data', JSON.stringify({ type: 'month', user: currentUser.value, data: selectedPayslip.value }));
  window.open('/print-payslip', '_blank');
};
const printYearlySummary = () => {
  if (!selectedPayslipYear.value) { ElMessage.warning('Vui lòng chọn năm cần in!'); return; }
  localStorage.setItem('print_payslip_data', JSON.stringify({ type: 'year', year: selectedPayslipYear.value, user: currentUser.value, data: filteredPayslips.value }));
  window.open('/print-payslip', '_blank');
};

const fetchLeaves = async () => {
  try {
    const res = await api.get('/hr/dontu/canhan');
    const raw = res.data || res;
    let ds = [];
    if (raw?.data?.data && Array.isArray(raw.data.data)) ds = raw.data.data;
    else if (raw?.data && Array.isArray(raw.data)) ds = raw.data;
    else if (Array.isArray(raw)) ds = raw;
    myLeaves.value = ds;
  } catch (error) {}
};
const submitLeave = async () => {
  if (!formLeave.value.dateRange || formLeave.value.dateRange.length === 0) { ElMessage.error('Vui lòng chọn thời gian!'); return; }
  try {
    const payload = { loaiDon: formLeave.value.loaiDon, ngayBatDau: formLeave.value.dateRange[0], ngayKetThuc: formLeave.value.dateRange[1], lyDo: formLeave.value.lyDo };
    const res = await api.post('/hr/dontu', payload);
    if (res.data?.success || res.success) {
      ElMessage.success('Gửi đơn xin nghỉ thành công!');
      dialogLeaveVisible.value = false; 
      formLeave.value = { loaiDon: 'Nghỉ phép năm', dateRange: [], lyDo: '' };
      fetchLeaves();
    }
  } catch (error) { ElMessage.error(error.response?.data?.message || 'Lỗi gửi đơn'); }
};

// ==========================================
// TIỆN ÍCH DÙNG CHUNG
// ==========================================
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
const formatDateVN = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
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
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) {
  :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; }
}
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
:deep(.payslip-dialog .el-dialog__body) { padding-top: 10px; padding-bottom: 20px; }
:deep(.custom-tabs .el-tabs__nav-wrap::after) { background-color: transparent; }

/* Làm cho Tabs cuộn ngang được trên Mobile */
:deep(.custom-tabs .el-tabs__nav-scroll) { overflow-x: auto; overflow-y: hidden; }
:deep(.custom-tabs .el-tabs__nav) { white-space: nowrap; }
:deep(.custom-tabs .el-tabs__item) { font-weight: 600; font-size: 13px; color: #64748b; padding: 0 16px; }
@media (min-width: 768px) {
  :deep(.custom-tabs .el-tabs__item) { font-size: 15px; padding: 0 24px; }
}
:deep(.custom-tabs .el-tabs__item.is-active) { color: #2563eb; }
:deep(.custom-tabs .el-tabs__active-bar) { background-color: #2563eb; height: 3px; border-radius: 3px; }

/* Ẩn scrollbar khi cuộn Tabs trên điện thoại */
:deep(.custom-tabs .el-tabs__nav-scroll::-webkit-scrollbar) { display: none; }

/* Ép Dialog ôm vừa vặn trên PC, tự động thu nhỏ trên Mobile */
:deep(.responsive-dialog) {
  max-width: 95vw !important;
}
</style>