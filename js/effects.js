/**
 * EFFECTS.JS - ES6 MODULE
 * Hiệu ứng Floating Hearts, Falling Leaves trên Canvas (60 FPS requestAnimationFrame)
 */

export function initCanvasEffects(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animFrameId = null;
    let isRunning = false;

    // Debounced resize handler — tránh resize liên tục gây reflow
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }, 150);
    }, { passive: true });

    const particles = [];
    const particleCount = 30;

    class FloatingParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.size = Math.random() * 8 + 5;
            this.speedY = Math.random() * 1.0 + 0.5;
            this.speedX = Math.random() * 0.6 - 0.3;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 1.5 - 0.75;
            this.opacity = Math.random() * 0.5 + 0.4;
            // 2 loại: Trái tim / Cánh hoa màu Đỏ Crimson (#B22222, #8B0000) hoặc Gold (#D4AF37)
            this.type = Math.random() > 0.5 ? "heart" : "leaf";
            this.color = this.type === "heart" ? (Math.random() > 0.5 ? "#D87093" : "#D4AF37") : (Math.random() > 0.5 ? "#B22222" : "#8B0000");
        }

        update() {
            this.y += this.speedY;
            this.x += Math.sin(this.y * 0.008) + this.speedX;
            this.rotation += this.rotationSpeed;

            if (this.y > height + 20) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;

            if (this.type === "heart") {
                ctx.beginPath();
                ctx.arc(-this.size / 4, 0, this.size / 4, 0, Math.PI, true);
                ctx.arc(this.size / 4, 0, this.size / 4, 0, Math.PI, true);
                ctx.lineTo(0, this.size / 2);
                ctx.closePath();
                ctx.fill();
            } else {
                // Leaf shape
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size / 3, this.size, 0, 0, 2 * Math.PI);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new FloatingParticle());
    }

    function renderLoop() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p) => {
            p.update();
            p.draw();
        });
        animFrameId = requestAnimationFrame(renderLoop);
    }

    function startLoop() {
        if (!isRunning) {
            isRunning = true;
            animFrameId = requestAnimationFrame(renderLoop);
        }
    }

    function stopLoop() {
        if (isRunning && animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
            isRunning = false;
        }
    }

    // Tạm dừng khi tab ẩn, tiếp tục khi tab hiển thị → tiết kiệm CPU đáng kể
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopLoop();
        } else {
            startLoop();
        }
    });

    startLoop();
}

// Parallax đã tắt — overlay cố định, không dịch chuyển khi cuộn
export function initParallax() {
    // disabled
}
