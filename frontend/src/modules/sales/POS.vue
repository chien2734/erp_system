<template>
  <div class="flex h-[calc(100vh-64px)] bg-slate-100 -m-8"> 
    
    <div class="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200">
      
      <div class="p-4 bg-white shadow-sm z-10 flex gap-4 items-center border-b-4 border-blue-500">
        <el-input 
          v-model="scanInput" 
          placeholder="TÍT MÃ VẠCH: Nhập Serial Number (maMay) và nhấn Enter..." 
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
                <p class="text-xs text-slate-400 mb-1 font-mono font-semibold">{{ item.maSP }}</p>
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
      
      <div class="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <el-icon class="text-xl text-blue-500"><UserFilled /></el-icon>
        <el-input placeholder="Số điện thoại khách hàng..." class="flex-1" size="default">
          <template #append><el-button :icon="Plus" /></template>
        </el-input>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
          <el-icon class="text-6xl mb-4"><ShoppingCart /></el-icon>
          <p class="text-lg">Chưa quét mã vạch nào</p>
          <p class="text-sm">Tít Serial Number để thêm vào hóa đơn</p>
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
          
          <div class="pt-1">
            <p class="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
              <span>Các máy đã xuất (Serial):</span>
              <el-button type="primary" link size="small" @click="autoPickSerialAndAdd(cartItem)">+ Chọn thêm máy</el-button>
            </p>
            <div class="flex flex-wrap gap-1.5">
              <el-tag 
                v-for="serial in cartItem.serials" 
                :key="serial"
                closable 
                @close="removeSerialFromCart(index, serial)"
                type="info"
                effect="plain"
                class="font-mono text-xs border-slate-300 text-slate-700 bg-slate-50"
              >
                <el-icon class="mr-1"><FullScreen /></el-icon> {{ serial }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border-t border-slate-200 p-5 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div class="space-y-3 text-slate-600 text-sm mb-4">
          <div class="flex justify-between">
            <span>Tổng số lượng máy xuất:</span>
            <span class="font-bold text-slate-800">{{ totalMachines }} máy</span>
          </div>
          <div class="flex justify-between items-center text-lg mt-2 pt-2 border-t border-slate-100">
            <span class="font-bold text-slate-800">KHÁCH CẦN TRẢ</span>
            <span class="font-black text-blue-600 text-2xl">{{ formatPrice(cartTotal) }}</span>
          </div>
        </div>

        <el-button 
          type="primary" 
          class="w-full !h-14 text-lg font-bold shadow-lg shadow-blue-500/30 !rounded-xl"
          :disabled="cart.length === 0"
          @click="processCheckout"
        >
          <div class="flex items-center justify-center gap-2">
            <el-icon><Money /></el-icon>
            THANH TOÁN HÓA ĐƠN
          </div>
        </el-button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search, Plus, ShoppingCart, UserFilled, Monitor, Money, FullScreen } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- MOCK DATABASE ---
// 1. Bảng `sanPham`: Chứa thông tin chung và Giá Bán
const dbSanPham = [
  { maSP: 'MAC_AIR_M2', tenSP: 'MacBook Air M2 13 inch', cauHinhSP: 'Apple M2 / 8GB / 256GB', giaBan: 26490000 },
  { maSP: 'ASUS_ROG_G15', tenSP: 'Asus ROG Strix G15', cauHinhSP: 'Ryzen 7 / 16GB / RTX 3060', giaBan: 32990000 },
  { maSP: 'DELL_XPS_13', tenSP: 'Dell XPS 13 Plus 9320', cauHinhSP: 'Core i7 / 16GB / 512GB', giaBan: 45000000 },
];

// 2. Bảng `mayTinh`: Chứa các cá thể máy tính cụ thể (Serial Number)
// maHoaDon = null nghĩa là máy đang ở trong kho, sẵn sàng bán.
const dbMayTinh = ref([
  { maMay: 'SN-MAC-001', maSP: 'MAC_AIR_M2', maHoaDon: null, trangThai: 'Sẵn sàng' },
  { maMay: 'SN-MAC-002', maSP: 'MAC_AIR_M2', maHoaDon: null, trangThai: 'Sẵn sàng' },
  { maMay: 'SN-MAC-003', maSP: 'MAC_AIR_M2', maHoaDon: null, trangThai: 'Sẵn sàng' },
  { maMay: 'SN-ASUS-999', maSP: 'ASUS_ROG_G15', maHoaDon: null, trangThai: 'Sẵn sàng' },
  // Cái Dell này đã bán (maHoaDon có giá trị), nên sẽ không hiện Tồn kho
  { maMay: 'SN-DELL-555', maSP: 'DELL_XPS_13', maHoaDon: 'HD-1001', trangThai: 'Đã bán' },
]);

// --- STATE ---
const scanInput = ref('');
const searchQuery = ref('');
const cart = ref([]); // Cấu trúc: [ { maSP, tenSP, giaBan, serials: ['SN-001', 'SN-002'] } ]
const scanInputRef = ref(null);

onMounted(() => {
  // Focus vào thanh quét mã vạch khi vừa mở POS lên
  if (scanInputRef.value) scanInputRef.value.focus();
});

// --- TÍNH TOÁN DỮ LIỆU HIỂN THỊ TRÊN GRID ---
const filteredProducts = computed(() => {
  return dbSanPham.filter(sp => {
    // 1. Lọc theo từ khóa tìm kiếm
    const matchSearch = sp.tenSP.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        sp.maSP.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // 2. Tính TỒN KHO THỰC TẾ: Đếm số lượng máy trong bảng mayTinh có maHoaDon = null VÀ chưa bị cho vào Giỏ hàng
    if (matchSearch) {
      // Tìm các máy trong kho
      const cacMayTrongKho = dbMayTinh.value.filter(mt => mt.maSP === sp.maSP && mt.maHoaDon === null);
      
      // Trừ đi các máy đã nằm trong Giỏ hàng (để đang chọn thì số tồn kho trên lưới giảm xuống)
      const itemTrongGio = cart.value.find(c => c.maSP === sp.maSP);
      const soLuongDaChon = itemTrongGio ? itemTrongGio.serials.length : 0;
      
      sp.soLuongTonThucTe = cacMayTrongKho.length - soLuongDaChon;
      return true;
    }
    return false;
  });
});

const totalMachines = computed(() => cart.value.reduce((sum, item) => sum + item.serials.length, 0));
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + (item.giaBan * item.serials.length), 0));

// --- METHODS ---
const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Nghiệp vụ 1: Thu ngân TÍT mã vạch hộp máy (Quét Serial maMay)
const handleScanBarcode = () => {
  const serialScanned = scanInput.value.trim().toUpperCase();
  if (!serialScanned) return;

  // 1. Tìm máy trong Database dựa trên Serial
  const mayTimThay = dbMayTinh.value.find(mt => mt.maMay === serialScanned);
  
  if (!mayTimThay) {
    ElMessage.error(`Không tìm thấy máy tính nào có Serial: ${serialScanned}`);
    scanInput.value = ''; return;
  }

  if (mayTimThay.maHoaDon !== null) {
    ElMessage.error(`Máy này đã được xuất bán trong hóa đơn ${mayTimThay.maHoaDon}!`);
    scanInput.value = ''; return;
  }

  // 2. Kiểm tra xem Serial này đã bị quét vào giỏ hàng trước đó chưa
  let isAlreadyInCart = false;
  cart.value.forEach(item => { if (item.serials.includes(serialScanned)) isAlreadyInCart = true; });
  if (isAlreadyInCart) {
    ElMessage.warning(`Mã Serial ${serialScanned} đã nằm trong giỏ hàng!`);
    scanInput.value = ''; return;
  }

  // 3. Lấy thông tin Sản phẩm tương ứng
  const thongTinSP = dbSanPham.find(sp => sp.maSP === mayTimThay.maSP);

  // 4. Thêm vào giỏ hàng
  addItemToCart(thongTinSP, mayTimThay.maMay);
  
  ElMessage.success(`Đã tít thành công: ${serialScanned}`);
  scanInput.value = ''; // Xóa trắng để tít máy tiếp theo
  if (scanInputRef.value) scanInputRef.value.focus();
};

// Nghiệp vụ 2: Thu ngân BẤM trực tiếp vào Lưới sản phẩm (Tự động bốc 1 Serial trong kho)
const autoPickSerialAndAdd = (product) => {
  if (product.soLuongTonThucTe <= 0) return;

  // Tìm toàn bộ Serial của mã SP này trong kho
  const cacMayTrongKho = dbMayTinh.value.filter(mt => mt.maSP === product.maSP && mt.maHoaDon === null);
  
  // Lọc ra Serial ĐẦU TIÊN chưa nằm trong giỏ hàng
  const itemTrongGio = cart.value.find(c => c.maSP === product.maSP);
  const serialsDaChon = itemTrongGio ? itemTrongGio.serials : [];
  
  const mayAvailable = cacMayTrongKho.find(mt => !serialsDaChon.includes(mt.maMay));

  if (mayAvailable) {
    addItemToCart(product, mayAvailable.maMay);
  }
};

// Hàm hỗ trợ: Đẩy vào giỏ (Gộp chung maSP, liệt kê danh sách Serial)
const addItemToCart = (sanPham, maMay) => {
  let item = cart.value.find(c => c.maSP === sanPham.maSP);
  if (item) {
    item.serials.push(maMay);
  } else {
    cart.value.push({ 
      maSP: sanPham.maSP, 
      tenSP: sanPham.tenSP, 
      cauHinhSP: sanPham.cauHinhSP,
      giaBan: sanPham.giaBan, 
      serials: [maMay] // Mảng chứa các Serial
    });
  }
};

// Nghiệp vụ 3: Khách đổi ý, bỏ 1 máy ra khỏi giỏ
const removeSerialFromCart = (cartIndex, serialToRemove) => {
  const item = cart.value[cartIndex];
  item.serials = item.serials.filter(s => s !== serialToRemove);
  
  // Nếu xóa hết serial của mã đó thì xóa luôn dòng đó khỏi giỏ
  if (item.serials.length === 0) {
    cart.value.splice(cartIndex, 1);
  }
};

// Tiến hành Lưu Hóa Đơn
const processCheckout = () => {
  ElMessageBox.confirm(
    `Xuất bán <b>${totalMachines.value} máy</b>. Thu của khách: <b class="text-blue-600">${formatPrice(cartTotal.value)}</b>?`,
    'TẠO HÓA ĐƠN XUẤT',
    {
      confirmButtonText: 'Lưu Hóa Đơn',
      cancelButtonText: 'Hủy',
      type: 'success',
      dangerouslyUseHTMLString: true,
    }
  ).then(() => {
    // TẠO PAYLOAD ĐẨY XUỐNG API:
    const payload = {
      tongTien: cartTotal.value,
      danhSachXuat: []
    };
    cart.value.forEach(item => {
      // Quan trọng: Gửi danh sách các maMay (Serial) xuống Backend để Update trangThai và maHoaDon
      item.serials.forEach(serial => {
        payload.danhSachXuat.push({ maSP: item.maSP, maMay: serial, giaBanDoiChieu: item.giaBan });
      });
    });

    console.log("DỮ LIỆU ĐẨY LÊN BACKEND KHI THANH TOÁN:", payload);

    ElMessage.success('Tạo hóa đơn thành công! Kho đã được cập nhật.');
    cart.value = [];
  }).catch(() => {});
};
</script>

<style scoped>
:deep(.custom-scan-input .el-input__wrapper) {
  background-color: #fff;
  box-shadow: none;
  font-family: monospace;
  font-weight: bold;
}
:deep(.custom-scan-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px transparent inset !important;
}
.overflow-y-auto::-webkit-scrollbar { width: 6px; }
.overflow-y-auto::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
</style>