/**
 * CONFIG-LOADER.JS - ES6 MODULE
 * Đọc dữ liệu từ data/config.js và tự động nạp thông tin SEO Meta
 */

import { weddingConfig } from '../data/config.js?v=20261102-06';

export function loadConfig() {
    if (!weddingConfig) {
        console.error("Không thể đọc weddingConfig từ data/config.js");
        return null;
    }

    // Cập nhật SEO Title & Meta tags
    if (weddingConfig.seo) {
        document.title = weddingConfig.seo.title || "Duc & Suong’s Wedding";

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            if (weddingConfig.seo.description) {
                metaDesc.setAttribute('content', weddingConfig.seo.description);
            } else {
                metaDesc.remove();
            }
        }

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', weddingConfig.seo.title || '');

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) {
            if (weddingConfig.seo.description) {
                ogDesc.setAttribute('content', weddingConfig.seo.description);
            } else {
                ogDesc.remove();
            }
        }

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && weddingConfig.seo.ogImage) {
            const fullOgUrl = weddingConfig.seo.ogImage.startsWith('http') 
                ? weddingConfig.seo.ogImage 
                : `${window.location.origin}/${weddingConfig.seo.ogImage.replace(/^\//, '')}`;
            ogImage.setAttribute('content', fullOgUrl);
            const ogSec = document.querySelector('meta[property="og:image:secure_url"]');
            if (ogSec) ogSec.setAttribute('content', fullOgUrl);
            const twImg = document.querySelector('meta[name="twitter:image"]');
            if (twImg) twImg.setAttribute('content', fullOgUrl);
        }

        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon && weddingConfig.seo.favicon) favicon.setAttribute('href', weddingConfig.seo.favicon);
    }

    return weddingConfig;
}
