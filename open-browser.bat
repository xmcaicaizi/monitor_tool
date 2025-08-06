@echo off
:: Browser Launcher Script (Batch Version)
:: This script handles opening the browser after server starts

set URL=%1
if "%URL%"=="" set URL=http://localhost:3000

set WAIT_SECONDS=%2
if "%WAIT_SECONDS%"=="" set WAIT_SECONDS=3

echo Waiting for server to initialize...
timeout /t %WAIT_SECONDS% /nobreak >nul

echo Checking server status...

:: Try to check if server is ready
curl -s %URL% >nul 2>&1
if %errorlevel% equ 0 (
    echo Server is ready! Opening browser...
    start %URL%
    echo Browser opened successfully.
) else (
    echo Server is starting... Opening browser anyway...
    start %URL%
    echo Browser opened. Please wait for server to be ready.
)

echo.
echo Access URL: %URL%