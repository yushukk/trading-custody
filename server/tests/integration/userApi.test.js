const request = require('supertest');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { promisify } = require('util');

// 在文件顶部设置环境变量，确保在导入任何模块之前设置
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_testing_purposes_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_testing_purposes_only';
process.env.DATABASE_PATH = ':memory:';
process.env.CORS_ORIGIN = 'http://localhost:8085';

// 创建测试应用
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

describe('User API Integration', () => {
  let db;
  let originalUserDao, originalAuthService;
  let originalFindAll,
    originalCreate,
    originalUpdate,
    originalDelete,
    originalUpdatePassword,
    originalFindByEmail;
  let originalLogin;

  // 增加测试超时时间
  jest.setTimeout(30000);

  beforeAll(async () => {
    // 临时改变环境变量以确保数据库路径为内存数据库
    const originalDbPath = process.env.DATABASE_PATH;
    process.env.DATABASE_PATH = ':memory:';

    // 创建一个新的内存数据库实例用于测试
    const { Database } = require('../../utils/database');
    db = new Database(':memory:');

    // 确保方法被正确绑定到数据库实例
    // 注意：SQLite 的 run 方法将结果放在 this 上，需要特殊处理
    const dbRun = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    };
    const dbGet = promisify(db.db.get.bind(db.db));
    const dbAll = promisify(db.db.all.bind(db.db));

    // 直接创建所需的表
    await dbRun(
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await dbRun(
      `CREATE TABLE funds (
        user_id INTEGER PRIMARY KEY,
        balance REAL DEFAULT 0
      )`
    );

    await dbRun(
      `CREATE TABLE fund_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount REAL,
        balance_after REAL,
        remark TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    await dbRun(
      `CREATE TABLE positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        asset_type TEXT,
        code TEXT,
        name TEXT,
        operation TEXT,
        price REAL,
        quantity INTEGER,
        fee REAL DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // 创建测试用的DAO
    const testUserDao = {
      findByEmail: async email => await dbGet('SELECT * FROM users WHERE email = ?', [email]),
      findByName: async name => await dbGet('SELECT * FROM users WHERE name = ?', [name]),
      findById: async id => await dbGet('SELECT * FROM users WHERE id = ?', [id]),
      create: async userData => {
        const { name, email, password, role } = userData;
        const result = await dbRun(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [name, email, password, role]
        );
        if (result === undefined || result.lastID === undefined) {
          throw new Error('Database insert failed');
        }
        return result.lastID;
      },
      update: async (id, userData) => {
        const { name, email, role } = userData;
        await dbRun('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
          name,
          email,
          role,
          id,
        ]);
      },
      updatePassword: async (id, hashedPassword) => {
        await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
      },
      delete: async id => {
        await dbRun('DELETE FROM users WHERE id = ?', [id]);
      },
      findAll: async () => {
        return await dbAll('SELECT id, name, email, role FROM users');
      },
    };

    const _testFundDao = {
      getBalance: async userId => {
        const result = await dbGet('SELECT balance FROM funds WHERE user_id = ?', [userId]);
        return result ? result.balance : 0;
      },
      updateBalance: async (userId, balance) => {
        await dbRun('INSERT OR REPLACE INTO funds (user_id, balance) VALUES (?, ?)', [
          userId,
          balance,
        ]);
      },
      addLog: async logData => {
        const { userId, type, amount, balanceAfter, remark } = logData;
        await dbRun(
          'INSERT INTO fund_logs (user_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)',
          [userId, type, amount, balanceAfter, remark]
        );
      },
      getLogs: async (userId, limit = 5) => {
        return await dbAll(
          'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
          [userId, limit]
        );
      },
    };

    const _testPositionDao = {
      findByUserId: async userId => {
        return await dbAll('SELECT * FROM positions WHERE user_id = ?', [userId]);
      },
      findByUserIdCodeType: async (userId, code, assetType) => {
        return await dbGet(
          'SELECT * FROM positions WHERE user_id = ? AND code = ? AND asset_type = ?',
          [userId, code, assetType]
        );
      },
      create: async positionData => {
        const { userId, assetType, code, name, operation, price, quantity, fee } = positionData;
        const result = await dbRun(
          `INSERT INTO positions (user_id, asset_type, code, name, operation, price, quantity, fee)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, assetType, code, name, operation, price, quantity, fee || 0]
        );
        return result.lastID;
      },
      update: async (id, positionData) => {
        const { assetType, code, name, operation, price, quantity, fee } = positionData;
        await dbRun(
          `UPDATE positions SET asset_type = ?, code = ?, name = ?, operation = ?,
           price = ?, quantity = ?, fee = ? WHERE id = ?`,
          [assetType, code, name, operation, price, quantity, fee || 0, id]
        );
      },
      deleteByUserId: async userId => {
        await dbRun('DELETE FROM positions WHERE user_id = ?', [userId]);
      },
      deleteById: async id => {
        await dbRun('DELETE FROM positions WHERE id = ?', [id]);
      },
      getAllPositions: async () => {
        return await dbAll('SELECT * FROM positions');
      },
    };

    // 创建测试用的服务和控制器
    // 这些服务已经导出了单例实例，无法传入测试DAO
    // 因此使用模拟服务来测试功能

    // 模拟UserService
    const mockUserService = {
      getAllUsers: jest.fn().mockResolvedValue([
        { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user' },
        { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin' },
      ]),
      createUser: jest.fn().mockImplementation(async userData => {
        return {
          id: 3,
          name: userData.name,
          email: userData.email,
          role: userData.role || 'user',
        };
      }),
      updateUser: jest.fn().mockResolvedValue(undefined),
      deleteUser: jest.fn().mockResolvedValue(undefined),
      updatePassword: jest.fn().mockResolvedValue({ message: '密码更新成功' }),
      getUserById: jest.fn().mockImplementation(async userId => {
        const user = await testUserDao.findById(userId);
        return user;
      }),
    };

    // 模拟AuthService
    const mockAuthService = {
      login: jest.fn().mockImplementation(async (username, password) => {
        // 检查用户是否存在并验证密码
        const user = await testUserDao.findByName(username);
        if (!user) {
          const AppError = require('../../utils/AppError');
          throw new AppError('用户不存在', 'USER_NOT_FOUND', 404);
        }

        const PasswordHelper = require('../../utils/passwordHelper');
        const isValid = await PasswordHelper.verify(password, user.password);
        if (!isValid) {
          const AppError = require('../../utils/AppError');
          throw new AppError('密码错误', 'INVALID_PASSWORD', 401);
        }

        // 生成测试token
        const JwtHelper = require('../../utils/jwtHelper');
        const payload = {
          userId: user.id,
          username: user.name,
          email: user.email,
          role: user.role,
        };

        return {
          accessToken: JwtHelper.generateAccessToken(payload),
          refreshToken: JwtHelper.generateRefreshToken(payload),
          user,
        };
      }),
      register: jest.fn().mockImplementation(async userData => {
        // 模拟注册逻辑
        const { name, email, password, role } = userData;
        const PasswordHelper = require('../../utils/passwordHelper');
        const hashedPassword = await PasswordHelper.hash(password);

        const userId = await testUserDao.create({
          name,
          email,
          password: hashedPassword,
          role: role || 'user',
        });

        return userId;
      }),
      refreshToken: jest.fn().mockResolvedValue({ accessToken: 'new_test_access_token' }),
    };

    const UserController = require('../../controllers/userController');
    const { AuthController } = require('../../controllers/authController');

    // 创建使用测试服务的控制器实例
    const authController = new AuthController(mockAuthService);

    const userController = new UserController(mockUserService);

    // 在测试中直接替换方法实现
    originalUserDao = require('../../dao/userDao');
    originalAuthService = require('../../services/authService');

    // 保存原始方法
    originalFindAll = originalUserDao.findAll;
    originalCreate = originalUserDao.create;
    originalUpdate = originalUserDao.update;
    originalDelete = originalUserDao.delete;
    originalUpdatePassword = originalUserDao.updatePassword;
    originalFindByEmail = originalUserDao.findByEmail;

    // 临时替换为测试DAO
    originalUserDao.findAll = testUserDao.findAll;
    originalUserDao.create = testUserDao.create;
    originalUserDao.update = testUserDao.update;
    originalUserDao.delete = testUserDao.delete;
    originalUserDao.updatePassword = testUserDao.updatePassword;
    originalUserDao.findByEmail = testUserDao.findByEmail;

    // 保存原始服务方法引用
    originalLogin = originalAuthService.login;

    // 配置UserService的模拟实现 - updatePassword 只接受 userId 和 newPassword 两个参数
    mockUserService.updatePassword.mockImplementation(async (userId, newPassword) => {
      // 哈希新密码并更新
      const PasswordHelper = require('../../utils/passwordHelper');
      const hashedNewPassword = await PasswordHelper.hash(newPassword);
      await testUserDao.updatePassword(userId, hashedNewPassword);
    });

    // 配置AuthService使用测试DAO
    originalAuthService.login = async (username, password) => {
      // 检查用户是否存在并验证密码
      const user = await testUserDao.findByName(username);
      if (!user) {
        const AppError = require('../../utils/AppError');
        throw new AppError('用户不存在', 'USER_NOT_FOUND', 404);
      }

      const PasswordHelper = require('../../utils/passwordHelper');
      const isValid = await PasswordHelper.verify(password, user.password);
      if (!isValid) {
        const AppError = require('../../utils/AppError');
        throw new AppError('密码错误', 'INVALID_PASSWORD', 401);
      }

      // 生成测试token
      const JwtHelper = require('../../utils/jwtHelper');
      const payload = {
        userId: user.id,
        username: user.name,
        email: user.email,
        role: user.role,
      };

      return {
        accessToken: JwtHelper.generateAccessToken(payload),
        refreshToken: JwtHelper.generateRefreshToken(payload),
        user,
      };
    };

    originalAuthService.register = async userData => {
      // 检查用户是否已存在
      const existingUser = await testUserDao.findByEmail(userData.email);
      if (existingUser) {
        const AppError = require('../../utils/AppError');
        throw new AppError('邮箱已被注册', 'EMAIL_EXISTS', 400);
      }

      // 注册新用户
      const { name, email, password, role } = userData;
      const PasswordHelper = require('../../utils/passwordHelper');
      const hashedPassword = await PasswordHelper.hash(password);

      const userId = await testUserDao.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
      });

      return userId;
    };

    originalAuthService.refreshToken = async refreshToken => {
      const JwtHelper = require('../../utils/jwtHelper');
      try {
        const decoded = JwtHelper.verifyRefreshToken(refreshToken);
        const payload = {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
        };

        const newAccessToken = JwtHelper.generateAccessToken(payload);
        return newAccessToken;
      } catch (error) {
        const AppError = require('../../utils/AppError');
        throw new AppError('Refresh token 无效', 'INVALID_REFRESH_TOKEN', 401);
      }
    };

    // 导入中间件
    const logMiddleware = require('../../middleware/logMiddleware');
    const errorMiddleware = require('../../middleware/errorMiddleware');
    const { authenticateToken, adminOnly } = require('../../middleware/authMiddleware');

    // 设置中间件和路由
    app.use(logMiddleware);
    app.post('/api/auth/login', (req, res, next) => authController.login(req, res, next));
    app.post('/api/auth/register', (req, res, next) => authController.register(req, res, next));
    app.post('/api/auth/refresh', (req, res, next) => authController.refresh(req, res, next));
    app.post('/api/auth/logout', (req, res) => authController.logout(req, res));
    app.get('/api/auth/me', authenticateToken, (req, res) => authController.me(req, res));
    app.put('/api/users/password', authenticateToken, (req, res, next) =>
      userController.updatePassword(req, res, next)
    );
    app.get('/api/users', authenticateToken, adminOnly, (req, res, next) =>
      userController.getAllUsers(req, res, next)
    );
    app.post('/api/users', authenticateToken, adminOnly, (req, res, next) =>
      userController.createUser(req, res, next)
    );
    app.put('/api/users/:id', authenticateToken, adminOnly, (req, res, next) =>
      userController.updateUser(req, res, next)
    );
    app.delete('/api/users/:id', authenticateToken, adminOnly, (req, res, next) =>
      userController.deleteUser(req, res, next)
    );
    app.use(errorMiddleware);

    // 插入测试数据
    const passwordHelper = require('../../utils/passwordHelper');
    const hashedPassword = await passwordHelper.hash('password123');
    await dbRun(
      "INSERT INTO users (id, name, email, password, role) VALUES (1, 'Alice', 'alice@example.com', ?, 'user')",
      [hashedPassword]
    );
    await dbRun(
      "INSERT INTO users (id, name, email, password, role) VALUES (2, 'Bob', 'bob@example.com', ?, 'admin')",
      [hashedPassword]
    );

    // 恢复原始数据库路径
    process.env.DATABASE_PATH = originalDbPath;
  });

  // 恢复原始方法的函数
  const restoreOriginalMethods = () => {
    if (originalUserDao && originalAuthService) {
      originalUserDao.findAll = originalFindAll;
      originalUserDao.create = originalCreate;
      originalUserDao.update = originalUpdate;
      originalUserDao.delete = originalDelete;
      originalUserDao.updatePassword = originalUpdatePassword;
      originalUserDao.findByEmail = originalFindByEmail;

      originalAuthService.login = originalLogin;
    }
  };

  afterAll(async () => {
    restoreOriginalMethods();
    // 关闭数据库连接
    if (db && db.db) {
      await new Promise(resolve => {
        db.close(() => {
          // Test database connection closed
          resolve();
        });
      });
    }
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Alice', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.id).toBe(1);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Alice', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.message).toBe('密码错误');
    });
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      // 首先登录作为管理员
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Bob', password: 'password123' })
        .expect(200);

      // 从响应中获取cookie（如果需要）
      const cookies = loginResponse.headers['set-cookie'];

      // 使用登录后的会话请求用户列表
      const response = await request(app).get('/api/users').set('Cookie', cookies).expect(200);

      // 检查返回格式是否为success和users
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(2);
      const alice = response.body.users.find(user => user.name === 'Alice');
      const bob = response.body.users.find(user => user.name === 'Bob');
      expect(alice).toBeDefined();
      expect(bob).toBeDefined();
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      // 首先登录作为管理员
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Bob', password: 'password123' })
        .expect(200);

      // 从响应中获取cookie
      const cookies = loginResponse.headers['set-cookie'];

      const newUser = {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'password789',
        role: 'user',
      };

      const response = await request(app).post('/api/users').set('Cookie', cookies).send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('Charlie');
      expect(response.body.user.email).toBe('charlie@example.com');
      expect(response.body.user.role).toBe('user');
    });
  });

  describe('PUT /api/users/password', () => {
    it('should update user password', async () => {
      // 首先登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Alice', password: 'password123' })
        .expect(200);

      // 从响应中获取cookie
      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .put('/api/users/password')
        .set('Cookie', cookies)
        .send({ oldPassword: 'password123', newPassword: 'updatedpassword' })
        .expect(200);

      expect(response.body.message).toBe('密码更新成功');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user by id', async () => {
      // 首先我们需要创建一个用户来删除（id=3）
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Bob', password: 'password123' }) // 使用管理员账户登录
        .expect(200);

      // 从响应中获取cookie
      const loginCookies = loginResponse.headers['set-cookie'];

      // 创建一个新用户用于删除测试
      const newUser = {
        name: 'David',
        email: 'david@example.com',
        password: 'password789',
        role: 'user',
      };

      await request(app).post('/api/users').set('Cookie', loginCookies).send(newUser).expect(201);

      // 现在删除用户（id=4，因为之前创建了 Alice(1)、Bob(2)、Charlie(3)）
      const response = await request(app)
        .delete('/api/users/4')
        .set('Cookie', loginCookies)
        .expect(200);

      expect(response.body.message).toBe('用户删除成功');
    });
  });
});
