import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../modules/auth/auth.store';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../modules/auth/login.vue')
    },
    {
        path: '/',
        component: () => import('../components/AdminLayout.vue'), // Dùng Layout làm cha
        children: [
        {
            path: '', // Trang chủ Dashboard
            name: 'Tổng quan',
            component: () => import('../modules/dashboard/Dashboard.vue')
        },
        {
            path: '/hr/employees',
            name: 'Quản lý nhân viên',
            component: () => import('../modules/hr/NhanVien.vue')
        },
        {
            path: '/sales/pos', 
            name: 'Bán hàng (POS)',
            component: () => import('../modules/sales/Pos.vue')
        },
        {
            path: '/inventory/stock', 
            name: 'Nhập kho',
            component: () => import('../modules/inventory/NhapKho.vue')
        },
        {
            path: '/inventory/history',
            name: 'Lịch sử nhập kho',
            component: () => import('../modules/inventory/LichSuNhap.vue')
        },
        {
            path: '/inventory/products', 
            name: 'Danh mục Sản phẩm',
            component: () => import('../modules/inventory/SanPham.vue')
        },
        {
            path: '/inventory/serial',
            name: 'Quản lý Serial',
            component: () => import('../modules/inventory/Serial.vue')
        },
        {
            path: '/sales/orders',
            name: 'Quản lý Hóa đơn',
            component: () => import('../modules/sales/HoaDon.vue')
        },
        {
            path: '/hr/attendance',
            name: 'Chấm Công',
            component: () => import('../modules/hr/ChamCong.vue')
        },
        {
            path: '/hr/checkin',
            name: 'Portal Chấm Công',
            component: () => import('../modules/hr/CheckIn.vue')
        },
        {
            path: '/hr/payroll',
            name: 'Bảng Tính Lương',
            component: () => import('../modules/hr/BangLuong.vue')
        },
        {
            path: '/settings',
            name: 'Cấu hình Hệ thống',
            component: () => import('../modules/settings/Settings.vue')
        },
        {
            path: '/auth/accounts',
            name: 'Quản lý Tài Khoản',
            component: () => import('../modules/auth/TaiKhoan.vue')
        },
        {
            path: '/profile',
            name: 'Hồ sơ Cá nhân',
            component: () => import('../modules/profile/Profile.vue')
        },
        {
            path: '/hr/leaves',
            name: 'Quản lý Đơn từ',
            component: () => import('../modules/hr/DonTu.vue')
        },
        {
            path: '/sales/customers', // Đã đổi theo ý bạn
            name: 'Quản lý Khách Hàng',
            component: () => import('../modules/sales/KhachHang.vue') // Trỏ về thư mục sales
        },
        // Các trang khác của phân hệ HR, Sales... sẽ khai báo thêm ở đây
        ],
        meta: { requiresAuth: true }
    },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// BẢO VỆ ROUTE (Navigation Guard)
router.beforeEach((to, from) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;

    // Nếu trang yêu cầu đăng nhập mà chưa có token -> Chuyển về Login
    if (to.meta.requiresAuth && !isAuthenticated) {
        return { name: 'Login' }; // Thay vì next('/login')
    }

    // Nếu đã đăng nhập mà cố vào trang Login -> Đẩy về Trang chủ
    if (to.path === '/login' && isAuthenticated) {
        return { path: '/' }; // Thay vì next('/')
    }

    // Không trả về gì hoặc trả về true có nghĩa là cho phép đi tiếp
    return true;
})

export default router;