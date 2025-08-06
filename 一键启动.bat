@echo off
:: 强制设置控制台编码为UTF-8
chcp 65001 >nul 2>&1
:: 设置环境变量确保编码正确
set PYTHONIOENCODING=utf-8
set LANG=zh_CN.UTF-8

title 服务监控工具 - 一键启动

:: 优先尝试使用PowerShell脚本（更好的中文支持）
if exist "一键启动.ps1" (
    echo 🔄 尝试使用PowerShell脚本以获得更好的中文支持...
    powershell -ExecutionPolicy Bypass -File "一键启动.ps1"
    if %errorlevel% equ 0 exit /b 0
    echo ❌ PowerShell脚本执行失败，回退到批处理模式...
    echo.
)

echo ==========================================
echo      🚀 服务监控工具 - 一键启动
echo ==========================================
echo.

:: 检查Node.js安装
echo [1/4] 🔍 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Node.js
    echo.
    echo 📋 请先安装Node.js：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装LTS版本
    echo 3. 重新运行此脚本
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js已安装

:: 检查npm安装
echo [2/4] 🔍 检查npm环境...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：npm未正确安装
    echo 📋 请重新安装Node.js
    pause
    exit /b 1
)
echo ✅ npm已安装

:: 检查并安装依赖
echo [3/4] 📦 检查项目依赖...
if not exist "node_modules" (
    echo 📥 首次运行，正在安装依赖...
    echo ⏳ 这可能需要几分钟时间，请耐心等待...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        echo 📋 请检查网络连接或尝试使用镜像源：
        echo npm config set registry https://registry.npmmirror.com/
        pause
        exit /b 1
    )
    echo ✅ 依赖安装成功
) else (
    echo ✅ 依赖已存在
)

:: 启动服务
echo [4/4] 🚀 启动服务监控工具...
echo.
echo 🔄 正在启动服务器...
echo 📍 访问地址: http://localhost:3000
echo 🛑 按 Ctrl+C 停止服务
echo.
echo ==========================================
echo.

:: 后台启动服务器
echo 🔧 启动Node.js服务器...
start /B npm start

:: 使用独立的浏览器启动脚本
if exist "open-browser.bat" (
    echo 🌐 正在启动浏览器...
    call open-browser.bat http://localhost:3000 3
) else (
    echo ❌ 未找到浏览器启动器，请手动打开: http://localhost:3000
)

echo.
echo ✅ 服务器正在运行，按 Ctrl+C 停止服务
echo.

:: Keep the window open and wait for user input
pause

:: If service exits abnormally
echo.
echo Service stopped
pause