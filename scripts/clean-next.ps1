# PowerShell script to clean .next directory on Windows
# Handles file locks and symlink issues

Write-Host "Cleaning .next directory..." -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $PSScriptRoot
$nextPath = Join-Path $projectRoot ".next"

# Stop all Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Check if .next exists
if (-not (Test-Path $nextPath)) {
    Write-Host "✓ .next directory doesn't exist - nothing to clean" -ForegroundColor Green
    exit 0
}

Write-Host "Removing .next directory..." -ForegroundColor Yellow

# Try multiple removal strategies
$removed = $false

# Strategy 1: Simple recursive delete
try {
    Remove-Item -Path $nextPath -Recurse -Force -ErrorAction Stop
    $removed = $true
    Write-Host "✓ Removed using standard method" -ForegroundColor Green
} catch {
    Write-Host "Standard removal failed, trying alternative methods..." -ForegroundColor Yellow
}

# Strategy 2: Delete files individually, then directory
if (-not $removed) {
    try {
        Get-ChildItem -Path $nextPath -Recurse -Force -ErrorAction SilentlyContinue | 
            ForEach-Object {
                try {
                    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
                } catch {
                    # Ignore individual file errors
                }
            }
        Remove-Item -Path $nextPath -Force -ErrorAction Stop
        $removed = $true
        Write-Host "✓ Removed using file-by-file method" -ForegroundColor Green
    } catch {
        Write-Host "File-by-file removal also failed" -ForegroundColor Yellow
    }
}

# Strategy 3: Use cmd /c rmdir (sometimes works better on Windows)
if (-not $removed) {
    try {
        $result = cmd /c "rmdir /s /q `"$nextPath`"" 2>&1
        if (-not (Test-Path $nextPath)) {
            $removed = $true
            Write-Host "✓ Removed using cmd rmdir" -ForegroundColor Green
        }
    } catch {
        Write-Host "cmd rmdir also failed" -ForegroundColor Yellow
    }
}

# Final check
if (Test-Path $nextPath) {
    Write-Host "" -ForegroundColor Red
    Write-Host "✗ Could not fully remove .next directory" -ForegroundColor Red
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host "1. Close all terminals and editors" -ForegroundColor White
    Write-Host "2. Open Task Manager and kill all 'node.exe' processes" -ForegroundColor White
    Write-Host "3. Wait 10 seconds" -ForegroundColor White
    Write-Host "4. Manually delete the .next folder in File Explorer" -ForegroundColor White
    Write-Host "5. If that fails, restart your computer" -ForegroundColor White
    exit 1
} else {
    Write-Host "" -ForegroundColor Green
    Write-Host "✓ .next directory cleaned successfully!" -ForegroundColor Green
    Write-Host "You can now restart your dev server with: npm run dev" -ForegroundColor Cyan
}

