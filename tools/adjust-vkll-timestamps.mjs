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
const CONCURRENCY = 8;
const OFFSET_SECONDS = 155; // 2 phút 35 giây

function adjustFilename(filename, offsetSeconds) {
    const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})(_.+)$/);
    if (!m) return null;
    const [_, y, mo, d, h, mi, s, rest] = m;
    const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    date.setUTCSeconds(date.getUTCSeconds() - offsetSeconds);

    const pad = n => String(n).padStart(2, '0');
    const newY = date.getUTCFullYear();
    const newMo = pad(date.getUTCMonth() + 1);
    const newD = pad(date.getUTCDate());
    const newH = pad(date.getUTCHours());
    const newMi = pad(date.getUTCMinutes());
    const newS = pad(date.getUTCSeconds());
    return `${newY}-${newMo}-${newD}_${newH}-${newMi}-${newS}${rest}`;
}

const ALBUMS = [
    {
        id: '03-vu-quy-tan-hon',
        name: 'Vu Quy & Tân Hôn',
        fullDir: 'E:\\Image-temp\\VuQuyTanHon-Optimized\\full',
        thumbDir: 'E:\\Image-temp\\VuQuyTanHon-Optimized\\thumbs'
    },
    {
        id: '04-tiec-cuoi-asianaplaza',
        name: 'Tiệc Cưới Asiana Plaza',
        fullDir: 'E:\\Image-temp\\NhaHang-Optimized\\full',
        thumbDir: 'E:\\Image-temp\\NhaHang-Optimized\\thumbs'
    }
];

let uploadedCache = new Set();
if (fs.existsSync(CACHE_FILE)) {
    try {
        uploadedCache = new Set(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')));
    } catch {
        uploadedCache = new Set();
    }
}

function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(Array.from(uploadedCache), null, 2), 'utf8');
    } catch {}
}

function runWrangler(args) {
    return new Promise((resolve) => {
        const fullArgs = WRANGLER_BIN ? [WRANGLER_BIN, ...args] : args;
        const cmd = WRANGLER_BIN ? process.execPath : (process.platform === 'win32' ? 'npx.cmd' : 'npx');
        const proc = spawn(cmd, fullArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        let stderr = '';
        proc.stderr.on('data', d => { stderr += d.toString(); });
        proc.on('close', code => {
            resolve({ success: code === 0, error: stderr.trim() });
        });
        proc.on('error', err => {
            resolve({ success: false, error: err.message });
        });
    });
}

async function runQueue(items, workerFn, label) {
    const total = items.length;
    let completed = 0;
    let failed = 0;
    let active = 0;
    let idx = 0;
    const startTime = Date.now();

    return new Promise((resolve) => {
        function next() {
            while (active < CONCURRENCY && idx < items.length) {
                const item = items[idx++];
                active++;

                workerFn(item).then(res => {
                    active--;
                    completed++;
                    if (!res.success) failed++;

                    const pct = ((completed / total) * 100).toFixed(1);
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                    process.stdout.write(`\r[${label}] [${completed}/${total}] ${pct}% | Lỗi: ${failed} | Thời gian: ${elapsed}s   `);

                    if (idx < items.length) {
                        next();
                    } else if (active === 0) {
                        console.log(`\n✅ ${label} hoàn tất (${((Date.now() - startTime) / 1000).toFixed(0)}s, lỗi: ${failed})`);
                        resolve();
                    }
                });
            }
        }
        next();
    });
}

async function main() {
    console.log('====================================================');
    console.log('⏱️ ĐIỀU CHỈNH THỜI GIAN CHỤP (-2m35s) CHO ẢNH VKLL');
    console.log(`⚡ Độ lệch: -${OFFSET_SECONDS} giây (-2 phút 35 giây)`);
    console.log(`📦 Bucket: ${BUCKET}`);
    console.log(`🧵 Luồng: ${CONCURRENCY}`);
    console.log('====================================================\n');

    // BƯỚC 1: XÁC ĐỊNH DANH SÁCH FILE VÀ ĐỔI TÊN LOCAL
    console.log('--- BƯỚC 1: Đổi tên file trên ổ E ---');
    const uploadTasks = [];
    const deleteTasks = [];

    for (const album of ALBUMS) {
        const fullFiles = fs.readdirSync(album.fullDir);
        const vkllFiles = fullFiles.filter(f => f.includes('VKLL'));

        console.log(`📁 ${album.name}: tìm thấy ${vkllFiles.length} ảnh VKLL`);

        for (const oldFile of vkllFiles) {
            const newFile = adjustFilename(oldFile, OFFSET_SECONDS);
            if (!newFile) {
                console.error('❌ Không thể phân tích tên file:', oldFile);
                continue;
            }

            // Đổi tên file trong thư mục full
            const oldFullPath = path.join(album.fullDir, oldFile);
            const newFullPath = path.join(album.fullDir, newFile);
            if (fs.existsSync(oldFullPath) && oldFile !== newFile) {
                fs.renameSync(oldFullPath, newFullPath);
            }

            // Đổi tên file trong thư mục thumbs
            const oldThumbPath = path.join(album.thumbDir, oldFile);
            const newThumbPath = path.join(album.thumbDir, newFile);
            if (fs.existsSync(oldThumbPath) && oldFile !== newFile) {
                fs.renameSync(oldThumbPath, newThumbPath);
            }

            // Task upload file mới
            uploadTasks.push({
                localPath: newFullPath,
                r2Key: `${album.id}/full/${newFile}`,
                contentType: 'image/jpeg'
            });
            uploadTasks.push({
                localPath: newThumbPath,
                r2Key: `${album.id}/thumb/${newFile}`,
                contentType: 'image/jpeg'
            });

            // Task xóa file cũ trên R2
            deleteTasks.push({ r2Key: `${album.id}/full/${oldFile}` });
            deleteTasks.push({ r2Key: `${album.id}/thumb/${oldFile}` });

            // Cập nhật cache
            uploadedCache.delete(`${album.id}/full/${oldFile}`);
            uploadedCache.delete(`${album.id}/thumb/${oldFile}`);
            uploadedCache.add(`${album.id}/full/${newFile}`);
            uploadedCache.add(`${album.id}/thumb/${newFile}`);
        }
    }

    // Đổi tên cả trong VKLL_JPG-Optimized nếu có
    const vkllOptDir = 'E:\\Image-temp\\VKLL_JPG-Optimized';
    if (fs.existsSync(vkllOptDir)) {
        for (const sub of ['full', 'thumbs']) {
            const dir = path.join(vkllOptDir, sub);
            if (fs.existsSync(dir)) {
                for (const f of fs.readdirSync(dir).filter(x => x.includes('VKLL'))) {
                    const nf = adjustFilename(f, OFFSET_SECONDS);
                    if (nf && f !== nf) {
                        try { fs.renameSync(path.join(dir, f), path.join(dir, nf)); } catch {}
                    }
                }
            }
        }
    }
    console.log('✅ Đã đổi tên local hoàn tất!\n');

    // BƯỚC 2: UPLOAD CÁC FILE ĐÃ ĐƯỢC ĐỔI TÊN LÊN R2
    console.log(`--- BƯỚC 2: Upload ${uploadTasks.length} file mới lên R2 ---`);
    await runQueue(uploadTasks, async (task) => {
        return await runWrangler([
            'r2', 'object', 'put',
            `${BUCKET}/${task.r2Key}`,
            '--file', task.localPath,
            '--content-type', task.contentType,
            '--remote'
        ]);
    }, 'Upload R2');
    saveCache();

    // BƯỚC 3: XÓA CÁC FILE CŨ KHỎI R2
    console.log(`\n--- BƯỚC 3: Xóa ${deleteTasks.length} file cũ khỏi R2 ---`);
    await runQueue(deleteTasks, async (task) => {
        return await runWrangler([
            'r2', 'object', 'delete',
            `${BUCKET}/${task.r2Key}`,
            '--remote'
        ]);
    }, 'Delete Old R2');
    saveCache();

    console.log('\n====================================================');
    console.log('🎉 TOÀN BỘ TIẾN TRÌNH ĐỔI TÊN & ĐỒNG BỘ ĐÃ HOÀN TẤT!');
    console.log('====================================================\n');
}

main().catch(console.error);

