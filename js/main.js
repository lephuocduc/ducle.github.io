/**
 * MAIN.JS - ENTRY POINT ES6 MODULE
 * Khởi tạo ứng dụng thiệp cưới SPA, render toàn bộ DOM từ config.js
 */

import { loadConfig } from './config-loader.js?v=20260729-2';
import { renderCountdown } from './countdown.js?v=20260729-2';
import { renderGallery } from './gallery.js?v=20260729-1';
import { initMusicPlayer } from './music.js?v=20260729-2';
import { initScrollAnimations } from './animation.js?v=20260728-3';
import { renderTimeline } from './timeline.js?v=20260729-2';
import { renderCeremonies } from './map.js?v=20260729-1';
import { initCanvasEffects, initParallax } from './effects.js?v=20260728-3';
import { initWishesModule } from './wishes.js?v=20260801-1';

// Tải cấu hình và chỉ preload các ảnh cần cho phần mở đầu.
const initialConfig = loadConfig();
if (initialConfig) {
    preloadImages(initialConfig);
}

document.addEventListener("DOMContentLoaded", () => {
    try {
        // 1. Tải cấu hình dữ liệu từ config.js
        const config = initialConfig || loadConfig();
        if (!config) return;

        // Intro screen button & opening curtain effect handling
        const intro = document.getElementById('intro-screen');
        const openBtn = document.getElementById('open-invite-btn');

        if (intro) {
            // Khóa cuộn trang khi đang hiển thị Intro (cả touch và scroll)
            document.body.classList.add('no-scroll');
            document.documentElement.classList.add('no-scroll');
            window.scrollTo(0, 0);

            intro.addEventListener('touchmove', (e) => {
                if (!intro.classList.contains('hidden-intro')) {
                    if (e.cancelable) e.preventDefault();
                }
            }, { passive: false });
        }

        if (openBtn && intro) {
            openBtn.addEventListener('click', () => {
                intro.classList.add('opening');
                setTimeout(() => {
                    intro.classList.add('hidden-intro');
                    // Mở khóa cuộn trang sau khi hiệu ứng mở rèm hoàn tất
                    document.body.classList.remove('no-scroll');
                    document.documentElement.classList.remove('no-scroll');
                }, 800);
            });
        }

        // 2. Render các Section chính hoàn toàn bằng JS
        renderHero(config);
        renderCouple(config);
        renderGiftSection(config);
        renderFooter(config);

        // 3. Render các Module chuyên biệt
        const coupleNames = `${config.groom?.shortName || config.groom?.name || ''} & ${config.bride?.shortName || config.bride?.name || ''}`;
        renderCountdown("countdown-container", config.weddingDate, coupleNames);
        renderTimeline("timeline-container", config.story);
        renderCeremonies("ceremonies-container", config.ceremonies);
        renderGallery("gallery-container", config.gallery);
        renderGalleryDriveLink(config.galleryDriveUrl);
        initWishesModule();

        // 4. Khởi tạo nhạc nền, hiệu ứng & animations
        initNavigationMenu();
        initSmoothAnchorScroll();
        initMusicPlayer(config.music, config.weddingDate);
        initCanvasEffects("effects-canvas");
        initParallax();
        initScrollAnimations();
        initCopyButtons();
        initBackToTop();
        initPreventDoubleTapZoom();
    } catch (err) {
        console.error("[main] Lỗi khởi tạo giao diện:", err);
    } finally {
        // 5. Tháo màn hình chờ Preloader sau khi hoàn tất
        hidePreloader();
    }
});

// Fallback an toàn: Tự động tháo Preloader sau 2.5s phòng trường hợp DOMContentLoaded quá chậm hoặc lỗi bất ngờ
setTimeout(() => {
    hidePreloader();
}, 2500);

// Chặn hành vi double-tap to zoom trên các nút và liên kết (đặc biệt trên iOS WebKit)
function initPreventDoubleTapZoom() {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const target = e.target.closest('button, a, .gift-qr-button, .gallery-card, .lightbox-nav-btn, .ws-like-btn, .ws-load-more, .ws-submit-btn, .nav-toggle, .floating-btn');
        if (target) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
                target.click();
            }
            lastTouchEnd = now;
        }
    }, { passive: false });
}

// Chỉ preload hero và ảnh đại diện; các ảnh còn lại tải khi khách cuộn đến.
function preloadImages(config) {
    const urls = new Set();

    if (config.hero?.backgroundImage) urls.add(config.hero.backgroundImage);
    if (config.groom?.avatar) urls.add(config.groom.avatar);
    if (config.bride?.avatar) urls.add(config.bride.avatar);

    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

function renderGalleryDriveLink(url) {
    const driveButton = document.getElementById("gallery-drive-btn");
    if (!driveButton) return;

    if (url) {
        driveButton.href = url;
    } else {
        driveButton.closest(".gallery-drive-link")?.remove();
    }
}

// Render Hero Section
function renderHero(config) {
    const heroSection = document.getElementById("hero-section");
    if (!heroSection) return;

    heroSection.style.backgroundImage = `url('${config.hero?.backgroundImage || 'assets/hero.jpg'}')`;

    heroSection.innerHTML = `
        <div class="hero-overlay"></div>
        <div class="hero-card reveal-zoom">
            <span class="hero-subtitle">${config.hero?.subtitle || 'SAVE THE DATE'}</span>
            <h1 class="hero-title">${config.groom?.shortName || config.groom?.name} & ${config.bride?.shortName || config.bride?.name}</h1>
            <div class="hero-date">${config.weddingDateDisplay || ''}</div>
            <div class="hero-lunar">${config.lunarDateDisplay || ''}</div>
            <p style="margin-top:15px; font-style:italic; color:var(--color-text-muted); font-family:var(--font-heading); font-size:1.1rem;">
                "${config.hero?.quote || ''}"
            </p>
        </div>
        <div class="scroll-indicator" id="scroll-indicator" aria-label="Cuộn xuống">
            <i class="fas fa-chevron-down"></i>
        </div>
    `;

    document.getElementById("scroll-indicator")?.addEventListener("click", () => {
        document.getElementById("couple-section")?.scrollIntoView({ behavior: "smooth" });
    });
}

// Render Couple Section (Chú Rể & Cô Dâu)
function renderCouple(config) {
    const coupleContainer = document.getElementById("couple-container");
    if (!coupleContainer) return;

    coupleContainer.innerHTML = `
        <!-- Chú Rể -->
        <div class="couple-card reveal-slide-left">
            <div class="avatar-frame">
                <img src="${config.groom.avatar}" alt="Chú Rể ${config.groom.name}" />
            </div>
            <span class="couple-role">${config.groom.title || 'CHÚ RỂ'}</span>
            <h3 class="couple-name">${config.groom.name}</h3>
            <p style="color:var(--color-text-muted); margin-bottom:15px;">${config.groom.story || ''}</p>
            <div class="parents-info">
                <p>Con ông: <strong>${config.groom.father}</strong></p>
                <p>Con bà: <strong>${config.groom.mother}</strong></p>
            </div>
        </div>

        <div class="couple-heart-divider reveal-zoom">
            <i class="fas fa-heart pulse"></i>
        </div>

        <!-- Cô Dâu -->
        <div class="couple-card reveal-slide-right">
            <div class="avatar-frame">
                <img src="${config.bride.avatar}" alt="Cô Dâu ${config.bride.name}" />
            </div>
            <span class="couple-role">${config.bride.title || 'CÔ DÂU'}</span>
            <h3 class="couple-name">${config.bride.name}</h3>
            <p style="color:var(--color-text-muted); margin-bottom:15px;">${config.bride.story || ''}</p>
            <div class="parents-info">
                <p>Con ông: <strong>${config.bride.father}</strong></p>
                <p>Con bà: <strong>${config.bride.mother}</strong></p>
            </div>
        </div>
    `;
}

// Render Gift / QR Section
function renderGiftSection(config) {
    const giftContainer = document.getElementById("gift-container");
    if (!giftContainer) return;

    const groomBank = config.groom.bank;
    const brideBank = config.bride.bank;

    const groomBankCode = groomBank.bankCode || "TPB";
    const brideBankCode = brideBank.bankCode || "VCB";

    // VietQR fallback generator
    const groomQrSrc = groomBank.qrImage || 
        `https://img.vietqr.io/image/${groomBankCode}-${groomBank.accountNumber}-compact2.png?amount=0&addInfo=Mung%20Cuoi%20${encodeURIComponent(config.groom.name)}`;

    const brideQrSrc = brideBank.qrImage || 
        `https://img.vietqr.io/image/${brideBankCode}-${brideBank.accountNumber}-compact2.png?amount=0&addInfo=Mung%20Cuoi%20${encodeURIComponent(config.bride.name)}`;

    giftContainer.innerHTML = `
        <!-- Thẻ mừng chú rể -->
        <div class="gift-card reveal-slide-left">
            <h3 style="font-family:var(--font-heading); font-size:1.8rem; color:var(--color-primary);">Mừng Cưới Chú Rể</h3>
            <button type="button" class="gift-qr-button" data-qr-src="${groomQrSrc}" data-qr-alt="Mã QR Chuyển Khoản Chú Rể" aria-label="Mở lớn mã QR chuyển khoản chú rể">
                <img src="${groomQrSrc}" alt="Mã QR Chuyển Khoản Chú Rể" class="gift-qr-img" loading="lazy" decoding="async" />
            </button>
            <div class="bank-info-box">
                <p><strong>Ngân hàng:</strong> ${groomBank.bankName}</p>
                <p>
                    <strong>Số TK:</strong> <span class="acc-number">${groomBank.accountNumber}</span>
                    <button class="btn-copy btn-copy-stk" data-stk="${groomBank.accountNumber}"><i class="fas fa-copy"></i> Sao chép</button>
                </p>
                <p><strong>Chủ TK:</strong> ${groomBank.accountOwner}</p>
            </div>
        </div>

        <!-- Thẻ mừng cô dâu -->
        <div class="gift-card reveal-slide-right">
            <h3 style="font-family:var(--font-heading); font-size:1.8rem; color:var(--color-primary);">Mừng Cưới Cô Dâu</h3>
            <button type="button" class="gift-qr-button" data-qr-src="${brideQrSrc}" data-qr-alt="Mã QR Chuyển Khoản Cô Dâu" aria-label="Mở lớn mã QR chuyển khoản cô dâu">
                <img src="${brideQrSrc}" alt="Mã QR Chuyển Khoản Cô Dâu" class="gift-qr-img" loading="lazy" decoding="async" />
            </button>
            <div class="bank-info-box">
                <p><strong>Ngân hàng:</strong> ${brideBank.bankName}</p>
                <p>
                    <strong>Số TK:</strong> <span class="acc-number">${brideBank.accountNumber}</span>
                    <button class="btn-copy btn-copy-stk" data-stk="${brideBank.accountNumber}"><i class="fas fa-copy"></i> Sao chép</button>
                </p>
                <p><strong>Chủ TK:</strong> ${brideBank.accountOwner}</p>
            </div>
        </div>
    `;

    initQrLightbox(giftContainer);

    // Handle VietQR image loading timeout and error fallback
    giftContainer.querySelectorAll('.gift-qr-img').forEach(img => {
        const loadTimeout = setTimeout(() => {
            console.warn('[vietqr] QR code loading timeout (> 5s):', img.src);
        }, 5000);

        img.addEventListener('load', () => clearTimeout(loadTimeout));
        img.addEventListener('error', () => {
            clearTimeout(loadTimeout);
            console.warn('[vietqr] Unable to load QR code image:', img.src);
        });
    });
}

function initQrLightbox(giftContainer) {
    const modal = document.getElementById("qr-modal");
    const modalImage = document.getElementById("qr-modal-img");
    const closeButton = document.getElementById("qr-modal-close-btn");
    if (!modal || !modalImage || !closeButton) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    let firstFocusable = null;
    let lastFocusable = null;

    const close = () => {
        modal.classList.remove("active");
        document.body.classList.remove("no-scroll");
        document.documentElement.classList.remove("no-scroll");
        modalImage.src = ""; // Clear image to stop any audio/video if added later
    };

    // Trap focus inside modal
    const handleTabKey = (e) => {
        if (!modal.classList.contains("active")) return;
        if (e.key !== "Tab") return;

        const focusables = modal.querySelectorAll(focusableSelector);
        firstFocusable = focusables[0];
        lastFocusable = focusables[focusables.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    };

    giftContainer.querySelectorAll(".gift-qr-button").forEach(button => {
        button.addEventListener("click", () => {
            modalImage.src = button.dataset.qrSrc;
            modalImage.alt = button.dataset.qrAlt;
            modal.classList.add("active");
            document.body.classList.add("no-scroll");
            document.documentElement.classList.add("no-scroll");
            closeButton.focus();
        });
    });

    closeButton.onclick = close;
    modal.onclick = (event) => {
        if (event.target === modal) close();
    };
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("active")) close();
        handleTabKey(event);
    });
}

// Render Footer
function renderFooter(config) {
    const footerContainer = document.getElementById("footer-container");
    if (!footerContainer || !config.footer) return;

    footerContainer.innerHTML = `
        <h2 class="footer-brand">${config.groom?.shortName} & ${config.bride?.shortName}</h2>
        <p style="max-width:600px; margin:0 auto 15px; font-size:0.95rem; opacity:0.9;">
            ${config.footer.thankYouMessage}
        </p>
        <p style="font-size:0.8rem; opacity:0.6;">${config.footer.copyright}</p>
    `;
}

// Xử lý nút copy STK
function initCopyButtons() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-copy-stk");
        if (btn) {
            const stk = btn.getAttribute("data-stk");
            if (stk) {
                // Fallback copy cho cả iOS/Android
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(stk).then(() => {
                        showToast("Đã sao chép số tài khoản thành công! ✨");
                    }).catch(() => {
                        fallbackCopyText(stk);
                    });
                } else {
                    fallbackCopyText(stk);
                }
            }
        }
    });
}

function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand("copy");
        showToast("Đã sao chép số tài khoản thành công! ✨");
    } catch (err) {
        showToast("Không thể sao chép tự động, vui lòng chọn thủ công.");
    }
    document.body.removeChild(textArea);
}

// Xử lý Back to top button
function initBackToTop() {
    const backBtn = document.getElementById("back-to-top-btn");
    if (!backBtn) return;

    window.addEventListener("scroll", () => {
        if (window.pageYOffset > 400) {
            backBtn.classList.add("show");
        } else {
            backBtn.classList.remove("show");
        }
    }, { passive: true });

    backBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// Toast notification helper
let toastTimer = null;
function showToast(msg) {
    let toast = document.getElementById("toast-msg");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-msg";
        toast.className = "toast-container";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.remove("show");
    void toast.offsetWidth; // Force reflow
    toast.classList.add("show");

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Preloader Hide
function hidePreloader() {
    const preloader = document.getElementById("preloader");
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add("hidden");
        }, 500);
    }
}

// Navigation Menu Drawer Toggle
function initNavigationMenu() {
    const navbar = document.getElementById("navbar");
    const toggleBtn = document.getElementById("nav-toggle");
    const closeBtn = document.getElementById("nav-close");
    const menu = document.getElementById("nav-menu");
    const overlay = document.getElementById("nav-overlay");
    const navLinks = menu?.querySelectorAll(".nav-link");

    if (!toggleBtn || !menu || !navbar) return;

    function openMenu() {
        menu.classList.add("active");
        overlay?.classList.add("active");
        document.body.classList.add("menu-open");
    }

    function closeMenu() {
        menu.classList.remove("active");
        overlay?.classList.remove("active");
        document.body.classList.remove("menu-open");
    }

    function updateNavMode() {
        const wasCollapsed = navbar.classList.contains("nav-collapsed");

        // Mobile: CSS @media (max-width: 850px) tu xu ly hamburger
        if (window.innerWidth <= 850) {
            navbar.classList.remove("nav-collapsed");
            return;
        }

        navbar.classList.remove("nav-collapsed");
        const overflows = menu.scrollWidth > menu.clientWidth + 1;

        if (overflows) {
            navbar.classList.add("nav-collapsed");
            if (!wasCollapsed) closeMenu();
        } else if (wasCollapsed) {
            closeMenu();
        }
    }

    toggleBtn.addEventListener("click", openMenu);
    closeBtn?.addEventListener("click", closeMenu);
    overlay?.addEventListener("click", closeMenu);

    navLinks?.forEach(link => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("active")) {
            closeMenu();
        }
    });

    updateNavMode();
    window.addEventListener("resize", updateNavMode, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(updateNavMode).observe(navbar);
    }
}

// Smooth anchor scroll - prevent URL hash change while enabling smooth scrolling
function initSmoothAnchorScroll() {
    // Select all internal anchor links (href="#xxx" but not href="#" or empty)
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault(); // Prevent default browser behavior
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}
