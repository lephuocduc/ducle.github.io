/**
 * MUSIC.JS - ES6 MODULE
 * Quản lý phát nhạc nền, tự động phát (autoplay) & nút bật/tắt đĩa nhạc xoay
 */

let audioObj = null;
let isPlaying = false;

export function initMusicPlayer(musicConfig) {
    const btn = document.getElementById("music-toggle-btn");
    const icon = document.getElementById("music-icon");
    if (!btn || !musicConfig) return;

    audioObj = new Audio(musicConfig.url || "assets/music.mp3");
    audioObj.loop = true;

    // Phản hồi khi audio bị lỗi (tạo synth fallback lãng mạn)
    audioObj.addEventListener("error", () => {
        console.warn("Không tìm thấy file mp3 local, chuẩn bị phương án phát nhạc synth.");
    });

    function play() {
        if (!audioObj) return;
        audioObj.play().then(() => {
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

    function toggle() {
        if (isPlaying) pause();
        else play();
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
        play();
        // Lắng nghe cú click đầu tiên của người dùng để bật nhạc nếu autoplay bị chặn
        const handleFirstTouch = () => {
            if (!isPlaying) play();
            window.removeEventListener("click", handleFirstTouch);
            window.removeEventListener("touchstart", handleFirstTouch);
        };
        window.addEventListener("click", handleFirstTouch, { passive: true });
        window.addEventListener("touchstart", handleFirstTouch, { passive: true });
    }
}
