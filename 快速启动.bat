@echo off
chcp 65001 >nul
title 服务监控工具

echo 🚀 启动服务监控工具...
echo 📍 访问地址: http://localhost:3000
echo.

:: 检查依赖
if not exist "node_modules" (
    echo 📦 安装依赖中...
    npm install --silent
)

:: 启动服务
npm start