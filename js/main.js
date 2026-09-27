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

// Định dạng số tài khoản thành từng cụm dễ đọc (VD: 0194 5354 401)
function formatAccountNumber(stk) {
    if (!stk) return "";
    const clean = String(stk).replace(/\s+/g, "");
    if (clean.length <= 10) {
        return clean.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
    }
    return clean.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

// Render Gift / QR Section - 1 Thiệp "Mừng Cưới Cô Dâu Chú Rể"
function renderGiftSection(config) {
    const giftContainer = document.getElementById("gift-container");
    if (!giftContainer) return;

    const groomName = config.groom.name;
    const brideName = config.bride.name;
    const groomShort = config.groom.shortName || "Phước Đức";
    const brideShort = config.bride.shortName || "Thu Sương";
    const groomAvatar = config.groom.avatar || "assets/img/groom.jpg";
    const brideAvatar = config.bride.avatar || "assets/img/bride.jpg";

    giftContainer.innerHTML = `
        <div class="envelope-card envelope-single reveal-fade" role="button" tabindex="0" aria-label="Mở phong bao mừng cưới cô dâu chú rể">
            <div class="envelope-top-decor">
                <span class="wax-seal" title="Song Hỷ Cát Tường">囍</span>
            </div>
            <div class="env-couple-row">
                <div class="env-avatar-item">
                    <img src="${groomAvatar}" alt="${groomName}" class="env-avatar-img" loading="lazy" decoding="async" />
                    <span class="env-avatar-tag">Chú Rể</span>
                </div>
                <div class="env-heart-badge" aria-hidden="true">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="env-avatar-item">
                    <img src="${brideAvatar}" alt="${brideName}" class="env-avatar-img" loading="lazy" decoding="async" />
                    <span class="env-avatar-tag">Cô Dâu</span>
                </div>
            </div>
            <span class="envelope-role-tag">HỘP CHÚC PHÚC</span>
            <h3 class="envelope-name">Mừng Cưới Cô Dâu & Chú Rể</h3>
            <p class="envelope-couple-names">${groomShort} & ${brideShort}</p>
            <button type="button" class="btn-open-envelope">
                <i class="fas fa-envelope-open-text"></i> Mở Phong Bao Mừng Cưới
            </button>
        </div>
    `;

    // Keyboard accessibility cho thẻ phong bao
    const singleCard = giftContainer.querySelector(".envelope-card");
    singleCard?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (window.openGiftEnvelopeModal) {
                window.openGiftEnvelopeModal();
            }
        }
    });

    initGiftModal(config);
    initQrLightbox();
}

// Modal Hộp Phong Bao Mừng Cưới (Hiện QR của cả 2 luôn, không chia tab)
function initGiftModal(config) {
    const modal = document.getElementById("gift-modal");
    const modalBody = document.getElementById("gift-modal-body");
    const closeBtn = document.getElementById("gift-modal-close-btn");
    const overlay = modal?.querySelector(".gift-modal-overlay");
    if (!modal || !modalBody) return;

    function renderModalContent() {
        const groom = config.groom;
        const bride = config.bride;
        const groomBank = groom.bank;
        const brideBank = bride.bank;

        const groomBankCode = groomBank.bankCode || "TPB";
        const brideBankCode = brideBank.bankCode || "VCB";

        const groomQrSrc = groomBank.qrImage || 
            `https://img.vietqr.io/image/${groomBankCode}-${groomBank.accountNumber}-compact2.png?amount=0&addInfo=Mung%20Cuoi%20${encodeURIComponent(groom.name)}`;
        const brideQrSrc = brideBank.qrImage || 
            `https://img.vietqr.io/image/${brideBankCode}-${brideBank.accountNumber}-compact2.png?amount=0&addInfo=Mung%20Cuoi%20${encodeURIComponent(bride.name)}`;

        const groomFormattedStk = formatAccountNumber(groomBank.accountNumber);
        const brideFormattedStk = formatAccountNumber(brideBank.accountNumber);

        const coupleShortNames = `${groom.shortName || 'Phuoc Duc'} ${bride.shortName || 'Thu Suong'}`;
        const transferMemo = `Mung cuoi ${coupleShortNames}`;

        modalBody.innerHTML = `
            <div class="gift-modal-header">
                <div class="wax-seal-mini" title="Song Hỷ">囍</div>
                <h3 id="gift-modal-title" class="gift-modal-title">Mừng Cưới Cô Dâu & Chú Rể</h3>
                <p class="gift-modal-subtitle">Quý khách có thể chuyển khoản chúc phúc đến Chú Rể hoặc Cô Dâu dưới đây</p>
            </div>

            <div class="gift-dual-grid">
                <!-- Cột Chú Rể -->
                <div class="gift-person-card">
                    <div class="gift-person-header">
                        <div class="gift-person-avatar-wrap">
                            <img src="${groom.avatar || 'assets/img/groom.jpg'}" alt="${groom.name}" class="gift-person-avatar" />
                        </div>
                        <div>
                            <span class="gift-person-role">MỪNG CƯỚI CHÚ RỂ</span>
                            <h4 class="gift-person-name">${groom.name}</h4>
                        </div>
                    </div>

                    <div class="gift-qr-wrapper">
                        <button type="button" class="gift-qr-zoom-btn" data-qr-src="${groomQrSrc}" data-qr-alt="Mã QR chuyển khoản chú rể ${groom.name}" title="Chạm để phóng to mã QR">
                            <img src="${groomQrSrc}" alt="Mã QR chuyển khoản chú rể ${groom.name}" class="gift-modal-qr-img" loading="lazy" decoding="async" />
                            <span class="qr-zoom-hint"><i class="fas fa-magnifying-glass-plus"></i> Chạm để phóng to mã QR</span>
                        </button>
                    </div>

                    <div class="bank-details-card">
                        <div class="bank-info-item">
                            <div class="bank-info-label"><i class="fas fa-building-columns"></i> Ngân hàng:</div>
                            <div class="bank-info-value"><strong>${groomBank.bankName}</strong></div>
                        </div>
                        <div class="bank-info-item">
                            <div class="bank-info-label"><i class="fas fa-user-check"></i> Chủ tài khoản:</div>
                            <div class="bank-info-value acc-owner-name">${groomBank.accountOwner}</div>
                        </div>
                        <div class="bank-info-item acc-item">
                            <div class="bank-info-label"><i class="fas fa-credit-card"></i> Số tài khoản:</div>
                            <div class="bank-info-actions">
                                <span class="acc-formatted-display">${groomFormattedStk}</span>
                                <button type="button" class="btn-copy btn-copy-stk" data-stk="${groomBank.accountNumber}" title="Sao chép số tài khoản">
                                    <i class="fas fa-copy"></i> Sao chép STK
                                </button>
                            </div>
                        </div>
                        <div class="bank-info-item memo-item">
                            <div class="bank-info-label"><i class="fas fa-pen-fancy"></i> Gợi ý nội dung CK:</div>
                            <div class="bank-info-actions">
                                <span class="memo-formatted-display">${transferMemo}</span>
                                <button type="button" class="btn-copy btn-copy-memo" data-memo="${transferMemo}" title="Sao chép nội dung chuyển khoản">
                                    <i class="fas fa-copy"></i> Sao chép nội dung
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cột Cô Dâu -->
                <div class="gift-person-card">
                    <div class="gift-person-header">
                        <div class="gift-person-avatar-wrap">
                            <img src="${bride.avatar || 'assets/img/bride.jpg'}" alt="${bride.name}" class="gift-person-avatar" />
                        </div>
                        <div>
                            <span class="gift-person-role">MỪNG CƯỚI CÔ DÂU</span>
                            <h4 class="gift-person-name">${bride.name}</h4>
                        </div>
                    </div>

                    <div class="gift-qr-wrapper">
                        <button type="button" class="gift-qr-zoom-btn" data-qr-src="${brideQrSrc}" data-qr-alt="Mã QR chuyển khoản cô dâu ${bride.name}" title="Chạm để phóng to mã QR">
                            <img src="${brideQrSrc}" alt="Mã QR chuyển khoản cô dâu ${bride.name}" class="gift-modal-qr-img" loading="lazy" decoding="async" />
                            <span class="qr-zoom-hint"><i class="fas fa-magnifying-glass-plus"></i> Chạm để phóng to mã QR</span>
                        </button>
                    </div>

                    <div class="bank-details-card">
                        <div class="bank-info-item">
                            <div class="bank-info-label"><i class="fas fa-building-columns"></i> Ngân hàng:</div>
                            <div class="bank-info-value"><strong>${brideBank.bankName}</strong></div>
                        </div>
                        <div class="bank-info-item">
                            <div class="bank-info-label"><i class="fas fa-user-check"></i> Chủ tài khoản:</div>
                            <div class="bank-info-value acc-owner-name">${brideBank.accountOwner}</div>
                        </div>
                        <div class="bank-info-item acc-item">
                            <div class="bank-info-label"><i class="fas fa-credit-card"></i> Số tài khoản:</div>
                            <div class="bank-info-actions">
                                <span class="acc-formatted-display">${brideFormattedStk}</span>
                                <button type="button" class="btn-copy btn-copy-stk" data-stk="${brideBank.accountNumber}" title="Sao chép số tài khoản">
                                    <i class="fas fa-copy"></i> Sao chép STK
                                </button>
                            </div>
                        </div>
                        <div class="bank-info-item memo-item">
                            <div class="bank-info-label"><i class="fas fa-pen-fancy"></i> Gợi ý nội dung CK:</div>
                            <div class="bank-info-actions">
                                <span class="memo-formatted-display">${transferMemo}</span>
                                <button type="button" class="btn-copy btn-copy-memo" data-memo="${transferMemo}" title="Sao chép nội dung chuyển khoản">
                                    <i class="fas fa-copy"></i> Sao chép nội dung
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="gift-modal-footer">
                <button type="button" class="btn-close-envelope-modal">
                    <i class="fas fa-xmark"></i> Đóng Phong Bao
                </button>
            </div>
        `;

        // Bấm QR để phóng to
        modalBody.querySelectorAll(".gift-qr-zoom-btn").forEach(zoomBtn => {
            zoomBtn.addEventListener("click", () => {
                const qrModal = document.getElementById("qr-modal");
                const qrModalImg = document.getElementById("qr-modal-img");
                if (qrModal && qrModalImg) {
                    qrModalImg.src = zoomBtn.dataset.qrSrc;
                    qrModalImg.alt = zoomBtn.dataset.qrAlt;
                    qrModal.classList.add("active");
                }
            });
        });

        // Nút đóng dưới chân modal
        const bottomCloseBtn = modalBody.querySelector(".btn-close-envelope-modal");
        if (bottomCloseBtn) {
            bottomCloseBtn.addEventListener("click", closeModal);
        }
    }

    function openModal() {
        renderModalContent();
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("no-scroll");
        document.documentElement.classList.add("no-scroll");
        closeBtn?.focus();
    }

    function closeModal() {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("no-scroll");
        document.documentElement.classList.remove("no-scroll");
    }

    window.openGiftEnvelopeModal = openModal;

    // Gán sự kiện click cho thẻ phong bao trên trang
    document.querySelectorAll(".envelope-card").forEach(el => {
        el.addEventListener("click", openModal);
    });

    closeBtn?.addEventListener("click", closeModal);
    overlay?.addEventListener("click", closeModal);

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            closeModal();
        }
    });
}

function initQrLightbox() {
    const modal = document.getElementById("qr-modal");
    const modalImage = document.getElementById("qr-modal-img");
    const closeButton = document.getElementById("qr-modal-close-btn");
    if (!modal || !modalImage || !closeButton) return;

    const close = () => {
        modal.classList.remove("active");
        // Chỉ gỡ no-scroll nếu modal phong bao không còn mở
        const giftModal = document.getElementById("gift-modal");
        if (!giftModal || !giftModal.classList.contains("active")) {
            document.body.classList.remove("no-scroll");
            document.documentElement.classList.remove("no-scroll");
        }
        modalImage.src = "";
    };

    closeButton.onclick = close;
    modal.onclick = (event) => {
        if (event.target === modal) close();
    };
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("active")) close();
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

// Xử lý nút copy STK & Lời nhắn chuyển khoản
function initCopyButtons() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-copy");
        if (btn) {
            const stk = btn.getAttribute("data-stk");
            const memo = btn.getAttribute("data-memo");
            const text = stk || memo;
            if (text) {
                const message = memo 
                    ? "Đã sao chép nội dung chuyển khoản! ✨" 
                    : "Đã sao chép số tài khoản thành công! ✨";

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => {
                        showToast(message);
                    }).catch(() => {
                        fallbackCopyText(text, message);
                    });
                } else {
                    fallbackCopyText(text, message);
                }
            }
        }
    });
}

function fallbackCopyText(text, successMsg = "Đã sao chép thành công! ✨") {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand("copy");
        showToast(successMsg);
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
