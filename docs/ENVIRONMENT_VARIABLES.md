# 环境变量配置说明

## 概述

本项目使用环境变量来配置不同环境（开发、测试、生产）的设置。环境变量分为以下几类：

1. **系统环境变量** - 由操作系统或运行时环境提供
2. **项目环境变量** - 在项目文件中定义，包括`.env`、`.env.local`、`.env.development`等

## 环境变量文件优先级

环境变量的加载遵循以下优先级（从高到低）：

1. `.env.development.local` (存在时)
2. `.env.local`
3. `.env.development` (存在时)
4. `.env`

## 核心环境变量

### 1. APP_PORT
- **用途**: 前端React应用运行端口
- **默认值**: 8085
- **使用位置**: React开发服务器通过`PORT`环境变量读取此值
- **示例**: `APP_PORT=8085`

### 2. SERVER_PORT
- **用途**: 后端Express服务运行端口
- **默认值**: 3001
- **使用位置**: 后端服务在启动时读取此值
- **示例**: `SERVER_PORT=3001`

### 3. REACT_APP_API_BASE_URL
- **用途**: 前端API调用的基础URL
- **默认值**: http://localhost:3001
- **使用位置**: 所有前端API调用都使用此URL作为基础路径
- **示例**: `REACT_APP_API_BASE_URL=http://localhost:3001`

## 环境变量使用规范

### 前端使用
1. 只有以`REACT_APP_`开头的环境变量可以在前端代码中访问
2. 所有API调用应使用统一的`REACT_APP_API_BASE_URL`环境变量
3. 前端端口通过`APP_PORT`环境变量配置

### 后端使用
1. 后端端口通过`SERVER_PORT`环境变量配置
2. 后端不应直接使用前端特定的环境变量（如`REACT_APP_*`）

## 各环境配置示例

### 开发环境 (.env.development)
```bash
# 开发环境配置
SERVER_PORT=3001
APP_PORT=8085
REACT_APP_API_BASE_URL=http://localhost:3001
```

### 本地开发环境 (.env.local)
```bash
# 本地开发环境配置（不会被git提交）
SERVER_PORT=3001
APP_PORT=8085
REACT_APP_API_BASE_URL=http://localhost:3001
```

### 生产环境
在生产环境中，应通过操作系统或部署平台设置环境变量，而不是使用`.env`文件。

## 启动命令

### 默认开发模式
```bash
npm run dev
```

### 指定端口的开发模式
```bash
APP_PORT=8085 SERVER_PORT=3001 npm run dev
```

## 常见问题

### 1. 端口冲突
如果遇到端口冲突，可以修改`APP_PORT`或`SERVER_PORT`环境变量：
```bash
APP_PORT=8086 SERVER_PORT=3002 npm run dev
```

### 2. API调用失败
如果前端API调用失败，请检查`REACT_APP_API_BASE_URL`是否与后端服务实际运行的地址一致。

### 3. 环境变量未生效
修改环境变量后需要重启开发服务器才能生效。