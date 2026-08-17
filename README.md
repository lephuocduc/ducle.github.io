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
- **Thông Tin Lễ Cưới**: Đếm ngược + lịch trình nghi lễ & tiệc cưới trong cùng một section
- **Love Story Timeline**: Hành trình yêu thương với ảnh và dòng thời gian
- **Gallery Masonry**: Album ảnh cưới responsive với Lazy Loading
- **Lightbox Modal**: Xem ảnh phóng to mượt mà
- **Google Maps Integration**: Nhúng bản đồ chỉ đường cho từng địa điểm
- **Lời Chúc (Wishes)**: Form gửi lời chúc, thả tim, sắp xếp Nổi bật/Mới nhất — đồng bộ Google Sheets qua Apps Script
- **QR Code Mừng Cưới**: Hiển thị QR chuyển khoản VietQR, sao chép STK và bấm để phóng to
- **Music Player**: Trình phát nhạc nền với icon visual
- **Particle Effects**: Hiệu ứng trái tim & cánh hoa rơi trên Canvas
- **Parallax Effect**: Hiệu ứng parallax nhẹ nhàng
- **Scroll Reveal**: Hiệu ứng fade-in khi scroll bằng IntersectionObserver
- **Hamburger Menu**: Tự chuyển sang menu drawer trên mobile hoặc khi thanh menu bị tràn trên desktop

### 🎬 Performance & Animations
- **60 FPS Animations**: Sử dụng `requestAnimationFrame` cho hiệu ứng mượt mà
- **CSS Keyframe Animations**: Transitions & animations tối ưu
- **Lazy Loading Images**: Hình ảnh tải khi cần thiết
- **WebP Image Format**: Giảm dung lượng, tăng tốc độ tải

### ♿ Accessibility & SEO
- **WCAG Compliance**: Hỗ trợ screen reader, ARIA labels
- **Keyboard Navigation**: Phím tắt hỗ trợ (Tab, Enter, Escape)
- **Color Contrast**: Đảm bảo độ tương phản màu sắc
- **Meta Tags**: Open Graph và Twitter Card

---

## 📁 Cấu Trúc Dự Án

```
Invitation/
├── index.html                  # SPA Container & Module Loader
├── css/
│   ├── style.css               # Giao diện chính (Emerald & Champagne Gold)
│   ├── animation.css           # Keyframe animations & Scroll effects
│   ├── responsive.css          # Media queries cho Mobile/Tablet/Desktop
│   └── variables.css           # CSS Variables (colors, fonts, z-index)
├── js/
│   ├── main.js                 # Entry Point - Điều khiển toàn ứng dụng
│   ├── config-loader.js        # Nạp config.js & cập nhật SEO Meta tags
│   ├── countdown.js            # Bộ đếm ngược chính xác đến giây
│   ├── gallery.js              # Gallery Masonry & Lightbox Modal
│   ├── music.js                # Trình phát nhạc nền & visual
│   ├── timeline.js             # Render Love Story Timeline
│   ├── map.js                  # Google Maps & thông tin lễ cưới
│   ├── wishes.js               # Form lời chúc, like, phân trang
│   ├── effects.js              # Canvas Particle (Hearts, Leaves) & Parallax
│   └── animation.js            # IntersectionObserver Scroll Reveal
├── data/
│   └── config.js               # 📌 FILE DUY NHẤT CẦN CHỈNH SỬA
├── tools/
│   ├── compress-images.mjs     # Script nén ảnh gallery & hero (sharp)
│   └── img-originals/          # Backup ảnh gốc trước khi nén
├── Appscript                   # Google Apps Script backend cho lời chúc
├── assets/
│   ├── img/                    # Hình ảnh (cover, groom, bride, gallery, etc.)
│   ├── audio/                  # File nhạc nền (.mp3)
│   ├── icons/                  # Icons & favicons (.svg)
│   └── ics/                    # Calendar file (.ics)
├── robots.txt                  # Cấu hình crawler SEO
├── sitemap.xml                 # Sơ đồ trang web XML
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
        ogImage: "assets/img/og-image.webp"
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
    // Giờ Việt Nam (UTC+7). Đây cũng là ngày kích hoạt nhạc đặc biệt.
    weddingDate: "2026-10-25T00:00:00+07:00",
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
        url: "assets/audio/canon-in-d.mp3",
        specialUrl: "assets/audio/Tonight I celebrate my love.mp3",
        title: "Canon in D - Pachelbel",
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
    galleryDriveUrl: "https://drive.google.com/drive/folders/...",
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

**Kiểm tra nhạc đặc biệt:** `weddingDate` là nơi cấu hình ngày duy nhất. Tạm đổi nó thành ngày hôm nay (vẫn giữ hậu tố `+07:00`) rồi tải lại trang để nghe `music.specialUrl`; kiểm tra xong, đổi lại ngày cưới thật. Ngày, tháng và năm được so sánh theo múi giờ Việt Nam.

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
│   ├── canon-in-d.mp3  # Nhạc nền chính
│   └── Tonight I celebrate my love.mp3  # Nhạc đặc biệt (phát vào ngày cưới)
└── icons/
    └── favicon.svg         # Biểu tượng website
```

**Lưu ý**: Dùng format `.webp` cho ảnh để giảm dung lượng. Hero và avatar được preload; ảnh gallery dùng lazy loading nên chỉ tải khi khách cuộn gần đến phần album.

**Ảnh hero (`cover.webp`)** là LCP image — được `<link rel="preload">` trong `index.html` nên ảnh hưởng trực tiếp tốc độ mở trang. Khuyến nghị giữ **dưới ~200 KB** (hiện tại ~684 KB nếu chưa nén lại). Xem mục [Nén ảnh](#-nén-ảnh-performance) bên dưới.

### 3️⃣ **Nén Ảnh (Performance)**

Dự án có sẵn script `tools/compress-images.mjs` (dùng [sharp](https://sharp.pixelplumbing.com/)) để nén ảnh WebP. Ảnh gốc được backup vào `assets/img/originals/` trước khi ghi đè.

**Cài đặt (một lần):**
```bash
npm init -y
npm install sharp
```

**Nén ảnh gallery:**
```bash
node tools/compress-images.mjs
```

Mặc định script nén gallery xuống tối đa **1920×1920 px**, WebP **quality 82%**. Chỉnh `GALLERY_FILES`, `MAX_WIDTH`, `WEBP_QUALITY` trong file nếu cần.

**Nén ảnh hero (`cover.webp`) — quan trọng cho LCP:**

Ảnh hero được preload làm LCP nên cần target nhỏ hơn gallery. Khuyến nghị:

| Thông số | Gallery | Hero (LCP) |
|----------|---------|------------|
| Kích thước tối đa | 1920 px | 1600–1920 px (chiều rộng) |
| WebP quality | 82% | **70–75%** |
| Dung lượng mục tiêu | — | **< 200 KB** |

Thêm `cover.webp` vào danh sách nén với profile riêng, hoặc chạy one-off:

```bash
node -e "
const sharp = require('sharp');
sharp('assets/img/cover.webp')
  .resize({ width: 1920, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 72, effort: 6 })
  .toFile('assets/img/cover.webp.tmp')
  .then(() => console.log('Done — kiểm tra dung lượng rồi đổi tên file'));
"
```

Sau khi nén, kiểm tra chất lượng hiển thị trên mobile và desktop. Nếu vẫn > 200 KB, hạ `quality` xuống 65–70 hoặc giảm `width` còn 1600 px.

### 4️⃣ **Tạo QR Code Mừng Cưới**

Sử dụng VietQR để tạo QR code chuyển khoản:
1. Vào [VietQR Image API](https://img.vietqr.io/)
2. Chọn ngân hàng, nhập STK, tên người nhận
3. Copy URL vào `qrImage` field trong `config.js`

Ví dụ:
```javascript
qrImage: "https://img.vietqr.io/image/TPB-01945354401-compact2.png?amount=0&addInfo=Mung%20Cuoi"
```

### 5️⃣ **Nhúng Google Maps**

1. Vào [Google Maps](https://maps.google.com)
2. Tìm địa điểm tiệc cưới
3. Click "Share" → "Embed a map"
4. Copy embed URL vào `mapEmbedUrl`
5. Copy direct link vào `mapDirectUrl`

Nếu muốn hiện nút **Thêm vào Lịch**, thêm cả hai đường dẫn vào từng mục `ceremonies`: `calendarUrl` (Google Calendar) và `calendarWebcalUrl` (tệp ICS). Trên Android, thiệp sẽ dùng Google Calendar; trên iPhone/iPad sẽ ưu tiên `webcal://`.

### 6️⃣ **Cấu Hình Lời Chúc (Google Apps Script)**

1. Tạo Google Sheet với các cột: `id | name | content | createdTime | status | likes | isPinned | visitorId`
2. Vào **Extensions → Apps Script**, dán nội dung file `Appscript`
3. **Deploy → New Deployment → Web App** (Execute as: Me, Who has access: Anyone)
4. Copy URL triển khai vào `wishesApiUrl` trong `data/config.js`

**Luồng xử lý:**
- Mọi lời chúc đều lưu vào Sheet (trạng thái `pending`)
- Email thông báo chỉ gửi khi lời chúc **≥ 20 ký tự**
- Đổi cột `status` thành `approved` trong Sheet để hiển thị công khai trên trang

**Lưu ý về fallback:** Nếu `wishesApiUrl` không được cấu hình hoặc Apps Script lỗi/quá quota, hệ thống sẽ ưu tiên hiển thị lời chúc từ cache (`localStorage`). Nếu chưa từng có cache (khách mở lần đầu hoặc mất kết nối), trang sẽ hiển thị thông báo "Đang tải lời chúc...". Khi deploy thật, hãy đảm bảo:
1. Đã cấu hình đúng `wishesApiUrl` trong `config.js`
2. Đã deploy Apps Script và kiểm tra hoạt động
3. Theo dõi quota của Apps Script (giới hạn miễn phí ~30,000 lần gọi/ngày)

Sau mỗi lần sửa `Appscript`, cần **deploy lại** Web App để thay đổi có hiệu lực.

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

---

## 🌐 Deploy Lên GitHub Pages

1. **Push code lên GitHub**:
   ```bash
   git add .
   git commit -m "Update wedding website"
   git push origin main
   ```

2. **Settings → Pages → Source → main branch**

3. Website tự động deploy tại `https://username.github.io/repository-name/`

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
| **Google Maps Embed** | Nhúng bản đồ chỉ đường |
| **HTML Audio** | Trình phát nhạc |
| **Open Graph & Meta Tags** | Social sharing & SEO |

---

## 🎯 Tối Ưu Hóa & Performance

### ✅ Đã Implement
- **Preload & Preconnect**: Preload hero/ảnh đại diện và kết nối trước tới tài nguyên bên ngoài
- **WebP Images**: Format ảnh hiệu suất cao
- **Lazy Loading**: Gallery, QR và bản đồ tải khi cần thiết
- **requestAnimationFrame**: Animations mượt 60 FPS
- **SEO & Search Indexing**: Cấu hình `robots.txt` và `sitemap.xml` chuẩn SEO

### ⚠️ Cần Kiểm Tra Trước Publish

| Ảnh | Vai trò | Mục tiêu |
|-----|---------|----------|
| `cover.webp` | **LCP** — preload trong `<head>` | **< 200 KB** |
| `groom.*` / `bride.*` | Preload avatar | < 100 KB mỗi ảnh |
| Gallery `*.webp` | Lazy load | < 300 KB mỗi ảnh |

`cover.webp` hiện ~684 KB nếu chưa nén lại — đây là điểm nghẽn LCP lớn nhất. Chạy `tools/compress-images.mjs` với target nhỏ hơn (xem [Nén ảnh](#3️⃣-nén-ảnh-performance)).

**Kiểm tra nhanh sau khi nén:**
```bash
# Windows PowerShell
(Get-Item assets/img/cover.webp).Length / 1KB
```
Kết quả nên dưới 200.

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

### ❓ Lời chúc hiển thị trạng thái "Đang tải lời chúc..."
- Kiểm tra `wishesApiUrl` trong `config.js` đã được cấu hình chưa
- Kiểm tra Apps Script đã được deploy chưa
- Mở browser console (F12) xem log lỗi API
- Apps Script quota miễn phí ~30,000 requests/ngày - nếu quá quota API sẽ không trả lời chúc mới

---

## 📋 Checklist Trước Khi Publish

- [ ] Chỉnh sửa tất cả thông tin trong `data/config.js`
- [ ] Thay ảnh cover, groom, bride, gallery
- [ ] **Nén `cover.webp` xuống < 200 KB** (LCP image — xem mục Nén Ảnh)
- [ ] Nén ảnh gallery bằng `node tools/compress-images.mjs`
- [ ] Cấu hình Google Maps cho các địa điểm
- [ ] Tạo QR code mừng cưới
- [ ] Deploy Google Apps Script & cấu hình `wishesApiUrl`
- [ ] Thêm file nhạc nền (mặc định: Canon in D)
- [ ] Verify nhạc nền phát đúng (kiểm tra cả ngày cưới đặc biệt)
- [ ] Kiểm tra responsive trên di động (hamburger menu, gallery, lightbox)
- [ ] Test toàn bộ tính năng (countdown, gallery, maps, music, lời chúc)
- [ ] Kiểm tra SEO Meta tags (F12 → Network)
- [ ] Deploy lên GitHub Pages hoặc hosting riêng

---

## ❤️ Ghi Chú

Website này được tạo với tình yêu và tâm huyết. Hy vọng thiệp cưới online này sẽ mang lại niềm vui cho quý vị quan khách.

**Chúc mừng ngày trọng đại! 🎉💍**

---

*Last Updated: 2026-08-08*
*Made with ❤️ by Lê Phước Đức*
