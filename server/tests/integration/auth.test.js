const request = require('supertest');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// 在文件顶部设置环境变量，确保在导入任何模块之前设置
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_testing_purposes_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_testing_purposes_only';
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

describe('Auth API Integration', () => {
  let db;

  // 增加测试超时时间
  jest.setTimeout(30000);

  beforeAll(async () => {
    // 临时改变环境变量以确保数据库路径为内存数据库
    const originalDbPath = process.env.DATABASE_PATH;
    process.env.DATABASE_PATH = ':memory:';

    // 创建一个新的内存数据库实例用于测试
    const { Database } = require('../../utils/database');
    db = new Database(':memory:');

    // 直接创建所需的表
    await db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建测试用的DAO和Service
    const testUserDao = {
      findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
      findByName: async name => await db.get('SELECT * FROM users WHERE name = ?', [name]),
      findById: async id => await db.get('SELECT * FROM users WHERE id = ?', [id]),
      create: async userData => {
        const { name, email, password, role } = userData;
        return new Promise((resolve, reject) => {
          db.db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role],
            function (err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      },
      update: async (id, userData) => {
        const { name, email, role } = userData;
        return new Promise((resolve, reject) => {
          db.db.run(
            'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
            [name, email, role, id],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      },
      updatePassword: async (id, hashedPassword) => {
        return new Promise((resolve, reject) => {
          db.db.run(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      },
      delete: async id => {
        return new Promise((resolve, reject) => {
          db.db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
            if (err) reject(err);
            else resolve();
          });
        });
      },
      findAll: async () => {
        return await db.all('SELECT id, name, email, role FROM users');
      },
    };

    // 创建测试用的服务和控制器
    const { AuthService } = require('../../services/authService');
    const { AuthController } = require('../../controllers/authController');

    // 创建一个使用测试DAO的AuthService实例
    const testAuthService = new AuthService(testUserDao);

    // 创建使用测试服务的AuthController实例
    const testAuthController = new AuthController(testAuthService);

    // 导入中间件
    const logMiddleware = require('../../middleware/logMiddleware');
    const errorMiddleware = require('../../middleware/errorMiddleware');
    const { authenticateToken } = require('../../middleware/authMiddleware');

    // 设置中间件和路由 - 使用测试控制器和服务
    app.use(logMiddleware);
    app.post('/api/auth/login', (req, res, next) => testAuthController.login(req, res, next));
    app.post('/api/auth/register', (req, res, next) => testAuthController.register(req, res, next));
    app.post('/api/auth/refresh', (req, res, next) => testAuthController.refresh(req, res, next));
    app.post('/api/auth/logout', (req, res) => testAuthController.logout(req, res));
    app.get('/api/auth/me', authenticateToken, (req, res) => testAuthController.me(req, res));
    app.use(errorMiddleware);

    // 插入测试数据
    const hashedPassword = await require('../../utils/passwordHelper').hash('password123');
    await new Promise((resolve, reject) => {
      db.db.run(
        "INSERT INTO users (name, email, password, role) VALUES ('Alice', 'alice@example.com', ?, 'user')",
        [hashedPassword],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    await new Promise((resolve, reject) => {
      db.db.run(
        "INSERT INTO users (name, email, password, role) VALUES ('Bob', 'bob@example.com', ?, 'admin')",
        [hashedPassword],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 恢复原始数据库路径
    process.env.DATABASE_PATH = originalDbPath;
  });

  afterAll(async () => {
    // 关闭数据库连接
    if (db) {
      await new Promise(resolve => {
        db.close(() => {
          resolve();
        });
      });
    }
  });

  beforeEach(async () => {
    // 在每次测试前清理数据
    // 注意：我们不需要在这里清理数据，因为测试数据是在beforeAll中设置的
    // 如果需要在每个测试前重置数据，可以在这里添加代码
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Alice', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('Alice');
      expect(response.body.user.role).toBe('user');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Alice', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.message).toContain('密码错误');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'NonExistentUser', password: 'password123' })
        .expect(404);

      expect(response.body.message).toContain('用户不存在');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'password789',
        role: 'user',
      };

      const response = await request(app).post('/api/auth/register').send(newUser).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBeDefined();
    });

    it('should return 400 for existing email', async () => {
      const existingUser = {
        name: 'Alice Duplicate',
        email: 'alice@example.com', // Already exists
        password: 'password123',
        role: 'user',
      };

      const response = await request(app).post('/api/auth/register').send(existingUser).expect(400);

      expect(response.body.message).toContain('邮箱已被注册');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      // First login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Alice', password: 'password123' })
        .expect(200);

      // Extract refresh token from cookie
      const refreshTokenCookie = loginResponse.headers['set-cookie'][1]; // Refresh token is second cookie
      const refreshToken = refreshTokenCookie.match(/refreshToken=([^;]+)/)[1];

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid_token'])
        .expect(401);

      expect(response.body.message).toContain('Refresh token 无效');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get token
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'Alice', password: 'password123' })
        .expect(200);

      const response = await request(app).post('/api/auth/logout').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('accessToken=;');
      expect(response.headers['set-cookie'][1]).toContain('refreshToken=;');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info when authenticated', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Alice', password: 'password123' })
        .expect(200);

      // Extract cookies from login response
      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app).get('/api/auth/me').set('Cookie', cookies).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.name).toBe('Alice');
      expect(response.body.user.email).toBe('alice@example.com');
      expect(response.body.user.role).toBe('user');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.error).toContain('Access token required');
    });
  });
});
