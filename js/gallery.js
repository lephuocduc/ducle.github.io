/**
 * GALLERY.JS - ES6 MODULE
 * Render bộ sưu tập ảnh kiểu Masonry Grid, Lightbox Modal mờ nền với mũi tên, zoom ảnh & vuốt chuyển ảnh
 */

let currentGalleryData = [];
let currentImageIndex = 0;
let savedScrollPosition = 0;

// State biến cho Zoom & Drag / Pan & Touch
let currentScale = 1;
let initialScale = 1;
let startDistance = 0;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastTapTime = 0;

// Desktop Mouse Dragging State
let isMouseDown = false;
let startMouseX = 0;
let startMouseY = 0;
let startPanX = 0;
let startPanY = 0;

// Touch / Swipe Tracking State
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchStartTime = 0;
let isMultiTouch = false;

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

        // Đã xóa biểu tượng kính lúp theo yêu cầu
        card.innerHTML = `
            <img src="${item.src}" alt="${item.title || 'Ảnh kỷ niệm đám cưới'}" loading="lazy" />
            <div class="gallery-hover-overlay">
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

function updateCursor() {
    const img = document.getElementById("lightbox-img");
    if (!img) return;
    if (currentScale > 1.05) {
        img.style.cursor = isMouseDown || isPanning ? "grabbing" : "grab";
    } else {
        img.style.cursor = "zoom-in";
    }
}

function clampPan() {
    const img = document.getElementById("lightbox-img");
    if (!img || currentScale <= 1.05) {
        panX = 0;
        panY = 0;
        return;
    }
    const maxPanX = (img.clientWidth * (currentScale - 1)) / 2 + 150;
    const maxPanY = (img.clientHeight * (currentScale - 1)) / 2 + 150;
    panX = Math.min(Math.max(panX, -maxPanX), maxPanX);
    panY = Math.min(Math.max(panY, -maxPanY), maxPanY);
}

function resetImageZoom() {
    currentScale = 1;
    initialScale = 1;
    startDistance = 0;
    panX = 0;
    panY = 0;
    isPanning = false;
    isMouseDown = false;
    isMultiTouch = false;
    const img = document.getElementById("lightbox-img");
    if (img) {
        img.style.transform = "translate(0px, 0px) scale(1)";
        img.style.transition = "transform 0.25s ease";
        img.style.cursor = "zoom-in";
    }
}

function updateImageTransform(smooth = false) {
    const img = document.getElementById("lightbox-img");
    if (!img) return;
    img.style.transition = smooth ? "transform 0.25s ease" : "none";
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
    updateCursor();
}

function openLightbox(index) {
    const modal = document.getElementById("lightbox-modal");
    if (!modal || currentGalleryData.length === 0) return;

    savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    currentImageIndex = index;
    updateLightboxImage();

    modal.classList.add("active");
    document.body.classList.add("no-scroll");
    document.documentElement.classList.add("no-scroll");
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
            document.documentElement.classList.remove("no-scroll");
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

    // Chặn hoàn toàn cuộn trang web khi đang ở trong lightbox (trên cả Desktop và Mobile)
    modal.addEventListener("wheel", (e) => {
        if (!modal.classList.contains("active")) return;
        e.preventDefault();

        // Zoom bằng con lăn chuột trên máy tính
        const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8;
        let newScale = currentScale * zoomFactor;

        if (newScale <= 1.05) {
            resetImageZoom();
        } else {
            newScale = Math.min(newScale, 5); // Phóng to tối đa 5 lần
            currentScale = newScale;
            clampPan();
            updateImageTransform(true);
        }
    }, { passive: false });

    if (img) {
        img.draggable = false;

        // Double click trên máy tính: Phóng to / Thu nhỏ 1x <-> 2.5x
        img.addEventListener("dblclick", (e) => {
            e.preventDefault();
            if (currentScale > 1.1) {
                resetImageZoom();
            } else {
                currentScale = 2.5;
                panX = 0;
                panY = 0;
                updateImageTransform(true);
            }
        });

        // Kéo thả chuột di chuyển ảnh (Desktop Drag & Pan)
        img.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return; // Chỉ xử lý chuột trái
            if (currentScale > 1.05) {
                e.preventDefault();
                isMouseDown = true;
                startMouseX = e.clientX;
                startMouseY = e.clientY;
                startPanX = panX;
                startPanY = panY;
                updateCursor();
            }
        });

        window.addEventListener("mousemove", (e) => {
            if (isMouseDown && currentScale > 1.05) {
                e.preventDefault();
                const dx = e.clientX - startMouseX;
                const dy = e.clientY - startMouseY;
                panX = startPanX + dx;
                panY = startPanY + dy;
                clampPan();
                updateImageTransform(false);
            }
        });

        window.addEventListener("mouseup", () => {
            if (isMouseDown) {
                isMouseDown = false;
                updateCursor();
            }
        });

        // Xử lý Cử chỉ Zoom & Touch trên Mobile
        img.addEventListener("touchstart", (e) => {
            if (e.touches.length > 1) {
                isMultiTouch = true;
            }

            if (e.touches.length === 2) {
                // Pinch zoom (2 ngón tay)
                startDistance = getDistance(e.touches[0], e.touches[1]);
                initialScale = currentScale;
            } else if (e.touches.length === 1) {
                const now = Date.now();
                // Double tap check
                if (now - lastTapTime < 300) {
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
                touchStartY = e.touches[0].clientY;
                touchStartTime = now;
                startTouchX = e.touches[0].clientX - panX;
                startTouchY = e.touches[0].clientY - panY;

                if (currentScale > 1.1) {
                    isPanning = true;
                }
            }
        }, { passive: true });

        img.addEventListener("touchmove", (e) => {
            if (e.touches.length > 1) {
                isMultiTouch = true;
            }

            if (e.touches.length === 2 && startDistance > 0) {
                const currentDist = getDistance(e.touches[0], e.touches[1]);
                const factor = currentDist / startDistance;
                currentScale = Math.min(Math.max(initialScale * factor, 1), 5);
                updateImageTransform(false);
                if (e.cancelable) e.preventDefault();
            } else if (e.touches.length === 1 && isPanning && currentScale > 1.1) {
                panX = e.touches[0].clientX - startTouchX;
                panY = e.touches[0].clientY - startTouchY;
                clampPan();
                updateImageTransform(false);
                if (e.cancelable) e.preventDefault();
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
                } else if (currentScale > 5) {
                    currentScale = 5;
                    updateImageTransform(true);
                }
                updateCursor();

                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;

                // CHỈ cho phép vuốt chuyển ảnh khi:
                // 1. Không dùng multi-touch (pinch) trong thao tác này
                // 2. Không ở chế độ zoom (currentScale <= 1.05)
                if (!isMultiTouch && currentScale <= 1.05) {
                    handleSwipeGesture();
                }

                isMultiTouch = false;
            }
        });

        img.addEventListener("touchcancel", () => {
            isPanning = false;
            isMultiTouch = false;
            startDistance = 0;
        });
    }

    modal.addEventListener("touchmove", (e) => {
        if (modal.classList.contains("active") && currentScale <= 1.05) {
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });
}

function handleSwipeGesture() {
    const swipeThreshold = 50; // Ngưỡng vuốt ngang 50px
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const duration = Date.now() - touchStartTime;

    // Phải là vuốt ngang chủ yếu (|diffX| > |diffY| * 1.5) và thời gian ngắn (< 500ms)
    if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > Math.abs(diffY) * 1.5 && duration < 500) {
        if (diffX < 0) {
            showNextImage();
        } else {
            showPrevImage();
        }
    }
}
