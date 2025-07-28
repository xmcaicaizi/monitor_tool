# 服务监控工具 (Service Monitor Tool)

一个简单易用的服务监控工具，可以监控网站或服务的可用性状态。

## 功能特性

- 实时监控多个服务的状态（正常/异常）
- 可自定义检测间隔（秒、分钟、小时、天）
- 一键检测所有服务
- 每日定时自动检测所有服务
- 可视化界面展示服务状态
- 添加、编辑、删除监控服务
- 响应式设计，支持各种设备

## 技术栈

- 后端：Node.js + Express
- 前端：Vue.js + 原生 JavaScript
- 调度：node-schedule
- HTTP客户端：axios

## 安装与运行

### 开发环境运行

1. 克隆项目：
   ```bash
   git clone <repository-url>
   cd monitor-tool
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动服务：
   ```bash
   npm start
   ```

4. 访问应用：
   打开浏览器访问 `http://localhost:3000`

### 生产环境打包

```bash
npm run build
```

这将生成一个可执行文件 `monitor-tool.exe`。

### Windows 环境安装

对于 Windows 用户，项目提供了安装包：

1. 运行 `package.bat` 脚本创建分发包
2. 解压生成的 `service-monitor-tool.zip` 文件
3. 运行 `install.bat` 脚本进行安装
4. 安装完成后，桌面会创建快捷方式，双击即可启动应用

注意：首次运行前请确保已安装 Node.js 环境（推荐 v14.x 或更高版本）。
下载地址：https://nodejs.org/

## 使用说明

1. **添加服务**：点击"添加服务"按钮，填写服务名称、地址和检测间隔
2. **编辑服务**：点击服务卡片上的"编辑"按钮修改服务信息
3. **删除服务**：点击服务卡片上的"删除"按钮移除服务
4. **手动检测**：点击"立即检测"按钮手动检测单个服务状态
5. **一键检测**：点击"一键检测所有服务"按钮检测所有服务
6. **设置每日检查**：选择时间并点击"设置每日检查"按钮，系统将在每天指定时间自动检测所有服务

## 配置文件

- `config/services.json`：存储监控服务的配置信息

## API 接口

- `GET /api/services`：获取所有服务
- `POST /api/services`：添加新服务
- `PUT /api/services/:id`：更新服务
- `DELETE /api/services/:id`：删除服务
- `POST /api/services/:id/check`：检测单个服务状态
- `POST /api/services/check-all`：检测所有服务状态
- `POST /api/services/schedule-daily-check`：设置每日检查
- `POST /api/services/cancel-daily-check`：取消每日检查

## 许可证

MIT
