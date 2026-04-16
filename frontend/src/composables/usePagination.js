import { ref, computed, watch } from 'vue';

/**
 * Hàm phân trang dùng chung cho mọi bảng dữ liệu
 * @param {Ref<Array>} sourceData - Mảng dữ liệu NGUỒN (Thường là biến computed đã được filter/search)
 * @param {Number} defaultPageSize - Số dòng trên 1 trang (Mặc định: 10)
 */
export function usePagination(sourceData, defaultPageSize = 10) {
  const currentPage = ref(1);
  const pageSize = ref(defaultPageSize);

  // Tự động quay về Trang 1 nếu người dùng gõ tìm kiếm làm thay đổi dữ liệu
  watch(sourceData, () => {
    currentPage.value = 1;
  });

  // Tổng số dòng hiện có
  const totalItems = computed(() => sourceData.value?.length || 0);

  // Mảng dữ liệu đã bị cắt xén đúng theo trang hiện tại (Dùng để đưa vào el-table)
  const paginatedData = computed(() => {
    if (!sourceData.value || sourceData.value.length === 0) return [];
    
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    
    return sourceData.value.slice(start, end);
  });

  return {
    currentPage,
    pageSize,
    totalItems,
    paginatedData
  };
}