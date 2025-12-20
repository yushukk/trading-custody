# 环境变量配置说明

## 📋 概述

本项目使用环境变量来配置不同环境（开发、测试、生产）的设置。所有环境变量配置都通过 `.env` 文件管理，并由 `dotenv` 包加载。

## 🚀 快速开始

### 1. 生成安全密钥

首次使用前，需要生成 JWT 密钥：

```bash
node scripts/generate-secrets.js
```

### 2. 创建 .env 文件

复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

### 3. 配置环境变量

将生成的密钥复制到 `.env` 文件中，替换默认的占位符。

## 📝 环境变量文件说明

### 文件类型

- **`.env.example`** - 环境变量模板文件（会被提交到 Git）
- **`.env`** - 实际使用的环境变量文件（不会被提交到 Git）
- **`.env.local`** - 本地覆盖配置（优先级最高，不会被提交到 Git）

### 加载优先级

环境变量的加载遵循以下优先级（从高到低）：

1. 系统环境变量
2. `.env.local`
3. `.env`
4. `.env.example`（仅作为参考）

## 🔧 环境变量详解

### 应用配置

#### NODE_ENV
- **用途**: 运行环境标识
- **可选值**: `development` | `production` | `test`
- **默认值**: `development`
- **示例**: `NODE_ENV=production`

#### APP_PORT
- **用途**: 前端 React 应用运行端口
- **默认值**: `8085`
- **使用位置**: React 开发服务器
- **示例**: `APP_PORT=8085`

#### SERVER_PORT
- **用途**: 后端 Express 服务运行端口
- **默认值**: `3001`
- **使用位置**: `server/config/env.js`
- **示例**: `SERVER_PORT=3001`

### 数据库配置

#### DATABASE_PATH
- **用途**: SQLite 数据库文件路径
- **默认值**: `./server/database.db`
- **使用位置**: `server/config/env.js`
- **示例**: `DATABASE_PATH=./server/database.db`
- **注意**: 生产环境建议使用绝对路径

### JWT 配置（必需）

#### JWT_ACCESS_SECRET
- **用途**: JWT 访问令牌签名密钥
- **默认值**: 无（必须配置）
- **生成方式**: 运行 `node scripts/generate-secrets.js`
- **安全要求**: 至少 64 字节的随机字符串
- **示例**: `JWT_ACCESS_SECRET=your-generated-secret-here`

#### JWT_REFRESH_SECRET
- **用途**: JWT 刷新令牌签名密钥
- **默认值**: 无（必须配置）
- **生成方式**: 运行 `node scripts/generate-secrets.js`
- **安全要求**: 至少 64 字节的随机字符串
- **示例**: `JWT_REFRESH_SECRET=your-generated-secret-here`

#### JWT_ACCESS_EXPIRES_IN
- **用途**: 访问令牌过期时间
- **默认值**: `15m`
- **格式**: 数字+单位（s=秒, m=分钟, h=小时, d=天）
- **示例**: `JWT_ACCESS_EXPIRES_IN=15m`

#### JWT_REFRESH_EXPIRES_IN
- **用途**: 刷新令牌过期时间
- **默认值**: `7d`
- **格式**: 数字+单位（s=秒, m=分钟, h=小时, d=天）
- **示例**: `JWT_REFRESH_EXPIRES_IN=7d`

### CORS 配置

#### CORS_ORIGIN
- **用途**: 允许跨域请求的源地址
- **默认值**: `http://localhost:8085`
- **开发环境**: `http://localhost:8085`
- **生产环境**: 设置为实际的前端域名
- **示例**: `CORS_ORIGIN=https://your-domain.com`
- **注意**: 生产环境不要使用 `*`

### 外部 API 配置

#### STOCK_API_URL
- **用途**: 股票数据 API 地址
- **默认值**: `http://23.95.205.223:18201/api/public/stock_zh_a_hist`
- **使用位置**: `server/services/priceService.js`
- **示例**: `STOCK_API_URL=http://your-api-server/stock`

#### FUTURE_API_URL
- **用途**: 期货数据 API 地址
- **默认值**: `http://23.95.205.223:18201/api/public/futures_hist_em`
- **使用位置**: `server/services/priceService.js`
- **示例**: `FUTURE_API_URL=http://your-api-server/future`

### 定时任务配置

#### PRICE_SYNC_CRON
- **用途**: 价格同步定时任务的 Cron 表达式
- **默认值**: `0 17 * * *`（每天 17:00）
- **格式**: Cron 表达式（秒 分 时 日 月 周）
- **示例**: `PRICE_SYNC_CRON=0 17 * * *`
- **常用配置**:
  - 每天 17:00: `0 17 * * *`
  - 每小时: `0 * * * *`
  - 每 30 分钟: `*/30 * * * *`

### 日志配置

#### LOG_LEVEL
- **用途**: 日志输出级别
- **可选值**: `error` | `warn` | `info` | `debug`
- **默认值**: `info`
- **示例**: `LOG_LEVEL=info`

#### LOG_FILE_PATH
- **用途**: 日志文件存储路径
- **默认值**: `./logs/app.log`
- **示例**: `LOG_FILE_PATH=./logs/app.log`

### 前端配置

#### REACT_APP_API_BASE_URL
- **用途**: 前端 API 调用的基础 URL
- **默认值**: `http://localhost:3001`
- **使用位置**: `src/config/api.js`
- **示例**: `REACT_APP_API_BASE_URL=http://localhost:3001`
- **注意**: 必须以 `REACT_APP_` 开头才能在前端访问

## 🔒 安全最佳实践

### 1. 密钥管理

- ✅ **使用强随机密钥**: 运行 `node scripts/generate-secrets.js` 生成
- ✅ **不同环境使用不同密钥**: 开发、测试、生产环境的密钥应该不同
- ✅ **定期轮换密钥**: 建议每 3-6 个月更换一次生产环境密钥
- ❌ **不要硬编码密钥**: 所有密钥都应通过环境变量配置
- ❌ **不要提交 .env 文件**: `.env` 文件已在 `.gitignore` 中

### 2. 生产环境配置

```bash
# 生产环境示例
NODE_ENV=production
SERVER_PORT=3001
DATABASE_PATH=/var/lib/trading-custody/database.db
JWT_ACCESS_SECRET=<生产环境专用的强随机密钥>
JWT_REFRESH_SECRET=<生产环境专用的强随机密钥>
CORS_ORIGIN=https://your-production-domain.com
LOG_LEVEL=warn
```

### 3. 环境变量验证

项目启动时会自动验证必需的环境变量（在 `server/config/env.js` 中）：

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

如果缺少必需的环境变量，应用将拒绝启动并显示错误信息。

## 📦 各环境配置示例

### 开发环境

```bash
# .env
NODE_ENV=development
APP_PORT=8085
SERVER_PORT=3001
DATABASE_PATH=./server/database.db
JWT_ACCESS_SECRET=<运行 generate-secrets.js 生成>
JWT_REFRESH_SECRET=<运行 generate-secrets.js 生成>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8085
STOCK_API_URL=http://23.95.205.223:18201/api/public/stock_zh_a_hist
FUTURE_API_URL=http://23.95.205.223:18201/api/public/futures_hist_em
PRICE_SYNC_CRON=0 17 * * *
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log
REACT_APP_API_BASE_URL=http://localhost:3001
```

### 生产环境

生产环境建议通过系统环境变量或容器编排工具（如 Docker、Kubernetes）设置：

```bash
# Docker Compose 示例
environment:
  - NODE_ENV=production
  - SERVER_PORT=3001
  - DATABASE_PATH=/data/database.db
  - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
  - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
  - CORS_ORIGIN=https://your-domain.com
  - LOG_LEVEL=warn
```

## 🚀 启动命令

### 开发模式

```bash
# 使用默认配置
npm run dev

# 指定端口
APP_PORT=8086 SERVER_PORT=3002 npm run dev

# 使用本地配置文件
npm run dev:local
```

### 生产模式

```bash
# 构建前端
npm run build

# 启动后端服务
NODE_ENV=production npm start
```

## ❓ 常见问题

### 1. 缺少必需的环境变量

**错误信息**: `缺少必需的环境变量: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET`

**解决方案**:
```bash
# 1. 生成密钥
node scripts/generate-secrets.js

# 2. 复制生成的密钥到 .env 文件
# 3. 重启应用
```

### 2. 端口冲突

**错误信息**: `Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**:
```bash
# 方法 1: 修改端口
SERVER_PORT=3002 npm run dev

# 方法 2: 停止占用端口的进程
lsof -ti:3001 | xargs kill -9
```

### 3. API 调用失败

**错误信息**: `Network Error` 或 `CORS Error`

**解决方案**:
1. 检查 `REACT_APP_API_BASE_URL` 是否正确
2. 检查 `CORS_ORIGIN` 是否包含前端地址
3. 确保后端服务正在运行

### 4. 环境变量未生效

**原因**: 修改环境变量后未重启服务

**解决方案**:
```bash
# 停止所有服务（Ctrl+C）
# 重新启动
npm run dev
```

### 5. 前端无法访问环境变量

**原因**: 环境变量名称不符合规范

**解决方案**:
- 前端环境变量必须以 `REACT_APP_` 开头
- 修改后需要重新构建前端应用

## 📚 相关文档

- [技术架构优化方案](../技术架构优化方案.md)
- [部署文档](./deployment.md)
- [Docker 部署文档](./DOCKER_DEPLOYMENT.md)

## 🔄 更新日志

- **2025-12-20**: 完善环境变量文档，添加安全最佳实践和详细说明
- **2025-12-19**: 初始版本创建