@echo off
title 服务监控工具
echo ================================
echo   服务监控工具启动器
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js
    echo 请先安装 Node.js 环境
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo 正在启动服务监控工具...
echo 请勿关闭此窗口
echo.
node server.js

pause
