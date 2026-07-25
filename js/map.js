/**
 * MAP.JS - ES6 MODULE
 * Render các thẻ Lễ & Tiệc cưới kèm bản đồ Google Maps nhúng iframe
 */

export function renderCeremonies(containerId, ceremoniesData) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(ceremoniesData)) return;

    container.innerHTML = "";

    ceremoniesData.forEach((item, index) => {
        const card = document.createElement("div");
        const hasMap = item.mapEmbedUrl && item.mapEmbedUrl !== null;

        card.className = `ceremony-card reveal-slide-up${hasMap ? '' : ' no-map'}`;

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

        const calendarBtn = item.calendarUrl ? `
            <a href="${item.calendarUrl}" target="_blank" rel="noopener noreferrer" class="btn-copy" style="text-decoration:none; display:inline-block; padding:8px 20px; background: var(--color-gold-dark);">
                <i class="far fa-calendar-plus"></i> Thêm vào Lịch
            </a>` : '';

        card.innerHTML = `
            <div class="ceremony-info">
                <div class="ceremony-icon"><i class="fas ${item.icon || 'fa-calendar-heart'}"></i></div>
                <span class="ceremony-tag">${item.tag || 'LỄ CƯỚI'}</span>
                <h3 class="ceremony-title">${item.title}</h3>
                <div class="ceremony-time"><i class="far fa-clock"></i> ${item.time}</div>
                <div class="ceremony-address"><i class="fas fa-location-dot"></i> ${item.address}</div>
                <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:15px;">
                    ${mapsBtn}
                    ${calendarBtn}
                </div>
            </div>
            ${mapSection}
        `;

        container.appendChild(card);
    });
}
