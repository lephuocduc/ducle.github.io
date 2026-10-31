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

| STT | Hiện tượng lỗi | Nguyên nhân gốc rễ (Root Cause) | Giải pháp chuẩn xác đã áp dụng (Commit f4b7a2a) |
|---|---|---|---|
| **1** | **Chớp giật màn hình khi vuốt lên/xuống để thoát ảnh** | Can thiệp thủ công vào `style.transform`, `backdrop.style.opacity`, và gán `container.style.display = "none"` trong `setTimeout`. Trên iOS Safari (WebKit), thao tác này giải phóng và tạo lại GPU layer snapshot gây ra 1-frame chớp sáng/tối. | **Loại bỏ 100% inline style khi vuốt**. Dùng JS nhận diện cử chỉ vuốt thuần túy (`absY >= 45 && absY > absX * 1.2` hoặc flick). Khi buông tay, trực tiếp gọi `lightGalleryInstance.closeGallery()`. Đóng mượt êm 100% như bấm nút [X] hoặc bấm backdrop. |
| **2** | **Ảnh zoom bị giật và dời về 1 góc** | Cố can thiệp vào `setZoomImageSize` để gán `width` và `height` pixel thật (Dynamic Re-rasterization) và thêm class `.reset-transition`. Khi layout DOM của thẻ ảnh `inline-block` bị thay đổi kích thước từ 400px lên hàng ngàn pixel, bounding box bị nở sang góc dưới/phải, làm gãy toàn bộ ma trận translate của LightGallery khiến ảnh **nhảy giật và dạt hẳn về 1 góc**. | **Vô hiệu hóa triệt để `setZoomImageSize`** (`window.lgZoom.prototype.setZoomImageSize = function () {};` và `zp.setZoomImageSize = function () {};`). Toàn bộ cơ chế zoom dựa trên **GPU 2D Transform Scale thuần túy** (`scale(${scale})` trên `$image` và `translate3d(posX, posY, 0)` trên `$wrap`). Giữ nguyên 100% layout DOM gốc, độ lệch tọa độ bằng 0, không bao giờ bị dời về góc. |
| **3** | **Rung giật hình khi dùng 2 ngón tay zoom (Pinch-to-zoom)** | CSS gán `transition: transform 0.22s` lên `.lg-image` và `.lg-img-wrap` trong cả lúc ngón tay đang di chuyển (`touchmove`). CSS transition liên tục giằng co với cử chỉ ngón tay. | Phân lập CSS transition: **chỉ bật transition khi có class `.lg-use-transition-for-zoom`** (nút [+] [-] hoặc double tap). Khi đang drag/pinch thì ép cứng `transition: none !important`. Khi kết thúc pinch, nếu `scale <= 1.15` thì tự động đàn hồi về tâm `scale(1)`. |
| **4** | **Trôi ảnh do quán tính khi kéo thả (Pan/Drag inertia)** | LightGallery nhân thêm hệ số vận tốc kéo chuột/tay vào tọa độ dừng khiến ảnh tiếp tục trôi trượt sau khi thả tay. | Tùy biến `zp.touchendZoom`: loại bỏ hoàn toàn hệ số gia tốc quán tính, buông tay ở đâu ảnh đứng yên 100% cố định tại đúng vị trí đó. |
| **5** | **Ảo giác ảnh mờ khi vừa mở ảnh** | Ảnh gốc 4K nặng 1.5–2 MB cần 1–2 giây tải từ mạng di động. Trong lúc tải, web hiển thị thumbnail 500px làm nền. `loading.gif` từ CDN bị lỗi 404 nên người dùng không biết ảnh gốc đang tải và tưởng ảnh bị mờ. | Thêm CSS gold spinner thanh lịch `.lg-item:not(.lg-complete)::after`. Khi ảnh gốc 4K tải xong, spinner lập tức biến mất và ảnh 4K sắc nét hiện ra. |
| **6** | **Một vài ảnh bị màn hình đen "Đang tải ảnh..."** | Danh sách `images` trong file cấu hình chứa tên file chưa upload lên R2 (ví dụ `DSCF5639-1.webp`, `DSCF5692.webp`). | Rà soát sạch sẽ toàn bộ danh sách ảnh trong `config.js` và `photos.json`, chỉ giữ lại đúng các ảnh đã upload 100% lên R2. |
| **7** | **Nút mũi tên chuyển ảnh che khuất người trong ảnh** | Nút mũi tên mặc định nền đen đục, nếu bật cố định sẽ che mất người trong các ảnh chụp đứng/toàn thân. | **Thiết kế nút bán trong suốt (Glassmorphism)**: nền `rgba(15, 10, 10, 0.28)` kết hợp `backdrop-filter: blur(6px)`, độ mờ `opacity: 0.45` (mobile `0.4`), icon vàng kim nhạt. Vừa dễ bấm chuyển ảnh, vừa nhìn xuyên thấu không che khuất chủ thể. Khi phóng to (zoom) tự động ẩn. |
| **8** | **Ảnh thiếu 1 trong 2 folder (thiếu thumb hoặc thiếu full)** | Nếu upload thiếu file ở 1 trong 2 folder trên R2, web trước đây có thể gặp lỗi 404, kẹt skeleton nhấp nháy trên lưới hoặc kẹt spinner loading trong Lightbox. | **Cơ chế đối chiếu giao thoa & tự hủy thẻ lỗi**: (1) Cloudflare Worker `/api/photos` đối chiếu danh sách giữa `thumb/` và `full/`, chỉ trả về các file có MẶT Ở CẢ 2 FOLDER, bỏ qua triệt để mọi ảnh thiếu; (2) Frontend `gallery.js` tự động `.remove()` thẻ card nếu thumbnail lỗi và tự động chuyển sang slide tiếp theo nếu ảnh full lỗi. |
| **9** | **Xóa ảnh trực tiếp từ Web (Chỉ riêng chủ nhân)** | Nhu cầu xóa ảnh lỗi/xấu ngay khi đang duyệt web mà không cần phải mở máy tính hay đăng nhập tài khoản Cloudflare Dashboard. | **Tính năng R2 Admin Photo Deletion**: (1) Bảo mật bằng bí mật `ADMIN_PIN` trên Cloudflare Worker (không lưu mã mặc định trong code), kích hoạt bằng đuôi `?admin` hoặc phím tắt `Ctrl+Shift+A`; (2) Endpoint `DELETE /api/photos` xóa đồng thời cả 2 thư mục `full/` và `thumb/`, sau đó kiểm tra đối soát trên R2 xác nhận biến mất 100% trước khi phản hồi; (3) Nút xóa xuất hiện ở góc từng thẻ ảnh và trên thanh công cụ Lightbox kèm hộp thoại xác nhận an toàn. |
| **10** | **Tích hợp Tab Video Cưới (YouTube & Trực tiếp)** | Nhu cầu bổ sung tab xem video cưới / phóng sự cưới bằng YouTube embed bên cạnh các album ảnh R2. | **Kiến trúc Tab Video linh hoạt**: (1) Thêm tab `type: "video"`, `id: "05-video-cuoi"`; (2) Hàm `extractYouTubeId` hỗ trợ tự động bóc tách ID từ mọi dạng link (đầy đủ, rút gọn, embed, shorts); (3) Giao diện Responsive 16:9 Cinema Card với viền vàng kim và đổ bóng sang trọng; (4) Tự động bỏ qua R2 auto-sync để không phát sinh request thừa; (5) Trên di động, tab thứ 5 tự động span `1 / -1` ở hàng 3 để bố cục cân đối hoàn hảo. |
| **11** | **Tab Album chiếm quá nhiều diện tích màn hình điện thoại (3 hàng ~230px)** | Khi có 5 album, bố cục xếp tầng dọc 3 dòng (icon trên, chữ giữa, badge dưới) chiếm gần nửa màn hình điện thoại. Tuy nhiên, nếu dùng thanh cuộn ngang thì người lớn tuổi sẽ không biết vuốt. | **Chuyển thành Lưới 2 cột siêu gọn (Compact Inline Grid) hiển thị 100% không cần vuốt**: (1) Toàn bộ 5 album luôn hiển thị đầy đủ ngay trước mắt người xem; (2) Icon, tên album và số lượng được xếp gọn gàng trên 1 dòng ngang giúp chiều cao mỗi nút giảm từ 70px xuống chỉ còn **40px**; (3) Tab thứ 5 (Video Cưới) chiếm trọn hàng thứ 3 căn giữa cân xứng; (4) Thu gọn khoảng cách viền header/divider; (5) Tiết kiệm gần **200px chiều cao** (giảm 50% diện tích) giúp ảnh bên dưới hiện lên ngay lập tức. |

---

## 3. ⚠️ NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM (WHAT NOT TO DO)

1. **TUYỆT ĐỐI KHÔNG can thiệp gán `width` / `height` pixel cho thẻ `.lg-image` khi zoom (`setZoomImageSize`)**:
   - ❌ *Sai lầm*: Cố gắng set `img.style.width = targetW + 'px'` hay add `.reset-transition` để ép trình duyệt re-rasterize. Việc này làm ảnh bị giật mạnh và dạt về 1 góc màn hình!
   - ✅ *Đúng đắn*: Luôn để `setZoomImageSize` là một hàm rỗng (`function () {}`). Dùng GPU 2D CSS Scale kết hợp `image-rendering: auto` & `-webkit-optimize-contrast`.
2. **KHÔNG can thiệp inline CSS vào cử chỉ vuốt thoát (Swipe Dismiss)**:
   - ❌ *Sai lầm*: `wrap.style.transform = ...`, `backdrop.style.opacity = ...`, `container.style.display = "none"`.
   - ✅ *Đúng đắn*: Chỉ theo dõi cử chỉ ngón tay (`diffY`), khi đạt ngưỡng thì gọi trực tiếp `lightGalleryInstance.closeGallery()`.
3. **KHÔNG gán transition CSS khi đang có cử chỉ vuốt/kéo (Touchmove/Drag)**:
   - ❌ *Sai lầm*: Để `transition: transform 0.22s` thường trực trên thẻ ảnh.
   - ✅ *Đúng đắn*: Dùng selector `.lg-outer.lg-zoom-dragging` để gán `transition: none !important`.
4. **KHÔNG gọi `renderActiveAlbum` trong khi Lightbox đang mở**:
   - ❌ *Sai lầm*: Gọi `renderActiveAlbum()` để cập nhật dữ liệu sau khi xóa ảnh trong Lightbox. Hàm này gọi `lightGalleryInstance.destroy(true)` phá hủy toàn bộ instance và đá văng người dùng ra ngoài!
   - ✅ *Đúng đắn*: Dùng `lightGalleryInstance.updateSlides(newDynamicEl, targetOldIdx)` để nạp danh sách ảnh mới và lập tức chuyển mượt mà sang ảnh kế tiếp mà không đóng popup. Cập nhật ngầm trên lưới và hoãn re-render grid đầy đủ cho đến khi người dùng đóng Lightbox (`lgAfterClose`).
5. **KHÔNG quên bump Cache Busters (`?v=...`) sau mỗi lần sửa CSS/JS**:
   - Vì Cloudflare CDN và trình duyệt người dùng cache rất mạnh, luôn cần nâng số version đồng bộ trên cả:
     - `index.html` (thẻ `<link href="css/style.css?v=...">` và `<script src="js/main.js?v=...">`)
     - `js/main.js` (`import ... from './gallery.js?v=...'` và `config-loader.js?v=...`)
     - `js/config-loader.js` (`import ... from '../data/config.js?v=...'`)

---

## 4. 🛠️ QUY TRÌNH KIỂM TRA ĐỘ HOÀN HẢO CỦA GALLERY

Mỗi khi có cập nhật liên quan đến hình ảnh và gallery, luôn kiểm tra các tiêu chí sau trên iPhone / iPad / Android:
1. **Mở ảnh**: Mở lên tức thì (thumbnail preview), vòng xoay loading xuất hiện nhẹ và biến mất khi ảnh 4K sẵn sàng.
2. **Vuốt thoát ảnh**: Vuốt dọc xuống bằng 1 ngón tay -> đóng ngay lập tức, 0% chớp sáng/tối.
3. **Chạm đúp (Double-tap)**: Phóng to 2.5x êm ái, chạm đúp lần 2 thu nhỏ về 1.0x căn giữa hoàn hảo, **0% giật, không bị dạt về góc**.
4. **Pinch zoom 2 ngón tay**: Phóng to/thu nhỏ êm ru 60fps, thu nhỏ quá mức tự đàn hồi về giữa.
5. **Rê kéo xem chi tiết (Pan/Drag)**: Thả tay ở đâu ảnh dừng cố định ở đó, không bị trôi hay giật về giữa.
6. **Nút mũi tên Trái/Phải**: Hiện 2 bên mép ảnh kiểu bán trong suốt (mờ nhẹ), bấm chuyển ảnh mượt mà, không che khuất người trong ảnh. Tự động ẩn khi đang zoom.
7. **Đồng bộ số lượng ảnh trên Tab Badge**: Số lượng ảnh trên từng tab luôn phản ánh đúng số file hợp lệ có mặt ở **cả 2 thư mục** `thumb/` và `full/` trên R2. Đồng bộ tự động và nhất quán giữa `data/config.js`, `photos.json` và Cloudflare Worker API.
