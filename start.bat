@echo off
title 服务监控工具
echo ================================
echo   服务监控工具启动程序
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js 版本: 
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 npm
    echo 请确保 Node.js 已正确安装
    echo.
    pause
    exit /b 1
)

echo npm 版本: 
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖包安装失败
        pause
        exit /b 1
    )
    echo 依赖包安装完成
    echo.
)

echo 正在启动服务监控工具...
echo 访问地址: http://localhost:3000
echo 按 Ctrl+C 停止服务
echo.
node server.js

pause
