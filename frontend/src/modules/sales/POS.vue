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
          
          <div class="flex justify-between border-b border-slate-100 pb-1.5 lg:pb-2">
            <span>Tổng số lượng:</span>
            <span class="font-bold text-slate-800">{{ totalMachines }} máy</span>
          </div>
          
          <div class="flex justify-between items-center text-base lg:text-lg mt-2 pt-1 lg:pt-2">
            <span class="font-bold text-slate-800">CẦN TRẢ</span>
            <span class="font-black text-blue-600 text-xl lg:text-2xl">{{ formatPrice(cartTotal) }}</span>
          </div>

          <div class="flex justify-between items-center pt-1 lg:pt-2">
            <span>Khách đưa:</span>
            <el-input v-model="customerMoney" placeholder="Nhập tiền..." class="!w-28 lg:!w-36" size="small">
              <template #append>₫</template>
            </el-input>
          </div>
          
          <div class="flex justify-between items-center" :class="changeMoney < 0 ? 'text-red-500' : 'text-emerald-600'">
            <span class="font-bold">Tiền thừa:</span>
            <span class="font-bold">{{ formatPrice(changeMoney > 0 ? changeMoney : 0) }}</span>
          </div>
        </div>

        <el-button 
          type="primary" 
          class="w-full !h-12 lg:!h-14 text-base lg:text-lg font-bold shadow-lg shadow-blue-500/30 !rounded-xl"
          :disabled="cart.length === 0 || changeMoney < 0"
          @click="processCheckout"
        >
          <div class="flex items-center justify-center gap-2">
            <el-icon><Money /></el-icon> THANH TOÁN & IN
          </div>
        </el-button>
      </div>

    </div>
  </div>

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
import { Search, ShoppingCart, UserFilled, Monitor, Money, FullScreen, Delete } from '@element-plus/icons-vue';
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
  get: () => customerMoneyRaw.value,
  set: (val) => { customerMoneyRaw.value = val.replace(/[^0-9]/g, ''); }
});

const totalMachines = computed(() => cart.value.reduce((sum, item) => sum + item.serials.length, 0));
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + (item.giaBan * item.serials.length), 0));
const finalTotal = computed(() => cartTotal.value); 
const changeMoney = computed(() => {
  const rawString = String(customerMoneyRaw.value || customerMoney.value || '0').replace(/[^0-9]/g, '');
  const moneyGiven = parseInt(rawString) || 0;
  
  return moneyGiven - finalTotal.value; 
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
  
  // SỬA LỖI Ở ĐÂY: Gọt sạch ký tự dấu phẩy trước khi chuyển thành số
  const rawString = String(customerMoneyRaw.value || customerMoney.value || '0').replace(/[^0-9]/g, '');
  let khachDua = parseInt(rawString) || 0;
  
  if (khachDua < currentTotal) {
    khachDua = currentTotal; 
  }

  ElMessageBox.confirm(
    `Xuất bán <b>${totalMachines.value} máy</b>. Tổng phải thu: <b class="text-blue-600">${formatPrice(currentTotal)}</b>?`,
    'TẠO HÓA ĐƠN XUẤT',
    { confirmButtonText: 'Lưu & In', cancelButtonText: 'Hủy', type: 'success', dangerouslyUseHTMLString: true }
  ).then(async () => {
    
    // Payload Backend
    const payloadBackend = {
      maKH: currentCustomer.maKH,
      giamGia: 0, 
      thanhTien: currentTotal, 
      tienKhachDua: khachDua,
      mangSerial: mangSerial
    };

    try {
      const loading = ElLoading.service({ lock: true, text: 'Đang xử lý hóa đơn...' });
      
      // Gọi API POST tạo hóa đơn
      const response = await api.post('/sales/hoadon', payloadBackend);
      
      loading.close();
      ElMessage.success('Thanh toán thành công!');

      if (billDialogRef.value) {
        billDialogRef.value.openBill({
          maHoaDon: response.data?.maHoaDon || response.data?.data?.maHoaDon || response.data?.data?.maHD || 'HD-NEW',
          items: currentCart, 
          tongTien: currentTotal,
          giamGia: 0,
          khachDua: khachDua, 
          tenKhachHang: currentCustomer.tenKH
        });
      }

      cart.value = []; 
      customerMoneyRaw.value = '';
      clearCustomer(); 
      loadInitialData(); // Load lại kho để cập nhật số lượng tồn

    } catch (error) {
      ElMessage.error(error.response?.data?.message || 'Lỗi hệ thống khi tạo hóa đơn');
    }
  }).catch(() => {}); // Hủy confirm
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