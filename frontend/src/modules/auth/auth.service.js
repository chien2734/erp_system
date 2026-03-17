import api from '../../services/api';

const AuthService = {
    async login(username, password) {
        // ========================================================
        // 1. CODE GỐC CHUẨN (Tạm thời dùng // để comment lại)
        // ========================================================
        /*
        const response = await api.post('/auth/login', {
            username: username,
            password: password
        });
        return response;
        */

        // ========================================================
        // 2. MOCK DATA (Dữ liệu giả lập để làm giao diện trước)
        // ========================================================
        return new Promise((resolve, reject) => {
            // Dùng setTimeout để giả lập thời gian mạng giật giật mất 1 giây
            setTimeout(() => {
                // Nhớ lại data mẫu hôm trước: Tài khoản admin, pass 123456 là Giám đốc
                if (username === 'admin' && password === '123456') {
                    resolve({
                        // Giả lập Backend tạo ra 1 cái thẻ Token
                        token: 'day-la-mot-doan-ma-token-gia-de-test-he-thong',
                        // Giả lập thông tin nhân viên từ bảng NhanVien
                        user: { 
                            maNhanVien: 1, 
                            hoTen: 'Hồ Vĩnh Phúc', 
                            maNhomQuyen: 1 // 1 là Admin (Ban Giám Đốc)
                        }
                    });
                } else {
                    // Nếu nhập sai thì ném lỗi
                    reject({ response: { data: { message: 'Sai tài khoản hoặc mật khẩu!' } } });
                }
            }, 1000); 
        });
    },

    async getProfile() {
        // Sau này backend làm xong thì mở code thật ra
        // return await api.get('/auth/profile');
    }
};

export default AuthService;