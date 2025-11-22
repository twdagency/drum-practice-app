# PowerShell script to help download drum sounds from the-open-source-drumkit
# This is a helper script - you'll need to manually select which files to use

Write-Host "Downloading drum sounds from the-open-source-drumkit..." -ForegroundColor Cyan
Write-Host "Repository: https://github.com/crabacus/the-open-source-drumkit" -ForegroundColor Gray
Write-Host ""

# Ensure sounds directory exists
$soundsDir = Join-Path $PSScriptRoot "..\public\sounds"
if (-not (Test-Path $soundsDir)) {
    New-Item -ItemType Directory -Path $soundsDir -Force | Out-Null
}

Write-Host "Note: This repository has folders with multiple samples." -ForegroundColor Yellow
Write-Host "You'll need to manually:" -ForegroundColor Yellow
Write-Host "1. Visit https://github.com/crabacus/the-open-source-drumkit" -ForegroundColor Yellow
Write-Host "2. Navigate to each folder (snare, kick, toms, etc.)" -ForegroundColor Yellow
Write-Host "3. Click on a .wav file, then click 'Download' or 'Raw'" -ForegroundColor Yellow
Write-Host "4. Save it to public/sounds/ with the correct name:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Required files:" -ForegroundColor Green
Write-Host "  - public/sounds/snare.wav (from snare folder)" -ForegroundColor White
Write-Host "  - public/sounds/kick.wav (from kick folder)" -ForegroundColor White
Write-Host "  - public/sounds/tom.wav (from toms folder)" -ForegroundColor White
Write-Host "  - public/sounds/floor.wav (from toms folder - pick a different file)" -ForegroundColor White
Write-Host ""
Write-Host "Current sounds directory: $soundsDir" -ForegroundColor Cyan

# Check if sounds already exist
$existingFiles = @()
$requiredFiles = @('snare.wav', 'kick.wav', 'tom.wav', 'floor.wav')
foreach ($file in $requiredFiles) {
    $filePath = Join-Path $soundsDir $file
    if (Test-Path $filePath) {
        $existingFiles += $file
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $file" -ForegroundColor Red
    }
}

if ($existingFiles.Count -eq $requiredFiles.Count) {
    Write-Host ""
    Write-Host "All required sound files are present!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some files are missing. Please download them manually from the repository." -ForegroundColor Yellow
}

