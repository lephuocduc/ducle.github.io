/**
 * COUNTDOWN.JS - ES6 MODULE
 * Bộ đếm ngược thời gian ngày cưới chính xác từng giây
 */

export function renderCountdown(containerId, weddingDateIso) {
    const container = document.getElementById(containerId);
    if (!container || !weddingDateIso) return;

    const targetTime = new Date(weddingDateIso).getTime();

    function renderRibbon() {
        const sectionTag = container.closest('.section')?.querySelector('.section-tag');
        if (sectionTag) sectionTag.style.display = 'none';

        container.innerHTML = `
            <div class="wedding-today-ribbon reveal-zoom">
                <i class="fas fa-crown" style="font-size:2.2rem; color:var(--color-gold); margin-bottom:10px;"></i>
                <h3 style="font-family:var(--font-script); font-size:clamp(1.6rem, 4vw, 2.5rem); color:var(--color-primary); margin-bottom:10px; line-height:1.4;">
                    Hôm nay là Ngày Trọng Đại của <br/>
                    <span style="white-space:nowrap; color:var(--color-primary-dark); font-weight:bold;">Phước Đức &amp; Thu Sương! 🥳🎉</span>
                </h3>
                <p style="color:var(--color-text-muted); font-size:1.05rem; margin-top:8px;">
                    Cảm ơn tình cảm và sự hiện diện quý báu của tất cả quý vị quan khách! ✨
                </p>
            </div>
        `;
    }

    function renderTimer() {
        container.innerHTML = `
            <div class="countdown-card reveal-zoom">
                <span id="cd-days" class="countdown-number">00</span>
                <span class="countdown-label">Ngày</span>
            </div>
            <div class="countdown-card reveal-zoom">
                <span id="cd-hours" class="countdown-number">00</span>
                <span class="countdown-label">Giờ</span>
            </div>
            <div class="countdown-card reveal-zoom">
                <span id="cd-minutes" class="countdown-number">00</span>
                <span class="countdown-label">Phút</span>
            </div>
            <div class="countdown-card reveal-zoom">
                <span id="cd-seconds" class="countdown-number">00</span>
                <span class="countdown-label">Giây</span>
            </div>
        `;
    }

    const pad = (n) => n < 10 ? `0${n}` : `${n}`;

    let isRibbonRendered = false;
    let intervalId;

    function update() {
        const diff = targetTime - Date.now();

        // Kiểm tra nếu đã đến ngày cưới (hoặc sau ngày cưới trong vòng 24h)
        if (diff <= 0) {
            if (!isRibbonRendered) {
                renderRibbon();
                isRibbonRendered = true;
            }
            if (intervalId) clearInterval(intervalId);
            return;
        }

        if (!isRibbonRendered && !document.getElementById("cd-days")) {
            renderTimer();
        }

        const daysEl = document.getElementById("cd-days");
        const hoursEl = document.getElementById("cd-hours");
        const minutesEl = document.getElementById("cd-minutes");
        const secondsEl = document.getElementById("cd-seconds");

        if (daysEl && hoursEl && minutesEl && secondsEl) {
            daysEl.textContent    = pad(Math.floor(diff / (1000 * 60 * 60 * 24)));
            hoursEl.textContent   = pad(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
            minutesEl.textContent = pad(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
            secondsEl.textContent = pad(Math.floor((diff % (1000 * 60)) / 1000));
        }
    }

    update();
    if (!isRibbonRendered) intervalId = setInterval(update, 1000);
}
