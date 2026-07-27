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

    const pad = (n) => n < 10 ? `0${n}` : `${n}`;

    function update() {
        const diff = targetTime - Date.now();

        if (diff <= 0) {
            daysEl.textContent = "00";
            hoursEl.textContent = "00";
            minutesEl.textContent = "00";
            secondsEl.textContent = "00";
            clearInterval(intervalId); // Ngừng interval sau khi đến ngày cưới
            return;
        }

        daysEl.textContent    = pad(Math.floor(diff / (1000 * 60 * 60 * 24)));
        hoursEl.textContent   = pad(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        minutesEl.textContent = pad(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
        secondsEl.textContent = pad(Math.floor((diff % (1000 * 60)) / 1000));
    }

    update();
    const intervalId = setInterval(update, 1000);
}
