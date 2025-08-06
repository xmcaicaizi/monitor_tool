@echo off
:: 强制设置控制台编码为UTF-8
chcp 65001 >nul 2>&1
:: 设置环境变量确保编码正确
set PYTHONIOENCODING=utf-8
set LANG=zh_CN.UTF-8
title 服务监控工具 - 快速启动

echo ==========================================
echo      🚀 服务监控工具 - 快速启动
echo ==========================================
echo 📍 访问地址: http://localhost:3000
echo.

:: 检查依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install --silent
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
)

:: 启动服务
echo 🔄 正在启动服务器...
start /B npm start

:: 使用独立的浏览器启动脚本
if exist "open-browser.bat" (
    echo 🌐 正在启动浏览器...
    call open-browser.bat http://localhost:3000 3
) else (
    echo ❌ 浏览器启动器未找到，请手动访问: http://localhost:3000
)

echo.
echo ✅ 服务器已启动！浏览器应该会自动打开
echo 🛑 按 Ctrl+C 停止服务
echo.
pause
