/**
 * GALLERY.JS - ES6 MODULE
 * Render bộ sưu tập ảnh kiểu Masonry Grid, Lazy Loading & Lightbox Modal phóng to
 */

export function renderGallery(containerId, galleryData) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(galleryData)) return;

    container.innerHTML = "";

    galleryData.forEach((item, index) => {
        const card = document.createElement("div");
        const aspectClass = item.aspect || "square";
        card.className = `gallery-card ${aspectClass} reveal-zoom`;
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `Xem ảnh: ${item.title || 'Ảnh kỷ niệm'}`);

        card.innerHTML = `
            <img src="${item.src}" alt="${item.title || 'Ảnh kỷ niệm đám cưới'}" loading="lazy" />
            <div class="gallery-hover-overlay">
                <i class="fas fa-magnifying-glass-plus" style="font-size:2rem; margin-bottom:8px;"></i>
                <span style="font-family:var(--font-heading); font-size:1.1rem;">${item.title || ''}</span>
            </div>
        `;

        // Sự kiện click mở Lightbox
        card.addEventListener("click", () => openLightbox(item.src, item.title));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                openLightbox(item.src, item.title);
            }
        });

        container.appendChild(card);
    });

    initLightboxEvents();
}

function openLightbox(src, title) {
    const modal = document.getElementById("lightbox-modal");
    const img = document.getElementById("lightbox-img");
    if (modal && img) {
        img.src = src;
        img.alt = title || "Ảnh phóng to";
        modal.classList.add("active");
        modal.focus();
    }
}

function initLightboxEvents() {
    const modal = document.getElementById("lightbox-modal");
    const closeBtn = document.getElementById("lightbox-close-btn");

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => modal.classList.remove("active"));
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("active");
        });
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.classList.contains("active")) {
                modal.classList.remove("active");
            }
        });
    }
}
