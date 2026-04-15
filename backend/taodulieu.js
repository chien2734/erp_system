// Hàm dùng để tạo dữ liệu chấm công mẫu cho 11 nhân viên 
const fs = require('fs');

const startDate = new Date('2026-01-01');
const endDate = new Date('2026-03-31');
const employees = Array.from({ length: 11 }, (_, i) => i + 1);

const ranMin = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (num) => String(num).padStart(2, '0');

let sql = 'INSERT INTO chamcong (maNhanVien, ngayLamViec, gioVao, gioRa, soGioLam, trangThai) VALUES\n';
let values = [];

for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue; 
    
    const dateStr = d.toISOString().split('T')[0];

    employees.forEach(emp => {
        const rand = Math.random();
        let hVao, mVao, hRa, mRa, soGioLam, trangThai;

        if (rand < 0.60) {
            // 60%: Đúng giờ - Về đúng giờ (Vào 07:45-07:59 | Ra 17:00-17:15)
            hVao = 7; mVao = ranMin(45, 59);
            hRa = 17; mRa = ranMin(0, 15);
            soGioLam = 8; 
            trangThai = 'Đúng giờ - Về đúng giờ';
        } else if (rand < 0.75) {
            // 15%: Đi trễ - Về đúng giờ (Vào 08:05-08:45 | Ra 17:00-17:15)
            hVao = 8; mVao = ranMin(5, 45);
            hRa = 17; mRa = ranMin(0, 15);
            soGioLam = 8 - (mVao / 60); 
            trangThai = 'Đi trễ - Về đúng giờ';
        } else if (rand < 0.80) {
            // 5%: Đúng giờ - Về sớm (Vào 07:45-07:59 | Ra 16:15-16:55)
            hVao = 7; mVao = ranMin(45, 59);
            hRa = 16; mRa = ranMin(15, 55);
            soGioLam = 8 - ((60 - mRa) / 60); 
            trangThai = 'Đúng giờ - Về sớm';
        } else if (rand < 0.85) {
            // 5%: Đi trễ - Về sớm (Vào 08:10-08:30 | Ra 16:30-16:50)
            hVao = 8; mVao = ranMin(10, 30);
            hRa = 16; mRa = ranMin(30, 50);
            soGioLam = 8 - (mVao / 60) - ((60 - mRa) / 60); 
            trangThai = 'Đi trễ - Về sớm';
        } else if (rand < 0.93) {
            // 8%: Đúng giờ và Tăng ca (OT < 2h) (Vào 07:45-07:59 | Ra 18:15-19:45)
            hVao = 7; mVao = ranMin(45, 59);
            hRa = ranMin(18, 19); mRa = ranMin(15, 45);
            soGioLam = 8 + (hRa - 18) + (mRa / 60); // Tính OT sau 18:00
            trangThai = 'Đúng giờ và Tăng ca';
        } else if (rand < 0.96) {
            // 3%: Đi trễ và Tăng ca (OT < 2h) (Vào 08:05-08:20 | Ra 18:15-19:45)
            hVao = 8; mVao = ranMin(5, 20);
            hRa = 18; mRa = ranMin(15, 45);
            soGioLam = 8 - (mVao / 60) + (hRa - 18) + (mRa / 60); 
            trangThai = 'Đi trễ và Tăng ca';
        } else if (rand < 0.99) {
            // 👉 MỚI: 3% Đúng giờ và Tăng ca (Max OT) (Vào 07:45-07:59 | Ra 20:00-21:30)
            hVao = 7; mVao = ranMin(45, 59);
            hRa = ranMin(20, 21); mRa = ranMin(0, 30);
            soGioLam = 10; // Bị chặn cứng ở mức 10 tiếng (8 hành chính + 2 OT)
            trangThai = 'Đúng giờ và Tăng ca (Max OT)';
        } else {
            // 👉 MỚI: 1% Đi trễ và Tăng ca (Max OT) (Vào 08:05-08:20 | Ra 20:00-21:00)
            hVao = 8; mVao = ranMin(5, 20);
            hRa = 20; mRa = ranMin(0, 59);
            soGioLam = 10 - (mVao / 60); // Bị chặn Max OT 2h, nhưng vẫn bị trừ tiền đi trễ
            trangThai = 'Đi trễ và Tăng ca (Max OT)';
        }

        // Làm tròn số giờ làm còn 2 chữ số thập phân
        soGioLam = Math.round(soGioLam * 100) / 100;
        
        const gioVao = `${pad(hVao)}:${pad(mVao)}:00`;
        const gioRa = `${pad(hRa)}:${pad(mRa)}:00`;

        values.push(`(${emp}, '${dateStr}', '${gioVao}', '${gioRa}', ${soGioLam}, '${trangThai}')`);
    });
}

sql += values.join(',\n') + ';\n';
fs.writeFileSync('seed_chamcong_2026_quy1.sql', sql);
console.log(`✅ Đã tạo xong file seed_chamcong_2026_quy1.sql với ${values.length} dòng dữ liệu!`);