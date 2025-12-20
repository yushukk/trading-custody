const request = require('supertest');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

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

describe('Fund API Integration', () => {
  let db;

  // 增加测试超时时间
  jest.setTimeout(30000);

  beforeAll(async () => {
    // 临时改变环境变量以确保数据库路径为内存数据库
    const originalDbPath = process.env.DATABASE_PATH;
    process.env.DATABASE_PATH = ':memory:';

    // 创建一个新的内存数据库实例用于测试
    const Database = require('../../utils/database');
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
      )`);

    await db.run(`
      CREATE TABLE funds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

    await db.run(`
      CREATE TABLE fund_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount REAL,
        balance_after REAL,
        remark TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

    // 插入测试数据
    const passwordHelper = require('../../utils/passwordHelper');
    const hashedPassword = await passwordHelper.hash('password123');
    await db.run(
      "INSERT INTO users (id, name, email, password, role) VALUES (1, 'Alice', 'alice@example.com', ?, 'user')",
      [hashedPassword]
    );
    await db.run('INSERT INTO funds (user_id, amount, timestamp) VALUES (1, 1000, ?)', [
      new Date().toISOString(),
    ]);

    // 恢复原始数据库路径
    process.env.DATABASE_PATH = originalDbPath;
  });

  afterAll(async () => {
    // 关闭数据库连接
    await new Promise(resolve => {
      db.close(() => {
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // 清理数据库状态，确保每个测试都在干净的状态下运行
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM funds', function (err) {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM fund_logs', function (err) {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  // 创建一个测试辅助函数来创建绕过认证的应用
  const createTestApp = () => {
    const testApp = express();
    testApp.use(
      cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      })
    );
    testApp.use(express.json());
    testApp.use(cookieParser());

    // 临时构建验证所需的组件来绕过中间件（由于测试环境的限制）
    const _testUserDao = {
      findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
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

    const testFundDao = {
      getBalance: async userId => {
        const result = await db.get(
          'SELECT COALESCE(SUM(amount), 0) as balance FROM funds WHERE user_id = ?',
          [userId]
        );
        return result.balance;
      },
      addFunds: async (userId, amount, timestamp) => {
        return new Promise((resolve, reject) => {
          db.db.run(
            'INSERT INTO funds (user_id, amount, timestamp) VALUES (?, ?, ?)',
            [userId, amount, timestamp],
            function (err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      },
      getFundLogs: async (userId, limit = 5) => {
        return await db.all(
          'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
          [userId, limit]
        );
      },
      addFundLog: async (userId, type, amount, balanceAfter, timestamp) => {
        return new Promise((resolve, reject) => {
          db.db.run(
            'INSERT INTO fund_logs (user_id, type, amount, balance_after, timestamp) VALUES (?, ?, ?, ?, ?)',
            [userId, type, amount, balanceAfter, timestamp],
            function (err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      },
    };

    const FundService = require('../../services/fundService').constructor;
    const FundController = require('../../controllers/fundController').constructor;

    const testFundService = new FundService(testFundDao);
    const fundController = new FundController(testFundService);

    const logMiddleware = require('../../middleware/logMiddleware');
    const errorMiddleware = require('../../middleware/errorMiddleware');

    // 创建一个绕过认证的测试路由
    testApp.use(logMiddleware);
    testApp.get('/api/funds/:userId', (req, res, next) =>
      fundController.getFundBalance(req, res, next)
    );
    testApp.get('/api/funds/:userId/logs', (req, res, next) =>
      fundController.getFundLogs(req, res, next)
    );
    testApp.post('/api/funds/:userId', (req, res, next) =>
      fundController.handleFundOperation(req, res, next)
    );
    testApp.use(errorMiddleware);

    return testApp;
  };

  describe('GET /api/funds/:userId', () => {
    it('should return fund balance for existing user', async () => {
      // 确保用户1有1000的资金
      await new Promise((resolve, reject) => {
        db.db.run(
          'INSERT OR REPLACE INTO funds (user_id, amount, timestamp) VALUES (1, 1000, ?)',
          [new Date().toISOString()],
          function (err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const appWithAuth = createTestApp();
      const response = await request(appWithAuth).get('/api/funds/1').expect(200);

      expect(response.body.user_id).toBe('1');
      expect(response.body.balance).toBe(1000);
    });

    it('should return zero balance for non-existing user', async () => {
      const appWithAuth = createTestApp();
      const response = await request(appWithAuth).get('/api/funds/999').expect(200);

      expect(response.body.user_id).toBe('999');
      expect(response.body.balance).toBe(0);
    });
  });

  describe('GET /api/funds/:userId/logs', () => {
    it('should return fund logs for user', async () => {
      const appWithAuth = createTestApp();
      const response = await request(appWithAuth).get('/api/funds/1/logs').expect(200);
      expect(Array.isArray(response.body.logs)).toBe(true);
    });
  });

  describe('POST /api/funds/:userId', () => {
    it('should handle initial fund operation', async () => {
      const appWithAuth = createTestApp();

      // 先删除现有资金记录
      await new Promise((resolve, reject) => {
        db.db.run('DELETE FROM funds WHERE user_id = 1', function (err) {
          if (err) reject(err);
          else resolve();
        });
      });

      const response = await request(appWithAuth)
        .post('/api/funds/1')
        .send({ type: 'initial', amount: 2000, remark: 'Initial deposit' })
        .expect(200);

      expect(response.body.message).toBe('操作成功');
      expect(response.body.balance).toBe(2000);
    });

    it('should handle deposit operation', async () => {
      // First initialize funds
      const appWithAuth = createTestApp();
      await request(appWithAuth)
        .post('/api/funds/1')
        .send({ type: 'initial', amount: 2000, remark: 'Initial deposit' });

      const response = await request(appWithAuth)
        .post('/api/funds/1')
        .send({ type: 'deposit', amount: 500, remark: 'Additional deposit' })
        .expect(200);

      expect(response.body.message).toBe('操作成功');
      expect(response.body.balance).toBe(2500);
    });

    it('should handle withdraw operation', async () => {
      // First initialize funds
      const appWithAuth = createTestApp();
      await request(appWithAuth)
        .post('/api/funds/1')
        .send({ type: 'initial', amount: 2500, remark: 'Initial deposit' });

      const response = await request(appWithAuth)
        .post('/api/funds/1')
        .send({ type: 'withdraw', amount: 300, remark: 'Withdrawal' })
        .expect(200);

      expect(response.body.message).toBe('操作成功');
      expect(response.body.balance).toBe(2200);
    });

    it('should return 400 for insufficient balance on withdrawal', async () => {
      // First initialize funds
      const appWithAuth = createTestApp();
      await request(appWithAuth)
        .post('/api/funds/1')
        .send({ type: 'initial', amount: 1000, remark: 'Initial deposit' });

      const response = await request(appWithAuth)
        .post('/api/funds/1')
        .send({ type: 'withdraw', amount: 5000, remark: 'Large withdrawal' })
        .expect(400);

      expect(response.body.message).toBe('余额不足');
    });

    it('should return 400 for invalid operation type', async () => {
      const appWithAuth = createTestApp();
      const response = await request(appWithAuth)
        .post('/api/funds/1')
        .send({ type: 'invalid', amount: 100, remark: 'Invalid operation' })
        .expect(400);

      expect(response.body.message).toBe('无效的操作类型');
    });
  });
});
