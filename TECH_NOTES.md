# 📘 CẨM NANG KỸ THUẬT & LỊCH SỬ TỐI ƯU HÓA GALLERY (TECH NOTES)

Tài liệu này ghi chú chi tiết toàn bộ kiến trúc, các lỗi đã từng gặp, nguyên nhân sâu xa từ tầng GPU/trình duyệt, giải pháp xử lý triệt để và **các nguyên tắc cấm kỵ (Golden Rules)** nhằm tránh lặp lại lỗi trong tương lai.

---

## 1. 🏗️ KIẾN TRÚC TỔNG THỂ CỦA GALLERY

- **Thư viện nền tảng**: LightGallery v2.7.2 (kèm plugin `lg-zoom` và `lg-thumbnail`).
- **Lưu trữ & Phân phối ảnh**: Cloudflare R2 Bucket (`wedding-album`) kết hợp Cloudflare CDN Cache toàn cầu.
- **Cấu trúc lưu trữ trên R2**:
  - `thumb/`: Chứa ảnh thu nhỏ (500x333 px, dung lượng ~80 KB) dùng cho lưới hiển thị (Grid), thanh thumbnails và ảnh preview tức thì khi mở Lightbox.
  - `full/`: Chứa ảnh gốc chất lượng cao 4K (3840x2560 px, dung lượng ~1.5 – 2 MB) dùng khi người dùng xem chi tiết hoặc zoom.
- **Tự động đồng bộ hóa**: Cloudflare Worker (`cloudflare/worker.js`) đồng bộ danh sách ảnh từ R2 về `cloudflare/photos.json` và cấu hình web `data/config.js`.

---

## 2. 📋 BẢNG TỔNG HỢP CÁC LỖI ĐÃ TỪNG GẶP & CÁCH GIẢI QUYẾT TRIỆT ĐỂ

| STT | Hiện tượng lỗi | Nguyên nhân gốc rễ (Root Cause) | Giải pháp chuẩn xác đã áp dụng |
|---|---|---|---|
| **1** | **Chớp giật màn hình khi vuốt lên/xuống để thoát ảnh** | Code can thiệp thủ công vào `style.transform`, `backdrop.style.opacity`, và gán `container.style.display = "none"` trong `setTimeout`. Trên iOS Safari (WebKit), thao tác này giải phóng và tạo lại GPU layer snapshot gây ra 1-frame chớp sáng/tối. | **Loại bỏ 100% inline style khi vuốt**. Dùng JS nhận diện cử chỉ vuốt thuần túy (`absY >= 45 && absY > absX * 1.2` hoặc flick). Khi buông tay, trực tiếp gọi `lightGalleryInstance.closeGallery()`. Đóng mượt êm 100% như bấm nút [X] hoặc bấm backdrop. |
| **2** | **Rung giật hình khi dùng 2 ngón tay zoom (Pinch-to-zoom)** | CSS gán `transition: transform 0.22s` lên `.lg-image` và `.lg-img-wrap` trong cả lúc ngón tay đang di chuyển (`touchmove`). CSS transition liên tục giằng co với cử chỉ ngón tay. | Phân lập CSS transition: **chỉ bật transition khi có class `.lg-use-transition-for-zoom`** (nút [+] [-] hoặc double tap). Khi đang pinch hoặc drag thì ép cứng `transition: none !important`. |
| **3** | **Ảnh zoom lên bị mờ, vỡ hạt, răng cưa** | 1. Có thuộc tính `image-rendering: -webkit-optimize-contrast !important` ép WebKit tắt khử răng cưa, bật nearest-neighbor.<br>2. Trình duyệt di động không tự re-rasterize file gốc 4K nếu layout `<img>` bị kẹp cứng ở `max-width: 100%` (390px). | 1. Đổi sang `image-rendering: auto` & `smooth`, khôi phục 3D anti-aliasing.<br>2. Tích hợp cơ chế **Dynamic Re-rasterization** (`setZoomImageSize`): sau khi zoom cận, tự cập nhật layout size thật từ file gốc 4K. |
| **4** | **Ảnh zoom lên bị giật 1 cái rồi mới nét** | Class `.reset-transition` trước đó ép `top: 50% !important; left: 50% !important; translate3d(-50%, -50%, 0) !important;` lên thẻ `inline-block`, làm lệch tâm hình học 10–40px. Timer 200ms cắt ngang animation 220ms. | 1. **Bỏ toàn bộ `top`, `left`, `translate3d(-50%, -50%, 0)`**. Giữ nguyên căn giữa tự nhiên `inline-block / vertical-align: middle`.<br>2. Đo trực tiếp kích thước unzoomed thực tế (`_baseW`, `_baseH`) từ DOM.<br>3. Tăng timer lên **260ms** để animation kết thúc trọn vẹn mới swap layout. |
| **5** | **Ảo giác ảnh mờ khi vừa mở ảnh** | Ảnh gốc 4K nặng 1.5–2 MB cần 1–2 giây tải từ mạng di động. Trong lúc tải, web hiển thị thumbnail 500px làm nền. `loading.gif` từ CDN bị lỗi 404 nên người dùng không biết ảnh gốc đang tải và zoom nhầm thumbnail. | Thêm CSS gold spinner thanh lịch `.lg-item:not(.lg-complete)::after`. Khi ảnh gốc 4K tải xong, spinner lập tức biến mất và ảnh 4K sắc nét hiện ra. |
| **6** | **Một vài ảnh bị màn hình đen "Đang tải ảnh..."** | Danh sách `images` trong file cấu hình chứa tên file chưa upload lên R2 (ví dụ `DSCF5639-1.webp`, `DSCF5692.webp`). | Rà soát sạch sẽ toàn bộ danh sách ảnh trong `config.js` và `photos.json`, chỉ giữ lại đúng các ảnh đã upload 100% lên R2. |

---

## 3. ⚠️ NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM (WHAT NOT TO DO)

1. **KHÔNG can thiệp inline CSS vào cử chỉ vuốt thoát (Swipe Dismiss)**:
   - ❌ *Sai lầm*: `wrap.style.transform = ...`, `backdrop.style.opacity = ...`, `container.style.display = "none"`.
   - ✅ *Đúng đắn*: Chỉ theo dõi cử chỉ ngón tay (`diffY`), khi đạt ngưỡng thì gọi trực tiếp `lightGalleryInstance.closeGallery()`.
2. **KHÔNG gán transition CSS khi đang có cử chỉ vuốt/kéo (Touchmove/Drag)**:
   - ❌ *Sai lầm*: Để `transition: transform 0.22s` thường trực trên thẻ ảnh.
   - ✅ *Đúng đắn*: Dùng selector `:not(.lg-use-transition-for-zoom)` và `.lg-zoom-dragging` để gán `transition: none !important`.
3. **KHÔNG dùng `-webkit-optimize-contrast` cho ảnh chụp nghệ thuật**:
   - ❌ *Sai lầm*: Nghĩ rằng "optimize contrast" làm ảnh nét hơn. Thực tế thuộc tính này ép thuật toán nearest-neighbor làm vỡ nát da mặt và chi tiết ảnh chụp.
   - ✅ *Đúng đắn*: Luôn dùng `image-rendering: auto !important; image-rendering: smooth !important;`.
4. **KHÔNG ép `top: 50%; left: 50%; translate3d(-50%, -50%, 0)` lên thẻ ảnh căn giữa bằng inline-block**:
   - ❌ *Sai lầm*: Copy class `.reset-transition` từ thư viện gốc mà không để ý thẻ ảnh đang là `inline-block`.
   - ✅ *Đúng đắn*: Giữ nguyên `display: inline-block; vertical-align: middle;`, chỉ gán `width`, `height` và `transform: scale3d(1, 1, 1) !important`.
5. **KHÔNG quên bump Cache Busters (`?v=...`) sau mỗi lần sửa CSS/JS**:
   - Vì Cloudflare CDN và trình duyệt người dùng cache rất mạnh, luôn cần nâng số version (ví dụ: `20261030-13`) đồng bộ trên cả:
     - `index.html` (thẻ `<link href="css/style.css?v=...">` và `<script src="js/main.js?v=...">`)
     - `js/main.js` (`import ... from './gallery.js?v=...'` và `config-loader.js?v=...`)
     - `js/config-loader.js` (`import ... from '../data/config.js?v=...'`)

---

## 4. 🛠️ QUY TRÌNH KIỂM TRA ĐỘ HOÀN HẢO CỦA GALLERY

Mỗi khi có cập nhật liên quan đến hình ảnh và gallery, luôn kiểm tra các tiêu chí sau trên iPhone / iPad / Android:
1. **Mở ảnh**: Mở lên tức thì (thumbnail preview), vòng xoay loading xuất hiện nhẹ và biến mất khi ảnh 4K sẵn sàng.
2. **Vuốt thoát ảnh**: Vuốt dọc xuống bằng 1 ngón tay -> đóng ngay lập tức, 0% chớp sáng/tối.
3. **Chạm đúp (Double-tap)**: Phóng to 3.0x êm ái, sau đó tự động làm nét căng 1:1 Retina, **không bị giật tâm ảnh**.
4. **Pinch zoom 2 ngón tay**: Phóng to/thu nhỏ êm ru 60fps, buông tay ra ảnh tự refresh nét căng.
5. **Rê kéo xem chi tiết (Pan/Drag)**: Thả tay ở đâu ảnh dừng cố định ở đó, không bị trôi hay giật về giữa.
