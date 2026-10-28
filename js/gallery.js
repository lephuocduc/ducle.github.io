/**
 * GALLERY.JS - ES6 MODULE
 * Tích hợp Thư viện ảnh Cloudflare R2 & LightGallery (lgThumbnail, lgZoom)
 * - 4 Album: 01-pre-wedding, 02-tiec-mung-vu-quy, 03-vu-quy-tan-hon, 04-tiec-cuoi-asianaplaza
 * - Cấu trúc R2: {host}/{folder}/thumbs/{file} và {host}/{folder}/full/{file}
 * - Tabs/Button Group chuyển album mượt mà
 * - Quản lý vòng đời LightGallery: Destroy instance cũ trước khi re-init instance mới
 * - Responsive 2 cột trên điện thoại, tự động co giãn trên máy tính
 */

let lightGalleryInstance = null;
let currentR2Config = null;
let activeAlbumId = "01-pre-wedding";
let isSyncing = false;
let isGalleryOpen = false;
let isGalleryInteractionsSetup = false;
let imageObserver = null;
const PAGE_SIZE = 16;
const currentVisibleCounts = {};

/**
 * Khởi tạo module Gallery
 * @param {string} containerId ID vùng chứa gallery (tương thích)
 * @param {object} config Toàn bộ weddingConfig
 */
export function initGalleryModule(containerId, config) {
    currentR2Config = config?.r2Gallery || getDefaultR2Config();

    // Nếu container có cấu trúc mới (id gallery-tabs & gallery-grid)
    const tabsContainer = document.getElementById("gallery-tabs");
    const gridContainer = document.getElementById("gallery-grid");

    if (!tabsContainer || !gridContainer) {
        // Fallback: nếu gọi vào container cũ thì tự động dựng cấu trúc tabs + grid
        const parent = document.getElementById(containerId);
        if (parent) {
            parent.innerHTML = `
                <div class="gallery-tabs-container">
                    <div class="gallery-tabs" id="gallery-tabs" role="tablist"></div>
                </div>
                <div class="gallery-content-wrap">
                    <div id="gallery-grid" class="r2-gallery-grid" aria-live="polite"></div>
                </div>
            `;
        }
    }

    // Mặc định chọn album đầu tiên
    const defaultAlbum = currentR2Config.albums?.[0];
    if (defaultAlbum) {
        activeAlbumId = defaultAlbum.id;
    }

    // 1. Render giao diện ngay tức thì với dữ liệu sẵn có (không để người dùng chờ)
    renderTabs();
    renderActiveAlbum(activeAlbumId);

    // 2. Chạy ngầm tiến trình tự động đồng bộ ảnh từ Cloudflare R2 (Stale-While-Revalidate)
    if (currentR2Config.autoSync !== false) {
        setTimeout(() => {
            syncAllAlbumsFromR2();
        }, 300);
    }
}

/**
 * Hàm tương thích ngược nếu script cũ gọi renderGallery
 */
export function renderGallery(containerId, galleryData) {
    // Được xử lý qua initGalleryModule
}

/**
 * Cấu hình mặc định phòng trường hợp chưa có trong config.js
 */
function getDefaultR2Config() {
    return {
        host: "https://media.phuocducthusuong.com",
        apiUrl: "https://media.phuocducthusuong.com/api/photos",
        manifestUrl: "https://media.phuocducthusuong.com/photos.json",
        autoSync: true,
        albums: [
            {
                id: "01-pre-wedding",
                folder: "01-pre-wedding",
                title: "Pre-Wedding",
                icon: "fa-heart",
                images: []
            },
            {
                id: "02-tiec-mung-vu-quy",
                folder: "02-tiec-mung-vu-quy",
                title: "Tiệc Mừng Vu Quy",
                icon: "fa-champagne-glasses",
                images: []
            },
            {
                id: "03-vu-quy-tan-hon",
                folder: "03-vu-quy-tan-hon",
                title: "Vu Quy & Tân Hôn",
                icon: "fa-ring",
                images: []
            },
            {
                id: "04-tiec-cuoi-asianaplaza",
                folder: "04-tiec-cuoi-asianaplaza",
                title: "Tiệc Cưới Asiana Plaza",
                icon: "fa-cake-candles",
                images: []
            }
        ]
    };
}

/**
 * 1. RENDER THANH CHỌN ALBUM (TABS / BUTTON GROUP)
 */
function renderTabs() {
    const tabsContainer = document.getElementById("gallery-tabs");
    if (!tabsContainer || !currentR2Config?.albums) return;

    tabsContainer.innerHTML = "";

    currentR2Config.albums.forEach((album) => {
        const count = Array.isArray(album.images) ? album.images.length : 0;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `gallery-tab-btn ${album.id === activeAlbumId ? "active" : ""}`;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", album.id === activeAlbumId ? "true" : "false");
        btn.setAttribute("data-album-id", album.id);

        btn.innerHTML = `
            ${album.icon ? `<i class="fas ${album.icon}"></i>` : '<i class="fas fa-camera"></i>'}
            <span class="tab-title">${album.title}</span>
            <span class="tab-count" id="tab-count-${album.id}">(${count})</span>
        `;

        btn.addEventListener("click", () => {
            if (activeAlbumId === album.id) return;
            switchAlbum(album.id);
        });

        tabsContainer.appendChild(btn);
    });
}

/**
 * Cập nhật số lượng ảnh trên huy hiệu Tab
 */
function updateTabBadge(albumId, count) {
    const badge = document.getElementById(`tab-count-${albumId}`);
    if (badge) {
        badge.textContent = `(${count})`;
    }
}

/**
 * 2. CHUYỂN QUA LẠI GIỮA CÁC ALBUM
 */
function switchAlbum(targetAlbumId) {
    activeAlbumId = targetAlbumId;

    // Cập nhật trạng thái active trên các nút tab
    const tabs = document.querySelectorAll(".gallery-tab-btn");
    tabs.forEach(tab => {
        const isCurrent = tab.getAttribute("data-album-id") === targetAlbumId;
        tab.classList.toggle("active", isCurrent);
        tab.setAttribute("aria-selected", isCurrent ? "true" : "false");

        // Cuộn tab active vào giữa vùng nhìn thấy nếu thanh tabs có cuộn ngang
        const tabsContainer = document.getElementById("gallery-tabs");
        if (isCurrent && tab.scrollIntoView && tabsContainer && tabsContainer.scrollWidth > tabsContainer.clientWidth) {
            tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
    });

    renderActiveAlbum(targetAlbumId);

    // Tự động kiểm tra xem album này có ảnh mới upload trên R2 chưa
    if (currentR2Config?.autoSync !== false) {
        syncAlbumFromR2(targetAlbumId, true);
    }
}

/**
 * 3. TỰ ĐỘNG ĐỒNG BỘ ẢNH TỪ CLOUDFLARE R2
 * - Cách 1: Gọi Cloudflare Worker API (/api/photos?album=...)
 * - Cách 2: Tải file manifest photos.json trên root R2
 */
async function syncAlbumFromR2(albumId, rerenderIfChanged = true) {
    if (!currentR2Config?.albums) return;
    const album = currentR2Config.albums.find(a => a.id === albumId);
    if (!album) return;

    const host = (currentR2Config.host || "https://media.phuocducthusuong.com").replace(/\/$/, "");
    let newImages = null;

    // CÁCH 1: Thử gọi Cloudflare Worker API (Tự động 100% khi bạn kéo thả ảnh lên R2)
    const apiUrl = currentR2Config.apiUrl || `${host}/api/photos`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${apiUrl}?album=${encodeURIComponent(album.folder)}&t=${Date.now()}`, {
            headers: { "Accept": "application/json" },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.images)) {
                newImages = data.images;
                if (data.hasThumbs !== undefined) {
                    album.hasThumbs = data.hasThumbs;
                }
                if (data.thumbDir) {
                    album.thumbDir = data.thumbDir;
                }
                if (data.fullDir) {
                    album.fullDir = data.fullDir;
                }
            }
        }
    } catch (e) {
        // Worker API chưa sẵn sàng hoặc timeout, bỏ qua và thử tiếp cách 2
    }

    // CÁCH 2: Thử đọc file photos.json trên R2 nếu có
    if (!newImages) {
        try {
            const manifestUrl = currentR2Config.manifestUrl || `${host}/photos.json`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(`${manifestUrl}?t=${Date.now()}`, {
                headers: { "Accept": "application/json" },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const manifest = await res.json();
                if (manifest && Array.isArray(manifest[album.id])) {
                    newImages = manifest[album.id];
                } else if (manifest && Array.isArray(manifest[album.folder])) {
                    newImages = manifest[album.folder];
                }
            }
        } catch (e) {
            // Không tìm thấy file manifest, sử dụng danh sách trong config
        }
    }

    // Nếu tìm thấy danh sách ảnh mới từ R2, kiểm tra xem có thay đổi không
    // Chú ý: Chỉ ghi đè nếu R2 thực sự có ảnh (> 0) hoặc album ban đầu chưa có ảnh, tránh làm mất 40 ảnh mặc định
    if (newImages && Array.isArray(newImages) && (newImages.length > 0 || (album.images || []).length === 0)) {
        const currentImagesStr = JSON.stringify(album.images || []);
        const newImagesStr = JSON.stringify(newImages);

        if (currentImagesStr !== newImagesStr) {
            console.log(`[R2 Auto-Sync] Cập nhật ảnh cho album ${album.title}: ${newImages.length} ảnh`);
            album.images = newImages;
            updateTabBadge(album.id, newImages.length);

            if (rerenderIfChanged && album.id === activeAlbumId) {
                renderActiveAlbum(activeAlbumId);
            }
        }
    }
}

/**
 * Đồng bộ toàn bộ các Album từ Cloudflare R2
 */
async function syncAllAlbumsFromR2() {
    if (isSyncing || !currentR2Config?.albums) return;
    isSyncing = true;

    try {
        const promises = currentR2Config.albums.map(album =>
            syncAlbumFromR2(album.id, album.id === activeAlbumId)
        );
        await Promise.allSettled(promises);
    } finally {
        isSyncing = false;
    }
}


/**
 * 3. RENDER LƯỚI ẢNH & KHỞI TẠO DYNAMIC LIGHTGALLERY (TỐI ƯU HIỆU NĂNG TỐI ĐA)
 * - Dynamic Gallery: Không tạo DOM ẩn, không quét thừa phần tử -> Triệt tiêu lỗi offsetWidth của lgZoom
 * - Lazy Loading: Ảnh lưới chỉ tải khi cuộn tới gần (tiết kiệm băng thông & chống giật lag)
 * - Safe Thumbnail: Chỉ bật lgThumbnail khi đã có thumbs chuẩn (tránh tải đồng thời 40 ảnh 17MB gốc)
 */
function renderActiveAlbum(albumId) {
    const gridContainer = document.getElementById("gallery-grid");
    if (!gridContainer || !currentR2Config) return;

    // BƯỚC 1: Phá hủy instance LightGallery cũ đúng cách (tránh đè popup / rò rỉ bộ nhớ)
    if (lightGalleryInstance) {
        try {
            lightGalleryInstance.destroy(true);
        } catch (err) {
            console.warn("[LightGallery] Lỗi hủy instance:", err);
        }
        lightGalleryInstance = null;
    }

    const album = currentR2Config.albums.find(a => a.id === albumId);
    const loadMoreWrap = document.getElementById("gallery-load-more-wrap");

    if (!album) {
        gridContainer.innerHTML = `<div class="r2-empty-state"><p>Không tìm thấy album.</p></div>`;
        if (loadMoreWrap) loadMoreWrap.style.display = "none";
        return;
    }

    const host = (currentR2Config.host || "https://media.phuocducthusuong.com").replace(/\/$/, "");
    const images = Array.isArray(album.images) ? album.images : [];

    // Trường hợp album chưa có ảnh
    if (images.length === 0) {
        gridContainer.innerHTML = `
            <div class="r2-empty-state">
                <i class="fas fa-camera-retro empty-icon"></i>
                <h3 class="empty-title">Album ${album.title}</h3>
                <p class="empty-desc">Hình ảnh đang được chuẩn bị và sẽ sớm được cập nhật</p>
            </div>
        `;
        if (loadMoreWrap) loadMoreWrap.style.display = "none";
        return;
    }

    const hasThumbs = Boolean(album.hasThumbs);
    const visibleCount = currentVisibleCounts[albumId] || PAGE_SIZE;

    // 1. Chuẩn bị danh sách dynamicEl cho toàn bộ ảnh trong album (phục vụ Lightbox duyệt cả album)
    const dynamicEl = images.map((item, index) => {
        const filename = typeof item === "string" ? item : (item.file || item.src || "");
        const imageTitle = typeof item === "object" && item.title ? item.title : `${album.title} - Ảnh ${index + 1}`;
        const thumbUrl = getThumbUrl(album, filename, hasThumbs, host);
        const fullUrl = getFullUrl(album, filename, hasThumbs, host);

        return {
            src: fullUrl,
            thumb: thumbUrl,
            width: "2560",
            height: "3840",
            size: "2560-3840",
            subHtml: `<div class='lg-caption-wrap'><h4>${album.title}</h4><p>${imageTitle}</p></div>`
        };
    });

    // 2. Chỉ render vào DOM đúng số lượng ảnh hiển thị (visibleCount) -> Tuyệt đối không tạo thẻ DOM ẩn
    let htmlContent = "";
    const renderLimit = Math.min(visibleCount, images.length);

    for (let index = 0; index < renderLimit; index++) {
        const item = images[index];
        const filename = typeof item === "string" ? item : (item.file || item.src || "");
        const imageTitle = typeof item === "object" && item.title ? item.title : `${album.title} - Ảnh ${index + 1}`;
        if (!filename) continue;

        const thumbUrl = getThumbUrl(album, filename, hasThumbs, host);
        const fullUrl = getFullUrl(album, filename, hasThumbs, host);
        const fallbackUrl = fullUrl;

        htmlContent += `
            <div class="r2-gallery-item" 
                 role="button" 
                 tabindex="0"
                 data-gallery-index="${index}" 
                 aria-label="Xem ảnh ${index + 1}/${images.length}: ${imageTitle}">
                <div class="r2-thumb-wrap">
                    <img data-src="${thumbUrl}" 
                         alt="${imageTitle}" 
                         loading="lazy" 
                         decoding="async"
                         class="r2-thumb-img"
                         onerror="this.onerror=null; this.src='${fallbackUrl}';" />
                    <div class="r2-thumb-skeleton"></div>
                    <div class="r2-hover-overlay">
                        <i class="fas fa-magnifying-glass-plus"></i>
                        <span class="r2-hover-text">Xem Ảnh</span>
                    </div>
                </div>
            </div>
        `;
    }

    gridContainer.innerHTML = htmlContent;

    // 3. Kích hoạt Lazy Loading qua IntersectionObserver (chỉ tải ảnh khi người dùng cuộn đến gần)
    initLazyImages(gridContainer);

    // 4. Gắn sự kiện click mở Lightbox tại đúng index ảnh
    bindCardClicks(gridContainer);

    // 5. Render nút "Xem Thêm Ảnh" nếu còn ảnh chưa hiển thị trên lưới
    renderLoadMoreButton(albumId, images.length, renderLimit);

    // 6. Khởi tạo Dynamic LightGallery siêu mượt
    initDynamicLightGallery(gridContainer, dynamicEl);
}

/**
 * Lấy URL ảnh Thumbnail cho từng ảnh (ảnh nhỏ lấy từ folder thumb):
 * Format: {host}/{album.folder}/thumb/{filename}
 */
function getThumbUrl(album, filename, hasThumbs, host) {
    if (!filename) return "";
    if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("/")) {
        return filename;
    }

    const cleanHost = (host || currentR2Config?.host || "https://media.phuocducthusuong.com").replace(/\/$/, "");
    const cleanFolder = (album?.folder || album?.id || "01-pre-wedding").replace(/^\/|\/$/g, "");
    const cleanFile = filename.trim();

    // Mặc định thư mục ảnh nhỏ là "thumb" theo đúng yêu cầu cấu trúc thư mục mới
    const thumbDir = album?.thumbDir || "thumb";
    return `${cleanHost}/${cleanFolder}/${thumbDir}/${cleanFile}`;
}

/**
 * Lấy URL ảnh xem lớn (ảnh bự lấy từ folder full):
 * Format: {host}/{album.folder}/full/{filename}
 */
function getFullUrl(album, filename, hasThumbs, host) {
    if (!filename) return "";
    if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("/")) {
        return filename;
    }

    const cleanHost = (host || currentR2Config?.host || "https://media.phuocducthusuong.com").replace(/\/$/, "");
    const cleanFolder = (album?.folder || album?.id || "01-pre-wedding").replace(/^\/|\/$/g, "");
    const cleanFile = filename.trim();

    // Mặc định thư mục ảnh lớn là "full" theo đúng yêu cầu cấu trúc thư mục mới
    const fullDir = album?.fullDir || "full";
    return `${cleanHost}/${cleanFolder}/${fullDir}/${cleanFile}`;
}

/**
 * Gắn sự kiện Click / Enter để mở LightGallery tại vị trí ảnh tương ứng
 */
function bindCardClicks(container) {
    container.querySelectorAll(".r2-gallery-item:not([data-click-bound])").forEach(card => {
        card.setAttribute("data-click-bound", "true");
        const openIdx = parseInt(card.getAttribute("data-gallery-index"), 10);

        const handleOpen = (e) => {
            e.preventDefault();
            if (lightGalleryInstance && !isNaN(openIdx)) {
                lightGalleryInstance.openGallery(openIdx);
            }
        };

        card.addEventListener("click", handleOpen);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                handleOpen(e);
            }
        });
    });
}

/**
 * Lazy Loading thông minh bằng IntersectionObserver:
 * - Khi card cách viewport 250px mới bắt đầu nạp ảnh
 * - Hiển thị skeleton shimmer trong lúc tải, fade-in mượt mà khi ảnh sẵn sàng
 */
function initLazyImages(container) {
    if (!("IntersectionObserver" in window)) {
        // Fallback cho trình duyệt không hỗ trợ
        container.querySelectorAll("img[data-src]").forEach(img => {
            img.src = img.getAttribute("data-src");
            img.removeAttribute("data-src");
            img.classList.add("loaded");
        });
        return;
    }

    if (!imageObserver) {
        imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute("data-src");
                    if (src) {
                        img.src = src;
                        img.removeAttribute("data-src");
                        img.addEventListener("load", () => {
                            img.classList.add("loaded");
                            const skeleton = img.parentElement?.querySelector(".r2-thumb-skeleton");
                            if (skeleton) skeleton.style.display = "none";
                        }, { once: true });
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: "250px 0px" });
    }

    container.querySelectorAll("img[data-src]").forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Khởi tạo LightGallery ở chế độ Dynamic (không phụ thuộc thẻ DOM tĩnh)
 */
function initDynamicLightGallery(gridContainer, dynamicEl) {
    if (!window.lightGallery || typeof window.lightGallery !== "function") return;

    // Luôn kích hoạt lgThumbnail & lgZoom: thumbnails hiện tại siêu nhẹ (chỉ 35KB/ảnh)
    const plugins = [window.lgZoom, window.lgThumbnail].filter(Boolean);

    try {
        lightGalleryInstance = window.lightGallery(gridContainer, {
            dynamic: true,
            dynamicEl: dynamicEl,
            plugins: plugins,
            speed: 300,
            preload: 2,
            download: false,
            thumbnail: true,
            animateThumb: true,
            showThumbByDefault: true,   // Luôn mở thanh thumbnails mặc định
            toggleThumb: false,         // Giữ thanh thumbnails luôn mở cố định, không cho phép ẩn
            hideBarsDelay: 0,           // Không tự động ẩn thanh thumbnails hay thanh công cụ khi rảnh tay
            thumbWidth: 70,
            thumbHeight: "52px",
            thumbMargin: 6,
            zoom: true,
            scale: 0.35,              // Mỗi nấc zoom là 0.35 (phóng to/thu nhỏ êm ái, tiến độ vừa phải)
            infiniteZoom: false,      // Dừng lại khi đạt mức zoom tối đa (5.0x), không zoom vô cực
            enableZoomAfter: 0,
            actualSize: false,        // TẮT nút phóng to 1 mạch 100% gây nhảy vọt sát rạt
            showZoomInOutIcons: true, // HIỆN 2 nút [+] và [-] trên thanh công cụ để zoom từng nấc từ từ
            controls: true,           // Mũi tên < và > chuyển ảnh
            keyPress: true,           // Mũi tên bàn phím
            loop: true,               // Xoay vòng ảnh khi đến cuối
            hideControlOnEnd: false,
            enableDrag: false,        // Tắt kéo trượt đổi ảnh bằng chuột trên máy tính (chặn trôi ảnh do quán tính chuột)
            enableSwipe: true,        // Giữ vuốt chuyển ảnh trên màn hình cảm ứng điện thoại
            mobileSettings: {
                controls: true,
                showCloseIcon: true,
                download: false,
                thumbnail: true,
                showThumbByDefault: true,
                toggleThumb: false,   // Đảm bảo trên điện thoại thumbnails luôn hiển thị 100%
                thumbWidth: 58,
                thumbHeight: "44px"
            }
        });

        // Tìm plugin zoom trong mảng plugins của LightGallery instance
        const zp = lightGalleryInstance?.plugins?.find(p => typeof p.zoomIn === "function");
        if (zp) {
            lightGalleryInstance.zoomPlugin = zp;

            // 1. Giới hạn tỷ lệ zoom tối đa lên mức tối thiểu 5.0x (hoặc theo tỷ lệ thực của ảnh gốc 2500px):
            // Cho phép người dùng soi rõ cận cảnh từng chi tiết nhỏ nhất
            zp.getCurrentImageActualSizeScale = function () {
                const $image = this.core.getSlideItem(this.core.index)?.find('.lg-image')?.first();
                const width = $image?.get()?.offsetWidth || window.innerWidth;
                const naturalWidth = this.getNaturalWidth(this.core.index) || width;
                return Math.max(5.0, this.getActualSizeScale(naturalWidth, width));
            };

            // 2. Tối ưu setZoomStyles dùng 2D scale: Ngăn Mobile Safari khóa texture ở độ phân giải thấp
            zp.setZoomStyles = function (style) {
                const $slide = this.core.getSlideItem(this.core.index);
                const $wrap = $slide.find(".lg-img-wrap").first();
                const $image = $slide.find(".lg-image").first();
                const $dummy = this.core.outer.find(".lg-current .lg-dummy-img").first();

                this.scale = style.scale;
                const scaleTransform = `scale(${style.scale})`;
                $image.css("transform", scaleTransform);
                $dummy.css("transform", scaleTransform);
                $wrap.css("transform", `translate3d(${style.x}px, ${style.y}px, 0)`);
            };

            // 3. Cho phép kích hoạt refresh nét kích thước thực tế khi đạt ngưỡng zoom sâu (actual size)
            zp.setZoomImageSize = function () {
                const self = this;
                const $slide = this.core.getSlideItem(this.core.index);
                const $image = $slide.find(".lg-image").first();
                const actualScale = this.getCurrentImageActualSizeScale();

                if (this.scale >= actualScale - 0.15) {
                    setTimeout(() => {
                        if (self.scale >= actualScale - 0.15) {
                            $image.addClass("no-transition");
                            self.imageReset = true;
                        }
                    }, 300);
                    setTimeout(() => {
                        if (self.scale >= actualScale - 0.15) {
                            const imgEl = $image.get();
                            const naturalWidth = imgEl?.naturalWidth;
                            const naturalHeight = imgEl?.naturalHeight;
                            if (naturalWidth && naturalHeight) {
                                $image.css("width", `${naturalWidth}px`).css("height", `${naturalHeight}px`);
                                self.core.outer.addClass("lg-actual-size");
                                $image.addClass("reset-transition");
                            }
                        }
                    }, 350);
                }
            };

            // 4. Nhấp đúp chuột (Double-Click) & Chạm đúp (Double-Tap) Toggle Zoom 2 chiều chuẩn xác:
            // - Nếu ĐANG PHÓNG TO (scale > 1.05 hoặc có class lg-zoomed): Luôn luôn THU NHỎ (Zoom Out) về 1.0x ban đầu và căn giữa hoàn toàn.
            // - Nếu ĐANG BÌNH THƯỜNG (scale = 1.0x): Phóng to 2.5x ngay tại tâm điểm con trỏ chuột/chạm.
            zp.setActualSize = function (index, event) {
                if (this.zoomInProgress) return;
                this.zoomInProgress = true;

                const isCurrentlyZoomed = this.scale > 1.05 || this.core.outer.hasClass("lg-zoomed");

                if (isCurrentlyZoomed) {
                    // Thu nhỏ 100% về 1.0x ban đầu
                    this.resetZoom();
                    this.core.outer.removeClass("lg-zoomed lg-actual-size");
                    setTimeout(() => {
                        this.zoomInProgress = false;
                    }, 220);
                } else {
                    // Phóng to 2.5x tại vị trí click/tap
                    const targetScale = 2.5;
                    this.setPageCords(event);
                    this.beginZoom(targetScale);
                    this.zoomImage(targetScale, targetScale - this.scale, true, false);
                    this.core.outer.addClass("lg-zoomed");
                    setTimeout(() => {
                        this.zoomInProgress = false;
                    }, 220);
                }
            };

            // 5. Khử hoàn toàn quán tính / chớn trượt khi rê kéo ảnh (pan) lúc phóng to:
            // Thả chuột hoặc buông ngón tay ở đâu, ảnh dừng cố định ngay tại đúng vị trí đó, tuyệt đối không trôi tiếp
            zp.touchendZoom = function (startCords, endCords, allowX, allowY) {
                const deltaX = endCords.x - startCords.x;
                const deltaY = endCords.y - startCords.y;

                // Giữ nguyên tọa độ thực 1:1, tuyệt đối không nhân thêm hệ số quán tính tốc độ (a *= r, n *= l)
                const newPos = {
                    x: this.left + deltaX,
                    y: this.top + deltaY
                };

                const possibleCords = this.getPossibleSwipeDragCords();

                // Giới hạn trong khung nhìn an toàn (không bị kéo lọt ra ngoài)
                if (allowY) {
                    if (this.isBeyondPossibleTop(newPos.y, possibleCords.minY)) {
                        newPos.y = possibleCords.minY;
                    } else if (this.isBeyondPossibleBottom(newPos.y, possibleCords.maxY)) {
                        newPos.y = possibleCords.maxY;
                    }
                    this.top = newPos.y;
                } else {
                    newPos.y = this.top;
                }

                if (allowX) {
                    if (this.isBeyondPossibleLeft(newPos.x, possibleCords.minX)) {
                        newPos.x = possibleCords.minX;
                    } else if (this.isBeyondPossibleRight(newPos.x, possibleCords.maxX)) {
                        newPos.x = possibleCords.maxX;
                    }
                    this.left = newPos.x;
                } else {
                    newPos.x = this.left;
                }

                const $wrap = this.core.getSlideItem(this.core.index).find(".lg-img-wrap").first();
                this.setZoomSwipeStyles($wrap, newPos);
                this.positionChanged = true;
            };

            // 6. Nâng cấp bộ bắt sự kiện Rê Kéo (Zoom Drag):
            // - Ngưỡng rê chuột 5px: Chặn hoàn toàn hiện tượng rung lắc chuột làm xê dịch ảnh khi click / double-click
            // - Bắt dblclick trên ảnh và khung ảnh: Đảm bảo nhấp đúp luôn nhận diện và zoom out ngay lập tức
            setupSmoothZoomDrag(zp);
        }

        // Gắn tương tác: Khóa cuộn trang nền, Cuộn chuột để Zoom, Phím mũi tên Trái/Phải
        setupGalleryInteractions(gridContainer);
    } catch (err) {
        console.error("[LightGallery] Lỗi khởi tạo dynamic:", err);
    }
}

/**
 * Quản lý Nút "Xem Thêm Ảnh" trên lưới
 */
function renderLoadMoreButton(albumId, totalImages, visibleCount) {
    const wrap = document.getElementById("gallery-load-more-wrap");
    if (!wrap) return;

    if (totalImages <= visibleCount) {
        wrap.style.display = "none";
        wrap.innerHTML = "";
        return;
    }

    const remaining = totalImages - visibleCount;
    const nextBatch = Math.min(PAGE_SIZE, remaining);

    wrap.style.display = "flex";
    wrap.innerHTML = `
        <button type="button" class="gallery-load-more-btn" id="gallery-load-more-btn" aria-label="Xem thêm ${nextBatch} ảnh">
            <i class="fas fa-angles-down"></i>
            <span>Xem Thêm ${nextBatch} Ảnh (Còn ${remaining} ảnh)</span>
        </button>
    `;

    document.getElementById("gallery-load-more-btn")?.addEventListener("click", () => {
        const newCount = visibleCount + nextBatch;
        currentVisibleCounts[albumId] = newCount;

        const album = currentR2Config.albums.find(a => a.id === albumId);
        const host = (currentR2Config.host || "https://media.phuocducthusuong.com").replace(/\/$/, "");
        const images = Array.isArray(album?.images) ? album.images : [];
        const hasThumbs = Boolean(album?.hasThumbs);
        const gridContainer = document.getElementById("gallery-grid");

        if (gridContainer && album) {
            const frag = document.createDocumentFragment();

            for (let index = visibleCount; index < newCount && index < images.length; index++) {
                const item = images[index];
                const filename = typeof item === "string" ? item : (item.file || item.src || "");
                const imageTitle = typeof item === "object" && item.title ? item.title : `${album.title} - Ảnh ${index + 1}`;
                if (!filename) continue;

                const thumbUrl = getThumbUrl(album, filename, hasThumbs, host);
                const fallbackUrl = `${host}/${album.folder}/${filename}`;

                const card = document.createElement("div");
                card.className = "r2-gallery-item";
                card.setAttribute("role", "button");
                card.setAttribute("tabindex", "0");
                card.setAttribute("data-gallery-index", index.toString());
                card.setAttribute("aria-label", `Xem ảnh ${index + 1}/${images.length}: ${imageTitle}`);

                card.innerHTML = `
                    <div class="r2-thumb-wrap">
                        <img data-src="${thumbUrl}" 
                             alt="${imageTitle}" 
                             loading="lazy" 
                             decoding="async"
                             class="r2-thumb-img"
                             onerror="this.onerror=null; this.src='${fallbackUrl}';" />
                        <div class="r2-thumb-skeleton"></div>
                        <div class="r2-hover-overlay">
                            <i class="fas fa-magnifying-glass-plus"></i>
                            <span class="r2-hover-text">Xem Ảnh</span>
                        </div>
                    </div>
                `;

                frag.appendChild(card);
            }

            gridContainer.appendChild(frag);
            bindCardClicks(gridContainer);
            initLazyImages(gridContainer);
        }

        renderLoadMoreButton(albumId, totalImages, newCount);
    });
}

/**
 * Xử lý các tương tác: Khóa cuộn trang nền, Zoom lăn chuột, Phím mũi tên Trái/Phải
 */
function setupGalleryInteractions(gridContainer) {
    gridContainer.addEventListener("lgBeforeOpen", () => {
        isGalleryOpen = true;
    });

    gridContainer.addEventListener("lgAfterOpen", () => {
        isGalleryOpen = true;
        document.body.classList.add("lg-body-no-scroll");
        document.documentElement.classList.add("lg-body-no-scroll");

        // Đảm bảo thanh thumbnails luôn mở sẵn ngay khi vừa mở ảnh trên cả điện thoại & máy tính
        const lgOuter = document.querySelector(".lg-outer");
        if (lgOuter) {
            lgOuter.classList.add("lg-thumb-open");
        }
    });

    gridContainer.addEventListener("lgBeforeClose", () => {
        isGalleryOpen = false;
        document.body.classList.remove("lg-body-no-scroll");
        document.documentElement.classList.remove("lg-body-no-scroll");
    });

    // 2. Gắn phím mũi tên & Lăn chuột toàn cục (chỉ gắn 1 lần duy nhất)
    if (!isGalleryInteractionsSetup) {
        isGalleryInteractionsSetup = true;

        // Lăn chuột Zoom ảnh trên máy tính (chặn đứng cuộn đổi ảnh hoặc cuộn trang)
        window.addEventListener("wheel", onLgWheelZoom, { passive: false, capture: true });

        window.addEventListener("keydown", (e) => {
            const isOpen = isGalleryOpen || Boolean(document.querySelector(".lg-show, .lg-outer.lg-visible"));
            if (!isOpen || !lightGalleryInstance) return;

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                lightGalleryInstance.goToPrevSlide();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                lightGalleryInstance.goToNextSlide();
            } else if (e.key === "Escape") {
                e.preventDefault();
                lightGalleryInstance.closeGallery();
            }
        });
    }
}

let lastWheelZoomTime = 0;

/**
 * Xử lý Zoom ảnh khi lăn chuột trên máy tính (Mượt mà, zoom từ từ theo từng nấc)
 */
function onLgWheelZoom(e) {
    // Kiểm tra xem lightbox có đang mở hay không
    const isOpen = isGalleryOpen || Boolean(document.querySelector(".lg-show, .lg-outer.lg-visible"));
    if (!isOpen || !lightGalleryInstance) return;

    // Ngăn chặn hoàn toàn hành vi cuộn chuột đổi ảnh hoặc cuộn trang web
    e.preventDefault();
    e.stopPropagation();

    const now = performance.now();
    // Throttle 50ms để mỗi bước zoom chuyển động mượt mà 60fps
    if (now - lastWheelZoomTime < 50) return;
    lastWheelZoomTime = now;

    const zoomPlugin = lightGalleryInstance.zoomPlugin || lightGalleryInstance.plugins?.find(p => typeof p.zoomIn === "function");

    if (e.deltaY < 0) {
        // Cuộn chuột lên -> Phóng to từ từ (Zoom In)
        if (zoomPlugin && typeof zoomPlugin.zoomIn === "function") {
            zoomPlugin.zoomIn();
        } else {
            const btnIn = document.getElementById("lg-zoom-in") || document.querySelector(".lg-zoom-in");
            if (btnIn) btnIn.click();
        }
    } else if (e.deltaY > 0) {
        // Cuộn chuột xuống -> Thu nhỏ từ từ (Zoom Out)
        if (zoomPlugin && typeof zoomPlugin.zoomOut === "function") {
            zoomPlugin.zoomOut();
        } else {
            const btnOut = document.getElementById("lg-zoom-out") || document.querySelector(".lg-zoom-out");
            if (btnOut) btnOut.click();
        }
    }
}

/**
 * Nâng cấp trải nghiệm rê kéo & nhấp đúp phóng to/thu nhỏ:
 * - Thiết lập ngưỡng rê chuột (DRAG_THRESHOLD = 5px) để chặn hoàn toàn hiện tượng rung lắc tay click chuột làm ảnh xê dịch
 * - Bắt sự kiện dblclick trên ảnh và khung ảnh: Đảm bảo nhấp đúp luôn nhận diện và thu nhỏ (zoom out) 100% tin cậy
 */
function setupSmoothZoomDrag(zp) {
    if (!zp) return;

    // Gỡ các sự kiện mousedown, mousemove, mouseup mặc định của lgZoom
    zp.core.outer.off("mousedown.lg.zoom");
    zp.$LG(window).off("mousemove.lg.zoom.global" + zp.core.lgId);
    zp.$LG(window).off("mouseup.lg.zoom.global" + zp.core.lgId);
    zp.core.outer.off("dblclick.lg");

    // Đảm bảo dblclick trên ảnh và khung ảnh luôn kích hoạt setActualSize để zoom out/in
    zp.core.outer.on("dblclick.lg", function (e) {
        if (!zp.isImageSlide(zp.core.index)) return;
        const $slide = zp.core.getSlideItem(zp.core.index);
        const $target = zp.$LG(e.target);
        if ($target.hasClass("lg-item") || $slide.get()?.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            zp.setActualSize(zp.core.index, e);
        }
    });

    let startTime = 0;
    let startCords = {};
    let endCords = {};
    let isMouseDown = false;
    let isDragging = false;
    let allowX = false;
    let allowY = false;
    let possibleCords = null;
    let $imgWrap = null;
    const DRAG_THRESHOLD = 5; // Ngưỡng tối thiểu 5px mới tính là rê kéo ảnh

    zp.core.outer.on("mousedown.lg.zoom", function (e) {
        if (!zp.isImageSlide(zp.core.index)) return;
        const $slide = zp.core.getSlideItem(zp.core.index);
        const $target = zp.$LG(e.target);

        if ($target.hasClass("lg-item") || $slide.get()?.contains(e.target)) {
            $imgWrap = $slide.find(".lg-img-wrap").first();
            const allowed = zp.getDragAllowedAxises(0);
            allowY = allowed.allowY;
            allowX = allowed.allowX;

            const isZoomed = zp.core.outer.hasClass("lg-zoomed") || zp.scale > 1.05;
            if (isZoomed && $target.hasClass("lg-object") && (allowX || allowY)) {
                e.preventDefault();
                startTime = Date.now();
                startCords = zp.getDragCords(e);
                endCords = { ...startCords };
                possibleCords = zp.getPossibleSwipeDragCords();
                isMouseDown = true;
                isDragging = false;
            }
        }
    });

    zp.$LG(window).on("mousemove.lg.zoom.global" + zp.core.lgId, function (e) {
        if (!isMouseDown) return;

        const currentCords = zp.getDragCords(e);
        const distance = Math.hypot(currentCords.x - startCords.x, currentCords.y - startCords.y);

        // Chỉ khi con trỏ di chuyển vượt qua ngưỡng 5px mới bắt đầu kích hoạt chế độ rê kéo
        // Giúp các cú click chuột hoặc double-click không bao giờ làm xê dịch ảnh
        if (!isDragging) {
            if (distance > DRAG_THRESHOLD) {
                isDragging = true;
                zp.core.outer.removeClass("lg-grab").addClass("lg-grabbing lg-zoom-dragging");
            } else {
                return;
            }
        }

        endCords = currentCords;
        const swipeCords = zp.getZoomSwipeCords(startCords, endCords, allowX, allowY, possibleCords);
        zp.setZoomSwipeStyles($imgWrap, swipeCords);
    });

    zp.$LG(window).on("mouseup.lg.zoom.global" + zp.core.lgId, function (e) {
        if (isMouseDown) {
            isMouseDown = false;
            zp.core.outer.removeClass("lg-zoom-dragging lg-grabbing").addClass("lg-grab");

            if (isDragging) {
                isDragging = false;
                endCords = zp.getDragCords(e);
                const duration = Date.now() - startTime;
                zp.touchendZoom(startCords, endCords, allowX, allowY, duration);
            }
        }
    });
}


