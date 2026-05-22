# VNUF2 Helper — Chrome Extension

Tiện ích mở rộng Chrome hỗ trợ sinh viên VNUF2 sử dụng Cổng thông tin đào tạo ([daotao.vnuf2.edu.vn](https://daotao.vnuf2.edu.vn)).

## ✨ Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| 📋 **Copy TKB** | Copy thời khóa biểu dạng tuần / học kỳ / lịch thi ra text |
| 📷 **Copy Ảnh** | Chụp và copy bảng TKB thành ảnh PNG |
| 📅 **Xuất Calendar** | Xuất TKB tuần ra file `.ics` (Google Calendar / Outlook) |
| 📊 **GPA Calculator** | Tính GPA giả định theo thang 4 với mục tiêu tùy chỉnh |
| 🔑 **Auto Login** | Tự động đăng nhập tài khoản mặc định |
| ⚡ **Auto Fill Khảo sát** | Tự động điền form khảo sát đánh giá |
| 🌙 **Dark Mode** | Chế độ tối cho toàn bộ trang |
| 🎯 **Course Sniper** | Hỗ trợ đăng ký môn học nhanh |

## 📦 Cài đặt (Developer Mode)

1. Tải xuống hoặc clone repo này
2. Mở Chrome → `chrome://extensions/`
3. Bật **Developer mode** (góc trên phải)
4. Nhấn **Load unpacked** → chọn thư mục `vnuf2-helper`
5. Extension sẽ tự động hoạt động khi truy cập `daotao.vnuf2.edu.vn`

## 🛠️ Cấu trúc dự án

```
vnuf2-helper/
├── manifest.json          # Manifest V3
├── background/
│   └── service-worker.js  # Background worker
├── content/
│   ├── main.js            # Router SPA
│   ├── copy-tkb.js        # Copy TKB & ảnh
│   ├── export-calendar.js # Xuất .ics
│   ├── gpa-calculator.js  # Tính GPA
│   ├── auto-login.js      # Tự động đăng nhập
│   ├── auto-fill-survey.js# Tự động điền khảo sát
│   ├── dark-mode.js       # Dark mode
│   └── course-snipper.js  # Course sniper
├── utils/
│   ├── dom-helper.js      # Tiện ích DOM cho Angular SPA
│   ├── storage.js         # Chrome Storage API wrapper
│   ├── crypto.js          # Mã hóa thông tin
│   └── html2canvas.min.js # Chụp ảnh bảng
├── popup/                 # Popup UI extension
└── icons/                 # Icon extension
```

## 📋 Hướng dẫn sử dụng

### Copy TKB / Ảnh / Xuất Calendar
1. Đăng nhập vào cổng đào tạo
2. Vào **Thời khóa biểu dạng tuần**
3. Các nút tiện ích sẽ tự hiện phía trên bảng TKB:
   - 📋 **Copy Text** — copy text dạng có cấu trúc
   - 📷 **Copy Ảnh** — copy ảnh vào clipboard (Ctrl+V để dán)
   - 📅 **Xuất Calendar (.ics)** — tải file để import vào Google Calendar

### GPA Calculator
1. Vào **Xem điểm**
2. Bảng điểm sẽ có thêm cột **🎯 Mục tiêu**
3. Nhập điểm mục tiêu vào từng môn để xem GPA dự kiến

## 🔒 Quyền yêu cầu

- `storage` — lưu cài đặt & tài khoản
- `alarms` — nhắc nhở
- `notifications` — thông báo
- `activeTab` — tương tác với tab hiện tại
- Chỉ hoạt động trên `https://daotao.vnuf2.edu.vn/*`

## 📄 License

MIT License — Xem [LICENSE](LICENSE) để biết thêm chi tiết.
