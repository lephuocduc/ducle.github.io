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
        // Chỉ gỡ no-scroll nếu Intro screen không mở
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

function initLightboxEvents() {
    const modal = document.getElementById("lightbox-modal");
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

    // Lướt vuốt tay trên điện thoại (Swipe Touch gestures) & ngăn cuộn trang ngầm
    modal.ontouchstart = (e) => {
        touchStartX = e.changedTouches[0].screenX;
    };

    modal.ontouchend = (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    };

    // Chặn tuyệt đối cuộn trang ngầm bên dưới khi modal đang mở trên di động
    modal.addEventListener("touchmove", (e) => {
        if (modal.classList.contains("active")) {
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
