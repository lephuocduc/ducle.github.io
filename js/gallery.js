/**
 * GALLERY.JS - ES6 MODULE
 * Tích hợp Thư viện ảnh Cloudflare R2 & LightGallery (lgThumbnail, lgZoom)
 * - 4 Album: 01-pre-wedding, 02-tiec-mung-vu-quy, 03-vu-quy-tan-hon, 04-tiec-cuoi-asianaplaza
 * - Cấu trúc R2: {host}/{folder}/thumbs/{file} và {host}/{folder}/full/{file}
 * - Tabs/Button Group chuyển album mượt mà
 * - Quản lý vòng đời LightGallery: Destroy instance cũ trước khi re-init instance mới
 * - Responsive 2 cột trên điện thoại, tự động co giãn trên máy tính
 */

// Tối ưu hóa triệt để thuật toán Pinch-Zoom (phóng to bằng 2 ngón tay) chuẩn Apple Photos trên iPhone/iPad:
if (typeof window !== "undefined" && window.lgZoom && window.lgZoom.prototype) {
    window.lgZoom.prototype.setZoomImageSize = function () {
        // Giữ nguyên GPU CSS transform scale, không cho phép gán width/height pixel gây hỏng layout và reset scale về 1
    };


}

let lightGalleryInstance = null;
let currentR2Config = null;
let activeAlbumId = "03-vu-quy-tan-hon";
let isSyncing = false;
let isGalleryOpen = false;
let isGalleryInteractionsSetup = false;
let imageObserver = null;
const PAGE_SIZE = 25;
const currentVisibleCounts = {};

// Quản lý trạng thái nhấp chuột & rê kéo mượt mà trên máy tính
let lastMouseClickTime = 0;
let lastMouseClickX = 0;
let lastMouseClickY = 0;
let wasJustDragging = false;

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
    const defaultAlbum = (currentR2Config.defaultAlbumId && currentR2Config.albums?.find(a => a.id === currentR2Config.defaultAlbumId))
        || currentR2Config.albums?.find(a => a.id === "03-vu-quy-tan-hon")
        || currentR2Config.albums?.[0];
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
        host: "https://wedding.phuocducthusuong.com",
        apiUrl: "https://wedding.phuocducthusuong.com/api/photos",
        manifestUrl: "https://wedding.phuocducthusuong.com/photos.json",
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

    const host = getR2Host(currentR2Config.host);
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
    // Chú ý: Chỉ ghi đè nếu R2 thực sự có ảnh mới hoặc album ban đầu chưa có ảnh
    if (newImages && Array.isArray(newImages) && newImages.length > 0) {
        const currentList = album.images || [];
        const currentSet = new Set(currentList.map(item => typeof item === "string" ? item : (item.file || item.src || "")));

        // Chỉ cập nhật và re-render khi số lượng thay đổi hoặc có ảnh hoàn toàn mới
        const hasNewItems = newImages.some(img => {
            const name = typeof img === "string" ? img : (img.file || img.src || "");
            return !currentSet.has(name);
        });

        if (currentList.length === 0 || hasNewItems || currentList.length !== newImages.length) {
            console.log(`[R2 Auto-Sync] Cập nhật ảnh mới cho album ${album.title}: ${newImages.length} ảnh`);
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
    const rawImages = Array.isArray(album.images) ? album.images : [];
    const images = [...rawImages].sort((a, b) => {
        const nameA = typeof a === "string" ? a : (a.file || a.src || "");
        const nameB = typeof b === "string" ? b : (b.file || b.src || "");
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
    });

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

        const downloadDomain = (typeof window !== "undefined" && window.location.hostname.includes("phuocducthusuong.com")) 
            ? window.location.origin 
            : "https://wedding.phuocducthusuong.com";
        const cleanFolder = (album?.folder || album?.id || "01-pre-wedding").replace(/^\/|\/$/g, "");
        const fullDir = album?.fullDir || "full";
        const downloadUrl = `${downloadDomain}/${cleanFolder}/${fullDir}/${filename}?download=${encodeURIComponent(filename)}`;

        return {
            src: fullUrl,
            thumb: thumbUrl,
            downloadUrl: downloadUrl,
            download: filename,
            subHtml: `<div class='lg-caption-wrap'><p>${imageTitle}</p></div>`
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
function getR2Host(host) {
    if (typeof window !== "undefined" && window.location.hostname.includes("phuocducthusuong.com")) {
        return window.location.origin;
    }
    const clean = (host || currentR2Config?.host || "https://wedding.phuocducthusuong.com").replace(/\/$/, "");
    if (clean.includes("media.phuocducthusuong.com")) {
        return "https://wedding.phuocducthusuong.com";
    }
    return clean;
}

function getThumbUrl(album, filename, hasThumbs, host) {
    if (!filename) return "";
    if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("/")) {
        return filename;
    }

    const cleanHost = getR2Host(host);
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

    const cleanHost = getR2Host(host);
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
                        if (img.complete) {
                            img.classList.add("loaded");
                            const skeleton = img.parentElement?.querySelector(".r2-thumb-skeleton");
                            if (skeleton) skeleton.style.display = "none";
                        } else {
                            img.addEventListener("load", () => {
                                img.classList.add("loaded");
                                const skeleton = img.parentElement?.querySelector(".r2-thumb-skeleton");
                                if (skeleton) skeleton.style.display = "none";
                            }, { once: true });
                        }
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: "400px 0px" });
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
            preload: 3,
            download: true,
            allowMediaOverlap: true,
            zoomFromOrigin: false,
            strings: {
                closeGallery: "Đóng",
                download: "Tải ảnh gốc",
                mediaLoadingFailed: "Không thể tải ảnh. Vui lòng thử lại"
            },
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
            controls: true,           // Hiện 2 nút mũi tên < và > mờ tinh tế chuyển ảnh
            keyPress: true,           // Mũi tên bàn phím vẫn hoạt động
            loop: true,               // Xoay vòng ảnh khi đến cuối
            hideControlOnEnd: false,
            enableDrag: true,         // Bật kéo chuột chuyển ảnh trên máy tính
            enableSwipe: true,        // Giữ vuốt chuyển ảnh trên màn hình cảm ứng điện thoại
            swipeThreshold: 40,       // Ngưỡng kéo chuột 40px để chuyển ảnh (tránh nhầm với nhấp chuột)
            swipeToClose: false,      // Tắt vuốt dọc đóng lightbox để không bị tắt nhầm khi rê ảnh
            mobileSettings: {
                controls: true,       // Hiện 2 nút mũi tên < và > mờ tinh tế trên điện thoại
                showCloseIcon: true,
                download: true,
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

            // 2. Tối ưu setZoomStyles dùng 2D scale & tự động căn giữa khi thu nhỏ:
            zp.setZoomStyles = function (style) {
                const $slide = this.core.getSlideItem(this.core.index);
                const $wrap = $slide.find(".lg-img-wrap").first();
                const $image = $slide.find(".lg-image").first();
                const $dummy = this.core.outer.find(".lg-current .lg-dummy-img").first();

                this.scale = style.scale;
                const scale = style.scale;

                let posX = style.x || 0;
                let posY = style.y || 0;

                // Khi scale <= 1.05x (thu nhỏ về kích thước ban đầu hoặc đang zoom out):
                // BẮT BUỘC posX = 0 và posY = 0 để ảnh luôn luôn căn giữa tuyệt đối, không bao giờ bị lệch!
                if (scale <= 1.05) {
                    posX = 0;
                    posY = 0;
                    this.left = 0;
                    this.top = 0;
                } else if (scale < 1.25) {
                    // Chuyển tiếp mượt mà kéo về tâm (0, 0) khi đang thu nhỏ dần từ 1.25x về 1.05x
                    const factor = (scale - 1.05) / (1.25 - 1.05);
                    posX = posX * factor;
                    posY = posY * factor;
                    this.left = posX;
                    this.top = posY;
                }

                const scaleTransform = `scale(${scale})`;
                $image.css("transform", scaleTransform);
                $dummy.css("transform", scaleTransform);
                $wrap.css("transform", `translate3d(${posX}px, ${posY}px, 0)`);
            };

            // Hook resetZoom để đảm bảo dọn sạch mọi transform tồn đọng
            const originalResetZoom = zp.resetZoom.bind(zp);
            zp.resetZoom = function (index) {
                this.scale = 1;
                this.left = 0;
                this.top = 0;
                this.positionChanged = false;
                this.zoomInProgress = false;
                const idx = index !== undefined ? index : this.core.index;
                const $slide = this.core.getSlideItem(idx);
                $slide.find(".lg-img-wrap").first().removeAttr("style");
                $slide.find(".lg-image").first().removeAttr("style");
                this.core.outer.find(".lg-current .lg-dummy-img").first().removeAttr("style");
                originalResetZoom(index);
            };

            // 3. Tối ưu zoom bằng GPU 2D transform scale mượt mà, không ép cứng width/height pixel gây hỏng resetZoom
            zp.setZoomImageSize = function () {
                // Để CSS 2D scale tự nhiên kết hợp image-rendering tối ưu đảm bảo sắc nét 4K mà không làm tràn layout DOM
            };

            // 4. Nhấp đúp chuột (Double-Click) & Chạm đúp (Double-Tap) Toggle Zoom 2 chiều chuẩn xác:
            // - Nếu ĐANG PHÓNG TO (bất kể mức nào, kể cả 2 ngón pinch zoom hết cỡ): Luôn luôn THU NHỎ (Zoom Out) về 1.0x ban đầu và căn giữa hoàn toàn.
            // - Nếu ĐANG BÌNH THƯỜNG (scale = 1.0x): Phóng to 2.5x ngay tại tâm điểm con trỏ chuột/chạm.
            let lastToggleActionTime = 0;
            zp.setActualSize = function (index, event) {
                const now = Date.now();
                if (now - lastToggleActionTime < 250) return;
                lastToggleActionTime = now;

                const $slide = this.core.getSlideItem(this.core.index);
                const $wrap = $slide.find(".lg-img-wrap").first();
                const $image = $slide.find(".lg-image").first();
                const imgEl = $image.get();
                const wrapEl = $wrap.get();

                // Kiểm tra toàn diện xem ảnh có đang ở trạng thái phóng to hay không:
                const isScaleZoomed = (this.scale || 1) > 1.02;
                const hasZoomClass = this.core.outer.hasClass("lg-zoomed") || 
                                     this.core.outer.hasClass("lg-actual-size") || 
                                     $slide.hasClass("lg-zoomed") || 
                                     $slide.hasClass("lg-actual-size");
                const hasInlineTransform = Boolean(imgEl?.style?.transform && !imgEl.style.transform.includes("scale(1)"));
                const hasInlineWrapTransform = Boolean(wrapEl?.style?.transform && wrapEl.style.transform !== "translate3d(0px, 0px, 0px)");
                const hasPixelDimension = Boolean(imgEl?.style?.width || imgEl?.style?.height);

                const isCurrentlyZoomed = isScaleZoomed || hasZoomClass || hasInlineTransform || hasInlineWrapTransform || hasPixelDimension;

                if (isCurrentlyZoomed) {
                    // Thu nhỏ 100% về 1.0x ban đầu ngay lập tức
                    this.scale = 1;
                    this.left = 0;
                    this.top = 0;
                    this.positionChanged = false;
                    this.zoomInProgress = false;
                    this.imageReset = false;
                    if (this.core) {
                        this.core.touchAction = undefined;
                    }

                    this.resetZoom();
                    if (typeof this.resetImageTranslate === "function") {
                        this.resetImageTranslate(this.core.index);
                    }

                    this.core.outer.removeClass("lg-zoomed lg-actual-size lg-zoom-drag-transition lg-zoom-dragging lg-grabbing");
                    this.core.outer.addClass("lg-grab");
                    $slide.removeClass("lg-zoomed lg-actual-size");

                    $wrap.removeAttr("style");
                    $image.removeAttr("style");
                    const $dummy = this.core.outer.find(".lg-current .lg-dummy-img").first();
                    $dummy.removeAttr("style");
                    $image.removeClass("reset-transition reset-transition-y reset-transition-x no-transition");

                    const $actualSize = this.core.getElementById("lg-actual-size");
                    if ($actualSize) {
                        $actualSize.removeClass(this.settings.actualSizeIcons.zoomOut).addClass(this.settings.actualSizeIcons.zoomIn);
                    }
                    this.setPageCords();
                } else {
                    if (this.zoomInProgress) return;
                    this.zoomInProgress = true;

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

    const cleanDummyImages = () => {
        document.querySelectorAll(".lg-dummy-img").forEach(el => el.remove());
    };
    // Bộ nhớ đệm file cho iOS Share Sheet (để kích hoạt tức thì khi chạm nút mà không mất User Activation)
    let iosShareFilePromise = null;
    let iosShareUrl = null;

    const isIOSDevice = () => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    const prepareIosShareFile = () => {
        if (!isIOSDevice()) return;
        const dlBtn = document.querySelector("#lg-download, .lg-download, [id^='lg-download']");
        if (!dlBtn) return;
        const url = dlBtn.getAttribute("href");
        if (!url || url === iosShareUrl) return;

        const downloadAttr = dlBtn.getAttribute("download");
        const filename = downloadAttr || url.split("/").pop().split("?")[0] || "wedding-photo.jpg";
        iosShareUrl = url;

        iosShareFilePromise = (async () => {
            try {
                const response = await fetch(url, { cache: "force-cache" });
                if (!response.ok) return null;
                const blob = await response.blob();
                const lower = filename.toLowerCase();
                let mimeType = "image/jpeg";
                if (lower.endsWith(".png")) mimeType = "image/png";
                else if (lower.endsWith(".webp")) mimeType = "image/webp";
                return new File([blob], filename, { type: mimeType, lastModified: Date.now() });
            } catch {
                return null;
            }
        })();
    };

    const updateDownloadButton = () => {
        const dlBtns = document.querySelectorAll("#lg-download, .lg-download, [id^='lg-download']");
        dlBtns.forEach(dlBtn => {
            dlBtn.removeAttribute("target"); // Gỡ bỏ triệt để target="_blank" trên mọi thiết bị để không mở tab mới
            dlBtn.setAttribute("rel", "noopener");
            if (!dlBtn.getAttribute("title")) {
                dlBtn.setAttribute("title", "Tải ảnh gốc về máy");
            }
        });
        prepareIosShareFile();
    };

    gridContainer.addEventListener("lgAfterOpen", () => {
        isGalleryOpen = true;
        document.body.classList.add("lg-body-no-scroll");
        document.documentElement.classList.add("lg-body-no-scroll");

        // Đảm bảo thanh thumbnails luôn mở sẵn ngay khi vừa mở ảnh trên cả điện thoại & máy tính
        const lgOuter = document.querySelector(".lg-outer");
        if (lgOuter) {
            lgOuter.classList.add("lg-thumb-open");
        }
        updateDownloadButton();
        cleanDummyImages();
        window.dispatchEvent(new CustomEvent("wedding-gallery-state-changed", { detail: { isOpen: true } }));
    });

    gridContainer.addEventListener("lgBeforeSlide", (event) => {
        // Hiển thị ngay thumbnail (đã có sẵn trong RAM/cache) làm nền tức thì
        const detail = event.detail || {};
        const index = detail.index !== undefined ? detail.index : 0;
        const galleryItem = lightGalleryInstance?.galleryItems?.[index];
        const thumbUrl = galleryItem?.thumb;
        if (thumbUrl) {
            setTimeout(() => {
                const slides = document.querySelectorAll(".lg-item");
                const currentSlide = document.querySelector(".lg-current") || slides[index];
                if (currentSlide && !currentSlide.classList.contains("lg-complete")) {
                    const wrap = currentSlide.querySelector(".lg-img-wrap");
                    if (wrap) {
                        wrap.style.backgroundImage = `url('${thumbUrl}')`;
                        wrap.style.backgroundRepeat = "no-repeat";
                        wrap.style.backgroundPosition = "center";
                        wrap.style.backgroundSize = "contain";
                    }
                }
            }, 10);
        }
    });

    // Xử lý khi ảnh full tải lỗi -> Tự động thử lại hoặc fallback về thumbnail
    gridContainer.addEventListener("lgSlideItemLoadError", (event) => {
        const detail = event.detail || {};
        const index = detail.index !== undefined ? detail.index : 0;
        console.warn("[lgSlideItemLoadError] Slide load error at index:", index);
        const galleryItem = lightGalleryInstance?.galleryItems?.[index];
        if (galleryItem && galleryItem.thumb) {
            const slides = document.querySelectorAll(".lg-item");
            const currentSlide = slides[index];
            if (currentSlide) {
                const img = currentSlide.querySelector(".lg-image");
                if (img && img.src !== galleryItem.thumb) {
                    console.log("[lgSlideItemLoadError] Fallback to thumb:", galleryItem.thumb);
                    img.src = galleryItem.thumb;
                }
            }
        }
    });

    gridContainer.addEventListener("lgAfterSlide", () => {
        updateDownloadButton();
        cleanDummyImages();
    });

    gridContainer.addEventListener("lgSlideItemLoad", (event) => {
        // Ảnh gốc đã tải xong, dọn sạch ảnh nền thumbnail
        const currentSlide = document.querySelector(".lg-current");
        if (currentSlide) {
            const wrap = currentSlide.querySelector(".lg-img-wrap");
            if (wrap) wrap.style.backgroundImage = "none";
            const img = currentSlide.querySelector(".lg-image");
            if (img && img.offsetWidth > 0 && img.offsetHeight > 0) {
                img._baseW = img.offsetWidth;
                img._baseH = img.offsetHeight;
            }
        }
    });

    gridContainer.addEventListener("lgBeforeClose", () => {
        isGalleryOpen = false;
        document.body.classList.remove("lg-body-no-scroll");
        document.documentElement.classList.remove("lg-body-no-scroll");
        window.dispatchEvent(new CustomEvent("wedding-gallery-state-changed", { detail: { isOpen: false } }));
    });

    gridContainer.addEventListener("lgAfterClose", () => {
        const container = document.querySelector(".lg-container");
        if (container) container.style.display = "";
        cleanDummyImages();
    });

    // 2. Gắn phím mũi tên & Lăn chuột toàn cục (chỉ gắn 1 lần duy nhất)
    if (!isGalleryInteractionsSetup) {
        isGalleryInteractionsSetup = true;

        // Bắt sự kiện tải ảnh gốc (Download)
        document.addEventListener("click", async (e) => {
            const dlBtn = e.target.closest("#lg-download, .lg-download, [id^='lg-download']");
            if (!dlBtn) return;

            e.preventDefault();
            e.stopPropagation();
            dlBtn.removeAttribute("target");

            let url = dlBtn.getAttribute("href");
            if (!url) return;

            const downloadAttr = dlBtn.getAttribute("download");
            const filename = downloadAttr || url.split("/").pop().split("?")[0] || "wedding-photo.jpg";

            dlBtn.classList.add("is-downloading");
            dlBtn.setAttribute("aria-busy", "true");

            const isIOS = isIOSDevice();

            // 1. TRÊN IPHONE / IPAD: Kích hoạt Share Sheet iOS để người dùng chọn "Lưu hình ảnh" (Save Image) vào Photos
            if (isIOS && typeof navigator.share === "function") {
                let shareFile = null;
                if (iosShareFilePromise && iosShareUrl === url) {
                    shareFile = await iosShareFilePromise;
                }

                if (!shareFile) {
                    try {
                        const response = await fetch(url, { cache: "force-cache" });
                        if (response.ok) {
                            const originalBlob = await response.blob();
                            const lower = filename.toLowerCase();
                            let mimeType = "image/jpeg";
                            if (lower.endsWith(".png")) mimeType = "image/png";
                            else if (lower.endsWith(".webp")) mimeType = "image/webp";
                            shareFile = new File([originalBlob], filename, { type: mimeType, lastModified: Date.now() });
                        }
                    } catch (fetchErr) {
                        console.warn("[iOS Share File Fetch Failed]", fetchErr);
                    }
                }

                if (shareFile && (!navigator.canShare || navigator.canShare({ files: [shareFile] }))) {
                    try {
                        // QUAN TRỌNG NHẤT: CHỈ TRUYỀN files, TUYỆT ĐỐI KHÔNG TRUYỀN title HAY text!
                        // Trên iOS Safari, khi truyền title/text, hệ thống sẽ coi là file dữ liệu và ẩn "Lưu hình ảnh" (chỉ hiện "Lưu vào Tệp").
                        // Chỉ khi truyền duy nhất mảng [shareFile] kiểu image/jpeg, iOS mới hiện nút "Lưu hình ảnh" (Save Image vào Photos).
                        await navigator.share({
                            files: [shareFile]
                        });
                        dlBtn.classList.remove("is-downloading");
                        dlBtn.removeAttribute("aria-busy");
                        return; // Đã kích hoạt thành công bảng Share Sheet của iOS
                    } catch (shareErr) {
                        dlBtn.classList.remove("is-downloading");
                        dlBtn.removeAttribute("aria-busy");
                        if (shareErr.name === "AbortError") return; // Người dùng chủ động bấm Hủy
                        console.warn("[iOS Share Sheet Error]:", shareErr);
                    }
                }
            }

            // Đối với iOS: nếu vì lý do nào đó Web Share không khả dụng, không ép octet-stream để tránh đẩy vào Files app
            if (isIOS) {
                dlBtn.classList.remove("is-downloading");
                dlBtn.removeAttribute("aria-busy");
                // Mở ảnh trực tiếp để người dùng nhấn giữ chọn "Lưu vào Ảnh"
                window.location.href = url;
                return;
            }

            // 2. TRÊN ANDROID & MÁY TÍNH: TẢI TRỰC TIẾP FILE VỀ MÁY (DOWNLOADS) - TUYỆT ĐỐI KHÔNG MỞ TAB MỚI
            // Ép kiểu Blob sang "application/octet-stream" để Chrome trên Android không xem là ảnh hiển thị trên tab mới
            try {
                const response = await fetch(url, { cache: "force-cache" });
                if (!response.ok) throw new Error("HTTP error " + response.status);
                const originalBlob = await response.blob();

                const octetBlob = new Blob([originalBlob], { type: "application/octet-stream" });
                const blobUrl = URL.createObjectURL(octetBlob);
                const tempLink = document.createElement("a");
                tempLink.style.display = "none";
                tempLink.href = blobUrl;
                tempLink.setAttribute("download", filename);
                tempLink.download = filename;
                tempLink.removeAttribute("target");
                document.body.appendChild(tempLink);
                tempLink.click();
                setTimeout(() => {
                    if (tempLink.parentNode) tempLink.parentNode.removeChild(tempLink);
                    URL.revokeObjectURL(blobUrl);
                }, 2000);
            } catch (err) {
                console.error("[LightGallery Download] Lỗi tải blob trực tiếp, dùng Worker attachment fallback:", err);
                // Fallback an toàn qua Cloudflare Worker với header Content-Disposition: attachment & application/octet-stream
                const album = currentR2Config?.albums?.find(a => a.id === activeAlbumId);
                const cleanFolder = (album?.folder || album?.id || "01-pre-wedding").replace(/^\/|\/$/g, "");
                const fullDir = album?.fullDir || "full";
                const fallbackDomain = (typeof window !== "undefined" && window.location.hostname.includes("phuocducthusuong.com")) 
                    ? window.location.origin 
                    : "https://wedding.phuocducthusuong.com";
                const workerDownloadUrl = `${fallbackDomain}/${cleanFolder}/${fullDir}/${filename}?download=${encodeURIComponent(filename)}`;

                const fallbackLink = document.createElement("a");
                fallbackLink.style.display = "none";
                fallbackLink.href = workerDownloadUrl;
                fallbackLink.setAttribute("download", filename);
                fallbackLink.download = filename;
                fallbackLink.removeAttribute("target");
                document.body.appendChild(fallbackLink);
                fallbackLink.click();
                setTimeout(() => {
                    if (fallbackLink.parentNode) fallbackLink.parentNode.removeChild(fallbackLink);
                }, 2000);
            } finally {
                dlBtn.classList.remove("is-downloading");
                dlBtn.removeAttribute("aria-busy");
            }
        }, true);

        // Lăn chuột Zoom ảnh trên máy tính (chặn đứng cuộn đổi ảnh hoặc cuộn trang)
        window.addEventListener("wheel", onLgWheelZoom, { passive: false, capture: true });

        // Xử lý kết thúc thao tác phóng to / thu nhỏ bằng 2 ngón tay (Pinch Zoom End)
        const handlePinchEnd = () => {
            const zp = lightGalleryInstance?.zoomPlugin || lightGalleryInstance?.plugins?.find(p => typeof p.zoomIn === "function");
            if (!zp) return;

            if (zp.core?.touchAction === "pinch") {
                const currentScale = zp.scale || 1;

                // Nếu sau khi pinch, scale <= 1.15 (người dùng vừa thu nhỏ ảnh lại):
                // Tự động khôi phục 100% về vị trí căn giữa chuẩn mực ban đầu với transition êm ái
                if (currentScale <= 1.15) {
                    zp.scale = 1;
                    zp.left = 0;
                    zp.top = 0;
                    zp.positionChanged = false;
                    zp.zoomInProgress = false;

                    const $slide = zp.core.getSlideItem(zp.core.index);
                    const $wrap = $slide?.find(".lg-img-wrap")?.first();
                    const $image = $slide?.find(".lg-image")?.first();
                    const $dummy = zp.core.outer.find(".lg-current .lg-dummy-img").first();

                    if ($wrap && $image) {
                        $wrap.css({
                            "transition": "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
                            "transform": "translate3d(0px, 0px, 0px)"
                        });
                        $image.css({
                            "transition": "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
                            "transform": "scale(1)"
                        });
                        if ($dummy) {
                            $dummy.css({
                                "transition": "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
                                "transform": "scale(1)"
                            });
                        }

                        setTimeout(() => {
                            $wrap.removeAttr("style");
                            $image.removeAttr("style");
                            if ($dummy) $dummy.removeAttr("style");
                        }, 260);
                    }

                    zp.resetZoom();
                    zp.core.outer.removeClass("lg-zoomed lg-actual-size lg-zoom-drag-transition lg-zoom-dragging lg-grabbing");
                    zp.core.outer.addClass("lg-grab");
                    $slide?.removeClass("lg-zoomed lg-actual-size");
                } else {
                    // Nếu người dùng đang giữ phóng to > 1.15x:
                    // Giới hạn tọa độ trong khung nhìn an toàn (không bị kéo lọt/lệch khỏi màn hình)
                    const possibleCords = zp.getPossibleSwipeDragCords();
                    let posX = zp.left || 0;
                    let posY = zp.top || 0;
                    let changed = false;

                    if (zp.isBeyondPossibleLeft(posX, possibleCords.minX)) {
                        posX = possibleCords.minX;
                        changed = true;
                    } else if (zp.isBeyondPossibleRight(posX, possibleCords.maxX)) {
                        posX = possibleCords.maxX;
                        changed = true;
                    }

                    if (zp.isBeyondPossibleTop(posY, possibleCords.minY)) {
                        posY = possibleCords.minY;
                        changed = true;
                    } else if (zp.isBeyondPossibleBottom(posY, possibleCords.maxY)) {
                        posY = possibleCords.maxY;
                        changed = true;
                    }

                    if (changed) {
                        zp.left = posX;
                        zp.top = posY;
                        const $slide = zp.core.getSlideItem(zp.core.index);
                        const $wrap = $slide?.find(".lg-img-wrap")?.first();
                        if ($wrap) {
                            zp.setZoomSwipeStyles($wrap, { x: posX, y: posY });
                        }
                    }

                    zp.core.outer.addClass("lg-zoomed");
                    if (typeof zp.manageActualPixelClassNames === "function") {
                        zp.manageActualPixelClassNames();
                    }
                }

                zp.core.touchAction = undefined;
            }
        };

        window.addEventListener("touchend", handlePinchEnd, { passive: true });
        window.addEventListener("touchcancel", handlePinchEnd, { passive: true });

        // 1. Bắt chạm đúp (Double-Tap) trên màn hình cảm ứng điện thoại / tablet ở tầng window capture
        // (ngăn chặn zoomSwipe gọi e.preventDefault() nuốt mất sự kiện chạm)
        let lastTouchTapTime = 0;
        let lastTouchTapX = 0;
        let lastTouchTapY = 0;

        const onGlobalSmartTouch = (e) => {
            const isOpen = isGalleryOpen || Boolean(document.querySelector(".lg-show, .lg-outer.lg-visible"));
            if (!isOpen || !lightGalleryInstance) return;

            // Bỏ qua nếu chạm 2 ngón trở lên (đang dùng 2 ngón pinch zoom)
            if (e.touches && e.touches.length !== 1) {
                lastTouchTapTime = 0;
                return;
            }

            // Bỏ qua nếu chạm vào thanh công cụ, nút chuyển ảnh, thumbnails
            if (e.target.closest && e.target.closest(".lg-toolbar, .lg-actions, .lg-thumb-outer, .lg-icon, .lg-prev, .lg-next, .lg-close")) return;

            const zp = lightGalleryInstance.zoomPlugin || lightGalleryInstance.plugins?.find(p => typeof p.zoomIn === "function");
            if (!zp) return;

            const now = Date.now();
            const touch = e.touches[0];
            const clientX = touch.clientX;
            const clientY = touch.clientY;

            const timeDiff = now - lastTouchTapTime;
            const dist = Math.hypot(clientX - lastTouchTapX, clientY - lastTouchTapY);

            // Bắt chạm 2 cái: khoảng cách thời gian từ 40ms đến 450ms, độ dịch chuyển ngón tay < 45px
            if (timeDiff > 40 && timeDiff < 450 && dist < 45) {
                lastTouchTapTime = 0;
                e.preventDefault();
                e.stopPropagation();
                zp.setActualSize(zp.core.index, e);
            } else {
                lastTouchTapTime = now;
                lastTouchTapX = clientX;
                lastTouchTapY = clientY;
            }
        };

        window.addEventListener("touchstart", onGlobalSmartTouch, { capture: true, passive: false });

        // 2. Bắt nhấp đúp (Double-Click) bằng chuột / trackpad trên máy tính
        const onGlobalSmartClick = (e) => {
            const isOpen = isGalleryOpen || Boolean(document.querySelector(".lg-show, .lg-outer.lg-visible"));
            if (!isOpen || !lightGalleryInstance) return;

            // Nếu người dùng vừa thả tay sau khi rê kéo ảnh thì bỏ qua click này, không toggle zoom nhầm
            if (wasJustDragging) {
                wasJustDragging = false;
                lastMouseClickTime = 0;
                return;
            }

            // Bỏ qua nếu click vào thanh công cụ, nút chuyển ảnh, thumbnails
            if (e.target.closest && e.target.closest(".lg-toolbar, .lg-actions, .lg-thumb-outer, .lg-icon, .lg-prev, .lg-next, .lg-close")) return;

            const zp = lightGalleryInstance.zoomPlugin || lightGalleryInstance.plugins?.find(p => typeof p.zoomIn === "function");
            if (!zp) return;

            const now = Date.now();
            const clientX = e.clientX;
            const clientY = e.clientY;

            const timeDiff = now - lastMouseClickTime;
            const dist = Math.hypot(clientX - lastMouseClickX, clientY - lastMouseClickY);

            // Bắt nhấp chuột 2 cái trong 40ms - 450ms với sai lệch vị trí < 45px
            if (timeDiff > 40 && timeDiff < 450 && dist < 45) {
                lastMouseClickTime = 0;
                e.preventDefault();
                e.stopPropagation();
                zp.setActualSize(zp.core.index, e);
            } else {
                lastMouseClickTime = now;
                lastMouseClickX = clientX;
                lastMouseClickY = clientY;
            }
        };

        document.addEventListener("click", onGlobalSmartClick, true);

        // Chặn triệt để hiện tượng trình duyệt kéo bóng mờ ảnh (HTML5 native drag) gây lỗi rê chuột
        document.addEventListener("dragstart", (e) => {
            if (e.target && (e.target.closest?.(".lg-outer") || e.target.closest?.(".r2-gallery-grid") || e.target.closest?.("#gallery-grid"))) {
                e.preventDefault();
            }
        }, false);

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

        // Kích hoạt tính năng Vuốt lên/xuống thoát ảnh (chuẩn iPhone) & bấm khoảng trống để đóng
        setupSwipeToDismissAndBackdropClick();
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
 * - Bộ nhận diện Smart Double-Tap & Double-Click thông minh: Tự động bắt nhấp 2 cái với độ trễ linh hoạt (lên đến 450ms)
 *   giúp thao tác thu nhỏ (zoom out) thành công 100%, không bị phụ thuộc vào native dblclick khắt khe của hệ điều hành.
 */
function setupSmoothZoomDrag(zp) {
    if (!zp) return;

    // Gỡ các sự kiện mousedown, mousemove, mouseup mặc định của lgZoom
    zp.core.outer.off("mousedown.lg.zoom");
    zp.$LG(window).off("mousemove.lg.zoom.global" + zp.core.lgId);
    zp.$LG(window).off("mouseup.lg.zoom.global" + zp.core.lgId);
    zp.core.outer.off("dblclick.lg");

    // 1. Bắt sự kiện dblclick gốc làm dự phòng
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

    // 2. Quản lý Rê Kéo (Zoom Drag & Pan)
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
                // Ngăn chặn LightGallery core chuyển slide khi đang rê kéo xem chi tiết ảnh phóng to
                e.stopPropagation();
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
                e.preventDefault();
            } else {
                return;
            }
        }

        e.preventDefault();
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
                wasJustDragging = true;
                // Nếu vừa rê kéo xong thì reset lastMouseClickTime để cú nhấp thả kéo không tính là click 1
                lastMouseClickTime = 0;
                endCords = zp.getDragCords(e);
                const duration = Date.now() - startTime;
                zp.touchendZoom(startCords, endCords, allowX, allowY, duration);
                setTimeout(() => {
                    wasJustDragging = false;
                }, 200);
            }
        }
    });
}




/**
 * TÍNH NĂNG VUỐT LÊN / VUỐT XUỐNG ĐỂ THOÁT LIGHTBOX (Chuẩn iOS Photos / Instagram)
 * - Vuốt ngón tay lên hoặc xuống: ảnh dịch chuyển theo ngón tay, thu nhỏ nhẹ và mờ dần nền
 * - Vuốt quá 70px hoặc hất nhanh (flick): ảnh trượt bay ra ngoài và đóng Lightbox
 * - Vuốt nhẹ chưa tới ngưỡng: ảnh đàn hồi tự động quay về vị trí trung tâm ban đầu
 * - Bấm vào khoảng trống màu đen xung quanh ảnh: đóng Lightbox ngay lập tức như bấm nút X
 */
function setupSwipeToDismissAndBackdropClick() {
    const isGalleryActive = () => isGalleryOpen || Boolean(document.querySelector(".lg-show, .lg-outer.lg-visible"));

    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let isTrackingSwipe = false;
    let isSwipingVertical = false;

    window.addEventListener("touchstart", (e) => {
        if (!isGalleryActive() || !lightGalleryInstance) return;

        // Chỉ theo dõi khi chạm đúng 1 ngón tay (nhường cử chỉ 2 ngón cho zoom)
        if (!e.touches || e.touches.length !== 1) {
            isTrackingSwipe = false;
            isSwipingVertical = false;
            return;
        }

        // Nếu ảnh đang zoom phóng to (scale > 1.05), nhường cho rê kéo soi chi tiết ảnh
        const zp = lightGalleryInstance.zoomPlugin || lightGalleryInstance.plugins?.find(p => typeof p.zoomIn === "function");
        if (zp && (zp.scale || 1) > 1.05) {
            isTrackingSwipe = false;
            return;
        }

        // Bỏ qua nếu chạm vào toolbar, thumbnails hoặc nút bấm điều khiển
        if (e.target && e.target.closest && e.target.closest(".lg-toolbar, .lg-thumb-outer, .lg-actions, .lg-icon, .lg-download, .lg-close")) {
            isTrackingSwipe = false;
            return;
        }

        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        isTrackingSwipe = true;
        isSwipingVertical = false;
    }, { capture: true, passive: true });

    window.addEventListener("touchmove", (e) => {
        if (!isTrackingSwipe) return;

        if (!e.touches || e.touches.length !== 1) {
            isTrackingSwipe = false;
            isSwipingVertical = false;
            return;
        }

        const touch = e.touches[0];
        const diffX = Math.abs(touch.clientX - touchStartX);
        const diffY = Math.abs(touch.clientY - touchStartY);

        if (!isSwipingVertical) {
            // Vuốt ngang nhiều hơn -> để LightGallery chuyển ảnh bình thường
            if (diffX > diffY && diffX > 12) {
                isTrackingSwipe = false;
                return;
            }

            // Vuốt dọc nhiều hơn và vượt ngưỡng 14px -> kích hoạt nhận diện vuốt thoát
            if (diffY > diffX && diffY > 14) {
                isSwipingVertical = true;
            } else {
                return;
            }
        }

        // Ngăn chặn trình duyệt cuộn trang phía dưới khi người dùng vuốt dọc
        if (e.cancelable) {
            e.preventDefault();
        }
    }, { capture: true, passive: false });

    const handleDismissEnd = (e) => {
        if (!isTrackingSwipe) return;
        isTrackingSwipe = false;

        if (!isSwipingVertical) {
            return;
        }
        isSwipingVertical = false;

        const touch = e.changedTouches ? e.changedTouches[0] : null;
        if (!touch) return;

        const currentY = touch.clientY;
        const currentX = touch.clientX;
        const diffY = currentY - touchStartY;
        const absY = Math.abs(diffY);
        const absX = Math.abs(currentX - touchStartX);
        const elapsed = Math.max(1, Date.now() - touchStartTime);
        const velocity = absY / elapsed;

        // Nếu vuốt dọc đủ xa (>= 45px) hoặc hất nhanh (velocity > 0.35) -> Thoát Lightbox như bấm nút [X]
        // Tuyệt đối không can thiệp inline style.transform/opacity/display để không bao giờ bị chớp giật trên iOS
        if ((absY >= 45 && absY > absX * 1.2) || (velocity > 0.35 && absY > 25 && absY > absX)) {
            wasJustDragging = true;
            setTimeout(() => {
                wasJustDragging = false;
            }, 300);

            if (lightGalleryInstance) {
                try {
                    lightGalleryInstance.closeGallery();
                } catch (err) {
                    console.warn("[closeGallery]", err);
                }
            }
        }
    };

    window.addEventListener("touchend", handleDismissEnd, { capture: true, passive: true });
    window.addEventListener("touchcancel", handleDismissEnd, { capture: true, passive: true });

    // Bấm vào khoảng trống màu đen xung quanh ảnh để đóng Lightbox (như bấm nút X)
    document.addEventListener("click", (e) => {
        if (!isGalleryActive() || !lightGalleryInstance) return;

        const zp = lightGalleryInstance.zoomPlugin || lightGalleryInstance.plugins?.find(p => typeof p.zoomIn === "function");
        const currentScale = zp ? (zp.scale || 1) : 1;
        if (currentScale > 1.05) return;

        if (wasJustDragging || isSwipingVertical) return;

        if (e.target && e.target.closest && e.target.closest(".lg-toolbar, .lg-thumb-outer, .lg-actions, .lg-icon, .lg-download, .lg-close, .lg-sub-html, .lg-image")) {
            return;
        }

        if (e.target && e.target.closest && e.target.closest(".lg-backdrop, .lg-item, .lg-inner, .lg-img-wrap")) {
            e.preventDefault();
            e.stopPropagation();
            lightGalleryInstance.closeGallery();
        }
    }, true);
}
