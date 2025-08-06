@echo off
chcp 65001 >nul
echo ========================================
echo       服务监控工具 - 打包脚本
echo ========================================
echo.

:: 检查 Node.js 环境
echo [1/4] 检查环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    pause
    exit /b 1
)
echo ✅ Node.js 环境正常

:: 安装依赖
echo [2/4] 安装依赖...
if not exist "node_modules" (
    echo 📦 安装项目依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)
echo ✅ 依赖已准备

:: 清理旧文件
echo [3/4] 清理旧文件...
if exist "dist" rd /s /q "dist"
echo ✅ 清理完成

:: 开始打包
echo [4/4] 开始打包...
echo.
echo 选择打包方式:
echo 1. 打包为可执行文件 (.exe)
echo 2. 打包为便携版 (.zip)
echo 3. 同时打包两种格式
echo.
set /p choice="请选择 (1-3): "

if "%choice%"=="1" goto build_exe
if "%choice%"=="2" goto build_portable
if "%choice%"=="3" goto build_both
echo 无效选择，默认打包便携版
goto build_portable

:build_exe
echo 🔨 正在打包可执行文件...
npm run build:exe
if %errorlevel% neq 0 (
    echo ❌ 可执行文件打包失败
    pause
    exit /b 1
)
echo ✅ 可执行文件打包完成: dist\monitor-tool.exe
goto end

:build_portable
echo 📦 正在打包便携版...
npm run build:portable
if %errorlevel% neq 0 (
    echo ❌ 便携版打包失败
    pause
    exit /b 1
)
echo ✅ 便携版打包完成: dist\monitor-tool-portable.zip
goto end

:build_both
echo 🔨 正在打包可执行文件...
npm run build:exe
if %errorlevel% neq 0 (
    echo ❌ 可执行文件打包失败
    pause
    exit /b 1
)
echo ✅ 可执行文件打包完成

echo 📦 正在打包便携版...
npm run build:portable
if %errorlevel% neq 0 (
    echo ❌ 便携版打包失败
    pause
    exit /b 1
)
echo ✅ 便携版打包完成

:end
echo.
echo ========================================
echo 🎉 打包完成！
echo.
echo 输出目录: dist\
if exist "dist\monitor-tool.exe" echo - 可执行文件: monitor-tool.exe
if exist "dist\monitor-tool-portable.zip" echo - 便携版: monitor-tool-portable.zip
echo.
echo 💡 使用说明:
echo - 可执行文件: 双击运行，无需安装 Node.js
echo - 便携版: 解压后运行"一键启动.bat"
echo ========================================
pause