# Script to verify .env.local file exists and contains ADMIN_EMAILS

$envPath = Join-Path $PSScriptRoot ".." ".env.local"
$envPath = Resolve-Path $envPath -ErrorAction SilentlyContinue

if (-not $envPath) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Expected location: $(Join-Path $PSScriptRoot ".." ".env.local")" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ .env.local found at: $envPath" -ForegroundColor Green
Write-Host ""

$content = Get-Content $envPath -Raw
$adminLine = $content -split "`n" | Where-Object { $_ -match "ADMIN_EMAILS" }

if ($adminLine) {
    Write-Host "✓ Found ADMIN_EMAILS line:" -ForegroundColor Green
    Write-Host "  $adminLine" -ForegroundColor Cyan
    
    # Try to extract the value
    if ($adminLine -match "ADMIN_EMAILS\s*=\s*(.+)") {
        $value = $matches[1].Trim()
        Write-Host "✓ Extracted value: $value" -ForegroundColor Green
    } else {
        Write-Host "⚠ Could not parse value from line" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ ADMIN_EMAILS not found in .env.local" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add this line to .env.local:" -ForegroundColor Yellow
    Write-Host "ADMIN_EMAILS=richard_ross@hotmail.co.uk" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "✓ Verification complete!" -ForegroundColor Green

