/**
 * ANIMATION.JS - ES6 MODULE
 * Sử dụng IntersectionObserver để kích hoạt 60 FPS Scroll Reveal Animations
 */

export function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        ".reveal-fade, .reveal-slide-up, .reveal-slide-left, .reveal-slide-right, .reveal-zoom"
    );

    if (!("IntersectionObserver" in window)) {
        // Fallback hiển thị mượt nếu trình duyệt rất cũ
        animatedElements.forEach(el => el.classList.add("active"));
        return;
    }

    const observerOptions = {
        root: null,
        rootMargin: "0px 0px -50px 0px",
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                // Ngừng observer sau khi xuất hiện để tiết kiệm RAM/CPU
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
}
