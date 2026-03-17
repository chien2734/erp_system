const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Lấy token từ header của request
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện chức năng này!' });
    }

    const token = authHeader.split(' ')[1]; // Cắt chữ 'Bearer ' đi lấy mỗi mã token

    try {
        // Giải mã token xem có hợp lệ và còn hạn không
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Nhét thông tin user vào request để dùng ở các bước sau
        next(); // Cho phép đi tiếp vào Controller
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn truy cập!' });
    }
};

module.exports = { verifyToken };