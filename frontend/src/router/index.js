import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../modules/auth/auth.store';
import { CHUCNANG } from '../utils/constants'; // Thêm bộ từ điển quyền
import { ElMessage } from 'element-plus'; // Để hiện thông báo chặn

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../modules/auth/login.vue')
    },
    {
        path: '/print-payslip',
        name: 'In phiếu lương',
        component: () => import('../modules/profile/PrintPayslip.vue'),
        meta: { requiresAuth: true } 
    },
    {
        path: '/',
        component: () => import('../components/AdminLayout.vue'), 
        children: [
        {
            path: '', 
            name: 'Tổng quan',
            component: () => import('../modules/dashboard/Dashboard.vue'),
            meta: { permission: CHUCNANG.SAN_PHAM}
        },
        {
            path: '/hr/checkin',
            name: 'Chấm công',
            component: () => import('../modules/hr/CheckIn.vue')
            // Quyền cá nhân mặc định (Không cần meta.permission)
        },
        {
            path: '/profile',
            name: 'Hồ sơ Cá nhân',
            component: () => import('../modules/profile/Profile.vue')
            // Quyền cá nhân mặc định (Không cần meta.permission)
        },

        // --- CÁC TRANG YÊU CẦU QUYỀN (NGHIỆP VỤ) ---
        {
            path: '/hr/employees',
            name: 'Quản lý nhân viên',
            component: () => import('../modules/hr/NhanVien.vue'),
            meta: { permission: CHUCNANG.NHAN_VIEN }
        },
        {
            path: '/sales/pos', 
            name: 'Bán hàng (POS)',
            component: () => import('../modules/sales/Pos.vue'),
            meta: { permission: CHUCNANG.POS }
        },
        {
            path: '/inventory/stock', 
            name: 'Nhập kho',
            component: () => import('../modules/inventory/NhapKho.vue'),
            meta: { permission: CHUCNANG.NHAP_KHO }
        },
        {
            path: '/inventory/history',
            name: 'Lịch sử nhập kho',
            component: () => import('../modules/inventory/LichSuNhap.vue'),
            meta: { permission: CHUCNANG.NHAP_KHO } 

        },
        {
            path: '/inventory/products', 
            name: 'Danh mục Sản phẩm',
            component: () => import('../modules/inventory/SanPham.vue'),
            meta: { permission: CHUCNANG.SAN_PHAM }
        },
        {
            path: '/inventory/suppliers', 
            name: 'Nhà Cung Cấp',
            component: () => import('../modules/inventory/NhaCungCap.vue'),
            meta: { permission: CHUCNANG.SAN_PHAM } // Dùng chung quyền bảo vệ với Danh mục SP
        },
        {
            path: '/inventory/brands',
            name: 'Quản lý Hãng',
            component: () => import('../modules/inventory/HangSP.vue'),
            meta: { permission: CHUCNANG.SAN_PHAM }
        },
        {
            path: '/inventory/serial',
            name: 'Quản lý Serial',
            component: () => import('../modules/inventory/Serial.vue'),
            meta: { permission: CHUCNANG.SERIAL }
        },
        {
            path: '/inventory/report',
            name: 'Báo cáo Kho',
            component: () => import('../modules/inventory/BaoCaoKho.vue'),
            meta: { permission: CHUCNANG.BAO_CAO }
        },
        {
            path: '/sales/orders',
            name: 'Quản lý Hóa đơn',
            component: () => import('../modules/sales/HoaDon.vue'),
            meta: { permission: CHUCNANG.POS } 
        },
        {
            path: '/sales/report',
            name: 'Báo cáo Sản phẩm',
            component: () => import('../modules/sales/ThongKeSanPham.vue'),
            meta: { permission: CHUCNANG.BAO_CAO }
        },
        {
            path: '/hr/attendance',
            name: 'Chấm Công',
            component: () => import('../modules/hr/ChamCong.vue'),
            meta: { permission: CHUCNANG.CHAM_CONG }
        },
        {
            path: '/hr/payroll',
            name: 'Bảng Tính Lương',
            component: () => import('../modules/hr/BangLuong.vue'),
            meta: { permission: CHUCNANG.TINH_LUONG }
        },
        {
            path: '/settings',
            name: 'Cấu hình Hệ thống',
            component: () => import('../modules/settings/Settings.vue'),
            meta: { permission: CHUCNANG.PHAN_QUYEN }
        },
        {
            path: '/auth/accounts',
            name: 'Quản lý Tài Khoản',
            component: () => import('../modules/auth/TaiKhoan.vue'),
            meta: { permission: CHUCNANG.PHAN_QUYEN }
        },
        {
            path: '/hr/leaves',
            name: 'Quản lý Đơn từ',
            component: () => import('../modules/hr/DonTu.vue'),
            meta: { permission: CHUCNANG.CHAM_CONG } // Người quản lý chấm công sẽ duyệt đơn
        },
        {
            path: '/sales/customers', 
            name: 'Quản lý Khách Hàng',
            component: () => import('../modules/sales/KhachHang.vue'),
            meta: { permission: CHUCNANG.KHACH_HANG }
        },
        {
            path: '/hr/positions',
            name: 'Quản lý Chức vụ', 
            component: () => import('../modules/hr/ChucVu.vue'),
            meta: { permission: CHUCNANG.PHAN_QUYEN } 
        },
        {
            path: '/hr/report-salary',
            name: 'Báo cáo Lương',
            component: () => import('../modules/hr/BaoCaoLuong.vue'),
            meta: { permission: CHUCNANG.BAO_CAO }
        },
        {
            path: '/audit/logs',
            name: 'Lịch sử hệ thống',
            component: () => import('../modules/audit/AuditLogs.vue'),
            meta: { permission: CHUCNANG.PHAN_QUYEN }
        },
        ],
        meta: { requiresAuth: true }
    },
    // --- 404 NOT FOUND (CATCH ALL) ---
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../modules/errors/NotFound.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// BẢO VỆ ROUTE (Navigation Guard)
router.beforeEach((to, from) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;
    const userRole = authStore.getUserRole; // Lấy Role (1: Giám đốc)

    // 1. Chưa đăng nhập -> Đuổi về trang Login
    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
        return { name: 'Login' }; 
    }

    // 2. Đã đăng nhập mà cố vào trang Login -> Đẩy về đúng trang mặc định
    if (to.path === '/login' && isAuthenticated) {
        return (userRole === 1 || userRole === 2) ? { path: '/' } : { path: '/hr/checkin' };
    }

    // 3. CHỐT CHẶN DASHBOARD: Chỉ Giám đốc & Quản lý mới được xem
    if (to.path === '/' && isAuthenticated) {
        if (userRole !== 1 && userRole !== 2) {
            return { path: '/hr/checkin' }; // Nhân viên khác bị đá sang Chấm công
        }
    }

    // 4. Chốt chặn Phân quyền nghiệp vụ (RBAC Guard)
    if (to.meta.permission) {
        if (!authStore.hasPermission(to.meta.permission, 'quyenXem')) {
            ElMessage.error('Truy cập bị từ chối! Bạn không có quyền xem trang này.');
            // Nếu bị từ chối, cũng phải trả về đúng trang mặc định theo Role (Giám đốc & Quản lý về Dashboard)
            return (userRole === 1 || userRole === 2) ? { path: '/' } : { path: '/hr/checkin' };
        }
    }

    // Cho phép đi tiếp
    return true;
})


export default router;