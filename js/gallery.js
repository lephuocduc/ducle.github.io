/**
 * GALLERY.JS - ES6 MODULE
 * Render bộ sưu tập ảnh kiểu Masonry Grid, Lightbox Modal mờ nền với mũi tên & lướt vuốt tay trên mobile
 */

let currentGalleryData = [];
let currentImageIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

export function renderGallery(containerId, galleryData) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(galleryData)) return;

    currentGalleryData = galleryData;
    container.innerHTML = "";

    galleryData.forEach((item, index) => {
        const card = document.createElement("div");
        const aspectClass = item.aspect || "square";
        card.className = `gallery-card ${aspectClass} reveal-zoom`;
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `Xem ảnh ${index + 1}/${galleryData.length}: ${item.title || 'Ảnh kỷ niệm'}`);

        card.innerHTML = `
            <img src="${item.src}" alt="${item.title || 'Ảnh kỷ niệm đám cưới'}" loading="lazy" />
            <div class="gallery-hover-overlay">
                <i class="fas fa-magnifying-glass-plus" style="font-size:2rem; margin-bottom:8px;"></i>
                <span style="font-family:var(--font-heading); font-size:1.1rem;">${item.title || ''}</span>
            </div>
        `;

        // Sự kiện click mở Lightbox
        card.addEventListener("click", () => openLightbox(index));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox(index);
            }
        });

        container.appendChild(card);
    });

    initLightboxEvents();
}

let savedScrollPosition = 0;

let currentScale = 1;
let initialScale = 1;
let startDistance = 0;
let panX = 0;
let panY = 0;
let startTouchX = 0;
let startTouchY = 0;
let isPanning = false;
let lastTapTime = 0;

function resetImageZoom() {
    currentScale = 1;
    initialScale = 1;
    startDistance = 0;
    panX = 0;
    panY = 0;
    isPanning = false;
    const img = document.getElementById("lightbox-img");
    if (img) {
        img.style.transform = "translate(0px, 0px) scale(1)";
        img.style.transition = "transform 0.25s ease";
    }
}

function updateImageTransform(smooth = false) {
    const img = document.getElementById("lightbox-img");
    if (!img) return;
    img.style.transition = smooth ? "transform 0.25s ease" : "none";
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
}

function openLightbox(index) {
    const modal = document.getElementById("lightbox-modal");
    if (!modal || currentGalleryData.length === 0) return;

    savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    currentImageIndex = index;
    updateLightboxImage();

    modal.classList.add("active");
    document.body.classList.add("no-scroll");
    modal.focus();
}

function closeLightbox() {
    const modal = document.getElementById("lightbox-modal");
    if (modal) {
        modal.classList.remove("active");
        resetImageZoom();
        const intro = document.getElementById("intro-screen");
        if (!intro || intro.classList.contains("hidden-intro")) {
            document.body.classList.remove("no-scroll");
            window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
        }
    }
}

function updateLightboxImage() {
    const img = document.getElementById("lightbox-img");
    const caption = document.getElementById("lightbox-caption");
    if (!img || currentGalleryData.length === 0) return;

    resetImageZoom();
    const item = currentGalleryData[currentImageIndex];
    img.src = item.src;
    img.alt = item.title || "Ảnh phóng to";

    if (caption) {
        caption.innerHTML = `<span>${item.title || 'Ảnh kỷ niệm'}</span> <small>(${currentImageIndex + 1}/${currentGalleryData.length})</small>`;
    }
}

function showNextImage() {
    if (currentGalleryData.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % currentGalleryData.length;
    updateLightboxImage();
}

function showPrevImage() {
    if (currentGalleryData.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + currentGalleryData.length) % currentGalleryData.length;
    updateLightboxImage();
}

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.hypot(dx, dy);
}

function initLightboxEvents() {
    const modal = document.getElementById("lightbox-modal");
    const img = document.getElementById("lightbox-img");
    const closeBtn = document.getElementById("lightbox-close-btn");
    const prevBtn = document.getElementById("lightbox-prev-btn");
    const nextBtn = document.getElementById("lightbox-next-btn");

    if (!modal) return;

    if (closeBtn) closeBtn.onclick = closeLightbox;
    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); showPrevImage(); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); showNextImage(); };

    modal.onclick = (e) => {
        if (e.target === modal || e.target.classList.contains("lightbox-content-wrapper")) {
            closeLightbox();
        }
    };

    // Điều hướng bàn phím (Mũi tên trái/phải, Esc)
    window.onkeydown = (e) => {
        if (!modal.classList.contains("active")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") showPrevImage();
        if (e.key === "ArrowRight") showNextImage();
    };

    // Xử lý Cử chỉ Zoom & Chạm trên hình ảnh
    if (img) {
        img.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
                // Pinch to zoom (2 ngón tay)
                startDistance = getDistance(e.touches[0], e.touches[1]);
                initialScale = currentScale;
            } else if (e.touches.length === 1) {
                // Double tap check
                const now = Date.now();
                if (now - lastTapTime < 300) {
                    // Double tap: toggle zoom 1x <-> 2.5x
                    if (currentScale > 1.1) {
                        resetImageZoom();
                    } else {
                        currentScale = 2.5;
                        panX = 0;
                        panY = 0;
                        updateImageTransform(true);
                    }
                    lastTapTime = 0;
                    return;
                }
                lastTapTime = now;

                touchStartX = e.touches[0].clientX;
                startTouchX = e.touches[0].clientX - panX;
                startTouchY = e.touches[0].clientY - panY;
                if (currentScale > 1.1) {
                    isPanning = true;
                }
            }
        }, { passive: true });

        img.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2 && startDistance > 0) {
                // Pinch zooming
                const currentDist = getDistance(e.touches[0], e.touches[1]);
                const factor = currentDist / startDistance;
                currentScale = Math.min(Math.max(initialScale * factor, 1), 4);
                updateImageTransform(false);
                e.preventDefault();
            } else if (e.touches.length === 1 && isPanning && currentScale > 1.1) {
                // Pan / Kéo di chuyển ảnh khi đã zoom
                panX = e.touches[0].clientX - startTouchX;
                panY = e.touches[0].clientY - startTouchY;
                updateImageTransform(false);
                e.preventDefault();
            }
        }, { passive: false });

        img.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) {
                startDistance = 0;
            }
            if (e.touches.length === 0) {
                isPanning = false;
                if (currentScale < 1.05) {
                    resetImageZoom();
                } else if (currentScale > 4) {
                    currentScale = 4;
                    updateImageTransform(true);
                }
                touchEndX = e.changedTouches[0].clientX;
                // Nếu không zoom, cho phép vuốt đổi ảnh
                if (currentScale <= 1.05) {
                    handleSwipeGesture();
                }
            }
        });
    }

    // Chặn tuyệt đối cuộn trang ngầm bên dưới khi modal đang mở trên di động
    modal.addEventListener("touchmove", (e) => {
        if (modal.classList.contains("active") && currentScale <= 1.05) {
            e.preventDefault();
        }
    }, { passive: false });
}

function handleSwipeGesture() {
    const swipeThreshold = 40; // Ngưỡng vuốt tối thiểu 40px
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff < 0) {
            showNextImage(); // Vuốt sang trái -> Ảnh tiếp
        } else {
            showPrevImage(); // Vuốt sang phải -> Ảnh trước
        }
    }
}
