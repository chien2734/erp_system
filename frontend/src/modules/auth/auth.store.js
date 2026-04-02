import { defineStore } from 'pinia';
import api from '../../services/api'; 

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Khớp tên key với file api.js của bạn (userInfo và accessToken)
    user: JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')) || null,
    token: localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUserName: (state) => state.user?.hoTen || state.user?.username || 'User',
    getUserRole: (state) => state.user?.maNhomQuyen,

    // Mặc định là check quyenXem, nếu muốn check nút Xóa thì truyền 'quyenXoa'
    hasPermission: (state) => (maChucNang, action = 'quyenXem') => {
      if (!state.user || !state.user.permissions) return false;
      
      // Lấy quyền của chức năng đó (Nếu không có trong danh sách -> false)
      const modulePerms = state.user.permissions[maChucNang];
      if (!modulePerms) return false;

      // Trả về 1 (true) hoặc 0 (false)
      return modulePerms[action] === 1;
    }
  },

  actions: {
    // 1. GỌI API ĐĂNG NHẬP
    async login(username, password, rememberMe) {
      try {
        // VÌ FILE api.js CỦA BẠN ĐÃ RETURN response.data, NÊN Ở ĐÂY CHỈ CẦN LẤY KẾT QUẢ TRỰC TIẾP
        const data = await api.post('/auth/login', { username, password });
        
        // Data trả về từ Backend (success, message, token, user)
        const { token, user } = data;

        // Lưu vào State
        this.token = token;
        this.user = user;

        // Lưu vào Trình duyệt (Tùy theo việc có tick Remember Me hay không)
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('accessToken', token); // Dùng đúng chữ accessToken
        storage.setItem('userInfo', JSON.stringify(user)); // Dùng đúng chữ userInfo

        return data; 
      } catch (error) {
        throw error; 
      }
    },

    // 2. ĐĂNG XUẤT
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userInfo');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('userInfo');
    },

    // 3. GỌI API ĐỔI MẬT KHẨU
    async changePassword(oldPassword, newPassword) {
      try {
        const data = await api.put('/auth/change-password', {
          oldPassword,
          newPassword
        });
        return data;
      } catch (error) {
        throw error;
      }
    }
  }
});