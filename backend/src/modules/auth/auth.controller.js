const AuthModel = require('./auth.model');
const jwt = require('jsonwebtoken');

const AuthController = {
    // ==========================================
    // 1. CÁC API CÁ NHÂN 
    // ==========================================
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu!' });
            
            const user = await AuthModel.findByUsername(username);
            if (!user) return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });

            // Kiểm tra xem tài khoản có bị Admin khóa (tk.trangThai) 
            // hoặc Nhân viên đã nghỉ việc (nv.trangThai) hay không
            if (user.trangThai === 0 || user.nvTrangThai === 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!' 
                });
            }

            if (password !== user.password) return res.status(401).json({ success: false, message: 'Mật khẩu không đúng!' });

            const rawPermissions = await AuthModel.getPermissions(user.maNhomQuyen);
            const permissionsMap = {};
            rawPermissions.forEach(p => {
                permissionsMap[p.maChucNang] = { quyenXem: p.quyenXem, quyenThem: p.quyenThem, quyenSua: p.quyenSua, quyenXoa: p.quyenXoa };
            });

            const token = jwt.sign({ maNhanVien: user.maNhanVien, maNhomQuyen: user.maNhomQuyen }, process.env.JWT_SECRET, { expiresIn: '1d' });
            delete user.password;
            
            res.status(200).json({ success: true, message: 'Đăng nhập thành công!', token: token, user: { ...user, permissions: permissionsMap }});
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập!' });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await AuthModel.getAccountById(req.user.maNhanVien);
            if (!user) return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });

            const rawPermissions = await AuthModel.getPermissions(user.maNhomQuyen);
            const permissionsMap = {};
            rawPermissions.forEach(p => {
                permissionsMap[p.maChucNang] = { quyenXem: p.quyenXem, quyenThem: p.quyenThem, quyenSua: p.quyenSua, quyenXoa: p.quyenXoa };
            });

            delete user.password;
            res.status(200).json({ success: true, user: { ...user, permissions: permissionsMap }});
        } catch (error) { res.status(500).json({ success: false, message: 'Lỗi server' }); }
    },

    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            if (!oldPassword || !newPassword) return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' });
            
            const user = await AuthModel.getAccountById(req.user.maNhanVien);
            if (oldPassword !== user.password) return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });

            await AuthModel.changePassword(req.user.maNhanVien, newPassword);
            res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
        } catch (error) { res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đổi mật khẩu' }); }
    },

    // ==========================================
    // 2. CÁC API DÀNH CHO ADMIN
    // ==========================================

    getAccounts: async (req, res) => {
        if (req.user.maNhomQuyen !== 1) return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền' });
        try {
            const data = await AuthModel.getAllAccounts();
            res.status(200).json({ success: true, data });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi lấy danh sách tài khoản' }); }
    },

    getFreeEmployees: async (req, res) => {
        if (req.user.maNhomQuyen !== 1) return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền' });
        try {
            const data = await AuthModel.getFreeEmployees();
            res.status(200).json({ success: true, data });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi lấy danh sách nhân viên' }); }
    },

    createAccount: async (req, res) => {
        if (req.user.maNhomQuyen !== 1) return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền' });
        try {
            await AuthModel.createAccount(req.body);
            res.status(200).json({ success: true, message: 'Cấp tài khoản thành công' });
        } catch (e) { res.status(500).json({ success: false, message: 'Username đã tồn tại hoặc lỗi server' }); }
    },

    updateAccountRole: async (req, res) => {
        if (req.user.maNhomQuyen !== 1) return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền' });
        try {
            await AuthModel.updateAccountRole(req.params.id, req.body.maNhomQuyen);
            res.status(200).json({ success: true, message: 'Cập nhật quyền thành công' });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi cập nhật quyền' }); }
    },

    updateAccountStatus: async (req, res) => {
        if (req.user.maNhomQuyen !== 1) return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền' });
        // Không cho phép Admin tự khóa chính mình
        if (Number(req.params.id) === Number(req.user.maNhanVien)) {
            return res.status(400).json({ success: false, message: 'Bạn không thể khóa tài khoản của chính mình!' });
        }
        try {
            await AuthModel.updateAccountStatus(req.params.id, req.body.trangThai);
            res.status(200).json({ success: true, message: 'Đổi trạng thái thành công' });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi đổi trạng thái' }); }
    },

    resetAccountPassword: async (req, res) => {
        if (req.user.maNhomQuyen !== 1) return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền' });
        try {
            await AuthModel.changePassword(req.params.id, '123456');
            res.status(200).json({ success: true, message: 'Mật khẩu đã được reset về 123456' });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi reset mật khẩu' }); }
    },

    getRoles: async (req, res) => {
        try {
            const data = await AuthModel.getAllRoles();
            res.status(200).json({ success: true, data });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi lấy danh sách Roles' }); }
    },

    createRole: async (req, res) => {
        if (req.user.maNhomQuyen !== 1) return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền' });
        try {
            await AuthModel.createRole(req.body);
            res.status(200).json({ success: true, message: 'Tạo nhóm quyền mới thành công' });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi tạo nhóm quyền' }); }
    },

    getFunctions: async (req, res) => {
        try {
            const data = await AuthModel.getAllFunctions();
            res.status(200).json({ success: true, data });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi lấy chức năng' }); }
    },

    getRolePermissions: async (req, res) => {
        try {
            const data = await AuthModel.getPermissions(req.params.id);
            res.status(200).json({ success: true, data });
        } catch (e) { res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết quyền' }); }
    },

    updateRolePermissions: async (req, res) => {
        if (req.user.maNhomQuyen !== 1) return res.status(403).json({ success: false, message: 'Chỉ Giám đốc mới có quyền' });
        if (Number(req.params.id) === 1) return res.status(400).json({ success: false, message: 'Không thể chỉnh sửa quyền của Admin mặc định!' });
        
        try {
            await AuthModel.updateRolePermissions(req.params.id, req.body.permissions);
            res.status(200).json({ success: true, message: 'Lưu ma trận phân quyền thành công' });
        } catch (e) { 
            console.error(e);
            res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lưu quyền' }); 
        }
    }
}

module.exports = AuthController;