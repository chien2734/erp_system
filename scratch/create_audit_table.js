const db = require('../backend/src/config/db');

async function createAuditLogTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        maNhanVien INT,
        hanhDong VARCHAR(255) NOT NULL,
        chiTiet TEXT,
        ngayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (maNhanVien) REFERENCES nhanvien(maNhanVien) ON DELETE SET NULL
    );
    `;
    try {
        await db.query(sql);
        console.log("Table 'audit_logs' created or already exists.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        process.exit();
    }
}

createAuditLogTable();
