[README.md](https://github.com/user-attachments/files/31539024/README.md)
# ra-soat-gdx# Webapp Rà soát dữ liệu xã phường

Cloudflare Pages + Pages Functions, nguồn dữ liệu là Google Sheet (50 tab, mỗi tab 1 đơn vị).

## Cấu trúc dự án

```
webapp/
  public/index.html        <- giao diện (chọn đơn vị, xem/sửa, import excel)
  functions/api/units.js   <- GET  /api/units   danh sách đơn vị (đọc động từ tên tab)
  functions/api/data.js    <- GET  /api/data    đọc dữ liệu 1 đơn vị
  functions/api/update.js  <- POST /api/update  lưu 1 dòng (nhập tay)
  functions/api/import.js  <- POST /api/import  import hàng loạt từ Excel
  functions/_shared/       <- config cột, validate, client Google Sheets (dùng chung)
```

## Bước 1 — Chuẩn bị Google Sheet

1. Tạo 1 spreadsheet với đủ số tab đơn vị, tên tab **trùng khớp chính xác** với tên đơn vị bạn muốn hiển thị.
2. Mỗi tab có cấu trúc cột A→K giống hệt file mẫu: A-F khóa (Mã tỉnh mới, Đơn vị, Tên đơn vị hành chính, Mã xã mới, Mã BĐX, Tên BĐX), G-K nhập được (Trưởng đại diện, Mã HRM, Giám đốc xã, Mã HRM, Ghi chú).
3. **Quan trọng**: định dạng cột H và J (Mã HRM) là **Plain text**, không phải Number — chọn cả cột → `Format > Number > Plain text`. Nếu không làm bước này, số 0 ở đầu có thể bị mất khi ai đó copy/paste dữ liệu trực tiếp trên Sheet (ngoài phạm vi webapp).

## Bước 2 — Tạo Service Account (để webapp có quyền đọc/ghi Sheet)

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo project mới (hoặc dùng project có sẵn).
2. Bật **Google Sheets API**: APIs & Services → Library → tìm "Google Sheets API" → Enable.
3. Tạo Service Account: APIs & Services → Credentials → Create Credentials → Service Account.
4. Vào service account vừa tạo → tab **Keys** → Add Key → Create new key → chọn **JSON** → tải file về. File này chứa `client_email` và `private_key`.
5. Mở Google Sheet của bạn → nút **Share** → dán `client_email` từ file JSON vào, cấp quyền **Editor**.

## Bước 3 — Deploy lên Cloudflare Pages

1. Đẩy thư mục `webapp/` này lên 1 repo GitHub.
2. Vào Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → chọn repo.
3. Build settings: **Framework preset: None**, **Build command: (để trống)**, **Build output directory: `public`**.
4. Sau khi tạo xong, vào project → Settings → Environment variables → thêm 3 biến (áp dụng cho cả Production và Preview):
   - `GOOGLE_CLIENT_EMAIL` = giá trị `client_email` trong file JSON
   - `GOOGLE_PRIVATE_KEY` = giá trị `private_key` trong file JSON (dán nguyên văn, kể cả `-----BEGIN PRIVATE KEY-----`)
   - `GOOGLE_SHEET_ID` = ID trong URL của Google Sheet, ví dụ URL `https://docs.google.com/spreadsheets/d/ABC123.../edit` thì ID là `ABC123...`
5. Deploy lại (Retry deployment) để biến môi trường có hiệu lực.

## Bước 4 — Kiểm tra

- Mở trang web đã deploy → dropdown đơn vị phải hiện đủ danh sách tab thật trong Sheet.
- Chọn 1 đơn vị → bảng dữ liệu hiện ra, cột A-D khóa, cột E-I nhập được.
- Sửa 1 ô → bấm Lưu → mở Google Sheet kiểm tra đã cập nhật đúng dòng.
- Thử import 1 file Excel cùng cấu trúc cột mẫu → xem báo cáo số dòng cập nhật/không tìm thấy/sai định dạng.

## Giới hạn đã biết (đánh đổi có chủ đích, phù hợp quy mô hiện tại)

- **Không có đăng nhập/phân quyền** — ai có link đều thao tác được, chỉ lọc theo đơn vị đã chọn. Nếu sau này cần audit (ai sửa, lúc nào), sẽ cần bổ sung xác thực.
- **Không có lớp cache/DB trung gian** — mỗi lần tải dữ liệu gọi thẳng Google Sheets API. Phù hợp với quy mô hiện tại (~3.300 dòng, 50 đơn vị). Nếu số người dùng đồng thời tăng mạnh, có thể chạm giới hạn quota của Google Sheets API (mặc định 300 requests/phút/project).
- **Ghi trực tiếp, không khóa dòng** — nếu 2 người sửa cùng 1 dòng cùng lúc, người ghi sau sẽ ghi đè người ghi trước (last write wins). Với quy mô hiện tại rủi ro thấp.
