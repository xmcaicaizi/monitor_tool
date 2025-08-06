# Browser Launcher Script
# This script handles opening the browser after server starts

param(
    [string]$Url = "http://localhost:3000",
    [int]$WaitSeconds = 3,
    [int]$TimeoutSeconds = 5
)

Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds $WaitSeconds

Write-Host "Checking server status..." -ForegroundColor Yellow

# Check if server is running and open browser
try {
    $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "Server is ready! Opening browser..." -ForegroundColor Green
        Start-Process $Url
        Write-Host "Browser opened successfully." -ForegroundColor Green
    } else {
        Write-Host "Server started but not responding yet. Opening browser anyway..." -ForegroundColor Yellow
        Start-Process $Url
        Write-Host "Browser opened. Server may still be initializing." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Server is starting... Opening browser..." -ForegroundColor Yellow
    Start-Process $Url
    Write-Host "Browser opened. Please wait for server to be ready." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Access URL: " -NoNewline -ForegroundColor Yellow
Write-Host $Url -ForegroundColor White