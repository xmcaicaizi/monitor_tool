@echo off
title 服务监控工具打包程序
echo ================================
echo   服务监控工具打包程序
echo ================================
echo.

REM Check if 7-Zip is installed
where 7z >nul 2>&1
if %errorlevel% neq 0 (
    echo 警告: 未找到 7-Zip 命令行工具
    echo 将创建 ZIP 文件但不进行压缩
    echo.
)

set PACKAGE_NAME=service-monitor-tool.zip
set TEMP_DIR=%TEMP%\ServiceMonitorPackage

echo 正在创建临时目录...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo 正在复制文件...
xcopy "package.json" "%TEMP_DIR%\" /EXCLUDE:package-exclude.txt >nul
xcopy "server.js" "%TEMP_DIR%\" /EXCLUDE:package-exclude.txt >nul
xcopy "README.md" "%TEMP_DIR%\" /EXCLUDE:package-exclude.txt >nul
xcopy "install.bat" "%TEMP_DIR%\" /EXCLUDE:package-exclude.txt >nul
xcopy "launch.bat" "%TEMP_DIR%\" /EXCLUDE:package-exclude.txt >nul
xcopy "start.bat" "%TEMP_DIR%\" /EXCLUDE:package-exclude.txt >nul
xcopy /E /I /Y "config" "%TEMP_DIR%\config\" /EXCLUDE:package-exclude.txt >nul
xcopy /E /I /Y "backend" "%TEMP_DIR%\backend\" /EXCLUDE:package-exclude.txt >nul
xcopy /E /I /Y "frontend" "%TEMP_DIR%\frontend\" /EXCLUDE:package-exclude.txt >nul

echo 正在创建压缩包...
if exist "%PACKAGE_NAME%" del "%PACKAGE_NAME%"

REM Try to use 7-Zip if available
where 7z >nul 2>&1
if %errorlevel% equ 0 (
    7z a -tzip "%PACKAGE_NAME%" "%TEMP_DIR%\*"
) else (
    REM Fallback to PowerShell for ZIP creation
    powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%TEMP_DIR%', '%PACKAGE_NAME%')"
)

echo 正在清理临时文件...
rmdir /s /q "%TEMP_DIR%"

echo.
echo 打包完成: %PACKAGE_NAME%
echo.
pause
