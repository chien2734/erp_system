<template>
  <div class="print-page bg-white text-black min-h-screen p-8 mx-auto max-w-[210mm]">

    <div v-if="!printData" class="text-center text-red-500 py-10">
      Không tìm thấy dữ liệu in. Vui lòng tắt tab này và thử lại từ trang Báo cáo Sản phẩm.
    </div>

    <div v-else>
      <div class="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 class="font-black text-2xl uppercase">HỆ THỐNG ERP</h1>
          <p class="text-sm mt-1">BÁO CÁO SẢN PHẨM</p>
        </div>
        <div class="text-right">
          <p class="italic text-sm">Ngày in: {{ currentDate }}</p>
        </div>
      </div>

      <div class="mb-6 text-center">
        <h2 class="text-lg font-bold uppercase tracking-widest">
          Báo cáo sản phẩm - {{ periodLabel }}
        </h2>
        <p class="text-sm text-slate-600 mt-1">Loại: {{ printData.type.toUpperCase() }}</p>
      </div>

      <table class="w-full text-sm border-collapse border border-black">
        <thead>
          <tr class="bg-gray-200">
            <th class="border border-black p-2 text-left">SẢN PHẨM</th>
            <th class="border border-black p-2 text-center">SL XUẤT</th>
            <th class="border border-black p-2 text-right">DOANH THU</th>
            <th class="border border-black p-2 text-right">GIÁ VỐN</th>
            <th class="border border-black p-2 text-right">LỢI NHUẬN</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in printData.data" :key="idx">
            <td class="border border-black p-2">{{ item.tenSP }}</td>
            <td class="border border-black p-2 text-center">{{ item.soLuongDaXuat }}</td>
            <td class="border border-black p-2 text-right">{{ formatPrice(item.doanhThu) }}</td>
            <td class="border border-black p-2 text-right">{{ formatPrice(item.tongGiaVon) }}</td>
            <td class="border border-black p-2 text-right">{{ formatPrice(item.loiNhuan) }}</td>
          </tr>
        </tbody>
        <tfoot v-if="summary">
          <tr class="bg-gray-100 font-bold">
            <td class="border border-black p-3 text-right">TỔNG CỘNG</td>
            <td class="border border-black p-3 text-center">{{ summary.tongSoLuong }}</td>
            <td class="border border-black p-3 text-right">{{ formatPrice(summary.tongDoanhThu) }}</td>
            <td class="border border-black p-3 text-right">{{ formatPrice(summary.tongGiaVon) }}</td>
            <td class="border border-black p-3 text-right">{{ formatPrice(summary.tongLoiNhuan) }}</td>
          </tr>
        </tfoot>
      </table>

      <div class="flex justify-between mt-12 px-10">
        <div class="text-center">
          <p class="font-bold mb-16">Người lập báo cáo</p>
          <p>(Ký, ghi rõ họ tên)</p>
        </div>
        <div class="text-center">
          <p class="font-bold mb-16">Người duyệt</p>
          <p>&nbsp;</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const printData = ref(null);
const currentDate = ref(new Date().toLocaleDateString('vi-VN'));

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const summary = ref(null);

const periodLabel = computed(() => {
  if (!printData.value) return '';
  const t = printData.value.type;
  if (t === 'month') return `${printData.value.month}/${printData.value.year}`;
  if (t === 'quarter') return `Quý ${printData.value.quarter} - ${printData.value.year}`;
  if (t === 'year') return `${printData.value.year}`;
  return '';
});

onMounted(() => {
  const stored = localStorage.getItem('print_report_product_data');
  if (stored) {
    try {
      printData.value = JSON.parse(stored);
      // summary có thể được gửi cùng payload hoặc tính tổng nếu không có
      if (printData.value.summary) {
        summary.value = printData.value.summary;
      } else if (Array.isArray(printData.value.data)) {
        const s = { tongSoLuong: 0, tongDoanhThu: 0, tongGiaVon: 0, tongLoiNhuan: 0 };
        printData.value.data.forEach(it => {
          s.tongSoLuong += Number(it.soLuongDaXuat || 0);
          s.tongDoanhThu += Number(it.doanhThu || 0);
          s.tongGiaVon += Number(it.tongGiaVon || 0);
          s.tongLoiNhuan += Number(it.loiNhuan || 0);
        });
        summary.value = s;
      }

      setTimeout(() => window.print(), 500);
      setTimeout(() => localStorage.removeItem('print_report_product_data'), 2000);
    } catch (e) {
      console.error('Invalid print data', e);
    }
  }
});
</script>

<style scoped>
:global(body) { background-color: #f3f4f6; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.print-page { font-family: Arial, Helvetica, sans-serif !important; }

@media print {
  @page { size: A4 portrait; margin: 15mm; }
  :global(body) { background-color: white !important; margin: 0; padding: 0; }
  * { -webkit-text-size-adjust: 100% !important; font-family: Arial, Helvetica, sans-serif !important; }
  :global(#app > *:not(.print-page)) { display: none !important; }
}
</style>
