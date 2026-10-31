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

async function listAllBucketFiles(bucket, prefix, extensions) {
  const files = [];
  let truncated = true;
  let cursor = undefined;

  while (truncated) {
    const res = await bucket.list({
      prefix: prefix,
      cursor: cursor,
      limit: 1000
    });

    const matched = (res.objects || [])
      .map(obj => obj.key.slice(prefix.length))
      .filter(filename => {
        if (!filename || filename.includes("/")) return false;
        const lower = filename.toLowerCase();
        return extensions.some(ext => lower.endsWith(ext));
      });

    files.push(...matched);
    truncated = Boolean(res.truncated);
    cursor = res.cursor;
    if (files.length >= 5000) break;
  }

  return files;
}

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

        // 1. Quét thư mục ảnh nhỏ: ưu tiên {album}/thumb/, nếu không có thì thử {album}/thumbs/
        let detectedThumbDir = "thumb";
        let thumbFiles = await listAllBucketFiles(env.MY_BUCKET, `${album}/thumb/`, imageExtensions);
        if (thumbFiles.length === 0) {
          thumbFiles = await listAllBucketFiles(env.MY_BUCKET, `${album}/thumbs/`, imageExtensions);
          if (thumbFiles.length > 0) {
            detectedThumbDir = "thumbs";
          }
        }

        // 2. Quét thư mục ảnh lớn: {album}/full/
        const fullFiles = await listAllBucketFiles(env.MY_BUCKET, `${album}/full/`, imageExtensions);

        let files = [];
        let hasThumbs = false;

        // 3. NGUYÊN TẮC: Nếu thiếu 1 trong 2 ảnh ở thumb/ hoặc full/ thì BỎ QUA ảnh đó
        if (thumbFiles.length > 0 && fullFiles.length > 0) {
          // Tạo Map không phân biệt hoa thường để đối chiếu
          const fullMap = new Map();
          fullFiles.forEach(file => fullMap.set(file.toLowerCase(), file));

          // Chỉ giữ lại các ảnh có MẶT Ở CẢ 2 THƯ MỤC
          files = thumbFiles.filter(thumbFile => fullMap.has(thumbFile.toLowerCase()));
          hasThumbs = true;
        } else if (thumbFiles.length === 0 && fullFiles.length === 0) {
          // Fallback trường hợp album cũ lưu trực tiếp ở thư mục gốc album
          files = await listAllBucketFiles(env.MY_BUCKET, `${album}/`, imageExtensions);
          hasThumbs = false;
        } else {
          // Thiếu hẳn 1 trong 2 folder -> Không đủ cả 2 ảnh nên bỏ qua toàn bộ
          files = [];
          hasThumbs = false;
        }

        // Sắp xếp thứ tự tự nhiên (ví dụ 1, 2, ..., 10, 11)
        files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

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

      // Nếu có query download, ép trình duyệt lưu trực tiếp file về máy dạng binary để không bao giờ mở tab mới
      if (url.searchParams.has("download")) {
        const dlName = url.searchParams.get("download") || key.split("/").pop() || "wedding-photo.jpg";
        headers.set("Content-Disposition", `attachment; filename="${dlName}"`);
        headers.set("Content-Type", "application/octet-stream");
      }

      return new Response(object.body, { headers });
    } catch (err) {
      return new Response("Error fetching object: " + err.message, { status: 500, headers: corsHeaders });
    }
  }
};
