# Docker部署支持设计文档

## 概述

本设计文档旨在为Trading Custody System项目添加完整的Docker部署支持，包括Dockerfile构建配置和Docker Compose编排方案。通过容器化部署，可以简化应用的部署流程，提高环境一致性，并便于在不同环境中快速部署和扩展。

## 项目架构分析

Trading Custody System是一个全栈应用，包含以下核心组件：

1. **前端应用**：基于React的单页应用，通过Node.js服务提供静态资源
2. **后端服务**：基于Express.js的API服务，使用SQLite作为数据存储
3. **数据库**：SQLite数据库文件，存储在文件系统中

为了实现Docker部署，我们需要将前端和后端分别容器化，并确保它们能够正确通信。

## Docker化方案设计

### 1. 后端服务Dockerfile

为后端Express.js服务创建Dockerfile，包含以下关键要素：

- 基于轻量级Node.js镜像
- 复制项目依赖文件并安装依赖
- 复制后端源代码
- 暴露服务端口
- 定义容器启动命令

### 2. 前端应用Dockerfile

为前端React应用创建Dockerfile，包含以下关键要素：

- 多阶段构建（构建阶段和生产阶段）
- 构建阶段使用Node.js镜像进行React应用构建
- 生产阶段使用轻量级Web服务器（Nginx）提供静态资源
- 复制构建产物到生产环境
- 配置Nginx以支持React Router的客户端路由

### 3. Docker Compose编排

创建docker-compose.yml文件，定义以下服务：

- backend服务：运行后端API服务
- frontend服务：运行前端应用
- 数据卷配置：持久化SQLite数据库文件
- 网络配置：确保服务间可以通信
- 环境变量配置：设置服务端口和API地址

## 详细设计

### 后端服务Dockerfile设计

```dockerfile
# 使用官方Node.js运行时作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制后端源代码
COPY server/ ./server/

# 复制公共文件
COPY public/ ./public/

# 创建数据库目录
RUN mkdir -p ./server/data

# 暴露端口
EXPOSE 3001

# 定义环境变量
ENV NODE_ENV=production
ENV DATABASE_PATH=./server/data/database.db

# 启动应用
CMD ["node", "server/server.js"]
```

### 前端应用Dockerfile设计

```dockerfile
# 构建阶段
FROM node:16-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装所有依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物到nginx默认目录
COPY --from=builder /app/build /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx配置设计

为前端应用创建nginx.conf文件，支持React Router的客户端路由：

```nginx
events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  
  server {
    listen 80;
    server_name localhost;
    
    location / {
      root /usr/share/nginx/html;
      index index.html index.htm;
      try_files $uri $uri/ /index.html;
    }
    
    location /api {
      proxy_pass http://backend:3001;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
      root /usr/share/nginx/html;
    }
  }
}
```

### Docker Compose配置设计

创建docker-compose.yml文件，定义服务编排：

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    volumes:
      - backend-data:/app/server/data
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/server/data/database.db
      - SERVER_PORT=3001
    networks:
      - app-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_BASE_URL=http://localhost:3001
    networks:
      - app-network

volumes:
  backend-data:

networks:
  app-network:
    driver: bridge
```

### 环境变量配置

为支持灵活的配置，需要定义以下环境变量：

| 变量名 | 用途 | 默认值 |
|--------|------|--------|
| SERVER_PORT | 后端服务监听端口 | 3001 |
| DATABASE_PATH | SQLite数据库文件路径 | ./server/data/database.db |
| NODE_ENV | Node.js运行环境 | production |
| REACT_APP_API_BASE_URL | 前端API基础URL | http://localhost:3001 |

#### 开发环境与生产环境的差异

在Docker部署中，需要注意开发环境与生产环境的配置差异：

1. **端口配置**：开发环境前端默认使用3000端口，生产环境使用80端口
2. **API地址**：开发环境直接访问后端服务，生产环境通过Nginx反向代理
3. **数据库路径**：生产环境需要确保数据库文件在容器重启后持久化
4. **日志输出**：生产环境应配置适当的日志级别以避免日志文件过大

## 部署流程

1. **构建镜像**：
   ```bash
   docker-compose build
   ```

2. **启动服务**：
   ```bash
   docker-compose up -d
   ```

3. **访问应用**：
   - 前端应用：http://localhost
   - 后端API：http://localhost:3001

4. **停止服务**：
   ```bash
   docker-compose down
   ```

## 数据持久化策略

为确保数据在容器重启后不丢失，采用以下策略：

1. 使用Docker卷挂载SQLite数据库文件
2. 将数据库文件存储在独立的卷中
3. 配置适当的文件权限确保数据库可读写

## 网络通信设计

1. 前端容器通过服务名"backend"访问后端API
2. 使用自定义Docker网络确保服务间安全通信
3. 配置Nginx反向代理将/api请求转发到后端服务

## 安全考虑

1. 使用多阶段构建减小镜像体积
2. 使用Alpine基础镜像减少攻击面
3. 仅安装生产环境依赖
4. 避免在镜像中包含敏感信息
5. 使用非root用户运行应用（可选增强）

## 性能优化

1. 使用.dockerignore文件排除不必要的文件
2. 合理组织Dockerfile指令以利用层缓存
3. 使用npm ci命令确保依赖安装的一致性和速度
4. 在生产环境中设置适当的资源限制

### .dockerignore文件设计

为优化Docker构建过程，需要创建.dockerignore文件，排除不必要的文件和目录：

```
# Dependencies
node_modules

# Build outputs
build
dist

# Logs
logs
*.log

# Runtime data
server/data/*.db
server/data/*.db-journal

# IDE and editor files
.idea/
.vscode/
*.swp
*.swo

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Testing
coverage
.nyc_output

# Cypress
cypress/screenshots/
cypress/videos/

# Git
.git
.gitignore

# OS generated files
.DS_Store
Thumbs.db

# npm
npm-debug.log*
.npm

# Optional npm cache directory
.npm
```

## 测试验证

部署完成后，需要验证以下功能：

1. 应用正常启动且端口监听正常
2. 前后端服务可以正常通信
3. 数据库读写功能正常
4. 用户认证和授权功能正常
5. 所有核心业务功能正常运行

## 故障排除

在Docker部署过程中可能遇到的问题及解决方案：

1. **数据库连接失败**：
   - 检查DATABASE_PATH环境变量配置
   - 确认数据卷挂载正确
   - 验证数据库文件权限

2. **前端无法访问后端API**：
   - 检查Nginx反向代理配置
   - 确认Docker网络配置正确
   - 验证后端服务是否正常运行

3. **容器启动失败**：
   - 查看容器日志：`docker-compose logs`
   - 检查端口冲突
   - 验证环境变量配置

4. **构建过程缓慢**：
   - 检查.dockerignore文件是否排除了不必要的文件
   - 确认Dockerfile层缓存是否有效利用