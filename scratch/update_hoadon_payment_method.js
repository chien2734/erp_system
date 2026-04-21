const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const db = require('../backend/src/config/db');

async function updateDatabase() {
    try {
        console.log('--- Đang cập nhật Database cho tính năng Chuyển khoản ---');
        
        // 1. Thêm cột phuongThucThanhToan vào bảng hoadon
        const [columns] = await db.query('SHOW COLUMNS FROM hoadon LIKE "phuongThucThanhToan"');
        if (columns.length === 0) {
            await db.query('ALTER TABLE hoadon ADD COLUMN phuongThucThanhToan VARCHAR(50) DEFAULT "Tiền mặt"');
            console.log('Đã thêm cột phuongThucThanhToan vào bảng hoadon');
        } else {
            console.log('Cột phuongThucThanhToan đã tồn tại');
        }

        console.log('--- Hoàn tất cập nhật Database ---');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi cập nhật Database:', error);
        process.exit(1);
    }
}

updateDatabase();
