/**
 * CONFIG-LOADER.JS - ES6 MODULE
 * Đọc dữ liệu từ data/config.js và tự động nạp thông tin SEO Meta
 */

import { weddingConfig } from '../data/config.js?v=20260729-2';

export function loadConfig() {
    if (!weddingConfig) {
        console.error("Không thể đọc weddingConfig từ data/config.js");
        return null;
    }

    // Cập nhật SEO Title & Meta tags
    if (weddingConfig.seo) {
        document.title = weddingConfig.seo.title || "Thiệp Mời Cưới";

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', weddingConfig.seo.description || '');

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', weddingConfig.seo.title || '');

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', weddingConfig.seo.description || '');

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute('content', weddingConfig.seo.ogImage || '');

        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) twitterImage.setAttribute('content', weddingConfig.seo.ogImage || '');

        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon && weddingConfig.seo.favicon) favicon.setAttribute('href', weddingConfig.seo.favicon);
    }

    return weddingConfig;
}
