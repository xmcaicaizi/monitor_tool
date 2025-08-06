@echo off
chcp 65001 >nul
echo ========================================
echo       服务监控工具 - 一键启动脚本
echo ========================================
echo.

:: 检查是否安装了 Node.js
echo [1/4] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo.
    echo 请先安装 Node.js:
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 LTS 版本
    echo 3. 重新运行此脚本
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

:: 检查是否安装了 npm
echo [2/4] 检查 npm 环境...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: npm 未正确安装
    echo 请重新安装 Node.js
    pause
    exit /b 1
)
echo ✅ npm 已安装

:: 检查并安装依赖
echo [3/4] 检查项目依赖...
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖包...
    echo 这可能需要几分钟时间，请耐心等待...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        echo 请检查网络连接或尝试使用国内镜像:
        echo npm config set registry https://registry.npmmirror.com/
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

:: 启动服务
echo [4/4] 启动服务监控工具...
echo.
echo 🚀 正在启动服务器...
echo 📍 访问地址: http://localhost:3000
echo 💡 按 Ctrl+C 可停止服务
echo.
echo ========================================
echo.

npm start

:: 如果服务异常退出
echo.
echo ⚠️  服务已停止
pause