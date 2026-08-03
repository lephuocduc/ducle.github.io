/**
 * WISHES.JS - LỜI CHÚC MODULE v2
 * Bố cục 2 cột form, avatar initials, sort Nổi bật / Mới nhất,
 * like chỉ cộng (mỗi click +1), phân trang 10 lời/lần.
 */

import { weddingConfig } from '../data/config.js?v=20260729-2';

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_WISHES = [
    {
        id: "w-pin-1", name: "Gia Đình Ba Mẹ Chú Rể", label: "Ba Mẹ Chú Rể",
        content: "Chúc hai con trăm năm hạnh phúc, luôn yêu thương, nhường nhịn và đồng hành cùng nhau trên mọi chặng đường tương lai!",
        likes: 99, createdTime: "2026-10-24T18:00:00+07:00", status: "approved", isPinned: true
    },
    {
        id: "w-pin-2", name: "Gia Đình Ba Mẹ Cô Dâu", label: "Ba Mẹ Cô Dâu",
        content: "Mong cho hai con một đời bình an, gia đình êm ấm, thuận hòa và gặp nhiều may mắn trong cuộc sống hôn nhân.",
        likes: 88, createdTime: "2026-10-24T18:30:00+07:00", status: "approved", isPinned: true
    },
    {
        id: "w-3", name: "Minh Anh", label: "Bạn thân",
        content: "Chúc hai bạn trăm năm hạnh phúc, luôn yêu thương và đồng hành cùng nhau trên mọi chặng đường của cuộc sống. 💕",
        likes: 42, createdTime: "2026-10-25T18:35:00+07:00", status: "approved", isPinned: false
    },
    {
        id: "w-4", name: "Huy",
        content: "Chúc cô dâu chú rể luôn mạnh khỏe, vui vẻ và hạnh phúc mỗi ngày! Mãi mãi bên nhau nhé 🥰",
        likes: 15, createdTime: "2026-10-25T18:40:00+07:00", status: "approved", isPinned: false
    },
    {
        id: "w-5", name: "Lan Ngọc",
        content: "Chúc hai bạn luôn yêu thương, thấu hiểu và cùng nhau vượt qua mọi thử thách. Hạnh phúc mãi nhé! 💝",
        likes: 9, createdTime: "2026-10-25T18:47:00+07:00", status: "approved", isPinned: false
    },
    {
        id: "w-6", name: "Anh Tuấn",
        content: "Chúc hai bạn một cuộc sống đầy ắp tiếng cười và những kỷ niệm đẹp. Trăm năm hạnh phúc! ✨",
        likes: 7, createdTime: "2026-10-25T18:52:00+07:00", status: "approved", isPinned: false
    },
    {
        id: "w-7", name: "Thanh Hương",
        content: "Gửi ngàn lời chúc tốt đẹp nhất tới cặp đôi. Mong các bạn luôn hạnh phúc bên nhau!",
        likes: 3, createdTime: "2026-10-25T19:05:00+07:00", status: "approved", isPinned: false
    },
];

// ── Constants ──────────────────────────────────────────────────────────────
const LS_WISHES = 'wedding_wishes_cache_v2';
const PAGE_SIZE = 10;

// Palette cho avatar initials (theo thứ tự vòng lặp)
const AVATAR_COLORS = [
    ['#8B0000', '#fff'], ['#a84848', '#fff'], ['#c47c5a', '#fff'],
    ['#7a6040', '#fff'], ['#4a7a5c', '#fff'], ['#3d5fa8', '#fff'],
    ['#7a3d8a', '#fff'], ['#b5635a', '#fff'],
];

// ── State ──────────────────────────────────────────────────────────────────
let allWishes = [];
let visibleCount = PAGE_SIZE;
let sortMode = 'hot'; // 'hot' | 'new'
let colorMap = {};    // id -> colorIndex

// ── Entry ──────────────────────────────────────────────────────────────────
export function initWishesModule() {
    getVisitorId();
    const container = document.getElementById('wishes-container');
    if (!container) return;
    container.innerHTML = buildShell();
    bindShellEvents();
    fetchWishes();
}

// ── HTML Shell ─────────────────────────────────────────────────────────────
function buildShell() {
    return `
    <div class="ws-root">

        <!-- Tổng lời chúc -->
        <div class="ws-total-row reveal-fade">
            <span class="ws-total-pill" id="ws-total-pill" title="Bấm để xem danh sách lời chúc">
                <i class="fas fa-heart"></i>
                <span id="ws-total-num">…</span> lời chúc đã được gửi
            </span>
        </div>

        <!-- Form Card -->
        <div class="ws-form-card reveal-fade">
            <div class="ws-form-inner">

                <!-- Cột trái – minh họa -->
                <div class="ws-form-deco">
                    <div class="ws-envelope-wrap">
                        <div class="ws-envelope-icon">
                            <i class="fas fa-envelope-open-text"></i>
                        </div>
                        <div class="ws-deco-petals">
                            <span class="ws-petal p1">🌸</span>
                            <span class="ws-petal p2">🌸</span>
                            <span class="ws-petal p3">✨</span>
                            <span class="ws-petal p4">💕</span>
                        </div>
                    </div>
                    <p class="ws-deco-quote">"Những lời chúc của mọi người là món quà tuyệt vời nhất dành cho chúng mình"</p>
                    <span class="ws-deco-gold">❤</span>
                </div>

                <!-- Cột phải – form -->
                <div class="ws-form-body">
                    <div class="ws-form-header">
                        <i class="fas fa-paper-plane ws-form-icon"></i>
                        <h3 class="ws-form-title">Gửi lời chúc</h3>
                        <p class="ws-form-sub">Hãy gửi những lời chúc ngọt ngào nhất tới<br><strong>Phước Đức &amp; Thu Sương</strong></p>
                    </div>

                    <form id="ws-form" novalidate>
                        <!-- Honeypot field để chống bot (ẩn hoàn toàn, bot điền sẽ bị chặn) -->
                        <div class="ws-hp-field">
                            <label for="ws-website">Website</label>
                            <input type="text" id="ws-website" name="website" tabindex="-1" autocomplete="off">
                        </div>

                        <div class="ws-field-group">
                            <label class="ws-label" for="ws-name">
                                <i class="fas fa-user"></i> Họ và tên <span class="ws-req">*</span>
                            </label>
                            <input id="ws-name" class="ws-input" type="text"
                                placeholder="Nhập tên hoặc nickname của mình nhé" maxlength="60" required autocomplete="name">
                        </div>

                        <div class="ws-field-group">
                            <label class="ws-label" for="ws-content">
                                <i class="fas fa-heart"></i> Lời chúc <span class="ws-req">*</span>
                            </label>
                            <div class="ws-textarea-wrap">
                                <textarea id="ws-content" class="ws-textarea" rows="4"
                                    placeholder="Viết lời chúc ý nghĩa tại đây..."
                                    maxlength="500" required></textarea>
                                <span class="ws-char-count"><span id="ws-char-num">0</span>/500</span>
                            </div>
                        </div>

                        <button id="ws-submit" type="submit" class="ws-btn-submit">
                            <i class="fas fa-heart"></i> Gửi lời chúc
                        </button>


                    </form>
                </div>
            </div>
        </div>

        <!-- Divider -->
        <div class="ws-divider reveal-fade">
            <span class="ws-divider-leaf">✿</span>
            <span class="ws-divider-heart"><i class="fas fa-heart"></i></span>
            <span class="ws-divider-leaf">✿</span>
        </div>

        <!-- List header -->
        <div class="ws-list-header reveal-fade">
            <div class="ws-list-title-group">
                <i class="fas fa-heart ws-list-icon"></i>
                <h3 class="ws-list-title">Những lời chúc</h3>
                <i class="fas fa-heart ws-list-icon"></i>
            </div>
            <p class="ws-list-sub">Cảm ơn mọi người đã gửi những lời chúc ý nghĩa!</p>

            <div class="ws-sort-bar">
                <span class="ws-sort-label">Sắp xếp:</span>
                <button id="ws-sort-hot" class="ws-sort-btn active" data-sort="hot">
                    <i class="fas fa-star"></i> Nổi bật
                </button>
                <button id="ws-sort-new" class="ws-sort-btn" data-sort="new">
                    <i class="fas fa-clock"></i> Mới nhất
                </button>
            </div>
        </div>

        <!-- Cards list -->
        <div id="ws-cards" class="ws-cards">
            <div class="ws-loading"><i class="fas fa-spinner fa-spin"></i> Đang tải lời chúc...</div>
        </div>

        <!-- Load more -->
        <div class="ws-more-row">
            <button id="ws-load-more" class="ws-load-more" style="display:none">
                <i class="fas fa-chevron-down"></i> Xem thêm <span id="ws-remaining"></span>
            </button>
        </div>

    </div>

    <!-- Toast -->
    <div id="ws-toast" class="ws-toast" role="alert" aria-live="polite"></div>
    `;
}

// ── Events ──────────────────────────────────────────────────────────────────
function bindShellEvents() {
    // Form submit
    document.getElementById('ws-form')?.addEventListener('submit', handleSubmit);

    // Scroll down when clicking total wishes pill
    document.getElementById('ws-total-pill')?.addEventListener('click', () => {
        const header = document.querySelector('.ws-list-header');
        if (header) {
            header.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Char count
    const ta = document.getElementById('ws-content');
    ta?.addEventListener('input', () => {
        document.getElementById('ws-char-num').textContent = ta.value.length;
    });

    // Sort buttons
    document.querySelectorAll('.ws-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ws-sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sortMode = btn.dataset.sort;
            visibleCount = PAGE_SIZE;
            renderList();
        });
    });

    // Load more
    document.getElementById('ws-load-more')?.addEventListener('click', () => {
        visibleCount += PAGE_SIZE;
        renderList();
    });
}

// ── Fetch ───────────────────────────────────────────────────────────────────
async function fetchWishes() {
    const apiUrl = weddingConfig.wishesApiUrl;
    if (apiUrl && apiUrl.trim()) {
        try {
            const res = await fetch(apiUrl + '?action=getWishes');
            if (res.ok) {
                const json = await res.json();
                if (json?.wishes) {
                    allWishes = json.wishes.filter(w => w.status === 'approved');
                    cacheWishes();
                    renderList();
                    return;
                }
            }
        } catch (e) {
            console.warn('[wishes] API error, falling back to cache:', e.message);
        }
    }
    // Fallback: localStorage → mock
    const cached = tryParseCached();
    allWishes = cached || MOCK_WISHES;
    renderList();
}

// ── Render List ──────────────────────────────────────────────────────────────
function renderList() {
    const cardsEl = document.getElementById('ws-cards');
    const moreBtn = document.getElementById('ws-load-more');
    const totalEl = document.getElementById('ws-total-num');
    const remEl = document.getElementById('ws-remaining');
    if (!cardsEl) return;

    const sorted = sortWishes([...allWishes]);
    if (totalEl) totalEl.textContent = sorted.length;

    if (!sorted.length) {
        cardsEl.innerHTML = `<div class="ws-empty">
            <i class="far fa-comments"></i>
            <p>Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc nhé!</p>
        </div>`;
        if (moreBtn) moreBtn.style.display = 'none';
        return;
    }

    const slice = sorted.slice(0, visibleCount);
    cardsEl.innerHTML = slice.map((w, idx) => buildCard(w, idx)).join('');

    // Bind like buttons
    cardsEl.querySelectorAll('.ws-like-btn').forEach(btn => {
        btn.addEventListener('click', () => handleLike(btn.dataset.id, btn));
    });

    // Load more
    const remaining = sorted.length - visibleCount;
    if (moreBtn) {
        moreBtn.style.display = remaining > 0 ? 'inline-flex' : 'none';
        if (remEl) remEl.textContent = remaining > 0 ? `(${remaining})` : '';
    }
}

// ── Build Card ───────────────────────────────────────────────────────────────
function buildCard(w, idx) {
    const initials = getInitials(w.name);
    const [bg, fg] = getAvatarColor(w.id, idx);
    const timeStr = fmtTime(w.createdTime);
    const pinBadge = w.isPinned
        ? `<div class="ws-pin-badge"><i class="fas fa-thumbtack"></i> ĐƯỢC GHIM</div>`
        : '';
    const label = w.label
        ? `<span class="ws-author-label">${escHtml(w.label)}</span>`
        : '';

    return `
    <div class="ws-card ${w.isPinned ? 'is-pinned' : ''}" data-id="${w.id}">
        ${pinBadge}
        <div class="ws-card-left">
            <div class="ws-avatar" style="background:${bg};color:${fg}">${initials}</div>
        </div>
        <div class="ws-card-mid">
            <div class="ws-card-top-row">
                <span class="ws-author-name">${escHtml(w.name)}</span>
                ${label}
            </div>
            <p class="ws-card-content">${escHtml(w.content)}</p>
            <span class="ws-card-time"><i class="far fa-clock"></i> ${timeStr}</span>
        </div>
        <div class="ws-card-right">
            <span class="ws-like-count">
                <i class="fas fa-heart ws-heart-icon"></i>
                <span id="lc-${w.id}">${w.likes || 0}</span>
            </span>
            <button class="ws-like-btn" data-id="${w.id}" aria-label="Thả tim lời chúc">
                Thả tim
            </button>
        </div>
    </div>`;
}

// ── Sort ─────────────────────────────────────────────────────────────────────
function sortWishes(list) {
    const pinned = list.filter(w => w.isPinned);
    const normal = list.filter(w => !w.isPinned);

    const cmp = sortMode === 'hot'
        ? (a, b) => (b.likes || 0) - (a.likes || 0) || timeMs(b) - timeMs(a)
        : (a, b) => timeMs(b) - timeMs(a) || (b.likes || 0) - (a.likes || 0);

    return [...pinned.sort(cmp), ...normal.sort(cmp)];
}

// ── Like (throttled 1s per wish per user, unlimited animation) ───────────────
const lastLikeTimeMap = {}; // wishId -> timestamp

async function handleLike(wishId, btnEl) {
    const wish = allWishes.find(w => w.id === wishId);
    if (!wish) return;

    // 1. Luôn chạy hiệu ứng thị giác cho từng cú click
    btnEl.classList.remove('ws-like-burst');
    void btnEl.offsetWidth; // Force reflow
    btnEl.classList.add('ws-like-burst');
    setTimeout(() => btnEl.classList.remove('ws-like-burst'), 500);

    // Mini floating heart luôn nảy lên
    spawnMiniHeart(btnEl);

    // 2. Kiểm tra Throttle: Tối đa 1 tim / 1 giây trên mỗi lời chúc cho user này
    const now = Date.now();
    const lastLikeTime = lastLikeTimeMap[wishId] || 0;
    if (now - lastLikeTime < 1000) {
        // Chưa đủ 1 giây trôi qua -> chỉ chạy hiệu ứng, không cộng số tim & không gửi API
        return;
    }
    lastLikeTimeMap[wishId] = now;

    // 3. Tăng số tim hiển thị +1
    wish.likes = (wish.likes || 0) + 1;

    // Cập nhật số tim hiển thị DOM
    const lcEl = document.getElementById('lc-' + wishId);
    if (lcEl) {
        lcEl.textContent = wish.likes;
        lcEl.classList.remove('ws-count-bump');
        void lcEl.offsetWidth; // Force reflow
        lcEl.classList.add('ws-count-bump');
        setTimeout(() => lcEl.classList.remove('ws-count-bump'), 350);
    }

    // 4. Gửi về API Google Sheet
    const apiUrl = weddingConfig.wishesApiUrl;
    if (apiUrl?.trim()) {
        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'likeWish', id: wishId })
        }).catch(() => { });
    }
}

// ── Submit ───────────────────────────────────────────────────────────────────
async function handleSubmit(e) {
    e.preventDefault();
    const nameEl = document.getElementById('ws-name');
    const contentEl = document.getElementById('ws-content');
    const submitBtn = document.getElementById('ws-submit');

    const name = nameEl?.value.trim() || '';
    const content = contentEl?.value.trim() || '';

    if (!name) {
        showToast('⚠️ Vui lòng nhập tên hoặc nickname của bạn!', 'warn');
        nameEl?.focus();
        return;
    }

    if (name.length < 2) {
        showToast('⚠️ Tên hoặc nickname phải có tối thiểu 2 ký tự!', 'warn');
        nameEl?.focus();
        return;
    }

    if (!content) {
        showToast('⚠️ Vui lòng nhập lời chúc!', 'warn');
        contentEl?.focus();
        return;
    }

    if (content.length < 10) {
        showToast('⚠️ Lời chúc phải từ 10 đến 500 ký tự!', 'warn');
        contentEl?.focus();
        return;
    }

    if (content.length > 500) {
        showToast('⚠️ Lời chúc không được vượt quá 500 ký tự!', 'warn');
        contentEl?.focus();
        return;
    }

    // Rate limit check: 10 seconds
    const visitorId = getVisitorId();
    const lastTimeKey = 'wedding_last_wish_time';
    const lastSentTime = parseInt(localStorage.getItem(lastTimeKey) || '0', 10);
    const now = Date.now();
    const diffSec = Math.ceil((10000 - (now - lastSentTime)) / 1000);

    if (diffSec > 0) {
        showToast(`⚠️ Bạn thao tác quá nhanh, vui lòng chờ ${diffSec} giây nữa trước khi gửi tiếp!`, 'warn');
        return;
    }

    // Honeypot check - bot sẽ điền field ẩn website
    const websiteEl = document.getElementById('ws-website');
    if (websiteEl && websiteEl.value.trim()) {
        // Bot detected - silently reject but show success to fool the bot
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-heart"></i> Gửi lời chúc`;
        showToast(`💕 Cảm ơn ${escHtml(name)}! Lời chúc đã được gửi thành công.`, 'success');
        triggerHeartBurst();
        if (nameEl) nameEl.value = '';
        if (contentEl) { contentEl.value = ''; document.getElementById('ws-char-num').textContent = '0'; }
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang gửi...`;

    const apiUrl = weddingConfig.wishesApiUrl;
    if (apiUrl?.trim()) {
        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'sendWish', name, content, visitorId })
            });
            const json = await res.json().catch(() => null);
            if (json && json.success === false && json.error === 'rate_limit') {
                showToast(`⚠️ Vui lòng chờ vài giây trước khi gửi lời chúc tiếp theo!`, 'warn');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fas fa-heart"></i> Gửi lời chúc`;
                return;
            }
        } catch (err) {
            console.warn('[wishes] send error:', err.message);
        }
    }

    // Save last sent time
    try { localStorage.setItem(lastTimeKey, Date.now().toString()); } catch (e) { }

    // Reset form
    if (nameEl) nameEl.value = '';
    if (contentEl) { contentEl.value = ''; document.getElementById('ws-char-num').textContent = '0'; }
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fas fa-heart"></i> Gửi lời chúc`;

    showToast(`💕 Cảm ơn ${escHtml(name)}! Lời chúc đã được gửi thành công và sẽ được hiển thị sớm.`, 'success');
    triggerHeartBurst();
}

// ── Effects ──────────────────────────────────────────────────────────────────
function triggerHeartBurst() {
    const wrap = document.createElement('div');
    wrap.className = 'ws-burst-wrap';
    document.body.appendChild(wrap);

    const syms = ['❤️', '💖', '🌸', '✨', '💕', '🌺', '💐'];
    for (let i = 0; i < 35; i++) {
        const s = document.createElement('span');
        s.className = 'ws-burst-p';
        s.innerText = syms[i % syms.length];
        s.style.cssText = `
            left:${Math.random() * 100}vw;
            font-size:${(Math.random() * 1.2 + 0.8).toFixed(2)}rem;
            animation-duration:${(Math.random() * 1.5 + 1.2).toFixed(2)}s;
            animation-delay:${(Math.random() * 0.5).toFixed(2)}s;
        `;
        wrap.appendChild(s);
    }
    setTimeout(() => wrap.remove(), 3500);
}

function spawnMiniHeart(el) {
    const r = el.getBoundingClientRect();
    const h = document.createElement('span');
    h.className = 'ws-mini-heart';
    h.innerText = '❤️';
    h.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top - 8}px`;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 900);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    let t = document.getElementById('ws-toast');
    if (!t) return;
    t.className = 'ws-toast show ' + type;
    t.innerHTML = msg;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = 'ws-toast'; }, 5000);
}

// ── LocalStorage ──────────────────────────────────────────────────────────────
function cacheWishes() {
    try { localStorage.setItem(LS_WISHES, JSON.stringify(allWishes)); } catch (e) { }
}
function tryParseCached() {
    try { return JSON.parse(localStorage.getItem(LS_WISHES)); } catch (e) { return null; }
}
function mergeLocalLikes() {
    const cached = tryParseCached();
    if (!cached) return;
    allWishes.forEach(w => {
        const c = cached.find(c => c.id === w.id);
        if (c && c.likes > w.likes) w.likes = c.likes;
    });
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function getInitials(name) {
    const parts = (name || '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(id, idx) {
    if (!colorMap[id]) colorMap[id] = idx % AVATAR_COLORS.length;
    return AVATAR_COLORS[colorMap[id]];
}

function timeMs(w) { return w.createdTime ? new Date(w.createdTime).getTime() : 0; }

function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} • ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function escHtml(s) {
    return (s || '').replace(/[&<>"']/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function getVisitorId() {
    let vid = localStorage.getItem('wedding_visitor_id');
    if (!vid) {
        vid = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'v-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        try { localStorage.setItem('wedding_visitor_id', vid); } catch (e) { }
    }
    return vid;
}
