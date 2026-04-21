<template>
  <div class="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-slate-100 -m-4 lg:-m-8 overflow-hidden"> 
    
    <div class="flex-1 flex flex-col min-w-0 bg-slate-50 lg:border-r border-slate-200 h-[50vh] lg:h-full overflow-hidden">
      
      <div class="p-3 lg:p-4 bg-white shadow-sm z-10 flex gap-4 items-center border-b-4 border-blue-500 shrink-0">
        <el-input 
          v-model="scanInput" 
          placeholder="Quét MÃ VẠCH (Enter)..." 
          :prefix-icon="FullScreen"
          class="flex-1 !text-base lg:!text-lg custom-scan-input"
          size="large"
          clearable
          @keyup.enter="handleScanBarcode"
          ref="scanInputRef"
        >
          <template #append>
            <el-button type="primary" @click="handleScanBarcode" class="font-bold">THÊM</el-button>
          </template>
        </el-input>
      </div>

      <div class="flex-1 overflow-y-auto p-3 lg:p-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1 shrink-0">
          <h3 class="font-bold text-slate-700 hidden sm:block">Danh mục sản phẩm</h3>
          <el-input v-model="searchQuery" placeholder="Tìm tên SP..." class="w-full sm:!w-64" :prefix-icon="Search" />
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-4">
          <div 
            v-for="item in filteredProducts" 
            :key="item.maSP"
            @click="autoPickSerialAndAdd(item)"
            class="bg-white rounded-xl p-2.5 lg:p-3 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 transition-all border border-slate-200 flex flex-col group relative overflow-hidden"
          >
            <div class="aspect-video bg-transparent rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
              <img 
                :src="getImageUrl(item.hinhAnh)" 
                class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
                @error="(e) => e.target.src = DEFAULT_IMAGE"
              />
              
              <div v-if="item.soLuongTonThucTe === 0" class="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm z-10">
                <span class="bg-red-500 text-white text-[10px] lg:text-xs font-bold px-2 lg:px-3 py-1 rounded-full uppercase">Hết hàng</span>
              </div>
            </div>

            <div class="flex-1 flex flex-col justify-between min-w-0">
              <div class="min-w-0">
                <p class="text-[10px] lg:text-xs text-slate-400 mb-0.5 font-mono font-semibold">SP{{ String(item.maSP).padStart(3, '0') }}</p>
                <h3 class="font-semibold text-slate-800 text-xs lg:text-sm leading-tight line-clamp-2" :title="item.tenSP">{{ item.tenSP }}</h3>
                
                <div class="mt-1 w-full">
                  <span class="block text-[10px] lg:text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded truncate w-full" :title="item.cauHinh">
                    {{ item.cauHinh || 'Không có cấu hình' }}
                  </span>
                </div>
              </div>

              <div class="mt-2.5 flex items-end justify-between gap-1">
                <p class="font-bold text-blue-600 text-sm lg:text-lg truncate">{{ formatPrice(item.giaBan) }}</p>
                <p class="text-[10px] lg:text-xs font-medium px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-md whitespace-nowrap shrink-0" :class="item.soLuongTonThucTe > 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                  Tồn: {{ item.soLuongTonThucTe }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-[400px] xl:w-[480px] h-[50vh] lg:h-full bg-white flex flex-col shadow-[0_-4px_15px_rgba(0,0,0,0.05)] lg:shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-20 shrink-0 border-t lg:border-t-0">
      
      <div class="p-3 lg:p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 min-h-[60px] lg:min-h-[72px] shrink-0">
        <el-icon class="text-lg lg:text-xl text-blue-500"><UserFilled /></el-icon>
        
        <el-input 
          v-if="!selectedCustomer"
          v-model="searchCustomerPhone" 
          placeholder="Nhập SĐT khách (Enter)..." 
          class="flex-1" 
          size="default"
          @keyup.enter="handleSearchCustomer"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearchCustomer" />
          </template>
        </el-input>

        <div v-else class="flex-1 flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 lg:py-2 rounded-lg relative overflow-hidden">
          <div class="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
          <div>
            <p class="font-bold text-blue-800 text-xs lg:text-sm leading-tight flex items-center gap-2">
              {{ selectedCustomer.tenKH }}
            </p>
            <p class="text-[10px] lg:text-xs text-blue-500 mt-0.5">{{ selectedCustomer.sdt }}</p>
          </div>
          <el-button type="danger" link :icon="Delete" @click="clearCustomer" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 bg-slate-50">
        
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
          <el-icon class="text-4xl lg:text-6xl mb-3 lg:mb-4"><ShoppingCart /></el-icon>
          <p class="text-base lg:text-lg">Chưa có sản phẩm nào</p>
          <p class="text-xs lg:text-sm text-center px-4">Quét hoặc chọn sản phẩm để thêm vào hóa đơn</p>
        </div>

        <div 
          v-for="(cartItem, index) in cart" 
          :key="cartItem.maSP"
          class="bg-white p-2.5 lg:p-3 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-2 relative group"
        >
          <div class="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
            <div class="min-w-0">
              <h4 class="font-bold text-slate-800 text-xs lg:text-sm leading-tight truncate">{{ cartItem.tenSP }}</h4>
              <span class="text-[10px] lg:text-xs text-slate-500">{{ formatPrice(cartItem.giaBan) }} x {{ cartItem.serials.length }}</span>
            </div>
            <p class="font-black text-blue-600 text-sm lg:text-base shrink-0">{{ formatPrice(cartItem.giaBan * cartItem.serials.length) }}</p>
          </div>
          
          <div class="pt-1 flex flex-wrap gap-1.5">
            <el-tag 
              v-for="serial in cartItem.serials" 
              :key="serial"
              closable 
              @close="removeSerialFromCart(index, serial)"
              type="info" effect="plain"
              class="font-mono text-[10px] lg:text-xs border-slate-300 text-slate-700 bg-slate-50"
            >
              <el-icon class="mr-1"><FullScreen /></el-icon> {{ serial }}
            </el-tag>
          </div>
        </div>
      </div>

      <div class="bg-white border-t border-slate-200 p-3 lg:p-5 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] shrink-0">
        <div class="space-y-2 lg:space-y-3 text-slate-600 text-xs lg:text-sm mb-3 lg:mb-4">
          
          <!-- Payment Method Selector -->
          <div class="bg-slate-50 p-2 rounded-xl border border-slate-200 mt-4">
             <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Phương thức thanh toán</span>
                <el-radio-group v-model="paymentMethod" size="small" class="!flex">
                  <el-radio-button label="Tiền mặt" />
                  <el-radio-button label="Chuyển khoản" />
                </el-radio-group>
             </div>

             <div v-if="paymentMethod === 'Tiền mặt'" class="space-y-2">
                <div class="flex justify-between items-center">
                  <span>Khách đưa:</span>
                  <el-input v-model="customerMoney" placeholder="Nhập tiền..." class="!w-28 lg:!w-36" size="small">
                    <template #append>₫</template>
                  </el-input>
                </div>
                <!-- Smart Validation Messages -->
                <div v-if="customerMoneyRaw" class="text-[10px] text-right space-y-1">
                  <p v-if="Number(customerMoneyRaw) % 1000 !== 0" class="text-red-500 italic font-semibold">
                    * Tiền mặt không được có số lẻ dưới 1.000đ
                  </p>
                  <p v-if="!isCashReasonable && Number(customerMoneyRaw) >= cartTotal" class="text-red-500 italic font-bold">
                    * Số tiền vô lý! (Vượt quá mốc thanh toán logic)
                  </p>
                </div>
                <div class="flex justify-between items-center pt-1 border-t border-slate-100" :class="changeMoney < 0 ? 'text-red-500' : 'text-emerald-600'">
                  <span class="font-bold">Tiền thừa:</span>
                  <span class="font-bold">{{ formatPrice(changeMoney > 0 ? changeMoney : 0) }}</span>
                </div>
             </div>

             <div v-else class="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div class="bg-white p-2 rounded-lg shadow-sm border border-blue-200 flex items-center justify-center shrink-0">
                   <!-- Inline SVG Logo VNPay chuẩn -->
                   <svg width="60" height="20" viewBox="0 0 162 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.1563 35.25L0 0H7.78125L21.8438 27.6562L35.9062 0H43.6875L25.5312 35.25H18.1563Z" fill="#005BAA"/>
                      <path d="M68.0625 35.25L53.4375 10.9688V35.25H46.125V0H53.5312L68.1562 24.2812V0H75.4688V35.25H68.0625Z" fill="#005BAA"/>
                      <path d="M84.1875 19.5V35.25H77.1562V0H93.0938C100.969 0 106.312 4.40625 106.312 11.25C106.312 18.0938 100.969 22.5 93.0938 22.5H84.1875V19.5ZM84.1875 16.5H93.0938C96.9375 16.5 99.2812 14.5312 99.2812 11.25C99.2812 7.96875 96.9375 6 93.0938 6H84.1875V16.5Z" fill="#E41F26"/>
                      <path d="M129.562 35.25L127.125 28.5938H113.812L111.375 35.25H104.062L117.188 0H123.75L136.875 35.25H129.562ZM115.688 23.4375H125.25L120.469 10.4062L115.688 23.4375Z" fill="#E41F26"/>
                      <path d="M149.25 19.5938L138 0H145.594L152.906 13.0312L160.219 0H167.812L156.562 19.5938V35.25H149.25V19.5938Z" fill="#E41F26"/>
                   </svg>
                </div>
                <div class="flex-1">
                   <p class="text-[11px] font-black text-indigo-700 uppercase tracking-tight">Cổng thanh toán VNPay</p>
                   <p class="text-[10px] text-indigo-500 leading-tight">An toàn - Nhanh chóng - Tiện lợi</p>
                </div>
             </div>
          </div>
        </div>

        <el-button 
          type="primary" 
          class="w-full !h-12 lg:!h-14 text-base lg:text-lg font-bold shadow-lg shadow-blue-500/30 !rounded-xl"
          :disabled="cart.length === 0 || (paymentMethod === 'Tiền mặt' && (changeMoney < 0 || !isCashReasonable))"
          @click="processCheckout"
        >
          <div class="flex items-center justify-center gap-2">
            <el-icon><CreditCard /></el-icon> {{ paymentMethod === 'Tiền mặt' ? 'THANH TOÁN & IN' : 'THANH TOÁN VNPAY' }}
          </div>
        </el-button>
      </div>

    </div>
  </div>

  <!-- XÓA QR DIALOG VÌ ĐÃ DÙNG VNPAY -->

  <el-dialog v-model="dialogNewCustomerVisible" title="THÊM KHÁCH HÀNG MỚI" width="400px" class="custom-dialog">
    <el-form label-position="top">
      <el-form-item label="Số điện thoại">
        <el-input v-model="newCustomerForm.sdt" disabled class="font-bold" />
      </el-form-item>
      <el-form-item label="Tên khách hàng (*)">
        <el-input v-model="newCustomerForm.tenKH" placeholder="Nhập họ và tên..." ref="newCustomerNameRef" />
      </el-form-item>
      <el-form-item label="Địa chỉ (Không bắt buộc)">
        <el-input v-model="newCustomerForm.diaChi" placeholder="Nhập địa chỉ..." />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogNewCustomerVisible = false">Hủy</el-button>
      <el-button type="primary" @click="saveNewCustomer" class="font-bold">LƯU & ÁP DỤNG</el-button>
    </template>
  </el-dialog>

  <BillPrintDialog ref="billDialogRef" />
</template>

<script setup>
import BillPrintDialog from './BillPrintDialog.vue';
import { ref, computed, onMounted, nextTick } from 'vue';
import { Search, ShoppingCart, UserFilled, Monitor, Money, FullScreen, Delete, CreditCard } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import api from '../../services/api'; // Gọi 'xe chở hàng' Axios

// --- STATE: DỮ LIỆU TỪ API ---
const dbSanPham = ref([]);
const dbMayTinh = ref([]);
const dbKhachHang = ref([]);

// --- STATE: GIAO DIỆN & GIỎ HÀNG ---
const scanInput = ref('');
const searchQuery = ref('');
const cart = ref([]); 
const scanInputRef = ref(null);
const billDialogRef = ref(null);

const searchCustomerPhone = ref('');
const selectedCustomer = ref(null);

// Dialog Khách hàng mới
const dialogNewCustomerVisible = ref(false);
const newCustomerForm = ref({ sdt: '', tenKH: '', diaChi: '' });
const newCustomerNameRef = ref(null);

const customerMoneyRaw = ref('');
const paymentMethod = ref('Tiền mặt');
const showQrDialog = ref(false);

// Thông tin ngân hàng của shop (Bạn có thể sửa ở đây)
const shopBank = {
    bankId: 'MSB', // MSB (Maritime Bank)
    accountNo: '0988776655', // THAY SỐ TÀI KHOẢN MSB CỦA BẠN VÀO ĐÂY
    accountName: 'TEN CUA BAN' // THAY TÊN CỦA BẠN VÀO ĐÂY (VIẾT HOA KHÔNG DẤU)
};

const transferInfo = computed(() => {
    // Tạo nội dung chuyển khoản ngẫu nhiên hoặc dựa trên thời gian
    const randomId = Math.random().toString(36).substring(7).toUpperCase();
    return {
        amount: cartTotal.value,
        description: `CHIE_LAPTOP_${randomId}`
    }
});

const vietQrUrl = computed(() => {
    return `https://img.vietqr.io/image/${shopBank.bankId}-${shopBank.accountNo}-compact.png?amount=${transferInfo.value.amount}&addInfo=${transferInfo.value.description}&accountName=${encodeURIComponent(shopBank.accountName)}`;
});

// ==========================================
// 1. HÀM GỌI API KHỞI TẠO DỮ LIỆU BAN ĐẦU
// ==========================================
const loadInitialData = async () => {
  const loading = ElLoading.service({ lock: true, text: 'Đang chuẩn bị quầy thu ngân...', background: 'rgba(255, 255, 255, 0.8)' });
  try {
    const [resSP, resMayTinh, resKH] = await Promise.all([
      api.get('/inventory/sanpham?limit=10000'), 
      api.get('/inventory/maytinh?limit=10000'), 
      api.get('/sales/khachhang?limit=10000')
    ]);

    // 1. Chỉ lấy các Sản phẩm đang Kinh doanh
    const tatCaSanPham = resSP.data || [];
    dbSanPham.value = tatCaSanPham.filter(sp => sp.trangThai === 1);
    
    // 2. CHỐT CHẶN QUAN TRỌNG: Chỉ nạp lên quầy thu ngân những Serial có trạng thái "Trong kho"
    const tatCaMayTinh = resMayTinh.data || [];
    dbMayTinh.value = tatCaMayTinh.filter(m => 
        m.trangThai && 
        m.trangThai.toString().trim() === 'Trong kho'
    );
    
    dbKhachHang.value = resKH.data || [];

  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
    ElMessage.error('Không thể kết nối với máy chủ!');
  } finally {
    loading.close();
    if (scanInputRef.value) scanInputRef.value.focus();
  }
};

onMounted(() => {
  loadInitialData();
  
  // KIỂM TRA NẾU QUAY VỀ TỪ VNPAY
  const urlParams = new URLSearchParams(window.location.search);
  const vnpResponseCode = urlParams.get('vnp_ResponseCode');
  
  if (vnpResponseCode === '00') {
      // 1. Lấy lại dữ liệu giỏ hàng đã lưu trước khi đi sang VNPay
      const savedData = localStorage.getItem('vnpay_pending_checkout');
      if (savedData) {
          const { customer, total, paidAmount, serials, cartItems, method } = JSON.parse(savedData);
          
          // 2. Tự động hoàn tất hóa đơn với đúng phương thức đã lưu
          finalizeCheckout(customer, total, paidAmount, serials, cartItems, method || 'Chuyển khoản');
          
          ElMessageBox.alert('Thanh toán qua VNPay thành công! Hóa đơn đã được tạo.', 'THÀNH CÔNG', {
              confirmButtonText: 'Đã hiểu',
              type: 'success'
          });
          
          // 3. Dọn dẹp
          localStorage.removeItem('vnpay_pending_checkout');
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
  } else if (vnpResponseCode && vnpResponseCode !== '00') {
      ElMessage.error('Thanh toán VNPay thất bại hoặc đã bị hủy.');
      localStorage.removeItem('vnpay_pending_checkout');
      window.history.replaceState({}, document.title, window.location.pathname);
  }
});

// ==========================================
// 2. TÍNH TOÁN HIỂN THỊ SẢN PHẨM & KHO
// ==========================================
const filteredProducts = computed(() => {
  return dbSanPham.value.filter(sp => {
    const matchSearch = sp.tenSP?.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        sp.maSP?.toString().includes(searchQuery.value);
    
    if (matchSearch) {
      const cacMayTrongKho = dbMayTinh.value.filter(mt => Number(mt.maSP) === Number(sp.maSP));
      
      const itemTrongGio = cart.value.find(c => Number(c.maSP) === Number(sp.maSP));
      const soLuongDaChon = itemTrongGio ? itemTrongGio.serials.length : 0;
      
      sp.soLuongTonThucTe = cacMayTrongKho.length - soLuongDaChon;
      
      // Chỉ hiển thị nếu Tồn thực tế lớn hơn 0
      return sp.soLuongTonThucTe > 0;
    }
    return false;
  });
});

// ==========================================
// 3. TÍNH TOÁN TIỀN BẠC
// ==========================================
const customerMoney = computed({
  get: () => {
    if (!customerMoneyRaw.value) return '';
    return new Intl.NumberFormat('vi-VN').format(customerMoneyRaw.value);
  },
  set: (val) => { 
    customerMoneyRaw.value = val.replace(/[^0-9]/g, ''); 
  }
});

const totalMachines = computed(() => cart.value.reduce((sum, item) => sum + item.serials.length, 0));
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + (item.giaBan * item.serials.length), 0));
const finalTotal = computed(() => cartTotal.value); 
const changeMoney = computed(() => {
  const rawString = String(customerMoneyRaw.value || customerMoney.value || '0').replace(/[^0-9]/g, '');
  const moneyGiven = parseInt(rawString) || 0;
  return moneyGiven - finalTotal.value; 
});

const isCashReasonable = computed(() => {
  if (paymentMethod.value === 'Chuyển khoản') return true;
  if (!customerMoneyRaw.value) return true;
  const money = Number(customerMoneyRaw.value);
  if (money < cartTotal.value) return true; // Để hiện lỗi Tiền thừa < 0 màu đỏ thay vì chặn nút sớm quá
  
  // 1. Phải chia hết cho 1000
  if (money % 1000 !== 0) return false;
  
  // 2. Logic mốc tối đa: Làm tròn lên 1 triệu gần nhất
  // Ví dụ: 12.570.000 -> Max là 13.000.000
  const nextMillion = Math.ceil(cartTotal.value / 1000000) * 1000000;
  
  // Nếu tổng đã là số tròn triệu (VD: 12.000.000), cho phép khách đưa thêm tối đa 500k lẻ
  const limit = (cartTotal.value % 1000000 === 0) ? cartTotal.value + 500000 : nextMillion;
  
  return money <= limit;
});

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

// ==========================================
// 4. KHÁCH HÀNG (TÌM KIẾM & THÊM API)
// ==========================================
const handleSearchCustomer = () => {
  const phone = searchCustomerPhone.value.trim();
  if (!phone) return;

  const kh = dbKhachHang.value.find(k => k.sdt === phone);
  if (kh) {
    selectedCustomer.value = kh;
    ElMessage.success(`Đã áp dụng khách hàng: ${kh.tenKH}`);
  } else {
    newCustomerForm.value = { sdt: phone, tenKH: '', diaChi: '' };
    dialogNewCustomerVisible.value = true;
    nextTick(() => { if (newCustomerNameRef.value) newCustomerNameRef.value.focus(); });
  }
};

const saveNewCustomer = async () => {
  if (!newCustomerForm.value.tenKH.trim()) {
    ElMessage.error("Vui lòng nhập Tên khách hàng!"); return;
  }
  
  try {
    // Gọi API thêm khách hàng xuống Backend
    const res = await api.post('/sales/khachhang', newCustomerForm.value);
    
    const newKh = {
      maKH: res.maKH, // Lấy ID vừa được tạo từ Backend
      sdt: newCustomerForm.value.sdt,
      tenKH: newCustomerForm.value.tenKH,
      diaChi: newCustomerForm.value.diaChi
    };
    
    dbKhachHang.value.push(newKh); // Cập nhật danh sách local
    selectedCustomer.value = newKh; // Áp dụng ngay vào giỏ hàng
    
    dialogNewCustomerVisible.value = false;
    ElMessage.success("Thêm khách hàng thành công!");
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'Lỗi khi thêm khách hàng');
  }
};

const clearCustomer = () => {
  selectedCustomer.value = null;
  searchCustomerPhone.value = '';
};

// ==========================================
// 5. XỬ LÝ QUÉT MÃ VẠCH (SERIAL)
// ==========================================
const handleScanBarcode = () => {
  const serialScanned = scanInput.value.trim().toUpperCase();
  if (!serialScanned) return;

  const mayTimThay = dbMayTinh.value.find(mt => mt.maMay === serialScanned);
  if (!mayTimThay) { 
    ElMessage.error(`Không tìm thấy Serial: ${serialScanned} hoặc máy đã bán!`); 
    scanInput.value = ''; return; 
  }

  let isAlreadyInCart = false;
  cart.value.forEach(item => { if (item.serials.includes(serialScanned)) isAlreadyInCart = true; });
  if (isAlreadyInCart) { 
    ElMessage.warning(`Serial ${serialScanned} đang có trong giỏ hàng!`); 
    scanInput.value = ''; return; 
  }

  const thongTinSP = dbSanPham.value.find(sp => sp.maSP === mayTimThay.maSP);
  if(!thongTinSP) {
      ElMessage.error(`Lỗi dữ liệu: Không tìm thấy thông tin Sản phẩm của Serial này.`);
      scanInput.value = ''; return; 
  }

  addItemToCart(thongTinSP, mayTimThay.maMay);
  ElMessage.success(`Đã thêm: ${serialScanned}`);
  scanInput.value = ''; 
  if (scanInputRef.value) scanInputRef.value.focus();
};

const autoPickSerialAndAdd = (product) => {
  if (product.soLuongTonThucTe <= 0) return;
  const cacMayTrongKho = dbMayTinh.value.filter(mt => mt.maSP === product.maSP);
  const itemTrongGio = cart.value.find(c => c.maSP === product.maSP);
  const serialsDaChon = itemTrongGio ? itemTrongGio.serials : [];
  
  // Tìm 1 máy chưa nằm trong giỏ hàng
  const mayAvailable = cacMayTrongKho.find(mt => !serialsDaChon.includes(mt.maMay));
  if (mayAvailable) addItemToCart(product, mayAvailable.maMay);
};

const addItemToCart = (sanPham, maMay) => {
  let item = cart.value.find(c => c.maSP === sanPham.maSP);
  if (item) item.serials.push(maMay);
  else cart.value.push({ maSP: sanPham.maSP, tenSP: sanPham.tenSP, giaBan: sanPham.giaBan, serials: [maMay] });
};

const removeSerialFromCart = (cartIndex, serialToRemove) => {
  const item = cart.value[cartIndex];
  item.serials = item.serials.filter(s => s !== serialToRemove);
  if (item.serials.length === 0) cart.value.splice(cartIndex, 1);
};

// ==========================================
// 6. THANH TOÁN (GỌI API BÁN HÀNG)
// ==========================================
const processCheckout = () => {
  // Ràng buộc nếu bán cho khách lẻ nhưng chưa có thông tin
  if (!selectedCustomer.value) {
    ElMessage.warning('Vui lòng chọn hoặc nhập khách hàng trước khi thanh toán!');
    if (scanInputRef.value) scanInputRef.value.focus();
    return;
  }

  // BƯỚC 1: "Chụp ảnh" (Snapshot) toàn bộ dữ liệu hiện tại
  const currentCart = JSON.parse(JSON.stringify(cart.value));
  const currentTotal = finalTotal.value;
  const currentCustomer = selectedCustomer.value;
  const mangSerial = cart.value.flatMap(item => item.serials);
  
  let khachDua = currentTotal;
  if (paymentMethod.value === 'Tiền mặt') {
      const rawString = String(customerMoneyRaw.value || customerMoney.value || '0').replace(/[^0-9]/g, '');
      khachDua = parseInt(rawString) || 0;
      if (khachDua % 1000 !== 0) {
        ElMessage.warning('Số tiền khách đưa phải là bội số của 1.000đ!');
        return;
      }
  }

  ElMessageBox.confirm(
    `Xác nhận thanh toán <b>${paymentMethod.value}</b> cho hóa đơn <b>${formatPrice(currentTotal)}</b>?`,
    'TẠO HÓA ĐƠN XUẤT',
    { confirmButtonText: 'Xác nhận', cancelButtonText: 'Hủy', type: 'success', dangerouslyUseHTMLString: true }
  ).then(async () => {
    const loading = ElLoading.service({ lock: true, text: 'Đang xử lý...' });
    
    try {
      if (paymentMethod.value === 'Chuyển khoản') {
        const paymentRes = await api.post('/sales/create-vnpay-url', {
          amount: currentTotal,
          orderDescription: transferInfo.value.description,
          orderType: 'other',
          language: 'vn'
        });

        loading.close();
        
        if (paymentRes && paymentRes.redirectUrl) {
            // LƯU TRẠNG THÁI TRƯỚC KHI RỜI TRANG
            localStorage.setItem('vnpay_pending_checkout', JSON.stringify({
                customer: currentCustomer,
                total: currentTotal,
                paidAmount: khachDua,
                serials: mangSerial,
                cartItems: currentCart,
                method: paymentMethod.value // Lưu thêm phương thức thanh toán
            }));

            // Chuyển hướng sang VNPay
            window.location.href = paymentRes.redirectUrl;
        } else {
            ElMessage.error(paymentRes?.message || 'Không thể khởi tạo cổng thanh toán VNPay');
        }
      } else {
        await finalizeCheckout(currentCustomer, currentTotal, khachDua, mangSerial, currentCart);
        loading.close();
      }
    } catch (error) {
      loading.close();
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi kết nối cổng thanh toán';
      ElMessage.error(errorMsg);
    }
  }).catch(() => {});
};

const finalizeCheckout = async (customer, total, paidAmount, serials, cartItems, customMethod = null) => {
    const finalMethod = customMethod || paymentMethod.value;
    
    const payload = {
      maKH: customer.maKH,
      giamGia: 0, 
      thanhTien: total, 
      tienKhachDua: paidAmount,
      mangSerial: serials,
      phuongThucThanhToan: finalMethod
    };

    try {
      const response = await api.post('/sales/hoadon', payload);
      ElMessage.success('Thanh toán thành công!');

      if (billDialogRef.value) {
        billDialogRef.value.openBill({
          maHoaDon: response.maHoaDon || response.data?.maHoaDon || 'HD-' + Date.now(),
          items: cartItems, 
          tongTien: total,
          giamGia: 0,
          khachDua: paidAmount, 
          tenKhachHang: customer.tenKH,
          phuongThuc: finalMethod
        });
      }

      cart.value = []; 
      customerMoneyRaw.value = '';
      paymentMethod.value = 'Tiền mặt';
      clearCustomer(); 
      loadInitialData();
    } catch (error) {
      ElMessage.error('Lỗi khi lưu hóa đơn: ' + (error.response?.data?.message || error.message));
    }
};

// ==========================================
// 7. HỖ TRỢ HIỂN THỊ ẢNH
// ==========================================
const BASE_API_URL = api.defaults.baseURL.replace('/api/v1', '');
const DEFAULT_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

const getImageUrl = (path) => {
  if (!path || path === '' || path === 'null') return DEFAULT_IMAGE; 
  if (path.startsWith('http')) return path; 
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_API_URL}${safePath}`; 
};
</script>

<style scoped>
:deep(.custom-scan-input .el-input__wrapper) { background-color: #fff; box-shadow: none; font-family: monospace; font-weight: bold; }
:deep(.custom-scan-input .el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px transparent inset !important; }
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
.overflow-y-auto::-webkit-scrollbar { width: 6px; }
.overflow-y-auto::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
</style>