<template>
  <el-dialog
    v-model="isVisible"
    width="400px"
    :show-close="false"
    class="print-dialog p-0"
    align-center
    destroy-on-close
  >
    <div id="print-section" class="bg-white text-black p-6 mx-auto w-full max-w-[350px] font-mono text-sm leading-tight relative">
      
      <div class="text-center mb-4 space-y-1">
        <h2 class="text-xl font-bold uppercase">Laptop Store ERP</h2>
        <p class="text-xs">123 Nguyễn Văn Cừ, Quận 5, TP.HCM</p>
        <p class="text-xs">Hotline: 0909.123.456</p>
      </div>

      <div class="border-b-2 border-dashed border-slate-300 mb-4"></div>

      <div class="mb-4 space-y-1 text-xs">
        <h3 class="text-center text-lg font-bold mb-2">HÓA ĐƠN BÁN HÀNG</h3>
        <p><strong>Mã HĐ:</strong> {{ billData.maHoaDon }}</p>
        <p><strong>Ngày:</strong> {{ getCurrentDateTime() }}</p>
        <p><strong>Thu ngân:</strong> Nguyễn Văn Admin</p>
        <p><strong>Khách hàng:</strong> {{ billData.tenKhachHang }}</p>
      </div>

      <div class="border-b-2 border-dashed border-slate-300 mb-4"></div>

      <div class="mb-4 text-xs">
        <div class="flex font-bold border-b border-slate-800 pb-1 mb-2">
          <div class="flex-1">TÊN HÀNG</div>
          <div class="w-8 text-center">SL</div>
          <div class="w-20 text-right">THÀNH TIỀN</div>
        </div>

        <div v-for="(item, index) in billData.items" :key="index" class="mb-3">
          <div class="font-bold mb-0.5">{{ item.tenSP }}</div>
          <div class="flex justify-between text-slate-600 mb-1">
            <div>{{ formatPrice(item.giaBan) }}</div>
            <div class="w-8 text-center">{{ item.serials.length }}</div>
            <div class="w-20 text-right">{{ formatPrice(item.giaBan * item.serials.length) }}</div>
          </div>
          <div class="text-[10px] text-slate-500 pl-2 border-l border-slate-300">
            SN: <span v-for="(sn, i) in item.serials" :key="sn">{{ sn }}{{ i < item.serials.length - 1 ? ', ' : '' }}</span>
          </div>
        </div>
      </div>

      <div class="border-b-2 border-dashed border-slate-300 mb-3"></div>

      <div class="space-y-1 text-xs">
        <div class="flex justify-between">
          <span>Cộng tiền hàng:</span>
          <span>{{ formatPrice(billData.tongTien) }}</span>
        </div>
        <div class="flex justify-between">
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

      <div class="border-b-2 border-dashed border-slate-300 my-4"></div>

      <div class="text-center text-xs space-y-1">
        <p class="font-bold">Cảm ơn Quý Khách!</p>
        <p class="italic">Hóa đơn có giá trị lưu giữ để bảo hành.</p>
        <p class="italic text-[10px] mt-2 text-slate-500">Powered by SGU Dev Team</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-center gap-3 print:hidden bg-slate-50 p-4 border-t border-slate-100">
        <el-button @click="isVisible = false" size="large" class="w-32">Đóng</el-button>
        <el-button type="primary" size="large" @click="handlePrint" class="w-32 font-bold" :icon="Printer">
          In Hóa Đơn
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { Printer } from '@element-plus/icons-vue';

// Khai báo state để quản lý ẩn/hiện và dữ liệu
const isVisible = ref(false);
const billData = ref({
  maHoaDon: '',
  items: [],
  tongTien: 0,
  giamGia: 0,
  khachDua: 0
});

// Hàm định dạng tiền
const formatPrice = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
};

// Hàm lấy ngày giờ hiện tại
const getCurrentDateTime = () => {
  const now = new Date();
  return now.toLocaleString('vi-VN', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit'
  });
};

// Cung cấp hàm MỞ dialog cho component cha (POS.vue) gọi
const openBill = (data) => {
  billData.value = data;
  isVisible.value = true;
};

// Kích hoạt tính năng In của trình duyệt
const handlePrint = () => {
  window.print();
};

// Bộc lộ hàm ra ngoài để file khác xài được
defineExpose({ openBill });
</script>

<style scoped>
/* Xóa background và padding của Element Plus Dialog để giống tờ giấy nhất */
:deep(.el-dialog__header) { display: none; }
:deep(.el-dialog__body) { padding: 0; background: #e2e8f0; }

/* MA THUẬT IN ẤN (Print Media Query) */
@media print {
  /* Ẩn mọi thứ trên trang web */
  body * {
    visibility: hidden;
  }
  
  /* Chỉ hiển thị khu vực tờ giấy biên lai */
  #print-section, #print-section * {
    visibility: visible;
  }
  
  /* Căn chỉnh tờ giấy lên góc cùng bên trái để máy in cắt cho chuẩn */
  #print-section {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm; /* Kích thước chuẩn giấy in nhiệt K80 */
    margin: 0;
    padding: 10px;
    box-shadow: none;
  }

  /* Ẩn phần background mờ mờ của Dialog */
  .el-overlay {
    background-color: transparent !important;
  }
}
</style>