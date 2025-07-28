@echo off
title 服务监控工具安装程序
echo ================================
echo   服务监控工具安装程序
echo ================================
echo.

REM Create installation directory
set INSTALL_DIR=%ProgramFiles%\ServiceMonitor
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo 正在复制文件...
xcopy /E /I /Y ".\*" "%INSTALL_DIR%\"
echo D | xcopy /E /I /Y ".\config" "%INSTALL_DIR%\config\"
echo D | xcopy /E /I /Y ".\backend" "%INSTALL_DIR%\backend\"
echo D | xcopy /E /I /Y ".\frontend" "%INSTALL_DIR%\frontend\"

echo 正在创建桌面快捷方式...
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%USERPROFILE%\Desktop\ServiceMonitor.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%INSTALL_DIR%\launch.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs
cscript CreateShortcut.vbs
del CreateShortcut.vbs

echo.
echo 安装完成！
echo 桌面已创建快捷方式: ServiceMonitor.lnk
echo 双击快捷方式即可启动服务监控工具
echo.
echo 注意: 首次运行前请确保已安装 Node.js 环境
echo 下载地址: https://nodejs.org/
echo.
pause
