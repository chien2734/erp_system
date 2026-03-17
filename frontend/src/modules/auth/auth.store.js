import { defineStore } from 'pinia';
import AuthService from './auth.service';

export const useAuthStore = defineStore('auth', {
    // 1. STATE: Nơi lưu trữ dữ liệu (Giống như biến data trong Vue)
    state: () => ({
        // Lấy token từ LocalStorage nếu có (giúp F5 không bị văng ra ngoài)
        token: localStorage.getItem('accessToken') || null,
        
        // Thông tin người dùng (Tên, Mã nhân viên, Phân quyền)
        userInfo: JSON.parse(localStorage.getItem('userInfo')) || null, 
    }),

    // 2. GETTERS: Các hàm lấy dữ liệu tính toán (Giống computed)
    getters: {
        isAuthenticated: (state) => !!state.token, // Trả về true nếu có token
        getUserName: (state) => state.userInfo ? state.userInfo.hoTen : 'Khách',
        getRole: (state) => state.userInfo ? state.userInfo.maNhomQuyen : null,
    },

    // 3. ACTIONS: Các hàm xử lý logic (Gọi API và cập nhật State)
    actions: {
        async login(username, password) {
            try {
                // Gọi sang tầng Service để bắn API
                const response = await AuthService.login(username, password);
                
                // Giả sử Backend trả về: { token: '...', user: { hoTen: '...', maNhanVien: 1 } }
                const { token, user } = response;

                // Cập nhật State
                this.token = token;
                this.userInfo = user;

                // Lưu vào LocalStorage để trình duyệt nhớ
                localStorage.setItem('accessToken', token);
                localStorage.setItem('userInfo', JSON.stringify(user));

                return true; // Báo hiệu đăng nhập thành công
            } catch (error) {
                console.error("Lỗi đăng nhập:", error);
                throw error; // Ném lỗi ra để giao diện hiển thị câu thông báo chữ đỏ
            }
        },

        logout() {
            // Xóa sạch State
            this.token = null;
            this.userInfo = null;

            // Xóa sạch LocalStorage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userInfo');
        }
    }
});