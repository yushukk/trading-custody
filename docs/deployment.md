# 部署和配置文档

## 环境要求

- Node.js (建议 v16+)
- npm
- SQLite (无需单独安装服务，sqlite3 包自动集成)

## 安装步骤

1. 克隆项目代码：
   ```bash
   git clone <repository-url>
   cd trading_custody
   ```

2. 安装前端依赖：
   ```bash
   npm install
   ```

3. 安装后端依赖：
   ```bash
   cd server
   npm install
   cd ..
   ```

## 运行环境

### 开发环境

启动开发服务器：
```bash
npm run dev
```
这将同时启动前端开发服务器和后端服务。

单独启动后端：
```bash
npm run server
```

单独启动前端：
```bash
npm run client
```

### 生产环境

构建项目：
```bash
npm run build
```

启动生产服务器：
```bash
npm start
```

或者使用静态文件服务器：
```bash
npm run serve
```

## 配置说明

### 环境变量

在 `server/config.js` 中可以配置以下参数：

- `PORT`: 服务器端口，默认 3001
- `DATABASE_PATH`: 数据库文件路径，默认 './server/database.db'
- `API_BASE_URL`: API基础URL，默认 'http://localhost:3001'
- `EXTERNAL_APIS`: 外部API配置
- `CRON_SCHEDULE`: 定时任务调度配置

### 数据库配置

项目使用 SQLite 作为数据库，数据库文件默认位于 `server/database.db`。

### 外部API配置

项目需要访问外部API获取股票和期货价格数据：
- 股票数据API: `http://23.95.205.223:18201/api/public/stock_zh_a_hist`
- 期货数据API: `http://23.95.205.223:18201/api/public/futures_hist_em`

## 部署脚本

项目提供了以下部署脚本：

- `deploy.sh`: 一键部署脚本
- `deploy_backend.sh`: 后端部署脚本
- `deploy_frontend.sh`: 前端部署脚本
- `download_deploy.sh`: 下载部署脚本

## 安全建议

1. 在生产环境中使用 HTTPS
2. 更改默认的 JWT 密钥
3. 对用户密码进行加密存储
4. 限制数据库并发访问
5. 定期备份数据库文件

## 故障排除

### 常见问题

1. 端口被占用：
   ```bash
   npx kill-port 3001
   ```

2. 依赖安装失败：
   ```bash
   npm install --legacy-peer-deps
   ```

3. 数据库连接问题：
   检查 `server/database.db` 文件权限和路径

### 日志查看

后端日志文件位于 `server/logs/` 目录下：
- `error.log`: 错误日志
- `combined.log`: 综合日志

## 性能优化

1. 启用 gzip 压缩
2. 使用 CDN 加速静态资源
3. 优化数据库查询
4. 合理设置缓存策略