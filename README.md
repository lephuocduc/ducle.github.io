# Wedding Invitation Website (Thiệp Mời Cưới Online Cao Cấp)

Website thiệp cưới online phong cách **Song Hỷ Xanh Emerald & Champagne Gold**, xây dựng theo chuẩn Single Page Application (SPA), viết bằng HTML5, CSS3 và Vanilla ES6 JavaScript Modules.

---

## 🌟 Tính Năng Nổi Bật

- **Dynamic Data Driven**: 100% dữ liệu được render từ `data/config.js`, không hard-code nội dung trong HTML.
- **ES6 JavaScript Modules**: Tách biệt logic rõ ràng (`config-loader`, `countdown`, `gallery`, `music`, `map`, `timeline`, `effects`).
- **Masonry Gallery & Lightbox**: Album ảnh sắp xếp thông minh, Lazy Loading ảnh, xem chi tiết phóng to mượt mà.
- **Google Maps Integration**: Nhúng trực tiếp bản đồ chỉ đường cho từng địa điểm (Nhà Trai, Nhà Gái, Tiệc Cưới).
- **QR Mừng Cưới & Copy STK**: Hiển thị QR chuyển khoản VietQR tự động, kèm nút sao chép số tài khoản có thông báo Toast.
- **Hiệu Ứng 60 FPS**: Particle cánh hoa & trái tim rơi nhẹ nhàng bằng Canvas `requestAnimationFrame`, Parallax nhẹ, Scroll Reveal bằng `IntersectionObserver`.
- **Tối Ưu Trải Nghiệm (UX/SEO/WCAG)**: Hỗ trợ phím tắt, ARIA labels, màu tương phản chuẩn, tối ưu thẻ Open Graph & Meta tags.

---

## 📁 Cấu Trúc Dự Án

```
wedding/
├── index.html                  # Thẻ chứa SPA & Imports ES6 Module main.js
├── css/
│   ├── variables.css           # Thư viện màu sắc, font chữ, spacing & design tokens
│   ├── style.css               # Giao diện chính Song Hỷ Xanh & Champagne Gold
│   ├── animation.css           # 60 FPS Keyframe animations & Scroll reveal
│   └── responsive.css          # Tối ưu chuẩn Mobile, Tablet, Laptop
├── js/
│   ├── config-loader.js        # Đọc file config.js & nạp thẻ SEO Meta
│   ├── countdown.js            # Bộ đếm ngược ngày cưới chính xác theo giây
│   ├── gallery.js              # Album ảnh cưới Masonry & Lightbox Zoom Modal
│   ├── music.js                # Trình phát nhạc nền & xoay đĩa nhạc
│   ├── animation.js            # IntersectionObserver kích hoạt hiệu ứng cuộn
│   ├── timeline.js             # Render Hành Trình Yêu Thương (Love Story)
│   ├── map.js                  # Thẻ thông tin Lễ Cưới & Iframe Google Maps
│   ├── effects.js              # Floating Hearts, Falling Leaves Canvas & Parallax
│   └── main.js                 # Entry Point điều khiển toàn bộ ứng dụng
├── assets/
│   ├── bride.jpg               # Ảnh đại diện Cô Dâu
│   ├── groom.jpg               # Ảnh đại diện Chú Rể
│   ├── hero.jpg                # Ảnh nền Banner chính
│   ├── qr.png                  # Mã QR chuyển khoản mừng cưới
│   ├── music.mp3               # File bài hát nhạc nền
│   ├── favicon.ico             # Biểu tượng biểu tượng website
│   └── gallery/                # Thư mục lưu trữ hình ảnh album
├── data/
│   └── config.js               # FILE DUY NHẤT CẦN CHỈNH SỬA THÔNG TIN
└── README.md                   # Tài liệu hướng dẫn sử dụng
```

---

## 🛠️ Hướng Dẫn Thay Đổi Cấu Hình (`data/config.js`)

Để thay đổi toàn bộ nội dung website, bạn chỉ cần mở và chỉnh sửa duy nhất file `data/config.js`:

```javascript
export const weddingConfig = {
    groom: {
        name: "Lê Phước Đức",
        father: "Lê Văn An",
        mother: "Nguyễn Thị Bình",
        avatar: "assets/groom.jpg",
        bank: {
            bankName: "MB Bank",
            accountNumber: "0399888999",
            accountOwner: "LE PHUOC DUC"
        }
    },
    bride: {
        name: "Nguyễn Kim Anh",
        father: "Nguyễn Văn Cường",
        mother: "Trần Thị Dung",
        avatar: "assets/bride.jpg"
    },
    weddingDate: "2026-11-20T10:00:00",
    music: {
        url: "assets/music.mp3",
        autoplay: true
    }
};
```

---

## 🚀 Chạy Trực Tiếp

Do dự án sử dụng **ES6 Modules** (`import/export`), hãy khởi chạy website thông qua một Web Server nhẹ:

1. **VS Code Live Server**: Click chuột phải vào `index.html` chọn **Open with Live Server**.
2. **Nginx / Apache / Python Simple HTTP Server**:
   ```bash
   python -m http.server 8000
   ```
   Mở trình duyệt tại đường dẫn `http://localhost:8000`.
