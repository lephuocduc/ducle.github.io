/**
 * MUSIC.JS - ES6 MODULE
 * Quản lý phát nhạc nền, tự động phát (autoplay) & tạm dừng khi rời trang / chuyển tab
 */

let audioObj = null;
let isPlaying = false;
let wasPlayingBeforeHide = false;
let hasInteracted = false; // Track if user has interacted with the player

export function initMusicPlayer(musicConfig, weddingDateIso) {
    const btn = document.getElementById("music-toggle-btn");
    const icon = document.getElementById("music-icon");
    if (!btn || !musicConfig) return;

    // Kiểm tra nếu hôm nay là ngày cưới hoặc SAU ngày cưới
    const vietnamDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const todayStr = vietnamDate.format(new Date());
    const weddingDayStr = weddingDateIso ? vietnamDate.format(new Date(weddingDateIso)) : null;
    
    // Chỉ phát nhạc đặc biệt vào ĐÚNG ngày cưới
    // Sau ngày cưới (từ 26/10 trở đi) sẽ phát nhạc thường
    const isWeddingDay = weddingDayStr && todayStr === weddingDayStr;

    const musicUrl = isWeddingDay
        ? (musicConfig.specialUrl || "assets/audio/Tonight I celebrate my love.mp3")
        : (musicConfig.url || "assets/audio/Canon in D (Pachelbel's Canon) - Cello & Piano [BEST WEDDING VERSION].mp3");

    // Preload audio file when page loads (just download, don't play)
    function preloadAudio() {
        if (audioObj) return audioObj;
        audioObj = new Audio(musicUrl);
        audioObj.loop = false;
        audioObj.preload = "auto"; // Hint to browser to preload
        audioObj.addEventListener("error", (e) => {
            console.warn("[music] Audio error:", e?.message || "cannot load audio", "- Continuing without audio");
        });
        // Listen for ended event to update UI
        audioObj.addEventListener("ended", () => {
            isPlaying = false;
            updateUI(false);
        });
        return audioObj;
    }

    // Preload immediately when module loads
    preloadAudio();

    function ensureAudio() {
        if (audioObj) return audioObj;
        return preloadAudio();
    }

    function play() {
        const audio = ensureAudio();
        audio.play().then(() => {
            isPlaying = true;
            updateUI(true);
        }).catch(() => {
            // Autoplay bị trình duyệt chặn -> chờ người dùng click tương tác trang
            console.log("Trình duyệt chặn autoplay, chờ người dùng tương tác.");
            isPlaying = false;
            updateUI(false);
        });
    }

    function pause() {
        if (audioObj) audioObj.pause();
        isPlaying = false;
        updateUI(false);
    }

    function toggle(e) {
        // Stop propagation to prevent double-play when clicking button
        if (e) e.stopPropagation();
        hasInteracted = true;
        
        if (isPlaying) {
            wasPlayingBeforeHide = false;
            pause();
        } else {
            play();
        }
    }

    function updateUI(playing) {
        if (playing) {
            btn.classList.add("playing");
            if (icon) icon.className = "fas fa-music";
        } else {
            btn.classList.remove("playing");
            if (icon) icon.className = "fas fa-volume-xmark";
        }
    }

    btn.addEventListener("click", toggle);

    // Tự động phát lần đầu tiên nếu cấu hình bật và trình duyệt cho phép
    if (musicConfig.autoplay) {
        const handleFirstTouch = () => {
            // Only play if user hasn't already interacted with the button
            if (!hasInteracted && !isPlaying) {
                play();
            }
            window.removeEventListener("click", handleFirstTouch);
            window.removeEventListener("touchstart", handleFirstTouch);
        };
        window.addEventListener("click", handleFirstTouch, { passive: true });
        window.addEventListener("touchstart", handleFirstTouch, { passive: true });
    }

    // Nhạc chỉ phát khi tab/trang web đang mở và hiển thị (Active). Khi ẩn/rời đi -> Tạm dừng!
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (isPlaying) {
                wasPlayingBeforeHide = true;
                pause();
            }
        } else {
            if (wasPlayingBeforeHide) {
                play();
            }
        }
    });

    window.addEventListener("pagehide", () => {
        if (isPlaying) {
            wasPlayingBeforeHide = true;
            pause();
        }
    });

    window.addEventListener("pageshow", () => {
        if (wasPlayingBeforeHide && !document.hidden) {
            play();
        }
    });
}
