/**
 * CLOUDFLARE WORKER: R2 PHOTOS AUTO-SYNC API
 * 
 * Hướng dẫn cài đặt trong 1 phút trên Cloudflare:
 * 1. Vào Cloudflare Dashboard -> Workers & Pages -> Create Application -> Create Worker -> Deploy.
 * 2. Bấm "Edit Code" -> Xóa hết code cũ và dán toàn bộ file này vào -> Bấm "Deploy".
 * 3. Vào Settings -> Variables and Secrets -> R2 Bucket Bindings:
 *    - Variable name: MY_BUCKET
 *    - R2 Bucket: (chọn bucket chứa ảnh cưới của bạn)
 * 4. Vào Settings -> Domains & Routes -> Add Custom Domain:
 *    - Nhập: media.phuocducthusuong.com
 *    (Hoặc dùng domain *.workers.dev mặc định và dán vào apiUrl trong config.js)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Headers CORS cho phép trang web gọi API an toàn
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. API ĐỒNG BỘ ẢNH TỰ ĐỘNG: /api/photos?album=01-pre-wedding
    if (url.pathname === "/api/photos" || url.pathname === "/api/photos/") {
      const album = url.searchParams.get("album") || "01-pre-wedding";

      try {
        if (!env.MY_BUCKET) {
          return new Response(JSON.stringify({ 
            error: "Chưa cấu hình R2 Bucket Binding với tên biến 'MY_BUCKET' trong Settings của Worker." 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const imageExtensions = [".webp", ".jpg", ".jpeg", ".png", ".gif", ".heic"];

        // Danh sách thư mục ưu tiên quét ảnh:
        // 1. {album}/thumb/ (Chuẩn mới: ảnh nhỏ)
        // 2. {album}/thumbs/ (Tương thích ngược)
        // 3. {album}/full/ (Nếu chưa có thumb)
        // 4. {album}/ (Gốc của album)
        const candidates = [
          { dir: `${album}/thumb/`, name: "thumb", isThumb: true },
          { dir: `${album}/thumbs/`, name: "thumbs", isThumb: true },
          { dir: `${album}/full/`, name: "full", isThumb: false },
          { dir: `${album}/`, name: "", isThumb: false }
        ];

        let files = [];
        let detectedThumbDir = "thumb";
        let hasThumbs = false;

        for (const candidate of candidates) {
          const listed = await env.MY_BUCKET.list({
            prefix: candidate.dir,
            limit: 1000
          });

          const matched = (listed.objects || [])
            .map(obj => obj.key.slice(candidate.dir.length))
            .filter(filename => {
              if (!filename || filename.includes("/")) return false;
              const lower = filename.toLowerCase();
              return imageExtensions.some(ext => lower.endsWith(ext));
            });

          if (matched.length > 0) {
            files = matched;
            detectedThumbDir = candidate.isThumb ? candidate.name : "thumb";
            hasThumbs = candidate.isThumb;
            break;
          }
        }

        return new Response(JSON.stringify({
          success: true,
          album: album,
          hasThumbs: hasThumbs,
          thumbDir: detectedThumbDir,
          fullDir: "full",
          count: files.length,
          images: files
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=30, s-maxage=30"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 2. PHỤC VỤ GIAO DIỆN WEB TĨNH (HTML, CSS, JS, Fonts, v.v.) TỰ ĐỘNG
    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status !== 404) {
        return assetRes;
      }
    }

    // 3. TỰ ĐỘNG TẢI FILE TỪ R2 NẾU TRUY CẬP TRỰC TIẾP (VD: /cover.webp hoặc /01-pre-wedding/thumb/...)
    const key = decodeURIComponent(url.pathname.slice(1));
    if (!key) {
      return new Response("Cloudflare R2 Media Service - Phước Đức & Thu Sương Wedding", { 
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } 
      });
    }

    try {
      if (!env.MY_BUCKET) {
        return new Response("File not found", { status: 404, headers: corsHeaders });
      }

      const object = await env.MY_BUCKET.get(key);
      if (!object) {
        return new Response("File not found on R2: " + key, { status: 404, headers: corsHeaders });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      // Đảm bảo Content-Type chuẩn cho file ảnh
      const lowerKey = key.toLowerCase();
      if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) {
        headers.set("Content-Type", "image/jpeg");
      } else if (lowerKey.endsWith(".webp")) {
        headers.set("Content-Type", "image/webp");
      } else if (lowerKey.endsWith(".png")) {
        headers.set("Content-Type", "image/png");
      }

      return new Response(object.body, { headers });
    } catch (err) {
      return new Response("Error fetching object: " + err.message, { status: 500, headers: corsHeaders });
    }
  }
};
