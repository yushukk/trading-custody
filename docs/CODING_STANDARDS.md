# Trading Custody System - 编码开发规范

## 目录

- [1. 概述](#1-概述)
- [2. 通用规范](#2-通用规范)
- [3. JavaScript/Node.js 规范](#3-javascriptnodejs-规范)
- [4. React 前端规范](#4-react-前端规范)
- [5. Express 后端规范](#5-express-后端规范)
- [6. 数据库规范](#6-数据库规范)
- [7. API 设计规范](#7-api-设计规范)
- [8. 测试规范](#8-测试规范)
- [9. Git 提交规范](#9-git-提交规范)
- [10. 代码审查清单](#10-代码审查清单)

---

## 1. 概述

本文档定义了 Trading Custody System 项目的编码开发规范，旨在确保代码质量、可维护性和团队协作效率。

### 1.1 技术栈

- **前端**: React 18 + Ant Design Mobile + React Router v6
- **后端**: Express.js + SQLite + JWT
- **测试**: Jest + Cypress
- **工具**: ESLint + Prettier + Husky

### 1.2 开发环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

---

## 2. 通用规范

### 2.1 代码格式化

项目使用 **Prettier** 进行代码格式化，配置如下：

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

**强制要求**：
- 使用单引号
- 使用分号结尾
- 每行最大长度 100 字符
- 使用 2 空格缩进
- 使用 LF 换行符

### 2.2 代码检查

项目使用 **ESLint** 进行代码检查，主要规则：

- 继承 `eslint:recommended`
- React 相关规则：`plugin:react/recommended`
- React Hooks 规则：`plugin:react-hooks/recommended`
- 禁止使用 `console.log`（允许 `console.warn` 和 `console.error`）
- 未使用的变量报错（以 `_` 开头的参数除外）

### 2.3 命名规范

#### 2.3.1 文件命名

- **组件文件**: 使用 PascalCase，如 `Login.jsx`, `UserManagement.jsx`
- **工具文件**: 使用 camelCase，如 `errorHandler.js`, `formatUtils.js`
- **常量文件**: 使用 camelCase，如 `index.js`, `appConstants.js`
- **样式文件**: 与组件同名，如 `Login.css`, `AdminDashboard.css`

#### 2.3.2 变量和函数命名

- **变量**: 使用 camelCase，如 `userName`, `isLoading`
- **常量**: 使用 UPPER_SNAKE_CASE，如 `API_BASE_URL`, `MAX_RETRY_COUNT`
- **函数**: 使用 camelCase，动词开头，如 `getUserInfo()`, `handleLogin()`
- **类**: 使用 PascalCase，如 `AuthService`, `AppError`
- **私有方法**: 以下划线开头，如 `_validateInput()`

#### 2.3.3 React 组件命名

- **组件**: 使用 PascalCase，如 `Login`, `UserFundPosition`
- **Hooks**: 以 `use` 开头，如 `useAuth`, `useFund`, `usePosition`
- **Context**: 以 `Context` 结尾，如 `AuthContext`
- **HOC**: 以 `with` 开头，如 `withAuth`

### 2.4 注释规范

#### 2.4.1 文件头注释

每个文件应包含简要说明：

```javascript
/**
 * 用户认证服务
 * 处理登录、注册、token 刷新等认证相关逻辑
 */
```

#### 2.4.2 函数注释

使用 JSDoc 格式：

```javascript
/**
 * 用户登录
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @returns {Promise<Object>} 包含 token 和用户信息的对象
 * @throws {AppError} 当用户不存在或密码错误时抛出
 */
async login(email, password) {
  // 实现代码
}
```

#### 2.4.3 复杂逻辑注释

对于复杂的业务逻辑，添加必要的注释说明：

```javascript
// 计算持仓盈亏：(当前价格 - 成本价) * 持仓数量
const profit = (currentPrice - costPrice) * quantity;
```

---

## 3. JavaScript/Node.js 规范

### 3.1 ES6+ 特性

**必须使用**：
- `const` 和 `let` 代替 `var`
- 箭头函数
- 模板字符串
- 解构赋值
- 扩展运算符
- Promise 和 async/await

**示例**：

```javascript
// ✅ 推荐
const getUserInfo = async userId => {
  const { name, email } = await userDao.findById(userId);
  return { name, email };
};

// ❌ 不推荐
var getUserInfo = function(userId) {
  return userDao.findById(userId).then(function(user) {
    return { name: user.name, email: user.email };
  });
};
```

### 3.2 错误处理

#### 3.2.1 使用自定义错误类

```javascript
const AppError = require('../utils/AppError');

// 抛出业务错误
throw new AppError('用户不存在', 'USER_NOT_FOUND', 404);
```

#### 3.2.2 异步错误处理

```javascript
// ✅ 推荐：使用 try-catch
async function handleRequest(req, res, next) {
  try {
    const result = await someAsyncOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error); // 传递给错误处理中间件
  }
}
```

### 3.3 模块导入导出

#### 3.3.1 导入顺序

```javascript
// 1. Node.js 内置模块
const path = require('path');
const fs = require('fs');

// 2. 第三方模块
const express = require('express');
const jwt = require('jsonwebtoken');

// 3. 项目内部模块
const AppError = require('../utils/AppError');
const userDao = require('../dao/userDao');
```

#### 3.3.2 导出规范

```javascript
// 单例导出（推荐用于 Service、Controller）
const authServiceInstance = new AuthService(userDao);
module.exports = authServiceInstance;
module.exports.default = authServiceInstance;
module.exports.AuthService = AuthService; // 同时导出类供测试使用

// 多个导出
module.exports = {
  validateEmail,
  validatePassword,
  sanitizeInput,
};
```

---

## 4. React 前端规范

### 4.1 组件结构

#### 4.1.1 函数组件（推荐）

```javascript
import React, { useState, useCallback } from 'react';
import { Toast } from 'antd-mobile';
import './Login.css';

const Login = () => {
  // 1. Hooks
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 2. 事件处理函数
  const handleLogin = useCallback(async () => {
    // 实现逻辑
  }, [username]);
  
  // 3. 渲染
  return (
    <div className="login-container">
      {/* JSX */}
    </div>
  );
};

export default React.memo(Login);
```

#### 4.1.2 组件导入顺序

```javascript
// 1. React 相关
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. UI 组件库
import { Toast, Button } from 'antd-mobile';

// 3. 自定义 Hooks 和 Context
import { useAuth } from '../contexts/AuthContext';
import { useFund } from '../hooks/useFund';

// 4. 工具函数
import { handleError } from '../utils/errorHandler';
import { formatCurrency } from '../utils/formatUtils';

// 5. 常量
import { ROLES, ROUTES } from '../constants';

// 6. 样式
import './Login.css';
```

### 4.2 Hooks 使用规范

#### 4.2.1 useState

```javascript
// ✅ 推荐：使用解构和描述性命名
const [isLoading, setIsLoading] = useState(false);
const [userData, setUserData] = useState(null);

// ❌ 不推荐：命名不清晰
const [flag, setFlag] = useState(false);
const [data, setData] = useState(null);
```

#### 4.2.2 useEffect

```javascript
// ✅ 推荐：明确依赖项
useEffect(() => {
  fetchUserData(userId);
}, [userId]);

// ✅ 推荐：清理副作用
useEffect(() => {
  const timer = setInterval(() => {
    // 定时任务
  }, 1000);
  
  return () => clearInterval(timer);
}, []);
```

#### 4.2.3 useCallback 和 useMemo

```javascript
// 使用 useCallback 优化事件处理函数
const handleSubmit = useCallback(async () => {
  // 处理逻辑
}, [formData, userId]);

// 使用 useMemo 优化计算
const totalAmount = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0);
}, [items]);
```

### 4.3 Props 和 State

#### 4.3.1 Props 解构

```javascript
// ✅ 推荐：在参数中解构
const UserCard = ({ name, email, role }) => {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
      <span>{role}</span>
    </div>
  );
};

// ❌ 不推荐
const UserCard = (props) => {
  return (
    <div>
      <h3>{props.name}</h3>
      <p>{props.email}</p>
    </div>
  );
};
```

#### 4.3.2 默认 Props

```javascript
const Button = ({ text = '确定', onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
};
```

### 4.4 条件渲染

```javascript
// ✅ 推荐：使用逻辑与运算符
{isLoading && <SpinLoading />}

// ✅ 推荐：使用三元运算符
{user ? <UserProfile user={user} /> : <Login />}

// ✅ 推荐：复杂条件提取为变量
const shouldShowButton = isLoggedIn && hasPermission && !isDisabled;
{shouldShowButton && <Button />}
```

### 4.5 列表渲染

```javascript
// ✅ 推荐：使用唯一 key
{users.map(user => (
  <UserCard key={user.id} {...user} />
))}

// ❌ 不推荐：使用 index 作为 key（除非列表静态且不会重排）
{users.map((user, index) => (
  <UserCard key={index} {...user} />
))}
```

---

## 5. Express 后端规范

### 5.1 项目结构

```
server/
├── config/           # 配置文件
├── controllers/      # 控制器层
├── services/         # 业务逻辑层
├── dao/              # 数据访问层
├── middleware/       # 中间件
├── utils/            # 工具函数
├── validators/       # 数据验证
└── server.js         # 入口文件
```

### 5.2 分层架构

#### 5.2.1 Controller 层

**职责**：处理 HTTP 请求和响应，参数验证，调用 Service 层

```javascript
class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      
      res.cookie('accessToken', result.accessToken, COOKIE_OPTIONS.ACCESS_TOKEN);
      res.json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

#### 5.2.2 Service 层

**职责**：业务逻辑处理，调用 DAO 层，事务管理

```javascript
class AuthService {
  constructor(userDao) {
    this.userDao = userDao;
  }

  async login(email, password) {
    const user = await this.userDao.findByEmail(email);
    if (!user) {
      throw new AppError('用户不存在', 'USER_NOT_FOUND', 404);
    }

    const isValid = await PasswordHelper.verify(password, user.password);
    if (!isValid) {
      throw new AppError('密码错误', 'INVALID_PASSWORD', 401);
    }

    const accessToken = JwtHelper.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, user };
  }
}
```

#### 5.2.3 DAO 层

**职责**：数据库操作，SQL 查询

```javascript
class UserDao {
  async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return await db.get(sql, [email]);
  }

  async create(userData) {
    const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
    const result = await db.run(sql, [
      userData.name,
      userData.email,
      userData.password,
      userData.role || 'user',
    ]);
    return result.lastID;
  }
}
```

### 5.3 中间件规范

#### 5.3.1 认证中间件

```javascript
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      throw new AppError('未授权访问', 'UNAUTHORIZED', 401);
    }

    const decoded = JwtHelper.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
```

#### 5.3.2 错误处理中间件

```javascript
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    errorCode,
    message: err.message,
  });
};
```

### 5.4 路由规范

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateLogin } = require('../validators/authValidator');

// 公开路由
router.post('/auth/login', validateLogin, authController.login);
router.post('/auth/register', authController.register);

// 受保护路由
router.get('/users', authMiddleware, userController.getUsers);
router.put('/users/:id', authMiddleware, userController.updateUser);

module.exports = router;
```

---

## 6. 数据库规范

### 6.1 表命名

- 使用小写字母和下划线
- 使用复数形式
- 示例：`users`, `funds`, `positions`

### 6.2 字段命名

- 使用小写字母和下划线
- 主键使用 `id`
- 外键使用 `表名_id`，如 `user_id`
- 时间戳字段：`created_at`, `updated_at`

### 6.3 SQL 查询规范

```javascript
// ✅ 推荐：使用参数化查询防止 SQL 注入
const sql = 'SELECT * FROM users WHERE email = ? AND status = ?';
const user = await db.get(sql, [email, 'active']);

// ❌ 不推荐：字符串拼接
const sql = `SELECT * FROM users WHERE email = '${email}'`;
```

### 6.4 事务处理

```javascript
async function transferFunds(fromUserId, toUserId, amount) {
  const db = await getDatabase();
  
  try {
    await db.run('BEGIN TRANSACTION');
    
    await db.run('UPDATE funds SET balance = balance - ? WHERE user_id = ?', [amount, fromUserId]);
    await db.run('UPDATE funds SET balance = balance + ? WHERE user_id = ?', [amount, toUserId]);
    
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

---

## 7. API 设计规范

### 7.1 RESTful API 设计

#### 7.1.1 HTTP 方法

- `GET`: 获取资源
- `POST`: 创建资源
- `PUT`: 更新资源（完整更新）
- `PATCH`: 更新资源（部分更新）
- `DELETE`: 删除资源

#### 7.1.2 URL 设计

```
GET    /api/users          # 获取用户列表
GET    /api/users/:id      # 获取单个用户
POST   /api/users          # 创建用户
PUT    /api/users/:id      # 更新用户
DELETE /api/users/:id      # 删除用户
```

### 7.2 响应格式

#### 7.2.1 成功响应

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
  }
}
```

#### 7.2.2 错误响应

```json
{
  "success": false,
  "errorCode": "USER_NOT_FOUND",
  "message": "用户不存在"
}
```

### 7.3 HTTP 状态码

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权
- `403 Forbidden`: 禁止访问
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器错误

---

## 8. 测试规范

### 8.1 单元测试

#### 8.1.1 测试文件命名

- 测试文件与源文件同名，添加 `.test.js` 后缀
- 示例：`authService.js` → `authService.test.js`

#### 8.1.2 测试结构

```javascript
describe('AuthService', () => {
  describe('login', () => {
    it('should return token when credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      // Act
      const result = await authService.login(email, password);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';
      
      // Act & Assert
      await expect(authService.login(email, password))
        .rejects
        .toThrow('用户不存在');
    });
  });
});
```

### 8.2 集成测试

```javascript
describe('POST /api/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toHaveProperty('id');
  });
});
```

### 8.3 测试覆盖率

- 目标：代码覆盖率 >= 80%
- 关键业务逻辑必须有测试覆盖
- 运行命令：`npm run test:coverage`

---

## 9. Git 提交规范

### 9.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 9.2 Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动

### 9.3 示例

```
feat(auth): add JWT token refresh mechanism

- Implement refresh token endpoint
- Add token expiration handling
- Update authentication middleware

Closes #123
```

### 9.4 分支管理

- `main`: 主分支，保持稳定
- `develop`: 开发分支
- `feature/xxx`: 功能分支
- `bugfix/xxx`: Bug 修复分支
- `hotfix/xxx`: 紧急修复分支

---

## 10. 代码审查清单

### 10.1 功能性

- [ ] 代码实现了需求的功能
- [ ] 边界条件和异常情况已处理
- [ ] 没有明显的 Bug

### 10.2 代码质量

- [ ] 代码符合项目规范
- [ ] 命名清晰、有意义
- [ ] 函数职责单一，长度适中（< 50 行）
- [ ] 避免代码重复
- [ ] 注释清晰、必要

### 10.3 性能

- [ ] 没有明显的性能问题
- [ ] 数据库查询已优化
- [ ] 避免不必要的渲染（React）

### 10.4 安全性

- [ ] 输入验证和清理
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 敏感信息不暴露

### 10.5 测试

- [ ] 包含必要的单元测试
- [ ] 测试覆盖关键逻辑
- [ ] 所有测试通过

### 10.6 文档

- [ ] 更新相关文档
- [ ] API 变更已记录
- [ ] README 保持最新

---

## 附录

### A. 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器

# 测试
npm test                 # 运行前端测试
npm run test:server      # 运行后端测试
npm run test:coverage    # 生成覆盖率报告

# 代码检查
npm run lint             # 运行 ESLint
npm run lint:fix         # 自动修复 ESLint 错误
npm run format           # 格式化代码
npm run format:check     # 检查代码格式

# 构建
npm run build            # 构建生产版本
npm start                # 启动生产服务器
```

### B. 推荐的 VSCode 插件

- ESLint
- Prettier - Code formatter
- GitLens
- JavaScript (ES6) code snippets
- ES7+ React/Redux/React-Native snippets

### C. 参考资源

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React Official Documentation](https://react.dev/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Jest Documentation](https://jestjs.io/)

---

**版本**: 1.0.0  
**最后更新**: 2024-12-20  
**维护者**: Trading Custody System Team
