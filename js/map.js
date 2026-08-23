/**
 * MAP.JS - ES6 MODULE
 * Render các thẻ Lễ & Tiệc cưới kèm bản đồ Google Maps nhúng iframe và trạng thái thời gian thực
 */

/**
 * Xác định trạng thái của sự kiện dựa vào thời gian hiện tại
 * - Sắp Diễn Ra: now < startTime
 * - Đang Diễn Ra: startTime <= now < endTime
 * - Đã Diễn Ra: now >= endTime
 * @param {string|number} startTimeIso 
 * @param {string|number} endTimeIso 
 * @returns {{ key: 'upcoming'|'ongoing'|'passed', label: string, html: string } | null}
 */
function getEventStatus(startTimeIso, endTimeIso) {
    if (!startTimeIso || !endTimeIso) return null;

    const now = Date.now();
    const start = new Date(startTimeIso).getTime();
    const end = new Date(endTimeIso).getTime();

    if (isNaN(start) || isNaN(end)) return null;

    if (now < start) {
        return {
            key: 'upcoming',
            label: 'Sắp Diễn Ra',
            html: `<span class="ceremony-status status-upcoming"><i class="far fa-clock"></i> Sắp Diễn Ra</span>`
        };
    } else if (now >= start && now < end) {
        return {
            key: 'ongoing',
            label: 'Đang Diễn Ra',
            html: `<span class="ceremony-status status-ongoing"><span class="status-live-dot" aria-hidden="true"></span> Đang Diễn Ra</span>`
        };
    } else {
        return {
            key: 'passed',
            label: 'Đã Diễn Ra',
            html: `<span class="ceremony-status status-passed"><i class="fas fa-check-circle"></i> Đã Diễn Ra</span>`
        };
    }
}

let statusUpdateTimer = null;

export function renderCeremonies(containerId, ceremoniesData) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(ceremoniesData)) return;

    container.innerHTML = "";

    ceremoniesData.forEach((item, index) => {
        const card = document.createElement("div");
        const hasMap = item.mapEmbedUrl && item.mapEmbedUrl !== null;

        card.className = `ceremony-card reveal-slide-up${hasMap ? '' : ' no-map'}`;
        card.dataset.ceremonyId = item.id || `ceremony-${index}`;

        const mapSection = hasMap ? `
            <div class="map-wrapper">
                <iframe 
                    src="${item.mapEmbedUrl}" 
                    title="Bản đồ chỉ đường - ${item.title}"
                    loading="lazy" 
                    allowfullscreen="" 
                    referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            </div>` : '';

        const mapsBtn = item.mapDirectUrl ? `
            <a href="${item.mapDirectUrl}" target="_blank" rel="noopener noreferrer" class="btn-copy" style="text-decoration:none; display:inline-block; padding:8px 20px;">
                <i class="fas fa-route"></i> Mở Google Maps
            </a>` : '';

        // webcal:// is handled reliably by iOS Calendar, while Android browsers
        // generally need the Google Calendar URL instead.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const resolvedCalendarUrl = isIOS
            ? (item.calendarWebcalUrl || item.calendarUrl)
            : (item.calendarUrl || item.calendarWebcalUrl);

        const calendarBtn = resolvedCalendarUrl ? `
            <a href="${resolvedCalendarUrl}" target="_blank" rel="noopener noreferrer" class="btn-copy" style="text-decoration:none; display:inline-block; padding:8px 20px; background: var(--color-gold-dark);">
                <i class="far fa-calendar-plus"></i> Thêm vào Lịch
            </a>` : '';

        const actions = mapsBtn || calendarBtn ? `
            <div class="ceremony-actions">
                ${mapsBtn}
                ${calendarBtn}
            </div>` : '';

        const statusInfo = getEventStatus(item.startTime, item.endTime);
        const statusHtml = statusInfo ? statusInfo.html : '';

        card.innerHTML = `
            <div class="ceremony-info">
                <div class="ceremony-header-row">
                    <div class="ceremony-icon"><i class="fas ${item.icon || 'fa-calendar-heart'}"></i></div>
                    <div class="ceremony-status-container" id="status-${item.id || index}">
                        ${statusHtml}
                    </div>
                </div>
                <span class="ceremony-tag">${item.tag || 'LỄ CƯỚI'}</span>
                ${item.title ? `<h3 class="ceremony-title">${item.title}</h3>` : ''}
                <div class="ceremony-time"><i class="far fa-clock"></i> ${item.time}</div>
                <div class="ceremony-address"><i class="fas fa-location-dot"></i> ${item.address}</div>
                ${actions}
            </div>
            ${item.blessing ? `<div class="ceremony-blessing"><i class="fas fa-quote-left" aria-hidden="true"></i><p>${item.blessing}</p></div>` : ''}
            ${mapSection}
        `;

        container.appendChild(card);
    });

    // Bắt đầu vòng lặp cập nhật trạng thái thời gian thực
    startRealtimeStatusUpdater(ceremoniesData);
}

function updateAllCeremonyStatuses(ceremoniesData) {
    if (!Array.isArray(ceremoniesData)) return;

    ceremoniesData.forEach((item, index) => {
        const statusEl = document.getElementById(`status-${item.id || index}`);
        if (!statusEl) return;

        const currentStatus = getEventStatus(item.startTime, item.endTime);
        if (!currentStatus) return;

        // Chỉ thay đổi innerHTML nếu có sự thay đổi về nội dung
        if (statusEl.innerHTML.trim() !== currentStatus.html.trim()) {
            statusEl.innerHTML = currentStatus.html;
        }
    });
}

function startRealtimeStatusUpdater(ceremoniesData) {
    if (statusUpdateTimer) {
        clearInterval(statusUpdateTimer);
    }

    // Kiểm tra & cập nhật mỗi 5 giây
    statusUpdateTimer = setInterval(() => {
        updateAllCeremonyStatuses(ceremoniesData);
    }, 5000);

    // Cập nhật lại ngay khi người dùng chuyển lại tab
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            updateAllCeremonyStatuses(ceremoniesData);
        }
    });
}
