# PowerShell script to remove all console statements from remaining API files
$apiFiles = @(
    "app\api\actions\[id]\review\route.ts",
    "app\api\actions\[id]\route.ts",
    "app\api\brands\[id]\route.ts",
    "app\api\image\[actionId]\route.ts",
    "app\api\personas\[id]\route.ts",
    "app\api\teams\requests\[requestId]\route.ts",
    "app\api\teams\[id]\members\[userId]\route.ts",
    "app\api\teams\[id]\requests\route.ts",
    "app\api\teams\[id]\route.ts",
    "app\api\themes\[id]\route.ts",
    "app\api\users\[id]\route.ts"
)

foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Remove console statements with various patterns
        $content = $content -replace "^\s*console\.(log|error|warn|info|debug)\([^;]*\);\s*$", "" -split "`n" | Where-Object { $_ -notmatch "^\s*$" } | Join-String -Separator "`n"
        $content = $content -replace "\s+console\.(log|error|warn|info|debug)\([^;]*\);\s*", "`n"
        
        # Clean up extra newlines
        $content = $content -replace "`n`n`n+", "`n`n"
        
        Set-Content $file -Value $content -Encoding UTF8
        Write-Host "Cleaned: $file" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}
