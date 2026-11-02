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
    console.log('🚀 BẮT ĐẦU ĐỒNG BỘ ẢNH VKLL (ĐÃ ĐỔI TÊN & DATE TAKEN -2m35s)');
    console.log(`📦 Bucket: ${BUCKET}`);
    console.log(`⚡ Wrangler: ${WRANGLER_BIN}`);
    console.log(`🧵 Luồng: ${CONCURRENCY}`);
    console.log('====================================================\n');

    const uploadTasks = [];
    const deleteTasks = [];

    for (const album of ALBUMS) {
        // 1. Lấy danh sách ảnh hiện tại trên R2 để tìm các file cũ cần xóa
        const res = await fetch(`https://wedding.phuocducthusuong.com/api/photos?album=${album.id}&_t=${Date.now()}`);
        const data = await res.json();
        const currentR2Images = data.images || [];

        const localFullFiles = fs.readdirSync(album.fullDir);
        const localVKLL = new Set(localFullFiles.filter(f => f.includes('VKLL')));

        console.log(`📁 ${album.name}:`);
        console.log(`  - Local VKLL (mới, đã sửa EXIF): ${localVKLL.size} ảnh`);

        // Tìm các file VKLL trên R2 mà KHÔNG khớp với tên local mới -> file cũ cần xóa
        const oldR2Files = currentR2Images.filter(f => f.includes('VKLL') && !localVKLL.has(f));
        console.log(`  - R2 VKLL cũ cần xóa: ${oldR2Files.length} ảnh`);

        // Chuẩn bị tasks upload các file mới (cả full và thumb)
        for (const file of localVKLL) {
            uploadTasks.push({
                localPath: path.join(album.fullDir, file),
                r2Key: `${album.id}/full/${file}`,
                contentType: 'image/jpeg'
            });
            uploadTasks.push({
                localPath: path.join(album.thumbDir, file),
                r2Key: `${album.id}/thumb/${file}`,
                contentType: 'image/jpeg'
            });
        }

        // Chuẩn bị tasks xóa file cũ trên R2
        for (const oldFile of oldR2Files) {
            deleteTasks.push({ r2Key: `${album.id}/full/${oldFile}` });
            deleteTasks.push({ r2Key: `${album.id}/thumb/${oldFile}` });

            // Xóa khỏi cache
            uploadedCache.delete(`${album.id}/full/${oldFile}`);
            uploadedCache.delete(`${album.id}/thumb/${oldFile}`);
        }
    }

    console.log(`\n📊 Tổng số file cần upload mới: ${uploadTasks.length}`);
    console.log(`🗑️ Tổng số file cũ cần xóa trên R2: ${deleteTasks.length}\n`);

    // BƯỚC 1: UPLOAD CÁC FILE MỚI ĐÃ SỬA EXIF LÊN R2
    console.log('--- BƯỚC 1: Upload file mới lên R2 ---');
    await runQueue(uploadTasks, async (task) => {
        const res = await runWrangler([
            'r2', 'object', 'put',
            `${BUCKET}/${task.r2Key}`,
            '--file', task.localPath,
            '--content-type', task.contentType,
            '--remote'
        ]);
        if (res.success) {
            uploadedCache.add(task.r2Key);
        }
        return res;
    }, 'Upload R2');
    saveCache();

    // BƯỚC 2: XÓA CÁC FILE CŨ TRÊN R2
    if (deleteTasks.length > 0) {
        console.log('\n--- BƯỚC 2: Xóa file cũ trên R2 ---');
        await runQueue(deleteTasks, async (task) => {
            return await runWrangler([
                'r2', 'object', 'delete',
                `${BUCKET}/${task.r2Key}`,
                '--remote'
            ]);
        }, 'Delete Old R2');
        saveCache();
    }

    console.log('\n====================================================');
    console.log('🎉 TOÀN BỘ UPLOAD VÀ DỌN R2 ĐÃ HOÀN TẤT!');
    console.log('====================================================\n');
}

main().catch(console.error);

