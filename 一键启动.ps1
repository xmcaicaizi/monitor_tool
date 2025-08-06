# PowerShell One-Click Start Script
# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Set window title
$Host.UI.RawUI.WindowTitle = "Service Monitor Tool - One Click Start"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      Service Monitor Tool - Start      " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# [1/4] Check Node.js environment
Write-Host "[1/4] Checking Node.js environment..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Node.js installed: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "Error: Node.js not detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "1. Visit https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Download and install LTS version" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# [2/4] Check npm environment
Write-Host "[2/4] Checking npm environment..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "npm installed: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host "Error: npm not properly installed" -ForegroundColor Red
    Write-Host "Please reinstall Node.js" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# [3/4] Check project dependencies
Write-Host "[3/4] Checking project dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies for first run..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes, please wait..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Dependency installation failed" -ForegroundColor Red
        Write-Host "Please check network connection or try using mirror:" -ForegroundColor Yellow
        Write-Host "npm config set registry https://registry.npmmirror.com/" -ForegroundColor White
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Dependencies already exist" -ForegroundColor Green
}

# [4/4] Start service monitoring tool
Write-Host "[4/4] Starting service monitoring tool..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
Write-Host "Access URL: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:3000" -ForegroundColor White
Write-Host "Press Ctrl+C to stop service" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start service and open browser
Write-Host "Starting Node.js server..." -ForegroundColor Green

# Start server in background using Start-Job
$serverJob = Start-Job -ScriptBlock { 
    Set-Location $using:PWD
    npm start 
}

# Launch browser using separate script
if (Test-Path "open-browser.ps1") {
    Write-Host "Launching browser..." -ForegroundColor Green
    & ".\open-browser.ps1" -Url "http://localhost:3000" -WaitSeconds 3 -TimeoutSeconds 5
} else {
    Write-Host "Browser launcher not found. Please manually open: http://localhost:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Server is running in background. Browser should open automatically." -ForegroundColor Green
Write-Host "To stop the server, close this window or press Ctrl+C" -ForegroundColor Cyan

# Wait for the server job to complete or user to stop
try {
    Wait-Job $serverJob
} finally {
    # Clean up the job
    Remove-Job $serverJob -Force -ErrorAction SilentlyContinue
}

# If service exits abnormally
Write-Host ""
Write-Host "Service stopped" -ForegroundColor Yellow
Read-Host "Press Enter to exit"