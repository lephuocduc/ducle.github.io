/**
 * COUNTDOWN.JS - ES6 MODULE
 * Bộ đếm ngược thời gian ngày cưới chính xác từng giây
 */

export function renderCountdown(containerId, weddingDateIso) {
    const container = document.getElementById(containerId);
    if (!container || !weddingDateIso) return;

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

    const daysEl = document.getElementById("cd-days");
    const hoursEl = document.getElementById("cd-hours");
    const minutesEl = document.getElementById("cd-minutes");
    const secondsEl = document.getElementById("cd-seconds");

    const targetTime = new Date(weddingDateIso).getTime();

    function update() {
        const now = new Date().getTime();
        const diff = targetTime - now;

        if (diff <= 0) {
            daysEl.innerText = "00";
            hoursEl.innerText = "00";
            minutesEl.innerText = "00";
            secondsEl.innerText = "00";
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.innerText = d < 10 ? `0${d}` : d;
        hoursEl.innerText = h < 10 ? `0${h}` : h;
        minutesEl.innerText = m < 10 ? `0${m}` : m;
        secondsEl.innerText = s < 10 ? `0${s}` : s;
    }

    update();
    setInterval(update, 1000);
}
