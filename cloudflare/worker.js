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
      const prefix = `${album}/thumbs/`;

      try {
        if (!env.MY_BUCKET) {
          return new Response(JSON.stringify({ 
            error: "Chưa cấu hình R2 Bucket Binding với tên biến 'MY_BUCKET' trong Settings của Worker." 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Tự động quét toàn bộ ảnh trong thư mục thumbs/ của album trên R2
        const listed = await env.MY_BUCKET.list({
          prefix: prefix,
          limit: 1000
        });

        // Lọc lấy tên file ảnh hợp lệ (.webp, .jpg, .jpeg, .png)
        const imageExtensions = [".webp", ".jpg", ".jpeg", ".png", ".gif"];
        const files = listed.objects
          .map(obj => obj.key.replace(prefix, ""))
          .filter(filename => {
            if (!filename || filename.includes("/")) return false;
            const lower = filename.toLowerCase();
            return imageExtensions.some(ext => lower.endsWith(ext));
          });

        return new Response(JSON.stringify({
          success: true,
          album: album,
          count: files.length,
          images: files
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=60, s-maxage=60"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 2. TỰ ĐỘNG TẢI FILE TỪ R2 NẾU TRUY CẬP TRỰC TIẾP (VD: /cover.webp hoặc /01-pre-wedding/thumbs/...)
    const key = url.pathname.slice(1);
    if (!key) {
      return new Response("Cloudflare R2 Media Service - Phước Đức & Thu Sương Wedding", { 
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } 
      });
    }

    try {
      if (!env.MY_BUCKET) {
        return new Response("R2 Bucket not bound", { status: 500, headers: corsHeaders });
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

      return new Response(object.body, { headers });
    } catch (err) {
      return new Response("Error fetching object: " + err.message, { status: 500, headers: corsHeaders });
    }
  }
};
