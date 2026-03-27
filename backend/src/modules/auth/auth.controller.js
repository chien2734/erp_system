const AuthModel = require('./auth.model');
const jwt = require('jsonwebtoken');

const AuthController = {
    // 1. Xử lý đăng nhập
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({
                        success: false,
                        message: 'Vui lòng nhập tài khoản và mật khẩu!'
                    });
            }
            const user = await AuthModel.findByUsername(username);
            if (!user) {
                return res.status(401).json({
                        success: false,
                        message: 'Tài khoản không tồn tại!'
                    });
            }
            if (password !== user.password) {
                return res.status(401).json({
                        success: false,
                        message: 'Mật khẩu không đúng!'
                    });
            }
            // Lấy quyền hạn của người dùng
            const permissions = await AuthModel.getPermissions(user.maNhomQuyen);
            // Tạo JWT Token, có thời hạn 1 ngày
            const token = jwt.sign({
                    maNhanVien: user.maNhanVien,
                    maNhomQuyen: user.maNhomQuyen,
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            // Xoa password trước khi trả về thông tin người dùng
            delete user.password;
            // Trả về token và thông tin người dùng
            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công!',
                token: token,
                user: {
                    ...user,
                    permissions: permissions
                }
            });
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập!' });
        }
    },

    // 2. Xử lý lấy thông tin profile
    getProfile: async (req, res) => {
        try {
            // req.user được tạo ra từ middleware verifyToken
            const maNhanVien = req.user.maNhanVien;

            const user = await AuthModel.getAccountById(maNhanVien);
            if (!user) return res.status(404).json({
                    success: false,
                    message: 'Tài khoản không tồn tại'
                });

            const permissions = await AuthModel.getPermissions(user.maNhomQuyen);
            delete user.password;

            res.status(200).json({
                success: true,
                user: { ...user, danhSachQuyen: permissions }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    // 2. Xử lý đổi mật khẩu
    changePassword: async (req, res) => {
        try {
            const maNhanVien = req.user.maNhanVien; // Lấy từ middleware auth
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới'
                });
            }
            const user = await AuthModel.getAccountById(maNhanVien);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
            }
            if (oldPassword !== user.password) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu cũ không đúng'
                });
            }

            await AuthModel.changePassword(maNhanVien, newPassword);
            res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đổi mật khẩu' });
        }
    }
}

module.exports = AuthController;