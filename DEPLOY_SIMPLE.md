# 🚀 Trading Custody - 极简部署指南

> 适用于飞牛、Portainer、Rancher 等容器平台，无需任何脚本，3 分钟完成部署！

## 📋 部署前准备

### 🎉 好消息：JWT 密钥现已支持自动生成！

**从 v2.0 版本开始，系统会在首次启动时自动生成 JWT 密钥，无需手动配置！**

如果你希望使用自定义密钥（推荐生产环境），可以通过以下方式生成：

<details>
<summary>点击展开：手动生成 JWT 密钥的方法（可选）</summary>

**方式一：在线生成**
- 访问：https://www.random.org/strings/
- 设置：长度 32，数量 2，字符集选择 Alphanumeric
- 点击生成，得到两个随机字符串

**方式二：命令行生成**
```bash
# Linux/Mac
openssl rand -base64 32
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**方式三：使用项目自带脚本**
```bash
node scripts/generate-secrets.js
```

</details>

---

## 🎯 部署步骤

### 步骤 1：准备配置文件（可选）

**选项 A：使用自动生成的密钥（推荐快速部署）**

直接使用 `docker-compose.simple.yml`，无需修改任何配置。系统会在首次启动时自动生成安全的 JWT 密钥并保存到 `.env` 文件。

**选项 B：使用自定义密钥（推荐生产环境）**

如果你希望使用自定义密钥，打开 `docker-compose.simple.yml`，找到以下两行：

```yaml
- JWT_ACCESS_SECRET=PLEASE_CHANGE_THIS_TO_RANDOM_STRING_AT_LEAST_32_CHARS_ACCESS_SECRET
- JWT_REFRESH_SECRET=PLEASE_CHANGE_THIS_TO_RANDOM_STRING_AT_LEAST_32_CHARS_REFRESH_SECRET
```

**替换为你生成的密钥**：

```yaml
- JWT_ACCESS_SECRET=你生成的第一个密钥
- JWT_REFRESH_SECRET=你生成的第二个密钥
```

**示例**：
```yaml
- JWT_ACCESS_SECRET=8kF9mN2pQ5rT7vX0zB3cD6eG9hJ1kL4m
- JWT_REFRESH_SECRET=nP8qR2sT5uV7wX0yZ3aB6cD9eF2gH5j
```

### 步骤 2：上传到容器平台

#### 飞牛平台
1. 登录飞牛控制台
2. 进入「应用管理」→「创建应用」
3. 选择「Docker Compose」方式
4. 上传修改后的 `docker-compose.simple.yml`
5. 点击「部署」

#### Portainer
1. 登录 Portainer
2. 进入「Stacks」→「Add stack」
3. 选择「Upload」
4. 上传修改后的 `docker-compose.simple.yml`
5. 点击「Deploy the stack」

#### Rancher
1. 登录 Rancher
2. 选择集群和命名空间
3. 进入「Apps」→「Launch」
4. 选择「Custom」
5. 粘贴 `docker-compose.simple.yml` 内容
6. 点击「Launch」

#### 命令行部署
```bash
# 上传文件到服务器
scp docker-compose.simple.yml user@server:/opt/trading_custody/

# SSH 登录服务器
ssh user@server

# 进入目录
cd /opt/trading_custody

# 启动服务
docker-compose -f docker-compose.simple.yml up -d

# 查看状态
docker-compose -f docker-compose.simple.yml ps
```

### 步骤 3：访问应用

部署完成后，访问：

- **前端界面**：http://服务器IP
- **后端 API**：http://服务器IP:3001
- **健康检查**：http://服务器IP:3001/health

**默认管理员账号**：
- 用户名：`admin`
- 密码：`admin`

⚠️ **首次登录后请立即修改密码！**

---

## 🔧 可选配置

### 修改端口

如果默认端口被占用，修改以下配置：

```yaml
ports:
  - "3001:3001"  # 改为 "3002:3001"（前端口改为 3002）
```

```yaml
ports:
  - "80:80"      # 改为 "8080:80"（前端口改为 8080）
```

### 修改 CORS（跨域配置）

如果前端和后端不在同一域名，需要配置 CORS：

```yaml
- CORS_ORIGIN=*  # 改为具体域名，如：https://your-domain.com
```

### 使用指定版本

默认使用 `latest` 版本，如需指定版本：

```yaml
# 后端
image: yushu/trading-custody-backend:latest
# 改为
image: yushu/trading-custody-backend:v1.0.0

# 前端
image: yushu/trading-custody:latest
# 改为
image: yushu/trading-custody:v1.0.0
```

---

## 📊 管理命令

### 查看服务状态
```bash
docker-compose -f docker-compose.simple.yml ps
```

### 查看日志
```bash
# 查看所有日志
docker-compose -f docker-compose.simple.yml logs -f

# 只看后端日志
docker-compose -f docker-compose.simple.yml logs -f backend

# 只看前端日志
docker-compose -f docker-compose.simple.yml logs -f frontend
```

### 重启服务
```bash
docker-compose -f docker-compose.simple.yml restart
```

### 停止服务
```bash
docker-compose -f docker-compose.simple.yml down
```

### 更新服务
```bash
# 拉取最新镜像
docker-compose -f docker-compose.simple.yml pull

# 重新启动
docker-compose -f docker-compose.simple.yml up -d
```

---

## 💾 数据备份

### 备份数据库
```bash
# 复制数据库文件
docker cp trading-custody-backend:/app/server/data/database.db ./backup/

# 或备份整个数据卷
docker run --rm \
  -v trading_custody_backend-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/data-$(date +%Y%m%d).tar.gz /data
```

### 恢复数据库
```bash
# 停止服务
docker-compose -f docker-compose.simple.yml down

# 恢复数据
docker run --rm \
  -v trading_custody_backend-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/data-20241221.tar.gz -C /

# 启动服务
docker-compose -f docker-compose.simple.yml up -d
```

---

## 🔍 故障排查

### 问题 1：容器无法启动

**检查日志**：
```bash
docker-compose -f docker-compose.simple.yml logs backend
```

**常见原因**：
- JWT 密钥未修改或格式错误
- 端口被占用
- 镜像拉取失败

### 问题 2：前端无法连接后端

**检查后端健康状态**：
```bash
curl http://localhost:3001/health
```

**解决方案**：
1. 确认后端服务正常运行
2. 检查防火墙是否开放 3001 端口
3. 如果前后端不在同一服务器，需要修改前端镜像的 API 地址

### 问题 3：JWT 密钥错误

**错误提示**：
```
Error: JWT secret must be at least 32 characters
```

**解决方案**：
确保 JWT 密钥至少 32 个字符，重新生成并修改配置。

### 问题 4：端口被占用

**错误提示**：
```
Error: bind: address already in use
```

**解决方案**：
修改 `docker-compose.simple.yml` 中的端口配置。

---

## 📝 配置说明

### 必须修改的配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `JWT_ACCESS_SECRET` | JWT 访问令牌密钥 | `8kF9mN2pQ5rT7vX0zB3cD6eG9hJ1kL4m` |
| `JWT_REFRESH_SECRET` | JWT 刷新令牌密钥 | `nP8qR2sT5uV7wX0yZ3aB6cD9eF2gH5j` |

### 可选配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `CORS_ORIGIN` | CORS 允许源 | `*` |
| `JWT_ACCESS_EXPIRES_IN` | 访问令牌过期时间 | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | 刷新令牌过期时间 | `7d` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `PRICE_SYNC_CRON` | 价格同步时间 | `0 17 * * *` |

---

## ✅ 部署检查清单

部署前请确认：

- [ ] 已生成并配置 JWT 密钥（至少 32 位）
- [ ] 已修改 `docker-compose.simple.yml` 中的密钥配置
- [ ] 确认端口未被占用（80 和 3001）
- [ ] 服务器已安装 Docker 和 Docker Compose
- [ ] 防火墙已开放相应端口

部署后请验证：

- [ ] 后端健康检查通过：`curl http://localhost:3001/health`
- [ ] 前端可以正常访问：`http://服务器IP`
- [ ] 可以使用 admin/admin 登录
- [ ] 已修改管理员密码

---

## 🆘 获取帮助

如果遇到问题：

1. **查看日志**：`docker-compose -f docker-compose.simple.yml logs -f`
2. **检查配置**：确认 JWT 密钥已正确配置
3. **查看文档**：阅读完整部署文档
4. **提交 Issue**：在 GitHub 上提交问题

---

## 🎉 部署成功！

恭喜！您已成功部署 Trading Custody 系统。

**下一步**：
1. 使用 admin/admin 登录系统
2. 立即修改管理员密码
3. 创建普通用户账号
4. 开始使用系统功能

**重要提示**：
- 定期备份数据库
- 保管好 JWT 密钥
- 及时更新系统版本
- 监控系统运行状态

---

**祝您使用愉快！** 🎊
