const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./src/routes/index');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Sử dụng tất cả routes với tiền tố /api/v1
app.use('/api/v1', apiRoutes);

// Xử lý lỗi 404 (Không tìm thấy route)
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API Route không tồn tại' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại http://localhost:${PORT}`);
});