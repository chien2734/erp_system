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
        // Thêm vào ngay dưới route hr/employees
        {
            path: '/sales/pos', 
            name: 'Bán hàng (POS)',
            component: () => import('../modules/sales/Pos.vue')
        }
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