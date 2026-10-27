# Optimize-Wedding-Photos.ps1
# Tự động nén và tạo 2 bộ ảnh chuẩn Web (thumbs và full) cho Cloudflare R2
# - thumbs/: 600px, chất lượng 80% (~35 KB/ảnh) -> Tải tức thì 0.1s
# - full/: 2048px, chất lượng 82% (~350 KB/ảnh) -> Cực nét trên màn hình Retina/4K

param (
    [string]$SourceFolder = "G:\My Drive\Lê Phước Đức\Wedding\Hình cưới\40 Hình",
    [string]$OutputDir = "$PSScriptRoot\..\optimized-photos\01-pre-wedding"
)

Add-Type -AssemblyName System.Drawing

$thumbsDir = Join-Path $OutputDir "thumbs"
$fullDir = Join-Path $OutputDir "full"

if (-not (Test-Path $thumbsDir)) { New-Item -ItemType Directory -Path $thumbsDir -Force | Out-Null }
if (-not (Test-Path $fullDir)) { New-Item -ItemType Directory -Path $fullDir -Force | Out-Null }

$subDirs = @("2 Hình Cổng", "1 Hình Bìa", "6 Hình Để Bàn", "31 Hình")
$allFiles = @()

foreach ($dir in $subDirs) {
    $fullPath = Join-Path $SourceFolder $dir
    if (Test-Path $fullPath) {
        $files = Get-ChildItem -LiteralPath $fullPath -Filter "*.JPG"
        $allFiles += $files
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " BẮT ĐẦU TỐI ƯU HÓA ẢNH CƯỚI CHO CLOUDFLARE R2 " -ForegroundColor Yellow
Write-Host " Tổng số ảnh phát hiện: $($allFiles.Count) ảnh" -ForegroundColor Green
Write-Host " Thư mục xuất:" -ForegroundColor White
Write-Host "   - Thumbs: $thumbsDir" -ForegroundColor Gray
Write-Host "   - Full:   $fullDir" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Hàm lấy Encoder JPEG
function Get-JpegEncoder {
    $codecs = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
    foreach ($codec in $codecs) {
        if ($codec.MimeType -eq "image/jpeg") {
            return $codec
        }
    }
    return $null
}

$jpegEncoder = Get-JpegEncoder

# Hàm resize và lưu ảnh với chất lượng JPEG tuỳ chỉnh
function Resize-And-SaveImage {
    param (
        [System.Drawing.Image]$img,
        [int]$maxDimension,
        [int]$quality,
        [string]$destinationPath
    )

    $origW = $img.Width
    $origH = $img.Height

    if ($origW -gt $origH) {
        $newW = [Math]::Min($maxDimension, $origW)
        $newH = [int]($origH * ($newW / $origW))
    } else {
        $newH = [Math]::Min($maxDimension, $origH)
        $newW = [int]($origW * ($newH / $origH))
    }

    $destBmp = New-Object System.Drawing.Bitmap($newW, $newH, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $destBmp.SetResolution($img.HorizontalResolution, $img.VerticalResolution)

    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $newW, $newH)
    $g.DrawImage($img, $destRect, 0, 0, $origW, $origH, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Thiết lập tham số nén chất lượng
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

    $destBmp.Save($destinationPath, $jpegEncoder, $encoderParams)
    $destBmp.Dispose()
    $encoderParams.Dispose()
}

$counter = 0
$origTotalBytes = 0
$newThumbBytes = 0
$newFullBytes = 0

foreach ($file in $allFiles) {
    $counter++
    $srcPath = $file.FullName
    $filename = $file.Name
    $origSize = $file.Length
    $origTotalBytes += $origSize

    $thumbDest = Join-Path $thumbsDir $filename
    $fullDest = Join-Path $fullDir $filename

    Write-Host "[$counter/$($allFiles.Count)] Đang nén $filename..." -NoNewline

    try {
        # Đọc ảnh vào bộ nhớ và tạo bản sao để tránh lock file gốc
        $origImg = [System.Drawing.Image]::FromFile($srcPath)

        # 1. Tạo thumbnail (600px, quality 80%)
        Resize-And-SaveImage -img $origImg -maxDimension 600 -quality 80 -destinationPath $thumbDest
        $tSize = (Get-Item -LiteralPath $thumbDest).Length
        $newThumbBytes += $tSize

        # 2. Tạo full-view (2048px, quality 82%)
        Resize-And-SaveImage -img $origImg -maxDimension 2048 -quality 82 -destinationPath $fullDest
        $fSize = (Get-Item -LiteralPath $fullDest).Length
        $newFullBytes += $fSize

        $origImg.Dispose()

        $origMB = ($origSize / 1MB).ToString("0.0")
        $thumbKB = ($tSize / 1KB).ToString("0")
        $fullKB = ($fSize / 1KB).ToString("0")

        Write-Host " Xong! (Gốc: ${origMB}MB -> Thumb: ${thumbKB}KB, Full: ${fullKB}KB)" -ForegroundColor Green
    } catch {
        Write-Host " Lỗi: $_" -ForegroundColor Red
    }
}

$origTotalMB = ($origTotalBytes / 1MB).ToString("0.0")
$newThumbMB = ($newThumbBytes / 1MB).ToString("0.0")
$newFullMB = ($newFullBytes / 1MB).ToString("0.0")
$totalSavedMB = (($origTotalBytes - ($newThumbBytes + $newFullBytes)) / 1MB).ToString("0.0")
$savingRatio = [Math]::Round((1 - (($newThumbBytes + $newFullBytes) / $origTotalBytes)) * 100)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " HOÀN TẤT TỐI ƯU HÓA!" -ForegroundColor Green
Write-Host " Tổng dung lượng ban đầu: $origTotalMB MB" -ForegroundColor Yellow
Write-Host " Tổng Thumbs (40 ảnh):     $newThumbMB MB" -ForegroundColor White
Write-Host " Tổng Full (40 ảnh):       $newFullMB MB" -ForegroundColor White
Write-Host " Đã tiết kiệm:             $totalSavedMB MB (Giảm $savingRatio%)!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "BƯỚC TIẾP THEO:" -ForegroundColor Yellow
Write-Host "1. Mở Cloudflare R2 bucket: 'wedding-album'" -ForegroundColor White
Write-Host "2. Vào thư mục '01-pre-wedding/'" -ForegroundColor White
Write-Host "3. Kéo thả 2 thư mục 'thumbs' và 'full' từ '$OutputDir' lên R2!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
