# Career PC Build Configurator

Web chọn nghề → gợi ý cấu hình PC (rẻ / tầm trung / cao cấp) kèm sơ đồ lắp ráp 3D xoay 360°.

## Cấu trúc
```
index.html          Khung trang (navbar, vùng nội dung, popup)
css/styles.css      Toàn bộ giao diện (theme, kính, accent, sơ đồ lắp ráp…)
js/icons-data.js    Dữ liệu icon logo phần mềm (BRAND, RICH) – nạp trước main.js
js/main.js          Toàn bộ logic: dữ liệu nghề/cấu hình, giao diện, sơ đồ 3D (three.js),
                    ước tính FPS, ngân sách, phân tích yêu cầu
```

## Chạy
- Mở `index.html` bằng trình duyệt (cần Internet vì dùng CDN: Tailwind, three.js r128, Font Awesome, Google Fonts).
- Hoặc chạy server nội bộ: `python3 -m http.server 8000` rồi vào http://localhost:8000

## Tìm nhanh trong `js/main.js`
Các khối được đánh dấu bằng comment `/* ── tên khối ── */`, ví dụ:
Sơ đồ lắp ráp (isometric / 3D thật three.js), linh kiện tower, laptop / Mac / Barebone,
logo ứng dụng theo ngành, FPS estimator, ngân sách (slider), phân tích yêu cầu.
Case theo tầm giá / nghề: các hàm `isoProfile`, `isoCaseName`, `towerShell`, `towerFront`.

Lưu ý: các file JS là script thường (không phải module) và dùng chung biến toàn cục, nên giữ đúng thứ tự nạp trong `index.html`.
