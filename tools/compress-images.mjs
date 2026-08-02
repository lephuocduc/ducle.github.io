/**
 * compress-images.mjs
 * Nén & thu nhỏ ảnh gallery xuống chuẩn web (tối đa 1920px, WebP chất lượng 82%)
 * Ảnh gốc được backup vào assets/img/originals/ trước khi ghi đè
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMG_DIR = path.join(__dirname, '..', 'assets', 'img');
const BACKUP_DIR = path.join(IMG_DIR, 'originals');

// Chỉ nén các file ảnh thuộc gallery (dung lượng lớn)
const GALLERY_FILES = [
    'NAM_2906.webp',
    'NAM_3318.webp',
    'NAM_3103.webp',
    'NAM_3230.webp',
    'NAM_3814.webp',
    'NAM_2934.webp',
    'NAM_3954.webp',
    'NAM_3511.webp',
    'NAM_3648.webp',
    'NAM_4087.webp',
    'NAM_3632.webp',
    'NAM_2843.webp',
];

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 82; // 82% – sắc nét nhưng nhẹ

// Đảm bảo thư mục backup tồn tại
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Đã tạo thư mục backup: ${BACKUP_DIR}`);
}

console.log('\n🚀 Bắt đầu nén ảnh gallery...\n');

let totalSaveMB = 0;

for (const filename of GALLERY_FILES) {
    const srcPath = path.join(IMG_DIR, filename);
    const backupPath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(srcPath)) {
        console.warn(`⚠️  Không tìm thấy: ${filename}, bỏ qua.`);
        continue;
    }

    const originalSize = fs.statSync(srcPath).size;

    // Backup ảnh gốc (chỉ lần đầu, không ghi đè backup)
    if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(srcPath, backupPath);
    }

    // Nén & resize bằng sharp
    const tmpPath = srcPath + '.tmp';
    await sharp(srcPath)
        .resize({
            width: MAX_WIDTH,
            height: MAX_HEIGHT,
            fit: 'inside',          // Giữ nguyên tỉ lệ khung hình
            withoutEnlargement: true // Không phóng to ảnh nhỏ
        })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(tmpPath);

    fs.renameSync(tmpPath, srcPath);

    const newSize = fs.statSync(srcPath).size;
    const savedMB = (originalSize - newSize) / 1024 / 1024;
    totalSaveMB += savedMB;

    const originalMB = (originalSize / 1024 / 1024).toFixed(2);
    const newMB = (newSize / 1024 / 1024).toFixed(2);
    const ratio = Math.round((1 - newSize / originalSize) * 100);

    console.log(`✅ ${filename}`);
    console.log(`   ${originalMB} MB → ${newMB} MB  (giảm ${ratio}%)\n`);
}

console.log(`\n🎉 Hoàn tất! Tổng dung lượng đã tiết kiệm: ${totalSaveMB.toFixed(1)} MB`);
console.log(`📦 Ảnh gốc được backup tại: ${BACKUP_DIR}`);
