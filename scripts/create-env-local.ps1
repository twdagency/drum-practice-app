# PowerShell script to create .env.local from template
# Run this script if your .env.local file is missing

Write-Host "Creating .env.local file..." -ForegroundColor Cyan

$envExamplePath = Join-Path $PSScriptRoot ".." ".env.example"
$envLocalPath = Join-Path $PSScriptRoot ".." ".env.local"

# Check if .env.example exists
if (-not (Test-Path $envExamplePath)) {
    Write-Host "Error: .env.example not found!" -ForegroundColor Red
    Write-Host "Please create .env.example first with the template." -ForegroundColor Yellow
    exit 1
}

# Check if .env.local already exists
if (Test-Path $envLocalPath) {
    Write-Host "Warning: .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Copy .env.example to .env.local
try {
    Copy-Item $envExamplePath $envLocalPath -Force
    Write-Host "✓ Created .env.local successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Edit .env.local and fill in your actual values:" -ForegroundColor Yellow
    Write-Host "  - DATABASE_URL" -ForegroundColor White
    Write-Host "  - AUTH_SECRET (generate with: openssl rand -base64 32)" -ForegroundColor White
    Write-Host "  - ADMIN_EMAILS (your admin email address)" -ForegroundColor White
    Write-Host "  - Other optional variables as needed" -ForegroundColor White
    Write-Host ""
    Write-Host "Location: $envLocalPath" -ForegroundColor Cyan
} catch {
    Write-Host "Error creating .env.local: $_" -ForegroundColor Red
    exit 1
}

