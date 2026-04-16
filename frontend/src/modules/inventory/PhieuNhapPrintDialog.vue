<template>
  <el-dialog
    v-model="isVisible"
    width="850px"
    class="custom-dialog responsive-dialog print-dialog"
    destroy-on-close
    title="XEM TRƯỚC PHIẾU NHẬP (A4)"
  >
    <div class="pdf-wrapper bg-slate-300 p-2 sm:p-4 md:p-8 overflow-auto max-h-[60vh] md:max-h-[70vh] custom-scrollbar rounded-lg">
      
      <div 
        id="phieu-nhap-pdf" 
        class="mx-auto shadow-sm"
        style="width: 210mm; min-width: 210mm; min-height: 297mm; padding: 15mm 20mm; font-family: 'Times New Roman', Times, serif; box-sizing: border-box; background-color: #ffffff; color: #000000;"
      >
        <div class="flex justify-between items-start mb-6 pb-3" style="border-bottom: 2px solid #000000;">
          <div>
            <h2 class="text-xl font-bold uppercase mb-1">LAPTOP STORE ERP</h2>
            <p class="text-sm mb-0.5">Địa chỉ: 123 Nguyễn Văn Cừ, Quận 5, TP.HCM</p>
            <p class="text-sm">Hotline: 0909.123.456</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-lg mb-1">Mã Phiếu: PN-{{ phieuData.maPhieuNhap }}</p>
            <p class="text-sm">Ngày in: {{ getCurrentDateTime() }}</p>
          </div>
        </div>

        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold uppercase mb-1">PHIẾU NHẬP KHO</h1>
          <p class="italic text-sm">Ngày lập phiếu: {{ formatDate(phieuData.ngayNhap) }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
          <p><strong>Nhà cung cấp:</strong> {{ phieuData.tenNCC }}</p>
          <p><strong>Người lập phiếu:</strong> {{ phieuData.tenNhanVien || 'Admin' }}</p>
        </div>

        <table class="w-full mb-8 border-collapse" style="border: 1px solid #000000; font-size: 14px;">
          <thead>
            <tr style="background-color: #f3f4f6;"> <th class="p-2 text-center w-10" style="border: 1px solid #000000;">STT</th>
              <th class="p-2 text-center w-20" style="border: 1px solid #000000;">Mã SP</th>
              <th class="p-2 text-left" style="border: 1px solid #000000;">Tên sản phẩm</th>
              <th class="p-2 text-center w-12" style="border: 1px solid #000000;">SL</th>
              <th class="p-2 text-right w-28" style="border: 1px solid #000000;">Đơn giá</th>
              <th class="p-2 text-right w-32" style="border: 1px solid #000000;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, index) in phieuData.items" :key="index">
              <tr>
                <td class="p-2 text-center" style="border: 1px solid #000000;">{{ index + 1 }}</td>
                <td class="p-2 font-mono text-xs text-center" style="border: 1px solid #000000;">SP{{ item.maSP }}</td>
                <td class="p-2 font-bold" style="border: 1px solid #000000;">{{ item.tenSP }}</td>
                <td class="p-2 text-center font-bold" style="border: 1px solid #000000;">{{ item.soLuong || item.serials?.length }}</td>
                <td class="p-2 text-right" style="border: 1px solid #000000;">{{ formatPrice(item.donGiaNhap || item.giaNhap) }}</td>
                <td class="p-2 text-right font-bold" style="border: 1px solid #000000; color: #1e40af;"> {{ formatPrice((item.donGiaNhap || item.giaNhap) * (item.soLuong || item.serials?.length)) }}
                </td>
              </tr>
              <tr v-if="item.serials && item.serials.length > 0">
                <td colspan="6" class="p-2 text-xs" style="border: 1px solid #000000; background-color: #f9fafb; color: #1f2937;"> <div style="word-break: break-all; width: 100%; line-height: 1.6;">
                    <span class="font-bold mr-1 underline">Serial (S/N):</span> 
                    {{ item.serials.join(', ') }}
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
          <tfoot>
            <tr style="background-color: #f3f4f6;">
              <td colspan="5" class="p-2 text-right font-bold text-sm uppercase" style="border: 1px solid #000000;">Tổng cộng:</td>
              <td class="p-2 text-right font-bold text-base" style="border: 1px solid #000000; color: #dc2626;"> {{ formatPrice(phieuData.tongTien) }}
              </td>
            </tr>
          </tfoot>
        </table>

        <div class="grid grid-cols-3 gap-4 mt-12 text-center text-sm">
          <div>
            <p class="font-bold mb-20 uppercase">Người lập phiếu</p>
            <p class="font-medium italic" style="color: #6b7280;">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p class="font-bold mb-20 uppercase">Thủ kho</p>
            <p class="font-medium italic" style="color: #6b7280;">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p class="font-bold mb-20 uppercase">Đại diện giao hàng</p>
            <p class="font-medium italic" style="color: #6b7280;">(Ký và ghi rõ họ tên)</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-2">
        <el-button @click="isVisible = false" size="large" class="w-full sm:w-auto">Đóng</el-button>
        <el-button type="success" size="large" @click="handleExportPDF" class="font-bold w-full sm:w-auto m-0" :loading="exporting">
          <el-icon class="mr-2"><Download /></el-icon> TẢI FILE PDF
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import html2pdf from 'html2pdf.js';

const isVisible = ref(false);
const exporting = ref(false);
const phieuData = ref({ maPhieuNhap: '', ngayNhap: '', tenNCC: '', tenNhanVien: '', items: [], tongTien: 0 });

const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getCurrentDateTime = () => {
  const now = new Date();
  return now.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const openPrint = (data) => {
  phieuData.value = data;
  isVisible.value = true;
};

// ==========================================
// HÀM TỰ XUẤT PDF ĐÃ ĐƯỢC FIX LỖI TRIỆT ĐỂ
// ==========================================
const handleExportPDF = async () => {
  exporting.value = true;
  
  // VŨ KHÍ 1: Chờ DOM render xong hoàn toàn 100% mới bắt đầu chụp ảnh
  await nextTick(); 

  const element = document.getElementById('phieu-nhap-pdf');
  if (!element) {
    exporting.value = false;
    ElMessage.error('Lỗi: Không tìm thấy dữ liệu để xuất!');
    return;
  }

  const opt = {
    margin:       0,
    filename:     `PhieuNhap_PN${phieuData.value.maPhieuNhap}.pdf`,
    image:        { type: 'jpeg', quality: 1 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true,
      scrollY: 0, // VŨ KHÍ 2: Fix lỗi chụp trang trắng khi người dùng đang cuộn chuột ở giữa trang
      windowWidth: 800 // Fix lỗi vỡ layout trên mobile khi canvas chụp
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    // Dùng async/await thay vì Promise then() để bắt lỗi chuẩn xác hơn
    await html2pdf().set(opt).from(element).save();
    ElMessage.success('Đã tải file PDF thành công!');
  } catch (error) {
    console.error("Lỗi xuất PDF:", error);
    ElMessage.error('Có lỗi xảy ra khi tạo file PDF.');
  } finally {
    exporting.value = false;
  }
};

defineExpose({ openPrint });
</script>

<style scoped>
/* Responsive Dialog */
:deep(.custom-dialog) { border-radius: 16px; overflow: hidden; }
:deep(.custom-dialog .el-dialog__header) { background-color: #f8fafc; margin-right: 0; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
@media (min-width: 768px) { :deep(.custom-dialog .el-dialog__header) { padding: 20px 24px; } }
:deep(.custom-dialog .el-dialog__title) { font-weight: 800; color: #0f172a; }
:deep(.responsive-dialog) { max-width: 95vw !important; }
:deep(.print-dialog .el-dialog__body) { padding: 0 !important; }

/* Custom Scrollbar cho khung xem trước A4 */
.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #cbd5e1; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #94a3b8; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
</style>