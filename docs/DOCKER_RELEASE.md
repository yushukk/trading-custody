# Docker 镜像发布规范

本文档详细说明了 Trading Custody System 的 Docker 镜像发布流程和规范。

## 目录

- [概述](#概述)
- [版本管理规范](#版本管理规范)
- [发布前准备](#发布前准备)
- [发布流程](#发布流程)
- [发布后验证](#发布后验证)
- [回滚流程](#回滚流程)
- [常见问题](#常见问题)

## 概述

### 镜像仓库

- **仓库地址**: Docker Hub (docker.io)
- **用户名**: yushu
- **后端镜像**: `yushu/trading-custody-backend`
- **前端镜像**: `yushu/trading-custody`

### 镜像架构

项目包含两个独立的 Docker 镜像：

1. **后端镜像** (`trading-custody-backend`)
   - 基于 Node.js Alpine
   - 包含 Express 服务器和 SQLite 数据库
   - 端口: 3001

2. **前端镜像** (`trading-custody`)
   - 基于 Nginx Alpine
   - 包含构建后的 React 应用
   - 通过 Nginx 反向代理访问后端
   - 端口: 80

## 版本管理规范

### 语义化版本控制

遵循 [Semantic Versioning 2.0.0](https://semver.org/) 规范：

```
主版本号.次版本号.修订号 (MAJOR.MINOR.PATCH)
```

#### 版本号递增规则

- **主版本号 (MAJOR)**: 不兼容的 API 修改
  - 示例: `1.0.0` → `2.0.0`
  - 场景: 数据库结构重大变更、API 接口破坏性更新

- **次版本号 (MINOR)**: 向下兼容的功能性新增
  - 示例: `1.0.0` → `1.1.0`
  - 场景: 新增功能模块、新增 API 接口

- **修订号 (PATCH)**: 向下兼容的问题修正
  - 示例: `1.0.0` → `1.0.1`
  - 场景: Bug 修复、性能优化、安全补丁

#### 版本标签规范

- **版本号格式**: `v{MAJOR}.{MINOR}.{PATCH}`
- **示例**: `v1.0.0`, `v1.0.1`, `v1.1.0`, `v2.0.0`
- **latest 标签**: 始终指向最新的稳定版本

### 版本号示例

```bash
# Bug 修复
v1.0.0 → v1.0.1  # 修复登录问题
v1.0.1 → v1.0.2  # 修复数据显示错误

# 功能新增
v1.0.2 → v1.1.0  # 新增导出功能
v1.1.0 → v1.2.0  # 新增报表模块

# 重大更新
v1.2.0 → v2.0.0  # 数据库架构升级
```

## 发布前准备

### 1. 代码准备

#### 确保代码质量

```bash
# 运行代码检查
npm run lint

# 运行测试套件
npm run test
npm run test:server

# 检查代码格式
npm run format:check
```

#### 更新版本信息

1. **更新 package.json 版本号**

```json
{
  "version": "1.0.1"
}
```

2. **更新 CHANGELOG.md**

```markdown
## [1.0.1] - 2025-12-23

### 修复
- 修复用户登录时的 token 过期问题
- 修复持仓数据显示不准确的问题
- 优化前端性能

### 变更
- 更新依赖包版本
```

3. **提交代码变更**

```bash
# 提交版本更新
git add package.json CHANGELOG.md
git commit -m "chore: bump version to v1.0.1"

# 创建 Git 标签
git tag -a v1.0.1 -m "Release v1.0.1: Bug fixes and performance improvements"

# 推送到远程仓库
git push origin main
git push origin v1.0.1
```

### 2. 环境检查

#### 检查 Docker 环境

```bash
# 检查 Docker 版本
docker --version
# 要求: Docker version 20.10.0 或更高

# 检查 Docker 服务状态
docker info

# 检查磁盘空间
df -h
# 建议: 至少 10GB 可用空间
```

#### 检查网络连接

```bash
# 测试 Docker Hub 连接
ping hub.docker.com

# 测试 Docker 登录
docker login docker.io
```

### 3. 配置检查

#### 验证发布脚本配置

编辑 `docker-publish.sh`，确认以下配置：

```bash
DOCKER_REGISTRY="docker.io"
DOCKER_USERNAME="yushu"
IMAGE_NAME_BACKEND="trading-custody-backend"
IMAGE_NAME_FRONTEND="trading-custody"
```

#### 准备 Docker Hub 凭证

- 登录 [Docker Hub](https://hub.docker.com/)
- 生成访问令牌（推荐）或准备密码
- 路径: Account Settings → Security → New Access Token

## 发布流程

### 自动化发布（推荐）

使用 `docker-publish.sh` 脚本进行一键发布：

```bash
# 1. 赋予脚本执行权限（首次使用）
chmod +x docker-publish.sh

# 2. 执行发布脚本
./docker-publish.sh v1.0.1
```

#### 脚本执行步骤

脚本会自动完成以下步骤：

1. ✅ **环境检查**
   - 检查 Docker 是否安装
   - 验证配置信息

2. ✅ **构建镜像**
   - 构建后端镜像（包含版本标签和 latest 标签）
   - 构建前端镜像（包含版本标签和 latest 标签）

3. ✅ **登录仓库**
   - 提示输入 Docker Hub 密码或访问令牌
   - 登录到 Docker Registry

4. ✅ **推送镜像**
   - 推送后端镜像（版本标签）
   - 推送后端镜像（latest 标签）
   - 推送前端镜像（版本标签）
   - 推送前端镜像（latest 标签）

5. ✅ **显示结果**
   - 显示镜像信息
   - 提供拉取命令
   - 显示部署说明

6. ✅ **清理选项**
   - 可选择清理本地构建的镜像

### 手动发布流程

如果需要手动控制发布过程：

#### 1. 构建镜像

```bash
# 构建后端镜像
docker build -f Dockerfile.backend \
  -t docker.io/yushu/trading-custody-backend:v1.0.1 \
  -t docker.io/yushu/trading-custody-backend:latest \
  .

# 构建前端镜像
docker build -f Dockerfile.frontend \
  --build-arg REACT_APP_API_BASE_URL= \
  -t docker.io/yushu/trading-custody:v1.0.1 \
  -t docker.io/yushu/trading-custody:latest \
  .
```

#### 2. 登录 Docker Hub

```bash
docker login docker.io -u yushu
# 输入密码或访问令牌
```

#### 3. 推送镜像

```bash
# 推送后端镜像
docker push docker.io/yushu/trading-custody-backend:v1.0.1
docker push docker.io/yushu/trading-custody-backend:latest

# 推送前端镜像
docker push docker.io/yushu/trading-custody:v1.0.1
docker push docker.io/yushu/trading-custody:latest
```

#### 4. 验证推送

访问 Docker Hub 验证镜像：
- https://hub.docker.com/r/yushu/trading-custody-backend
- https://hub.docker.com/r/yushu/trading-custody

## 发布后验证

### 1. 镜像验证

#### 检查镜像信息

```bash
# 查看镜像详情
docker manifest inspect yushu/trading-custody-backend:v1.0.1
docker manifest inspect yushu/trading-custody:v1.0.1

# 检查镜像大小
docker images | grep trading-custody
```

#### 拉取测试

```bash
# 拉取新版本镜像
docker pull yushu/trading-custody-backend:v1.0.1
docker pull yushu/trading-custody:v1.0.1

# 验证镜像可用性
docker run --rm yushu/trading-custody-backend:v1.0.1 node --version
```

### 2. 功能验证

#### 本地部署测试

```bash
# 使用新版本镜像部署
docker-compose -f docker-compose.simple.yml pull
docker-compose -f docker-compose.simple.yml up -d

# 等待服务启动
sleep 10

# 检查服务状态
docker-compose -f docker-compose.simple.yml ps

# 检查日志
docker-compose -f docker-compose.simple.yml logs
```

#### 健康检查

```bash
# 检查后端健康状态
curl http://localhost:3001/health

# 检查前端访问
curl -I http://localhost

# 测试 API 接口
curl http://localhost/api/health
```

#### 功能测试清单

- [ ] 用户登录功能正常
- [ ] 资金管理功能正常
- [ ] 持仓管理功能正常
- [ ] 数据显示正确
- [ ] 页面响应正常
- [ ] API 接口正常

### 3. 文档更新

#### 更新部署文档

确保以下文档包含新版本信息：

- `README.md` - 更新版本号和安装说明
- `CHANGELOG.md` - 记录版本变更
- `docs/DOCKER_DEPLOYMENT.md` - 更新部署示例

#### 发布说明

在 GitHub Releases 页面创建发布说明：

1. 访问 https://github.com/yushukk/trading-custody/releases
2. 点击 "Draft a new release"
3. 填写发布信息：
   - Tag: `v1.0.1`
   - Title: `Release v1.0.1`
   - Description: 从 CHANGELOG.md 复制变更内容
4. 发布 Release

## 回滚流程

如果发现新版本存在问题，需要回滚到之前的版本：

### 1. 快速回滚

```bash
# 停止当前服务
docker-compose down

# 修改 docker-compose.yml，指定旧版本
# 将镜像标签从 v1.0.1 改为 v1.0.0

# 重新启动服务
docker-compose up -d
```

### 2. 更新 latest 标签

如果需要将 latest 标签指向旧版本：

```bash
# 拉取旧版本
docker pull yushu/trading-custody-backend:v1.0.0
docker pull yushu/trading-custody:v1.0.0

# 重新标记为 latest
docker tag yushu/trading-custody-backend:v1.0.0 yushu/trading-custody-backend:latest
docker tag yushu/trading-custody:v1.0.0 yushu/trading-custody:latest

# 推送 latest 标签
docker push yushu/trading-custody-backend:latest
docker push yushu/trading-custody:latest
```

### 3. 通知用户

- 在 GitHub Issues 中创建问题报告
- 更新 CHANGELOG.md 记录回滚信息
- 通知相关用户更新到稳定版本

## 常见问题

### Q1: 构建失败怎么办？

**问题**: Docker 构建过程中出错

**解决方案**:
```bash
# 清理 Docker 缓存
docker builder prune -a

# 重新构建（不使用缓存）
docker build --no-cache -f Dockerfile.backend -t yushu/trading-custody-backend:v1.0.1 .
```

### Q2: 推送超时怎么办？

**问题**: 推送镜像到 Docker Hub 超时

**解决方案**:
```bash
# 检查网络连接
ping hub.docker.com

# 使用代理（如果需要）
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080

# 重试推送
docker push yushu/trading-custody-backend:v1.0.1
```

### Q3: 镜像太大怎么办？

**问题**: 镜像体积过大，推送和拉取缓慢

**解决方案**:
```bash
# 检查镜像大小
docker images | grep trading-custody

# 优化 Dockerfile
# - 使用多阶段构建
# - 清理不必要的文件
# - 合并 RUN 命令

# 压缩镜像
docker save yushu/trading-custody-backend:v1.0.1 | gzip > backend.tar.gz
```

### Q4: 版本号打错了怎么办？

**问题**: 推送了错误的版本号

**解决方案**:
```bash
# 删除远程标签（需要联系 Docker Hub 支持）
# 或者推送一个新的正确版本

# 删除本地标签
docker rmi yushu/trading-custody-backend:v1.0.1

# 重新构建正确版本
./docker-publish.sh v1.0.2
```

### Q5: 如何查看镜像历史？

**问题**: 想了解镜像的构建历史

**解决方案**:
```bash
# 查看镜像历史
docker history yushu/trading-custody-backend:v1.0.1

# 查看镜像详细信息
docker inspect yushu/trading-custody-backend:v1.0.1
```

## 最佳实践

### 1. 发布频率

- **Bug 修复**: 及时发布，通常在修复后 1-2 天内
- **功能更新**: 每 2-4 周发布一次次版本
- **重大更新**: 充分测试后发布，提前通知用户

### 2. 测试要求

发布前必须通过：
- ✅ 单元测试
- ✅ 集成测试
- ✅ 端到端测试
- ✅ 本地部署测试

### 3. 文档同步

每次发布必须更新：
- ✅ CHANGELOG.md
- ✅ package.json 版本号
- ✅ Git 标签
- ✅ GitHub Release

### 4. 安全考虑

- 使用访问令牌而非密码登录 Docker Hub
- 定期更新基础镜像
- 扫描镜像安全漏洞
- 不在镜像中包含敏感信息

### 5. 性能优化

- 使用 .dockerignore 排除不必要的文件
- 利用 Docker 缓存加速构建
- 使用多阶段构建减小镜像体积
- 定期清理未使用的镜像

## 相关文档

- [Docker 部署指南](./DOCKER_DEPLOYMENT.md)
- [环境变量配置](./ENVIRONMENT_VARIABLES.md)
- [贡献指南](../CONTRIBUTING.md)
- [变更日志](../CHANGELOG.md)

## 联系方式

如有问题或建议，请：
- 提交 Issue: https://github.com/yushukk/trading-custody/issues
- 发起 Pull Request: https://github.com/yushukk/trading-custody/pulls

---

**最后更新**: 2025-12-23
**文档版本**: 1.0.0
