/**
 * TIMELINE.JS - ES6 MODULE
 * Render danh sách Hành Trình Yêu Thương (Love Story Timeline)
 */

export function renderTimeline(containerId, storyData) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(storyData)) return;

    container.innerHTML = "";

    storyData.forEach((item, index) => {
        const itemEl = document.createElement("div");
        const animationClass = index % 2 === 0 ? "reveal-slide-left" : "reveal-slide-right";
        itemEl.className = `timeline-item ${animationClass}`;

        itemEl.innerHTML = `
            <div class="timeline-badge"></div>
            <div class="timeline-card">
                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="timeline-img" loading="lazy" />` : ''}
                <span class="timeline-year">${item.date || item.year}</span>
                <h3 class="timeline-item-title">${item.title}</h3>
                <p style="color:var(--color-text-muted); font-size:0.95rem;">${item.content}</p>
            </div>
        `;

        container.appendChild(itemEl);
    });
}
