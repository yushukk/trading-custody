# Docker部署指南

本文档详细说明了如何使用Docker和Docker Compose来部署Trading Custody System应用。

## 目录结构

项目包含以下Docker相关文件：

```
trading-custody/
├── Dockerfile.backend     # 后端服务Dockerfile
├── Dockerfile.frontend    # 前端应用Dockerfile
├── docker-compose.yml     # Docker Compose配置文件
├── nginx.conf             # Nginx配置文件
└── .dockerignore          # Docker构建忽略文件
```

## 架构说明

Docker部署方案包含以下服务：

1. **backend** - 基于Node.js的后端服务
2. **frontend** - 基于Nginx的前端应用
3. **数据持久化** - 通过Docker卷存储SQLite数据库文件

## 部署步骤

### 1. 安装Docker

确保系统已安装Docker和Docker Compose：

```bash
# 检查Docker版本
docker --version
docker-compose --version
```

### 2. 构建镜像

在项目根目录执行：

```bash
docker-compose build
```

### 3. 启动服务

```bash
# 后台启动所有服务
docker-compose up -d
```

### 4. 访问应用

- 前端应用：http://localhost
- 后端API：http://localhost:3001

### 5. 停止服务

```bash
# 停止并移除容器
docker-compose down
```

## 配置说明

### 环境变量

可以通过修改docker-compose.yml文件中的environment部分来调整配置：

```yaml
environment:
  - NODE_ENV=production
  - DATABASE_PATH=/app/server/data/database.db
  - SERVER_PORT=3001
```

### 端口映射

默认端口配置：

```yaml
ports:
  - "3001:3001"  # 后端服务端口映射
  - "80:80"      # 前端应用端口映射
```

### 数据持久化

数据库文件通过Docker卷进行持久化存储：

```yaml
volumes:
  - backend-data:/app/server/data
```

## 故障排除

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend
```

### 重新构建

如果修改了代码或配置，需要重新构建镜像：

```bash
# 重新构建所有服务
docker-compose build

# 重新构建特定服务
docker-compose build backend
```

### 数据库问题

如果遇到数据库连接问题，检查：

1. 数据库文件权限
2. DATABASE_PATH环境变量配置
3. 数据卷挂载配置

## 性能优化

### 构建优化

.dockerignore文件排除了不必要的文件，以减小镜像大小并加快构建速度。

### 多阶段构建

前端Dockerfile使用多阶段构建：
1. 构建阶段：使用Node.js镜像编译React应用
2. 生产阶段：使用Nginx镜像提供静态文件服务

## 安全考虑

1. 使用Alpine基础镜像减小攻击面
2. 仅安装生产环境依赖
3. 避免在镜像中包含敏感信息
4. 使用非root用户运行应用（可选增强）