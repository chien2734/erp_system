<template>
  <el-dialog
    v-model="isVisible"
    width="380px"
    :show-close="false"
    class="print-dialog p-0"
    align-center
    destroy-on-close
  >
    <div id="print-section" class="bg-white text-black p-4 mx-auto w-full sm:w-[80mm] font-mono text-[12px] leading-tight relative">
      
      <div class="text-center mb-4 space-y-1">
        <h2 class="text-lg md:text-xl font-bold uppercase">Laptop Store ERP</h2>
        <p class="text-[11px] md:text-xs">123 Nguyễn Văn Cừ, Quận 5, TP.HCM</p>
        <p class="text-[11px] md:text-xs">Hotline: 0909.123.456</p>
      </div>

      <div class="border-b border-dashed border-slate-400 mb-3"></div>

      <div class="mb-3 space-y-1 text-[11px] md:text-xs">
        <h3 class="text-center text-base md:text-lg font-bold mb-2">HÓA ĐƠN BÁN HÀNG</h3>
        <p><strong>Mã HĐ:</strong> HD-{{ billData.maHoaDon }}</p>
        <p><strong>Ngày:</strong> {{ getCurrentDateTime() }}</p>
        <p><strong>Thu ngân:</strong> {{ billData.tenThuNgan || authStore.user?.hoten || authStore.user?.username || 'Admin' }}</p>
        <p><strong>Khách hàng:</strong> {{ billData.tenKhachHang }}</p>
      </div>

      <div class="border-b border-dashed border-slate-400 mb-3"></div>

      <div class="mb-3 text-[11px] md:text-xs">
        <div class="flex font-bold border-b border-slate-800 pb-1 mb-2">
          <div class="flex-1">TÊN HÀNG / ĐƠN GIÁ</div>
          <div class="w-8 text-center shrink-0">SL</div>
          <div class="w-[85px] text-right shrink-0">TTIỀN</div>
        </div>

        <div v-for="(item, index) in billData.items" :key="index" class="mb-2">
          <div class="font-bold mb-0.5 leading-tight">{{ item.tenSP }}</div>
          
          <div class="flex text-slate-800 mb-1 items-start">
            <div class="flex-1 text-slate-600">{{ formatPrice(item.giaBan) }}</div>
            <div class="w-8 text-center shrink-0">{{ item.serials ? item.serials.length : item.soLuong }}</div>
            <div class="w-[85px] text-right font-bold shrink-0">{{ formatPrice(item.giaBan * (item.serials ? item.serials.length : item.soLuong)) }}</div>
          </div>
          
          <div class="text-[10px] text-slate-500 pl-2 border-l border-slate-300" v-if="item.serials && item.serials.length > 0">
            SN: <span v-for="(sn, i) in item.serials" :key="sn">{{ sn }}{{ i < item.serials.length - 1 ? ', ' : '' }}</span>
          </div>
        </div>
      </div>

      <div class="border-b border-dashed border-slate-400 mb-2"></div>

      <div class="space-y-1 text-[11px] md:text-xs">
        <div class="flex justify-between">
          <span>Cộng tiền hàng:</span>
          <span>{{ formatPrice(billData.tongTien) }}</span>
        </div>
        <div class="flex justify-between" v-if="billData.giamGia > 0">
          <span>Giảm giá:</span>
          <span>- {{ formatPrice(billData.giamGia) }}</span>
        </div>
        <div class="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-slate-800">
          <span>TỔNG THANH TOÁN:</span>
          <span>{{ formatPrice(billData.tongTien - billData.giamGia) }}</span>
        </div>
        <div class="flex justify-between mt-2">
          <span>Khách đưa:</span>
          <span>{{ formatPrice(billData.khachDua) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Tiền thừa:</span>
          <span>{{ formatPrice(billData.khachDua - (billData.tongTien - billData.giamGia)) }}</span>
        </div>
      </div>

      <div class="border-b border-dashed border-slate-400 my-3"></div>

      <div class="text-center text-[10px] md:text-xs space-y-1">
        <p class="font-bold">Cảm ơn Quý Khách!</p>
        <p class="italic">Hóa đơn có giá trị lưu giữ để bảo hành.</p>
        <p class="italic text-[9px] mt-2 text-slate-500">Powered by SGU Dev Team</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-center gap-3 print:hidden bg-slate-50 p-3 md:p-4 border-t border-slate-200">
        <el-button @click="isVisible = false" size="large" class="w-28 md:w-32">Đóng</el-button>
        <el-button type="primary" size="large" @click="handlePrint" class="w-32 md:w-40 font-bold" :icon="Printer">
          In Hóa Đơn
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { Printer } from '@element-plus/icons-vue';
import { useAuthStore } from '../auth/auth.store';

const authStore = useAuthStore();

const isVisible = ref(false);
const billData = ref({
  maHoaDon: '',
  tenThuNgan: '',
  items: [],
  tongTien: 0,
  giamGia: 0,
  khachDua: 0
});

const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
};

const getCurrentDateTime = () => {
  const now = new Date();
  return now.toLocaleString('vi-VN', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit'
  });
};

const openBill = (data) => {
  billData.value = data;
  isVisible.value = true;
};

// Hàm IN cực xịn: Thêm class vào body để CSS toàn cục bắt tín hiệu
const handlePrint = () => {
  document.body.classList.add('printing-bill');
  window.print();
  
  // Xóa class sau khi hộp thoại In tắt đi (dù in hay hủy)
  setTimeout(() => {
    document.body.classList.remove('printing-bill');
  }, 500);
};

defineExpose({ openBill });
</script>

<style scoped>
:deep(.el-dialog__header) { display: none; }
:deep(.el-dialog__body) { padding: 0; background: #e2e8f0; }
</style>

<style>
/* Chỉ kích hoạt khi body có class 'printing-bill' do nút In đính vào */
@media print {
  
  /* 1. Định dạng kích thước giấy in nhiệt K80 */
  @page {
    size: 80mm auto;
    margin: 0;
  }

  /* 2. Ẩn TOÀN BỘ UI bên dưới */
  body.printing-bill * {
    visibility: hidden !important;
  }

  /* 3. Phá bỏ mọi giới hạn lồng kính (Bẫy Transform của Element Plus) */
  body.printing-bill .el-overlay {
    position: absolute !important;
    background-color: transparent !important;
    overflow: visible !important; /* Mở khóa để bill không bị cắt cụt */
  }
  
  body.printing-bill .el-dialog {
    transform: none !important; /* PHÁ BẪY TRUNG TÂM Ở ĐÂY */
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    overflow: visible !important;
  }
  
  body.printing-bill .el-dialog__body {
    padding: 0 !important;
  }

  /* 4. Móc riêng vùng hóa đơn ra, cho hiển thị và ép sát góc trái tờ in */
  body.printing-bill #print-section, 
  body.printing-bill #print-section * {
    visibility: visible !important;
  }
  
  body.printing-bill #print-section {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 80mm !important; /* Ép cứng kích thước theo cuộn giấy */
    padding: 4mm !important;
    margin: 0 !important;
    background: white !important;
    color: black !important; /* Ép mực in đen trắng để rõ nét */
  }
}
</style>