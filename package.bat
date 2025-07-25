@echo off
title 打包服务监控工具
echo ================================
echo   打包服务监控工具
echo ================================
echo.

REM Create distribution folder
if exist "dist" (
    echo 清理旧的打包文件...
    rd /s /q dist
)

echo 创建打包目录...
mkdir dist
mkdir dist\monitor-tool

echo 复制文件...
xcopy . dist\monitor-tool\ /E /I /EXCLUDE:package-exclude.txt

echo 创建压缩包...
cd dist
powershell -Command "Compress-Archive -Path monitor-tool -DestinationPath monitor-tool.zip"

echo.
echo 打包完成! 文件位置: dist\monitor-tool.zip
echo.

pause
