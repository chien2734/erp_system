<template>
  <div class="flex h-[calc(100vh-64px)] bg-slate-100 -m-8"> 
    
    <div class="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200">
      
      <div class="p-4 bg-white shadow-sm z-10 flex gap-4 items-center border-b-4 border-blue-500">
        <el-input 
          v-model="scanInput" 
          placeholder="Quét MÃ VẠCH: Nhập Serial Number (maMay) và nhấn Enter..." 
          :prefix-icon="FullScreen"
          class="flex-1 !text-lg custom-scan-input"
          size="large"
          clearable
          @keyup.enter="handleScanBarcode"
          ref="scanInputRef"
        >
          <template #append>
            <el-button type="primary" @click="handleScanBarcode" class="font-bold">TÌM & THÊM</el-button>
          </template>
        </el-input>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div class="flex items-center justify-between mb-4 px-1">
          <h3 class="font-bold text-slate-700">Tra cứu danh mục sản phẩm</h3>
          <el-input v-model="searchQuery" placeholder="Tìm tên SP..." class="!w-64" :prefix-icon="Search" />
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div 
            v-for="item in filteredProducts" 
            :key="item.maSP"
            @click="autoPickSerialAndAdd(item)"
            class="bg-white rounded-xl p-3 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 transition-all border border-slate-200 flex flex-col group relative"
            :class="{'opacity-50 pointer-events-none': item.soLuongTonThucTe === 0}"
          >
            <div class="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
              <el-icon class="text-4xl text-slate-300 group-hover:scale-110 transition-transform"><Monitor /></el-icon>
              
              <div v-if="item.soLuongTonThucTe === 0" class="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm">
                <span class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Hết hàng</span>
              </div>
            </div>

            <div class="flex-1 flex flex-col justify-between">
              <div>
                <p class="text-xs text-slate-400 mb-1 font-mono font-semibold">SP{{ String(item.maSP).padStart(3, '0') }}</p>
                <h3 class="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{{ item.tenSP }}</h3>
                <p class="text-xs text-slate-500 mt-1 line-clamp-1 bg-slate-100 px-2 py-0.5 rounded inline-block">{{ item.cauHinhSP }}</p>
              </div>
              <div class="mt-3 flex items-end justify-between">
                <p class="font-bold text-blue-600 text-lg">{{ formatPrice(item.giaBan) }}</p>
                <p class="text-xs font-medium px-2 py-1 rounded-md" :class="item.soLuongTonThucTe > 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                  Tồn: {{ item.soLuongTonThucTe }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-[480px] bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-20 flex-shrink-0">
      
      <div class="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 min-h-[72px]">
        <el-icon class="text-xl text-blue-500"><UserFilled /></el-icon>
        
        <el-input 
          v-if="!selectedCustomer"
          v-model="searchCustomerPhone" 
          placeholder="Nhập SĐT khách hàng (Enter để tìm)..." 
          class="flex-1" 
          size="default"
          @keyup.enter="handleSearchCustomer"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearchCustomer" />
          </template>
        </el-input>

        <div v-else class="flex-1 flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg relative overflow-hidden">
          <div class="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
          <div>
            <p class="font-bold text-blue-800 text-sm leading-tight flex items-center gap-2">
              {{ selectedCustomer.tenKH }}
            </p>
            <p class="text-xs text-blue-500 mt-0.5">{{ selectedCustomer.sdt }}</p>
          </div>
          <el-button type="danger" link :icon="Delete" @click="clearCustomer" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
          <el-icon class="text-6xl mb-4"><ShoppingCart /></el-icon>
          <p class="text-lg">Chưa có sản phẩm nào</p>
          <p class="text-sm">Quét Serial Number để thêm vào hóa đơn</p>
        </div>

        <div 
          v-for="(cartItem, index) in cart" 
          :key="cartItem.maSP"
          class="bg-white p-3 rounded-xl border border-blue-200 shadow-sm flex flex-col gap-2 relative group"
        >
          <div class="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
            <div>
              <h4 class="font-bold text-slate-800 text-sm leading-tight">{{ cartItem.tenSP }}</h4>
              <span class="text-xs text-slate-500">{{ formatPrice(cartItem.giaBan) }} x {{ cartItem.serials.length }}</span>
            </div>
            <p class="font-black text-blue-600">{{ formatPrice(cartItem.giaBan * cartItem.serials.length) }}</p>
          </div>
          
          <div class="pt-1 flex flex-wrap gap-1.5">
            <el-tag 
              v-for="serial in cartItem.serials" 
              :key="serial"
              closable 
              @close="removeSerialFromCart(index, serial)"
              type="info" effect="plain"
              class="font-mono text-xs border-slate-300 text-slate-700 bg-slate-50"
            >
              <el-icon class="mr-1"><FullScreen /></el-icon> {{ serial }}
            </el-tag>
          </div>
        </div>
      </div>

      <div class="bg-white border-t border-slate-200 p-5 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div class="space-y-3 text-slate-600 text-sm mb-4">
          
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span>Tổng số lượng xuất:</span>
            <span class="font-bold text-slate-800">{{ totalMachines }} máy</span>
          </div>
          
          <div class="flex justify-between items-center text-lg mt-2 pt-2">
            <span class="font-bold text-slate-800">TỔNG TIỀN (CẦN TRẢ)</span>
            <span class="font-black text-blue-600 text-2xl">{{ formatPrice(cartTotal) }}</span>
          </div>

          <div class="flex justify-between items-center pt-2">
            <span>Tiền khách đưa:</span>
            <el-input v-model="customerMoney" placeholder="Nhập số tiền" class="!w-36" size="small">
              <template #append>₫</template>
            </el-input>
          </div>
          
          <div class="flex justify-between items-center" :class="changeMoney < 0 ? 'text-red-500' : 'text-emerald-600'">
            <span class="font-bold">Tiền thừa trả khách:</span>
            <span class="font-bold">{{ formatPrice(changeMoney > 0 ? changeMoney : 0) }}</span>
          </div>
        </div>

        <el-button 
          type="primary" 
          class="w-full !h-14 text-lg font-bold shadow-lg shadow-blue-500/30 !rounded-xl"
          :disabled="cart.length === 0 || changeMoney < 0"
          @click="processCheckout"
        >
          <div class="flex items-center justify-center gap-2">
            <el-icon><Money /></el-icon> LƯU HÓA ĐƠN & IN (F9)
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
import { Search, ShoppingCart, UserFilled, Monitor, Money, FullScreen, Delete, Medal } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- MOCK DATABASE ---
const dbSanPham = [
  { maSP: 1, tenSP: 'MacBook Air M2 13 inch', cauHinhSP: 'Apple M2 / 8GB / 256GB', giaBan: 26490000 },
  { maSP: 2, tenSP: 'Asus ROG Strix G15', cauHinhSP: 'Ryzen 7 / 16GB / RTX 3060', giaBan: 32990000 },
  { maSP: 3, tenSP: 'Dell XPS 13 Plus 9320', cauHinhSP: 'Core i7 / 16GB / 512GB', giaBan: 45000000 },
];

const dbMayTinh = ref([
  { maMay: 'SN-MAC-001', maSP: 1, maHoaDon: null },
  { maMay: 'SN-MAC-002', maSP: 1, maHoaDon: null },
  { maMay: 'SN-ASUS-999', maSP: 2, maHoaDon: null },
]);

// Giả lập DB Khách hàng 
const dbKhachHang = ref([
  { maKH: 1, sdt: '0901234567', tenKH: 'Trương Vô Kỵ', diaChi: 'Quận 1' },
  { maKH: 2, sdt: '0988777666', tenKH: 'Triệu Mẫn', diaChi: 'Quận 7' }
]);

// --- STATE ---
const scanInput = ref('');
const searchQuery = ref('');
const cart = ref([]); 
const scanInputRef = ref(null);
const billDialogRef = ref(null);

const searchCustomerPhone = ref('');
const selectedCustomer = ref(null);

// State cho Dialog thêm khách mới
const dialogNewCustomerVisible = ref(false);
const newCustomerForm = ref({ sdt: '', tenKH: '', diaChi: '' });
const newCustomerNameRef = ref(null);

const customerMoneyRaw = ref('');
const customerMoney = computed({
  get: () => customerMoneyRaw.value,
  set: (val) => { customerMoneyRaw.value = val.replace(/[^0-9]/g, ''); }
});

onMounted(() => {
  if (scanInputRef.value) scanInputRef.value.focus();
});

// --- TÍNH TOÁN TIỀN BẠC ---
const totalMachines = computed(() => cart.value.reduce((sum, item) => sum + item.serials.length, 0));
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + (item.giaBan * item.serials.length), 0));

const changeMoney = computed(() => {
  const moneyGiven = parseInt(customerMoneyRaw.value) || 0;
  return moneyGiven - cartTotal.value; // Chú ý: Trừ bằng FinalTotal đã giảm giá
});

const filteredProducts = computed(() => {
  return dbSanPham.filter(sp => {
    const matchSearch = sp.tenSP.toLowerCase().includes(searchQuery.value.toLowerCase()) || sp.maSP.toString().includes(searchQuery.value);
    if (matchSearch) {
      const cacMayTrongKho = dbMayTinh.value.filter(mt => mt.maSP === sp.maSP && mt.maHoaDon === null);
      const itemTrongGio = cart.value.find(c => c.maSP === sp.maSP);
      const soLuongDaChon = itemTrongGio ? itemTrongGio.serials.length : 0;
      sp.soLuongTonThucTe = cacMayTrongKho.length - soLuongDaChon;
      return true;
    }
    return false;
  });
});

// --- METHODS TÌM & THÊM KHÁCH ---
const handleSearchCustomer = () => {
  const phone = searchCustomerPhone.value.trim();
  if (!phone) return;

  const kh = dbKhachHang.value.find(k => k.sdt === phone);
  if (kh) {
    selectedCustomer.value = kh;
    ElMessage.success(`Đã áp dụng khách hàng: ${kh.tenKH}`);
  } else {
    // SĐT chưa tồn tại -> Mở popup thêm mới ngay lập tức
    newCustomerForm.value = { sdt: phone, tenKH: '', diaChi: '' };
    dialogNewCustomerVisible.value = true;
    
    // Tự động focus con trỏ chuột vào ô Tên khách hàng
    nextTick(() => {
      if (newCustomerNameRef.value) newCustomerNameRef.value.focus();
    });
  }
};

const saveNewCustomer = () => {
  if (!newCustomerForm.value.tenKH.trim()) {
    ElMessage.error("Vui lòng nhập Tên khách hàng!"); 
    return;
  }
  
  // 1. Lưu thẳng vào CSDL
  const newKh = {
    maKH: Date.now(), // Sinh ID tạm
    sdt: newCustomerForm.value.sdt,
    tenKH: newCustomerForm.value.tenKH,
    diaChi: newCustomerForm.value.diaChi
  };
  dbKhachHang.value.push(newKh);
  
  // 2. Gán luôn vào đơn hàng hiện tại
  selectedCustomer.value = newKh;
  dialogNewCustomerVisible.value = false;
  ElMessage.success("Đã lưu và áp dụng khách hàng mới!");
};

const clearCustomer = () => {
  selectedCustomer.value = null;
  searchCustomerPhone.value = '';
};

// --- CÁC HÀM XỬ LÝ SẢN PHẨM & THANH TOÁN ---
const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const handleScanBarcode = () => {
  const serialScanned = scanInput.value.trim().toUpperCase();
  if (!serialScanned) return;

  const mayTimThay = dbMayTinh.value.find(mt => mt.maMay === serialScanned);
  if (!mayTimThay) { ElMessage.error(`Không tìm thấy Serial: ${serialScanned}`); scanInput.value = ''; return; }
  if (mayTimThay.maHoaDon !== null) { ElMessage.error(`Máy này đã bán!`); scanInput.value = ''; return; }

  let isAlreadyInCart = false;
  cart.value.forEach(item => { if (item.serials.includes(serialScanned)) isAlreadyInCart = true; });
  if (isAlreadyInCart) { ElMessage.warning(`Mã Serial ${serialScanned} đã có trong giỏ hàng!`); scanInput.value = ''; return; }

  const thongTinSP = dbSanPham.find(sp => sp.maSP === mayTimThay.maSP);
  addItemToCart(thongTinSP, mayTimThay.maMay);
  
  ElMessage.success(`Đã quét thành công: ${serialScanned}`);
  scanInput.value = ''; 
  if (scanInputRef.value) scanInputRef.value.focus();
};

const autoPickSerialAndAdd = (product) => {
  if (product.soLuongTonThucTe <= 0) return;
  const cacMayTrongKho = dbMayTinh.value.filter(mt => mt.maSP === product.maSP && mt.maHoaDon === null);
  const itemTrongGio = cart.value.find(c => c.maSP === product.maSP);
  const serialsDaChon = itemTrongGio ? itemTrongGio.serials : [];
  const mayAvailable = cacMayTrongKho.find(mt => !serialsDaChon.includes(mt.maMay));
  if (mayAvailable) addItemToCart(product, mayAvailable.maMay);
};

const addItemToCart = (sanPham, maMay) => {
  let item = cart.value.find(c => c.maSP === sanPham.maSP);
  if (item) item.serials.push(maMay);
  else cart.value.push({ maSP: sanPham.maSP, tenSP: sanPham.tenSP, cauHinhSP: sanPham.cauHinhSP, giaBan: sanPham.giaBan, serials: [maMay] });
};

const removeSerialFromCart = (cartIndex, serialToRemove) => {
  const item = cart.value[cartIndex];
  item.serials = item.serials.filter(s => s !== serialToRemove);
  if (item.serials.length === 0) cart.value.splice(cartIndex, 1);
};

const processCheckout = () => {
  ElMessageBox.confirm(
    `Xuất bán <b>${totalMachines.value} máy</b>. Tổng phải thu: <b class="text-blue-600">${formatPrice(cartTotal.value)}</b>?`,
    'TẠO HÓA ĐƠN XUẤT',
    { confirmButtonText: 'Lưu & In', cancelButtonText: 'Hủy', type: 'success', dangerouslyUseHTMLString: true }
  ).then(() => {
    const fakeMaHD = 'HD-' + Math.floor(100000 + Math.random() * 900000);

    // Chuẩn bị Dữ liệu để gửi cho Backend (Khớp 100% với Schema của bạn)
    const payloadBackend = {
      tongTien: cartTotal.value,
      maKH: selectedCustomer.value ? selectedCustomer.value.maKH : null, // Gửi maKH (INT) lên
      chiTiet: cart.value.map(item => ({ maSP: item.maSP, giaBan: item.giaBan, serials: item.serials }))
    };
    
    console.log("GỬI API LƯU HÓA ĐƠN:", payloadBackend);

    if (billDialogRef.value) {
      billDialogRef.value.openBill({
        maHoaDon: fakeMaHD,
        items: JSON.parse(JSON.stringify(cart.value)), 
        tongTien: cartTotal.value,
        khachDua: parseInt(customerMoneyRaw.value) || cartTotal.value,
        tenKhachHang: selectedCustomer.value ? selectedCustomer.value.tenKH : 'Khách lẻ'
      });
    }

    ElMessage.success('Thanh toán thành công! Đang tạo lệnh in...');
    cart.value = []; 
    customerMoneyRaw.value = '';
    clearCustomer(); 
  }).catch(() => {});
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