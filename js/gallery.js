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
                title: "Tiệc Mừng Lễ Vu Quy",
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

    // Nút làm mới danh sách ảnh từ R2
    const syncBtn = document.createElement("button");
    syncBtn.type = "button";
    syncBtn.className = "gallery-tab-btn gallery-sync-tab-btn";
    syncBtn.id = "gallery-sync-btn";
    syncBtn.title = "Đồng bộ ảnh mới tải lên từ Cloudflare R2";
    syncBtn.setAttribute("aria-label", "Làm mới ảnh từ Cloudflare R2");
    syncBtn.innerHTML = `<i class="fas fa-arrows-rotate"></i><span class="sync-text">Làm Mới</span>`;
    syncBtn.addEventListener("click", () => {
        manualRefreshR2();
    });
    tabsContainer.appendChild(syncBtn);
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
    const tabs = document.querySelectorAll(".gallery-tab-btn:not(.gallery-sync-tab-btn)");
    tabs.forEach(tab => {
        const isCurrent = tab.getAttribute("data-album-id") === targetAlbumId;
        tab.classList.toggle("active", isCurrent);
        tab.setAttribute("aria-selected", isCurrent ? "true" : "false");

        // Cuộn tab active vào giữa vùng nhìn thấy trên điện thoại
        if (isCurrent && tab.scrollIntoView) {
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
    if (newImages && Array.isArray(newImages)) {
        const currentImagesStr = JSON.stringify(album.images || []);
        const newImagesStr = JSON.stringify(newImages);

        if (currentImagesStr !== newImagesStr) {
            console.log(`[R2 Auto-Sync] Phát hiện ảnh mới cho album ${album.title}: ${newImages.length} ảnh`);
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
 * Người dùng bấm nút "Làm Mới" thủ công
 */
async function manualRefreshR2() {
    const btn = document.getElementById("gallery-sync-btn");
    const icon = btn?.querySelector("i");
    if (icon) icon.classList.add("fa-spin");

    try {
        await syncAllAlbumsFromR2();
        if (window.showToast) {
            window.showToast("✨ Đã đồng bộ ảnh mới nhất từ Cloudflare R2!");
        }
    } catch (e) {
        console.warn("Lỗi làm mới:", e);
    } finally {
        setTimeout(() => {
            if (icon) icon.classList.remove("fa-spin");
        }, 600);
    }
}

/**
 * 3. RENDER LƯỚI ẢNH & RE-INIT LIGHTGALLERY
 * QUAN TRỌNG: Phá hủy instance LightGallery cũ trước khi render và khởi tạo instance mới
 */
function renderActiveAlbum(albumId) {
    const gridContainer = document.getElementById("gallery-grid");
    if (!gridContainer || !currentR2Config) return;

    // BƯỚC 1: Phá hủy instance LightGallery cũ đúng cách (tránh đè popup / sai index ảnh cũ)
    if (lightGalleryInstance) {
        try {
            lightGalleryInstance.destroy(true); // true = complete destroy
        } catch (err) {
            console.warn("[LightGallery] Lỗi hủy instance:", err);
        }
        lightGalleryInstance = null;
    }

    const album = currentR2Config.albums.find(a => a.id === albumId);
    if (!album) {
        gridContainer.innerHTML = `<div class="r2-empty-state"><p>Không tìm thấy album.</p></div>`;
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
                <p class="empty-desc">Hình ảnh đang được chuẩn bị và sẽ sớm được cập nhật trực tuyến!</p>
            </div>
        `;
        return;
    }

    // BƯỚC 2: Tạo các thẻ HTML ảnh chuẩn LightGallery
    // Cấu trúc URL: {host}/{folder}/thumbs/{file} và {host}/{folder}/full/{file}
    let htmlContent = "";

    images.forEach((item, index) => {
        // Hỗ trợ cả string ("NAM_3318.webp") hoặc object ({ file: "NAM_3318.webp", title: "..." })
        const filename = typeof item === "string" ? item : (item.file || item.src || "");
        const imageTitle = typeof item === "object" && item.title ? item.title : `${album.title} - Ảnh ${index + 1}`;

        if (!filename) return;

        const thumbUrl = `${host}/${album.folder}/thumbs/${filename}`;
        const fullUrl = `${host}/${album.folder}/full/${filename}`;

        htmlContent += `
            <a href="${fullUrl}" 
               data-src="${fullUrl}"
               data-sub-html="<div class='lg-caption-wrap'><h4>${album.title}</h4><p>${imageTitle}</p></div>"
               class="r2-gallery-item"
               aria-label="Xem ảnh ${index + 1}/${images.length}: ${imageTitle}">
                <div class="r2-thumb-wrap">
                    <img src="${thumbUrl}" 
                         alt="${imageTitle}" 
                         loading="lazy" 
                         decoding="async"
                         onerror="this.onerror=null; this.src='assets/img/${filename}';" />
                    <div class="r2-hover-overlay">
                        <i class="fas fa-magnifying-glass-plus"></i>
                        <span class="r2-hover-text">Xem Ảnh</span>
                    </div>
                </div>
            </a>
        `;
    });

    gridContainer.innerHTML = htmlContent;

    // BƯỚC 3: Khởi tạo LightGallery mới với plugin lgThumbnail và lgZoom
    if (window.lightGallery && typeof window.lightGallery === "function") {
        try {
            lightGalleryInstance = window.lightGallery(gridContainer, {
                plugins: [window.lgThumbnail, window.lgZoom].filter(Boolean),
                speed: 400,
                selector: ".r2-gallery-item",
                download: false,
                thumbnail: true,
                animateThumb: true,
                showThumbByDefault: true,
                thumbWidth: 80,
                thumbHeight: "60px",
                thumbMargin: 8,
                zoom: true,
                scale: 1,
                enableZoomAfter: 300,
                mobileSettings: {
                    controls: true,
                    showCloseIcon: true,
                    download: false
                }
            });
        } catch (err) {
            console.error("[LightGallery] Lỗi khởi tạo:", err);
        }
    } else {
        console.warn("[LightGallery] Thư viện LightGallery chưa sẵn sàng.");
    }
}
