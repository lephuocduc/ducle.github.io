import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findWranglerPath() {
    const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\leduc\\AppData\\Local';
    const npxDir = path.join(localAppData, 'npm-cache', '_npx');
    if (fs.existsSync(npxDir)) {
        const dirs = fs.readdirSync(npxDir);
        for (const dir of dirs) {
            const candidate = path.join(npxDir, dir, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
            if (fs.existsSync(candidate)) return candidate;
        }
    }
    return null;
}

const WRANGLER_BIN = findWranglerPath();
const BUCKET = 'wedding-album';
const CACHE_FILE = path.join(__dirname, '.upload-progress.json');
const CONCURRENCY = 8; // 8 luồng song song upload cực nhanh

const MAPPINGS = [
    {
        name: 'VuQuyTanHon - Thumbs',
        localDir: 'E:\\Image-temp\\VuQuyTanHon-Optimized\\thumbs',
        targetPrefix: '03-vu-quy-tan-hon/thumb'
    },
    {
        name: 'VuQuyTanHon - Full',
        localDir: 'E:\\Image-temp\\VuQuyTanHon-Optimized\\full',
        targetPrefix: '03-vu-quy-tan-hon/full'
    },
    {
        name: 'NhaHang - Thumbs',
        localDir: 'E:\\Image-temp\\NhaHang-Optimized\\thumbs',
        targetPrefix: '04-tiec-cuoi-asianaplaza/thumb'
    },
    {
        name: 'NhaHang - Full',
        localDir: 'E:\\Image-temp\\NhaHang-Optimized\\full',
        targetPrefix: '04-tiec-cuoi-asianaplaza/full'
    }
];

let uploadedCache = new Set();
if (fs.existsSync(CACHE_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        uploadedCache = new Set(data);
    } catch {
        uploadedCache = new Set();
    }
}

function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(Array.from(uploadedCache), null, 2), 'utf8');
    } catch (e) {
        // ignore
    }
}

function uploadFile(localPath, r2Key, maxRetries = 3) {
    return new Promise((resolve) => {
        const contentType = localPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        let attempt = 0;

        function tryUpload() {
            attempt++;
            const args = WRANGLER_BIN
                ? [
                    WRANGLER_BIN,
                    'r2',
                    'object',
                    'put',
                    `${BUCKET}/${r2Key}`,
                    '--file',
                    localPath,
                    '--content-type',
                    contentType,
                    '--remote'
                ]
                : [
                    'wrangler',
                    'r2',
                    'object',
                    'put',
                    `${BUCKET}/${r2Key}`,
                    '--file',
                    localPath,
                    '--content-type',
                    contentType,
                    '--remote'
                ];

            const cmd = WRANGLER_BIN ? process.execPath : (process.platform === 'win32' ? 'npx.cmd' : 'npx');
            const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

            let stderr = '';
            proc.stderr.on('data', (d) => { stderr += d.toString(); });

            proc.on('close', (code) => {
                if (code === 0) {
                    uploadedCache.add(r2Key);
                    resolve({ success: true, key: r2Key });
                } else {
                    if (attempt < maxRetries) {
                        setTimeout(tryUpload, 1000 * attempt);
                    } else {
                        resolve({ success: false, key: r2Key, error: stderr.trim() });
                    }
                }
            });

            proc.on('error', (err) => {
                if (attempt < maxRetries) {
                    setTimeout(tryUpload, 1000 * attempt);
                } else {
                    resolve({ success: false, key: r2Key, error: err.message });
                }
            });
        }

        tryUpload();
    });
}

async function main() {
    console.log('====================================================');
    console.log('🚀 BẮT ĐẦU UPLOAD CÁC ẢNH MỚI LÊN CLOUDFLARE R2');
    console.log(`📦 Bucket: ${BUCKET}`);
    console.log(`⚡ Wrangler: ${WRANGLER_BIN || 'npx wrangler'}`);
    console.log(`🧵 Luồng chạy song song: ${CONCURRENCY}`);
    console.log(`💾 Cache file: ${CACHE_FILE} (đã ghi nhận ${uploadedCache.size} ảnh trước đó)`);
    console.log('====================================================\n');

    const tasks = [];

    for (const mapping of MAPPINGS) {
        if (!fs.existsSync(mapping.localDir)) {
            console.error(`❌ Thư mục không tồn tại: ${mapping.localDir}`);
            continue;
        }

        const files = fs.readdirSync(mapping.localDir).filter(f => {
            const lower = f.toLowerCase();
            return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
        });

        // Chỉ lấy các file CHƯA CÓ trong cache (tránh tải trùng lặp hoặc phục hồi ảnh đã xóa)
        const newFiles = files.filter(f => !uploadedCache.has(`${mapping.targetPrefix}/${f}`));
        console.log(`📁 ${mapping.name}: ${files.length} ảnh local | Bỏ qua đã có: ${files.length - newFiles.length} | Cần upload MỚI: ${newFiles.length}`);

        for (const file of newFiles) {
            const localPath = path.join(mapping.localDir, file);
            const r2Key = `${mapping.targetPrefix}/${file}`;
            tasks.push({ localPath, r2Key });
        }
    }

    const totalTasks = tasks.length;
    console.log(`\n📊 TỔNG SỐ ẢNH MỚI CẦN UPLOAD: ${totalTasks} file\n`);

    if (totalTasks === 0) {
        console.log('🎉 Không có ảnh mới nào cần upload!');
        return;
    }

    let completed = 0;
    let failed = 0;
    let uploadedCount = 0;
    let startTime = Date.now();
    let activeWorkers = 0;
    let taskIndex = 0;

    return new Promise((resolve) => {
        function next() {
            while (activeWorkers < CONCURRENCY && taskIndex < tasks.length) {
                const currentTask = tasks[taskIndex++];
                activeWorkers++;

                uploadFile(currentTask.localPath, currentTask.r2Key).then(result => {
                    activeWorkers--;
                    completed++;

                    if (result.success) {
                        uploadedCount++;
                        if (uploadedCount % 10 === 0 || completed === totalTasks) {
                            saveCache();
                        }
                    } else {
                        failed++;
                        console.error(`\n❌ Lỗi upload: ${result.key} (${result.error})`);
                    }

                    const pct = ((completed / totalTasks) * 100).toFixed(1);
                    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
                    process.stdout.write(`\r[${completed}/${totalTasks}] ${pct}% | Uploaded: ${uploadedCount} | Lỗi: ${failed} | Thời gian: ${elapsedSec}s   `);

                    if (taskIndex < tasks.length) {
                        next();
                    } else if (activeWorkers === 0) {
                        saveCache();
                        console.log('\n\n====================================================');
                        console.log('🎉 HOÀN TẤT TIẾN TRÌNH UPLOAD ẢNH MỚI LÊN R2!');
                        console.log(`✅ Thành công: ${uploadedCount}/${totalTasks} file`);
                        if (failed > 0) {
                            console.log(`⚠️ Thất bại: ${failed} file (có thể chạy lại script để retry)`);
                        }
                        const totalMin = (((Date.now() - startTime) / 1000) / 60).toFixed(1);
                        console.log(`⏱️ Tổng thời gian: ${totalMin} phút`);
                        console.log('====================================================\n');
                        resolve();
                    }
                });
            }
        }

        next();
    });
}

main().catch(console.error);

