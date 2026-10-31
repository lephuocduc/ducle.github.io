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
      "Access-Control-Allow-Methods": "GET, HEAD, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token, *",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
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

    // 2. API XÁC THỰC MÃ PIN QUẢN TRỊ VIÊN: /api/admin/verify
    if (url.pathname === "/api/admin/verify" || url.pathname === "/api/admin/verify/") {
      const authHeader = request.headers.get("Authorization") || request.headers.get("X-Admin-Token") || url.searchParams.get("pin") || url.searchParams.get("token") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      const expectedPin = String(env.ADMIN_PIN || env.admin_pin || env.ADMINPIN || env.ADMIN_SECRET || env.admin_secret || env.ADMIN_KEY || "").trim();

      if (!expectedPin) {
        const availableKeys = Object.keys(env || {}).filter(k => k !== "MY_BUCKET" && k !== "ASSETS");
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Chưa thiết lập biến bí mật 'ADMIN_PIN' trong Cloudflare Worker Settings. Các biến hiện có: [" + availableKeys.join(", ") + "]" 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const isValid = Boolean(token && token === expectedPin);
      return new Response(JSON.stringify({ 
        success: isValid, 
        message: isValid ? "Mã PIN chính xác" : "Mã PIN không đúng" 
      }), {
        status: isValid ? 200 : 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. API XÓA ẢNH DÀNH RIÊNG CHO QUẢN TRỊ VIÊN: DELETE /api/photos?album={album}&file={file}
    if (request.method === "DELETE" && (url.pathname === "/api/photos" || url.pathname === "/api/photos/")) {
      try {
        if (!env.MY_BUCKET) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Chưa cấu hình R2 Bucket Binding với tên biến 'MY_BUCKET'." 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Xác thực mã PIN bí mật từ Cloudflare secret ADMIN_PIN
        const authHeader = request.headers.get("Authorization") || request.headers.get("X-Admin-Token") || url.searchParams.get("pin") || url.searchParams.get("token") || "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        const expectedPin = String(env.ADMIN_PIN || env.admin_pin || env.ADMINPIN || env.ADMIN_SECRET || env.admin_secret || env.ADMIN_KEY || "").trim();

        if (!expectedPin) {
          const availableKeys = Object.keys(env || {}).filter(k => k !== "MY_BUCKET" && k !== "ASSETS");
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Chưa thiết lập biến bí mật 'ADMIN_PIN' trong Cloudflare Worker Settings. Các biến hiện có: [" + availableKeys.join(", ") + "]" 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (!token || token !== expectedPin) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Mã PIN quản trị không chính xác hoặc bạn không có quyền xóa ảnh." 
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const album = (url.searchParams.get("album") || "").replace(/^\/|\/$/g, "");
        const filename = (url.searchParams.get("file") || "").trim();

        if (!album || !filename || filename.includes("/") || filename.includes("..")) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Tên album hoặc tên file không hợp lệ." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // XÓA ĐỒNG THỜI CẢ THƯ MỤC THUMB VÀ FULL (và thumbs nếu có)
        const keysToDelete = [
          `${album}/thumb/${filename}`,
          `${album}/thumbs/${filename}`,
          `${album}/full/${filename}`,
          `${album}/${filename}`
        ];

        // 1. Gửi lệnh xóa đồng thời ở tất cả các thư mục liên quan trên R2 (thumb, full, thumbs, root)
        await Promise.all(keysToDelete.map(key => env.MY_BUCKET.delete(key)));

        // 2. KIỂM TRA LẠI TRÊN R2 XEM CÁC FILE ĐÃ THỰC SỰ ĐƯỢC XÓA SẠCH CHƯA
        // Hàm kiểm tra sự tồn tại của file bằng head() (nhanh, nhẹ) hoặc get()
        const checkKeyExists = async (key) => {
          try {
            const obj = env.MY_BUCKET.head ? await env.MY_BUCKET.head(key) : await env.MY_BUCKET.get(key);
            return Boolean(obj);
          } catch (_) {
            return false;
          }
        };

        let remaining = [];
        // Kiểm tra tối đa 2 lần để đảm bảo tính nhất quán trên R2
        for (let attempt = 0; attempt < 2; attempt++) {
          const verifyChecks = await Promise.all(keysToDelete.map(async (key) => {
            const exists = await checkKeyExists(key);
            return { key, exists };
          }));
          remaining = verifyChecks.filter(r => r.exists).map(r => r.key);
          if (remaining.length === 0) break;
          // Nếu vẫn còn file, đợi 250ms rồi thử lại
          await new Promise(r => setTimeout(r, 250));
        }

        if (remaining.length > 0) {
          return new Response(JSON.stringify({
            success: false,
            verified: false,
            error: `Xác thực thất bại: File vẫn còn tồn tại trên R2 sau khi xóa (${remaining.join(", ")}). Vui lòng thử lại.`
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
          });
        }

        // 3. Đảm bảo 100% file không còn tồn tại trên R2 trước khi thông báo thành công
        return new Response(JSON.stringify({
          success: true,
          verified: true,
          album: album,
          file: filename,
          message: `Đã kiểm tra R2 và xác nhận xóa vĩnh viễn ảnh '${filename}' thành công!`,
          deletedKeys: keysToDelete
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 4. PHỤC VỤ GIAO DIỆN WEB TĨNH (HTML, CSS, JS, Fonts, v.v.) TỰ ĐỘNG
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
