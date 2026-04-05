import axios from 'axios';

// Khởi tạo một đối tượng axios với cấu hình mặc định
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, // Lấy từ file .env
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // Quá 10s không thấy server trả lời là báo lỗi TimeOut
});

// INTERCEPTOR REQUEST: Can thiệp trước khi gửi API đi
api.interceptors.request.use(
    (config) => {
        // Lấy token từ LocalStorage (Lát nữa đăng nhập xong mình sẽ lưu vào đây)
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// INTERCEPTOR RESPONSE: Can thiệp khi Server trả dữ liệu về
api.interceptors.response.use(
    (response) => {
        // Nếu gọi thành công, chỉ lấy đúng cục data, bỏ qua các thông tin rườm rà của HTTP
        return response.data;
    },
    (error) => {
        // Xử lý lỗi chung (VD: Nếu server báo 401 Unauthorized -> Token hết hạn -> Xóa token, bắt đăng nhập lại)
        if (error.response && error.response.status === 401) {
            console.error("Phiên đăng nhập hết hạn!");
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userInfo');
            // Cú pháp chuyển trang về Login (Sẽ hoạt động khi ráp với Vue Router)
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;