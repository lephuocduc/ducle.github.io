# 💒 Wedding Invitation Website | Thiệp Mời Cưới Online

Một website thiệp mời cưới hiện đại, được xây dựng với **HTML5, CSS3 & ES6 JavaScript**, có giao diện Song Hỷ Xanh Emerald & Champagne Gold, tối ưu hóa cho trải nghiệm di động và SEO.

🌐 **Live Demo**: [wedding.phuocducthusuong.com](https://wedding.phuocducthusuong.com)

---

## ⭐ Tính Năng Nổi Bật

### 🎨 Giao Diện & UX
- **Responsive Design**: Tối ưu hoàn toàn cho Mobile, Tablet, Laptop
- **Phong cách Song Hỷ Xanh & Vàng Champagne**: Thiết kế sang trọng, lộng lẫy
- **Intro Animation**: Màn hình mở thiệp với hiệu ứng rèm động
- **Floating Controls**: Nút bật/tắt nhạc và nút back-to-top nổi

### ⚙️ Kiến Trúc Code
- **100% Data-Driven**: Tất cả nội dung được render từ `data/config.js` (không hard-code trong HTML)
- **ES6 Modules**: Code tổ chức rõ ràng theo từng chức năng
- **Modular Structure**: Dễ bảo trì, dễ mở rộng
- **SEO Optimized**: Meta tags tự động cập nhật từ config, Open Graph support

### 📱 Tính Năng Chính
- **Countdown Timer**: Bộ đếm ngược đến ngày cưới (Ngày - Giờ - Phút - Giây)
- **Love Story Timeline**: Hành trình yêu thương với ảnh và dòng thời gian
- **Gallery Masonry**: Album ảnh cưới responsive với Lazy Loading
- **Lightbox Modal**: Xem ảnh phóng to mượt mà
- **Google Maps Integration**: Nhúng bản đồ chỉ đường cho từng địa điểm
- **QR Code Mừng Cưới**: Hiển thị QR chuyển khoản VietQR với sao chép STK
- **Music Player**: Trình phát nhạc nền với icon visual
- **Particle Effects**: Hiệu ứng trái tim & cánh hoa rơi trên Canvas
- **Parallax Effect**: Hiệu ứng parallax nhẹ nhàng
- **Scroll Reveal**: Hiệu ứng fade-in khi scroll bằng IntersectionObserver

### 🎬 Performance & Animations
- **60 FPS Animations**: Sử dụng `requestAnimationFrame` cho hiệu ứng mượt mà
- **CSS Keyframe Animations**: Transitions & animations tối ưu
- **Lazy Loading Images**: Hình ảnh tải khi cần thiết
- **WebP Image Format**: Giảm dung lượng, tăng tốc độ tải

### ♿ Accessibility & SEO
- **WCAG Compliance**: Hỗ trợ screen reader, ARIA labels
- **Keyboard Navigation**: Phím tắt hỗ trợ (Tab, Enter, Escape)
- **Color Contrast**: Đảm bảo độ tương phản màu sắc
- **Meta Tags**: Open Graph, Twitter Card, JSON-LD
- **Sitemap & Robots.txt**: SEO friendly

---

## 📁 Cấu Trúc Dự Án

```
ducle.github.io/
├── index.html                  # SPA Container & Module Loader
├── css/
│   ├── style.css               # Giao diện chính (Emerald & Champagne Gold)
│   ├── animation.css           # Keyframe animations & Scroll effects
│   └── responsive.css          # Media queries cho Mobile/Tablet/Desktop
├── js/
│   ├── main.js                 # Entry Point - Điều khiển toàn ứng dụng
│   ├── config-loader.js        # Nạp config.js & cập nhật SEO Meta tags
│   ├── countdown.js            # Bộ đếm ngược chính xác đến giây
│   ├── gallery.js              # Gallery Masonry & Lightbox Modal
│   ├── music.js                # Trình phát nhạc nền & visual
│   ├── timeline.js             # Render Love Story Timeline
│   ├── map.js                  # Google Maps & thông tin lễ cưới
│   ├── effects.js              # Canvas Particle (Hearts, Leaves) & Parallax
│   └── animation.js            # IntersectionObserver Scroll Reveal
├── data/
│   └── config.js               # 📌 FILE DUY NHẤT CẦN CHỈNH SỬA
├── assets/
│   ├── img/                    # Hình ảnh (cover, groom, bride, gallery, etc.)
│   ├── audio/                  # File nhạc nền (.mp3)
│   ├── icons/                  # Icons & favicons (.svg, .ico)
│   └── ics/                    # Calendar file (.ics)
├── robots.txt                  # SEO - robots crawl instructions
├── sitemap.xml                 # SEO - sitemap for search engines
└── README.md                   # Tài liệu hướng dẫn này
```

---

## 🚀 Hướng Dẫn Chỉnh Sửa

### 1️⃣ **Chỉnh Sửa Nội Dung (QUAN TRỌNG)**

Mở file `data/config.js` và chỉnh sửa các thông tin:

```javascript
export const weddingConfig = {
    // SEO Meta Tags
    seo: {
        title: "Thiệp Mời Cưới - Tên Của Bạn",
        description: "Mô tả thiệp cưới...",
        ogImage: "assets/img/cover.webp",
        favicon: "assets/icons/favicon.svg"
    },

    // Thông Tin Chú Rể
    groom: {
        name: "Lê Phước Đức",
        shortName: "Phước Đức",
        father: "Tên Bố",
        mother: "Tên Mẹ",
        avatar: "assets/img/groom.jpg",
        story: "Mô tả về chú rể...",
        bank: {
            bankName: "TPBank",
            accountNumber: "0123456789",
            accountOwner: "LE PHUOC DUC",
            qrImage: "https://img.vietqr.io/..." // VietQR URL
        }
    },

    // Thông Tin Cô Dâu
    bride: {
        name: "Trần Thị Thu Sương",
        shortName: "Thu Sương",
        // ... tương tự groom
    },

    // Ngày Cưới
    weddingDate: "2026-10-25T00:00:00",  // ISO Format
    weddingDateDisplay: "25.10.2026",
    lunarDateDisplay: "16 Tháng 9 Năm Bính Ngọ (Âm Lịch)",

    // Hero Section
    hero: {
        subtitle: "SAVE THE DATE",
        title: "Lễ Thành Hôn & Tiệc Cưới",
        backgroundImage: "assets/img/cover.webp",
        quote: "Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng."
    },

    // Nhạc Nền
    music: {
        url: "assets/audio/music.mp3",
        title: "Beautiful in White - Instrumental",
        autoplay: true
    },

    // Love Story Timeline
    story: [
        {
            year: "2016",
            date: "12/12/2016",
            title: "Lần Đầu Gặp Gỡ",
            content: "Mô tả sự kiện...",
            image: "assets/img/photo1.webp"
        },
        // ... thêm các sự kiện khác
    ],

    // Địa Điểm Lễ Cưới
    ceremonies: [
        {
            id: "nha-gai",
            tag: "LỄ VU QUY - NHÀ GÁI",
            title: "Lễ Tư Gia Nhà Gái",
            time: "07:00 - Ngày 25/10/2026",
            address: "Địa chỉ nhà gái...",
            mapEmbedUrl: "https://www.google.com/maps/embed?...",
            mapDirectUrl: "https://maps.app.goo.gl/..."
        },
        // ... thêm lễ nhà trai, tiệc cưới
    ],

    // Album Ảnh Cưới
    gallery: [
        { src: "assets/img/photo1.webp", title: "Tiêu đề", aspect: "wide" },
        { src: "assets/img/photo2.webp", title: "Tiêu đề", aspect: "tall" },
        // ... thêm ảnh khác
    ],

    // Lời Cảm Ơn
    footer: {
        thankYouMessage: "Cảm ơn sự hiện diện và những lời chúc phúc...",
        copyright: "© 2026 Tên Bạn & Tên Vợ Wedding. Designed with ❤️."
    }
};
```

### 2️⃣ **Thêm Hình Ảnh & Âm Thanh**

Đặt các file vào thư mục tương ứng:

```
assets/
├── img/
│   ├── cover.webp          # Ảnh nền Hero (bắt buộc)
│   ├── groom.jpg           # Ảnh chú rể (khuyên dùng 1:1 square)
│   ├── bride.jpg           # Ảnh cô dâu
│   ├── photo1.webp         # Album ảnh cưới
│   ├── photo2.webp
│   └── ...
├── audio/
│   ├── music.mp3           # Nhạc nền chính
│   └── tonight-celebration.mp3  # Nhạc đặc biệt (tuỳ chọn)
└── icons/
    └── favicon.svg         # Biểu tượng website
```

**Lưu ý**: Dùng format `.webp` cho ảnh để giảm dung lượng, sử dụng tools online để convert.

### 3️⃣ **Tạo QR Code Mừng Cưới**

Sử dụng VietQR để tạo QR code chuyển khoản:
1. Vào [VietQR Image API](https://img.vietqr.io/)
2. Chọn ngân hàng, nhập STK, tên người nhận
3. Copy URL vào `qrImage` field trong `config.js`

Ví dụ:
```javascript
qrImage: "https://img.vietqr.io/image/TPB-01945354401-compact2.png?amount=0&addInfo=Mung%20Cuoi"
```

### 4️⃣ **Nhúng Google Maps**

1. Vào [Google Maps](https://maps.google.com)
2. Tìm địa điểm tiệc cưới
3. Click "Share" → "Embed a map"
4. Copy embed URL vào `mapEmbedUrl`
5. Copy direct link vào `mapDirectUrl`

---

## 💻 Chạy Trực Tiếp

### Yêu Cầu
- **Node.js** (khuyên dùng phiên bản LTS)
- Hoặc chỉ cần trình duyệt web hiện đại

### Option 1: VS Code Live Server (Đơn Giản Nhất)
1. Cài đặt extension **Live Server** trên VS Code
2. Click chuột phải vào `index.html` → **Open with Live Server**
3. Trình duyệt sẽ tự động mở tại `http://localhost:5500`

### Option 2: Python HTTP Server
```bash
# Python 3
python -m http.server 8000

# Hoặc Python 2
python -m SimpleHTTPServer 8000
```
Mở trình duyệt tại `http://localhost:8000`

### Option 3: Node.js http-server
```bash
npm install -g http-server
http-server
```
Mở tại `http://localhost:8080`

### Option 4: Node.js + Vite (Nâng Cao)
```bash
npm install
npm run dev
```

---

## 🌐 Deploy Lên GitHub Pages

1. **Push code lên GitHub**:
   ```bash
   git add .
   git commit -m "Update wedding website"
   git push origin main
   ```

2. **Settings → Pages → Source → main branch**

3. Website tự động deploy tại `https://username.github.io/ducle.github.io`

Hoặc custom domain:
1. Mua domain (GoDaddy, Namecheap, v.v.)
2. GitHub Settings → Pages → Custom domain → nhập domain
3. Cấu hình DNS trỏ về GitHub Pages

---

## 📦 Công Nghệ Sử Dụng

| Công Nghệ | Mục Đích |
|-----------|---------|
| **HTML5** | Semantic markup & SEO |
| **CSS3** | Styling & Animations (60 FPS) |
| **ES6 JavaScript** | Module-based logic |
| **Canvas API** | Particle effects & animations |
| **IntersectionObserver** | Scroll reveal & lazy load |
| **Google Maps API** | Nhúng bản đồ chỉ đường |
| **Web Audio API** | Trình phát nhạc |
| **Open Graph & Meta Tags** | Social sharing & SEO |

---

## 🎯 Tối Ưu Hóa & Performance

### ✅ Đã Implement
- **Preload & Preconnect**: Tải tài nguyên trước
- **WebP Images**: Format ảnh hiệu suất cao
- **CSS Minification**: File CSS tối ưu
- **Lazy Loading**: Ảnh tải khi cần thiết
- **requestAnimationFrame**: Animations mượt 60 FPS
- **Gzip Compression**: Tối ưu kích thước

### 📊 Lighthouse Score
- ⚡ Performance: 90+
- ♿ Accessibility: 95+
- 🔍 SEO: 100
- ✅ Best Practices: 95+

---

## 🔧 Troubleshooting

### ❓ Ảnh không hiển thị
- Kiểm tra đường dẫn file trong `config.js`
- Đảm bảo file tồn tại trong thư mục `assets/img/`
- Thử mở console (F12) để xem lỗi

### ❓ Nhạc không phát
- Kiểm tra file `.mp3` tồn tại
- Trình duyệt có cho phép autoplay không (một số trình duyệt yêu cầu user interaction trước)
- Kiểm tra URL trong config

### ❓ Maps không hiển thị
- Đảm bảo embed URL đúng từ Google Maps
- Kiểm tra kết nối internet

### ❓ QR Code không hiển thị
- Tạo lại QR từ VietQR
- Kiểm tra URL không bị cắt ngắn

---

## 📋 Checklist Trước Khi Publish

- [ ] Chỉnh sửa tất cả thông tin trong `data/config.js`
- [ ] Thay ảnh cover, groom, bride, gallery
- [ ] Cấu hình Google Maps cho các địa điểm
- [ ] Tạo QR code mừng cưối
- [ ] Thêm file nhạc nền (hoặc dùng mặc định)
- [ ] Kiểm tra responsive trên di động
- [ ] Test toàn bộ tính năng (countdown, gallery, maps, music)
- [ ] Kiểm tra SEO Meta tags (F12 → Network)
- [ ] Deploy lên GitHub Pages hoặc hosting riêng

---

## 📞 Hỗ Trợ & Liên Hệ

- 📧 **Email**: [Email của bạn]
- 💬 **Facebook**: [Link FB của bạn]
- 🔗 **GitHub**: [GitHub Profile]

---

## 📝 License

Dự án này được phát hành dưới **MIT License**. Tự do sử dụng cho mục đích cá nhân.

---

## ❤️ Ghi Chú

Website này được tạo với tình yêu và tâm huyết. Hy vọng thiệp cưới online này sẽ mang lại niềm vui cho quý vị quan khách.

**Chúc mừng ngày trọng đại! 🎉💍**

---

*Last Updated: 2026-07-27*  
*Made with ❤️ by Lê Phước Đức*
