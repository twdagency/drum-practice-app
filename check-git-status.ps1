# Git Status Checker Script
Write-Host "=== Modified Files (Uncommitted) ===" -ForegroundColor Yellow
$modified = git diff --name-only
if ($modified) {
    $modified | ForEach-Object { Write-Host "  M $_" -ForegroundColor Yellow }
} else {
    Write-Host "  None" -ForegroundColor Green
}

Write-Host "`n=== Staged Files (Ready to Commit) ===" -ForegroundColor Cyan
$staged = git diff --cached --name-only
if ($staged) {
    $staged | ForEach-Object { Write-Host "  A $_" -ForegroundColor Cyan }
} else {
    Write-Host "  None" -ForegroundColor Green
}

Write-Host "`n=== Untracked Files ===" -ForegroundColor Magenta
$untracked = git ls-files --others --exclude-standard
if ($untracked) {
    $untracked | ForEach-Object { Write-Host "  ?? $_" -ForegroundColor Magenta }
} else {
    Write-Host "  None" -ForegroundColor Green
}

Write-Host "`n=== Commits to Push ===" -ForegroundColor Red
# Try different branch names
$branch = git branch --show-current
$remote = "origin/$branch"

try {
    $unpushed = git log $remote..HEAD --oneline 2>$null
    if ($unpushed) {
        Write-Host "  You have unpushed commits:" -ForegroundColor Red
        $unpushed | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    } else {
        Write-Host "  None - everything is pushed" -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not determine remote branch" -ForegroundColor Yellow
}

Write-Host "`n=== Summary ===" -ForegroundColor White
git status --short
