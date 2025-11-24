# Vercel Deployment Script for Windows PowerShell
# This script automates the deployment process to Vercel

Write-Host "Vercel Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envPath = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host ".env.local not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your environment variables." -ForegroundColor Yellow
    exit 1
}

# Check if Vercel CLI is available - prefer npx
Write-Host "Checking Vercel CLI..." -ForegroundColor Cyan
$useNpx = $false

if (Get-Command npx -ErrorAction SilentlyContinue) {
    $useNpx = $true
    Write-Host "Using npx vercel (recommended)" -ForegroundColor Green
} elseif (Get-Command vercel.cmd -ErrorAction SilentlyContinue) {
    $useNpx = $false
    Write-Host "Using vercel.cmd" -ForegroundColor Green
} elseif (Test-Path "$env:APPDATA\npm\vercel.cmd") {
    $useNpx = $false
    Write-Host "Using vercel.cmd from AppData" -ForegroundColor Green
} elseif (Get-Command vercel -ErrorAction SilentlyContinue) {
    $useNpx = $false
    Write-Host "Using vercel" -ForegroundColor Green
} else {
    Write-Host "Vercel CLI not found" -ForegroundColor Yellow
    Write-Host "Please install: npm i -g vercel" -ForegroundColor Yellow
    Write-Host "Or use: npx vercel" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if user is logged in
Write-Host "Checking Vercel login status..." -ForegroundColor Cyan
try {
    if ($useNpx) {
        $loginCheck = & npx vercel whoami 2>&1
    } else {
        $loginCheck = & vercel whoami 2>&1
    }
    
    if ($LASTEXITCODE -eq 0 -and $loginCheck -notmatch "error|Error|ERROR") {
        Write-Host "Logged in as: $loginCheck" -ForegroundColor Green
    } else {
        Write-Host "Not logged in" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please login first" -ForegroundColor Yellow
        Write-Host ""
        $shouldLogin = Read-Host "Login now? (y/n)"
        if ($shouldLogin -eq "y" -or $shouldLogin -eq "Y") {
            if ($useNpx) {
                & npx vercel login
            } else {
                & vercel login
            }
        } else {
            exit 1
        }
    }
} catch {
    Write-Host "Could not check login status" -ForegroundColor Yellow
    Write-Host "You may need to login manually" -ForegroundColor Yellow
}
Write-Host ""

# Ask for deployment type
Write-Host "Deployment Type:" -ForegroundColor Cyan
Write-Host "  1. Preview (default)" -ForegroundColor White
Write-Host "  2. Production" -ForegroundColor White
Write-Host ""
$promptText = "Select deployment type (1 or 2, default: 1)"
$deployType = Read-Host $promptText

if ($deployType -eq "2") {
    Write-Host ""
    Write-Host "Deploying to PRODUCTION..." -ForegroundColor Yellow
    Write-Host ""
    if ($useNpx) {
        & npx vercel --prod
    } else {
        & vercel --prod
    }
} else {
    Write-Host ""
    Write-Host "Deploying to PREVIEW..." -ForegroundColor Cyan
    Write-Host ""
    if ($useNpx) {
        & npx vercel
    } else {
        & vercel
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Add environment variables in Vercel Dashboard" -ForegroundColor White
    Write-Host "  2. Update NEXTAUTH_URL to your Vercel domain" -ForegroundColor White
    Write-Host "  3. Update OAuth redirect URLs (if using OAuth)" -ForegroundColor White
    Write-Host ""
    Write-Host "Dashboard: https://vercel.com/dashboard" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
    exit 1
}
