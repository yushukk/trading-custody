# Trading Custody System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/trading-custody/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-blue.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/trading-custody/pulls)
[![Build Status](https://img.shields.io/github/workflow/status/your-username/trading-custody/CI)](https://github.com/your-username/trading-custody/actions)
[![Coverage Status](https://img.shields.io/codecov/c/github/your-username/trading-custody)](https://codecov.io/gh/your-username/trading-custody)

## 简介

Trading Custody System 是一个基于 React 和 Express 的开源交易与托管管理系统。该系统旨在为个人投资者提供资金和持仓管理功能，同时为管理员提供用户和数据统一管控能力。

主要特性：
- 用户身份验证和权限管理（JWT）
- 资金流水记录和余额管理
- 股票、期货、基金等持仓管理
- 管理员后台管理系统
- 响应式设计，支持移动端访问
- 完整的测试覆盖（单元测试、集成测试、端到端测试）

### 屏幕截图

![Dashboard](docs/screenshots/dashboard.png)
![User Management](docs/screenshots/user-management.png)

## 技术栈

### 前端
- [React 18](https://reactjs.org/) - 用于构建用户界面的JavaScript库
- [Ant Design](https://ant.design/) & [Ant Design Mobile](https://mobile.ant.design/) - 企业级UI设计语言和React组件库
- [React Router v6](https://reactrouter.com/) - React应用的声明式路由
- [Create React App](https://create-react-app.dev/) - React应用的官方脚手架工具

### 后端
- [Express.js](https://expressjs.com/) - Node.js的快速、无约束的web应用框架
- [SQLite](https://www.sqlite.org/) - 轻量级嵌入式数据库
- [JWT](https://jwt.io/) (JSON Web Tokens) - 安全的用户身份验证
- [Winston](https://github.com/winstonjs/winston) - 多传输异步日志记录库

### 开发工具
- [Jest](https://jestjs.io/) - JavaScript测试框架
- [Cypress](https://www.cypress.io/) - 端到端测试工具
- [Nodemon](https://nodemon.io/) - 监控文件变化并自动重启应用
- [Concurrently](https://github.com/open-cli-tools/concurrently) - 并行执行多个命令

## 核心功能

### 用户系统
- 用户注册/登录（JWT认证）
- 密码修改
- 用户角色区分（普通用户/管理员）

### 资金管理
- 设置初始资金
- 追加/取出资金
- 实时余额显示
- 资金流水记录查询

### 持仓管理
- 添加股票/期货/基金持仓
- 买入/卖出操作
- 持仓记录展示
- 盈亏计算

### 管理员功能
- 用户管理（增删改查）
- 查看所有用户的资金与持仓数据
- 资金和持仓操作管理

## 环境变量配置

项目使用环境变量来配置不同环境的设置。详细说明请参考 [环境变量配置文档](docs/ENVIRONMENT_VARIABLES.md)。

### 核心环境变量

| 变量名 | 用途 | 默认值 |
|--------|------|--------|
| `APP_PORT` | 前端React应用运行端口 | 8085 |
| `SERVER_PORT` | 后端Express服务运行端口 | 3001 |
| `REACT_APP_API_BASE_URL` | 前端API调用的基础URL | http://localhost:3001 |

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone https://github.com/your-username/trading-custody.git
cd trading-custody

# 安装所有依赖
npm install
```

### 开发环境

```bash
# 启动开发服务器（前端:8085, 后端:3001）
npm run dev

# 或者指定端口启动
APP_PORT=8085 SERVER_PORT=3001 npm run dev
```

访问 http://localhost:8085 查看应用

### 生产构建

```bash
# 构建前端应用
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
trading-custody/
├── src/                 # 前端源码
│   ├── components/      # React组件
│   ├── api/             # API调用封装
│   ├── hooks/           # 自定义Hooks
│   ├── utils/           # 工具函数
│   ├── styles/          # 全局样式
│   └── layouts/         # 页面布局
├── server/              # 后端源码
│   ├── controllers/     # 控制器
│   ├── services/        # 业务逻辑
│   ├── middleware/      # 中间件
│   ├── utils/           # 工具函数
│   └── tests/           # 后端测试
├── cypress/             # 端到端测试
├── public/              # 静态资源
└── docs/                # 文档
```

## API 文档

### 认证API
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/change-password` - 修改密码

### 用户API
- `GET /api/users` - 获取所有用户（管理员）
- `GET /api/users/:id` - 获取特定用户信息
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户（管理员）

### 资金API
- `GET /api/funds` - 获取资金记录
- `POST /api/funds` - 添加资金记录
- `PUT /api/funds/:id` - 更新资金记录

### 持仓API
- `GET /api/positions` - 获取持仓记录
- `POST /api/positions` - 添加持仓记录
- `PUT /api/positions/:id` - 更新持仓记录
- `DELETE /api/positions/:id` - 删除持仓记录

## 测试

### 单元测试
```bash
# 运行前端单元测试
npm test

# 运行后端单元测试
npm run test:server

# 生成测试覆盖率报告
npm run test:coverage
```

### 端到端测试
```bash
# 运行端到端测试
npm run test:e2e

# 打开Cypress测试界面
npm run test:e2e:open
```

## 部署

### 手动部署
```bash
# 构建前端应用
npm run build

# 启动生产服务器
npm start
```

### Docker部署

本项目支持通过Docker进行容器化部署，包含以下组件：
- 前端React应用（通过Nginx提供服务）
- 后端Express服务
- SQLite数据库（数据持久化）

#### 部署步骤

1. 确保已安装Docker和Docker Compose
2. 在项目根目录执行以下命令构建和启动服务：

```bash
# 构建Docker镜像
docker-compose build

# 启动所有服务
docker-compose up -d
```

3. 访问应用：
   - 前端应用：http://localhost
   - 后端API：http://localhost:3001

4. 停止服务：

```bash
# 停止并移除容器
docker-compose down
```

#### Docker配置说明

- 前端服务运行在80端口
- 后端服务运行在3001端口
- 数据库文件存储在Docker卷中以确保数据持久化
- 前端通过Nginx反向代理与后端通信

#### 自定义配置

可以通过修改docker-compose.yml文件来调整以下配置：
- 端口映射
- 环境变量
- 数据卷路径

## 贡献

欢迎任何形式的贡献！在贡献之前，请阅读以下文档：

- [贡献指南](CONTRIBUTING.md)
- [行为准则](CODE_OF_CONDUCT.md)