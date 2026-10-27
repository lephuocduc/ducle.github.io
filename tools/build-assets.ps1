# Build-Assets.ps1
# Tự động nén và tạo 40 ảnh thumbnails (35KB) và 40 ảnh full web (450KB) vào assets/img/

Add-Type -AssemblyName System.Drawing

$baseDir = (Get-Item -LiteralPath "$PSScriptRoot\..").FullName
$thumbsDir = Join-Path $baseDir "assets\img\thumbs\01-pre-wedding"
$fullDir = Join-Path $baseDir "assets\img\full\01-pre-wedding"

if (-not (Test-Path -LiteralPath $thumbsDir)) {
    New-Item -ItemType Directory -LiteralPath $thumbsDir -Force | Out-Null
}
if (-not (Test-Path -LiteralPath $fullDir)) {
    New-Item -ItemType Directory -LiteralPath $fullDir -Force | Out-Null
}

$sourceBase = "G:\My Drive\Lê Phước Đức\Wedding\Hình cưới\40 Hình"
$subDirs = @("2 Hình Cổng", "1 Hình Bìa", "6 Hình Để Bàn", "31 Hình")

function Get-JpegEncoder {
    $codecs = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
    foreach ($codec in $codecs) {
        if ($codec.MimeType -eq "image/jpeg") { return $codec }
    }
    return $null
}

$encoder = Get-JpegEncoder

function Resize-ImageFile {
    param(
        [string]$srcPath,
        [string]$destPath,
        [int]$maxDimension,
        [int]$quality
    )

    $img = [System.Drawing.Image]::FromFile($srcPath)
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
    $destBmp.SetResolution(72, 72)

    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $newW, $newH)
    $g.DrawImage($img, $destRect, 0, 0, $origW, $origH, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $img.Dispose()

    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

    $destBmp.Save($destPath, $encoder, $encoderParams)
    $destBmp.Dispose()
    $encoderParams.Dispose()
}

$allFiles = @()
foreach ($d in $subDirs) {
    $p = Join-Path $sourceBase $d
    if (Test-Path -LiteralPath $p) {
        $allFiles += Get-ChildItem -LiteralPath $p -Filter "*.JPG"
    }
}

Write-Output "Found total files: $($allFiles.Count)"
$i = 0
foreach ($f in $allFiles) {
    $i++
    $tDest = Join-Path $thumbsDir $f.Name
    $fDest = Join-Path $fullDir $f.Name

    # 1. Thumbs: 500px, quality 75 (~35KB)
    Resize-ImageFile -srcPath $f.FullName -destPath $tDest -maxDimension 500 -quality 75

    # 2. Full: 2048px, quality 83 (~450KB)
    Resize-ImageFile -srcPath $f.FullName -destPath $fDest -maxDimension 2048 -quality 83

    Write-Output "[$i/$($allFiles.Count)] $($f.Name) processed"
}

Write-Output "ALL 40 PHOTOS SUCCESSFULLY GENERATED IN ASSETS!"
