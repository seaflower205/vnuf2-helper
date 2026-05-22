Add-Type -AssemblyName System.Drawing

$sizes = @(16, 48, 128)
$dir = "c:\Users\Sea Flower\Pictures\web scan\vnuf2-helper\icons"

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'HighQuality'
    $g.TextRenderingHint = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::FromArgb(40, 167, 69))

    $fontSize = [Math]::Floor($size * 0.55)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = [System.Drawing.Brushes]::White
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $sf.LineAlignment = 'Center'
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('V', $font, $brush, $rect, $sf)

    $filePath = Join-Path $dir "icon$size.png"
    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $font.Dispose()
    $bmp.Dispose()
    Write-Host "Created $filePath"
}
