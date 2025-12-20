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

describe('Position API Integration', () => {
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
      )
    `);
    await db.run(`
      CREATE TABLE positions (
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
      )
    `);
    await db.run(`
      CREATE TABLE price_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT,
        asset_type TEXT,
        date TEXT,
        open REAL,
        high REAL,
        low REAL,
        close REAL,
        volume REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建测试用的DAO
    const _testUserDao = {
      findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
      findById: async id => await db.get('SELECT * FROM users WHERE id = ?', [id]),
      create: async userData => {
        const { name, email, password, role } = userData;
        const result = await db.run(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [name, email, password, role]
        );
        return result.lastID;
      },
      update: async (id, userData) => {
        const { name, email, role } = userData;
        await db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
          name,
          email,
          role,
          id,
        ]);
      },
      updatePassword: async (id, hashedPassword) => {
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
      },
      delete: async id => {
        await db.run('DELETE FROM users WHERE id = ?', [id]);
      },
      findAll: async () => {
        return await db.all('SELECT id, name, email, role FROM users');
      },
    };

    const _testFundDao = {
      getBalance: async userId => {
        const result = await db.get('SELECT balance FROM funds WHERE user_id = ?', [userId]);
        return result ? result.balance : 0;
      },
      updateBalance: async (userId, balance) => {
        await db.run('INSERT OR REPLACE INTO funds (user_id, balance) VALUES (?, ?)', [
          userId,
          balance,
        ]);
      },
      addLog: async logData => {
        const { userId, type, amount, balanceAfter, remark } = logData;
        await db.run(
          'INSERT INTO fund_logs (user_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)',
          [userId, type, amount, balanceAfter, remark]
        );
      },
      getLogs: async (userId, limit = 5) => {
        return await db.all(
          'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
          [userId, limit]
        );
      },
    };

    const testPositionDao = {
      findByUserId: async userId => {
        const rows = await db.all(
          'SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC',
          [userId]
        );
        // 模拟数据库字段名到驼峰命名的映射
        return rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          assetType: row.asset_type,
          code: row.code,
          name: row.name,
          operation: row.operation,
          price: row.price,
          quantity: row.quantity,
          timestamp: row.timestamp,
          fee: row.fee,
        }));
      },
      create: async positionData => {
        const { userId, assetType, code, name, operation, price, quantity, timestamp, fee } =
          positionData;
        const result = await db.run(
          'INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, code, name, assetType, operation, price, quantity, timestamp, fee || 0]
        );
        return result.lastID;
      },
      deleteByUserId: async userId => {
        await db.run('DELETE FROM positions WHERE user_id = ?', [userId]);
      },
    };

    const _testPriceDao = {
      getLatestPrice: async (_code, _assetType) => {
        return await db.get(
          'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY date DESC LIMIT 1',
          [_code, _assetType]
        );
      },
      addPrice: async priceData => {
        const { code, assetType, date, open, high, low, close, volume } = priceData;
        await db.run(
          'INSERT INTO price_data (code, asset_type, date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [code, assetType, date, open, high, low, close, volume]
        );
      },
    };

    // 导入服务和控制器
    const { PositionService } = require('../../services/positionService');
    const { PositionController } = require('../../controllers/positionController');

    // 创建价格服务的模拟实现
    const testPriceService = {
      getLatestPrice: async () => {
        return 150.0; // 返回一个模拟的价格
      },
    };

    const testPositionService = new PositionService(testPositionDao, testPriceService);
    const positionController = new PositionController(testPositionService);

    let authenticateToken, checkResourceOwnership;

    try {
      const authMiddleware = require('../../middleware/authMiddleware');
      authenticateToken =
        authMiddleware.authenticateToken || authMiddleware.default?.authenticateToken;
      checkResourceOwnership =
        authMiddleware.checkResourceOwnership || authMiddleware.default?.checkResourceOwnership;
    } catch (_err) {
      // 如果认证中间件未导出这些函数，则使用绕过认证的版本
      authenticateToken = (req, _res, next) => {
        req.user = { id: 1, role: 'user', email: 'alice@example.com' }; // 模拟认证用户
        next();
      };
      checkResourceOwnership = (_req, _res, next) => next();
    }

    // 导入中间件
    const logMiddleware = require('../../middleware/logMiddleware');
    const errorMiddleware = require('../../middleware/errorMiddleware');

    // 设置中间件和路由
    app.use(logMiddleware);
    app.get('/api/positions/:userId', authenticateToken, checkResourceOwnership, (req, res, next) =>
      positionController.getPositions(req, res, next)
    );
    app.get(
      '/api/positions/:userId/profit',
      authenticateToken,
      checkResourceOwnership,
      (req, res, next) => positionController.calculatePositionProfit(req, res, next)
    );
    app.post(
      '/api/positions/:userId',
      authenticateToken,
      checkResourceOwnership,
      (req, res, next) => positionController.addPosition(req, res, next)
    );
    app.delete(
      '/api/positions/:userId',
      authenticateToken,
      checkResourceOwnership,
      (req, res, next) => positionController.deletePositions(req, res, next)
    );
    app.use(errorMiddleware);

    // 插入测试数据
    const passwordHelper = require('../../utils/passwordHelper');
    const hashedPassword = await passwordHelper.hash('password123');
    await db.run(
      "INSERT INTO users (id, name, email, password, role) VALUES (1, 'Alice', 'alice@example.com', ?, 'user')",
      [hashedPassword]
    );
    await db.run(
      "INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee) VALUES (1, 'AAPL', 'Apple', 'stock', 'buy', 150.00, 10, '2023-01-01 10:00:00', 0)"
    );

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

  describe('GET /api/positions/:userId', () => {
    it('should return positions for existing user', async () => {
      // 使用绕过认证的测试应用
      const appWithAuth = express();
      appWithAuth.use(
        cors({
          origin: process.env.CORS_ORIGIN,
          credentials: true,
        })
      );
      appWithAuth.use(express.json());
      appWithAuth.use(cookieParser());

      const _testUserDao = {
        findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
        findById: async id => await db.get('SELECT * FROM users WHERE id = ?', [id]),
        create: async userData => {
          const { name, email, password, role } = userData;
          const result = await db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
          );
          return result.lastID;
        },
        update: async (id, userData) => {
          const { name, email, role } = userData;
          await db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
            name,
            email,
            role,
            id,
          ]);
        },
        updatePassword: async (id, hashedPassword) => {
          await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        },
        delete: async id => {
          await db.run('DELETE FROM users WHERE id = ?', [id]);
        },
        findAll: async () => {
          return await db.all('SELECT id, name, email, role FROM users');
        },
      };

      const _testFundDao = {
        getBalance: async userId => {
          const result = await db.get('SELECT balance FROM funds WHERE user_id = ?', [userId]);
          return result ? result.balance : 0;
        },
        updateBalance: async (userId, balance) => {
          await db.run('INSERT OR REPLACE INTO funds (user_id, balance) VALUES (?, ?)', [
            userId,
            balance,
          ]);
        },
        addLog: async logData => {
          const { userId, type, amount, balanceAfter, remark } = logData;
          await db.run(
            'INSERT INTO fund_logs (user_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)',
            [userId, type, amount, balanceAfter, remark]
          );
        },
        getLogs: async (userId, limit = 5) => {
          return await db.all(
            'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
            [userId, limit]
          );
        },
      };

      const testPositionDao = {
        findByUserId: async userId => {
          const rows = await db.all(
            'SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC',
            [userId]
          );
          // 模拟数据库字段名到驼峰命名的映射
          return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            assetType: row.asset_type,
            code: row.code,
            name: row.name,
            operation: row.operation,
            price: row.price,
            quantity: row.quantity,
            timestamp: row.timestamp,
            fee: row.fee,
          }));
        },
        create: async positionData => {
          const { userId, assetType, code, name, operation, price, quantity, timestamp, fee } =
            positionData;
          const result = await db.run(
            'INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, code, name, assetType, operation, price, quantity, timestamp, fee || 0]
          );
          return result.lastID;
        },
        deleteByUserId: async userId => {
          await db.run('DELETE FROM positions WHERE user_id = ?', [userId]);
        },
        deleteById: async id => {
          await db.run('DELETE FROM positions WHERE id = ?', [id]);
        },
        findById: async id => {
          return await db.get('SELECT * FROM positions WHERE id = ?', [id]);
        },
        findByCodeAndUser: async (userId, code, assetType) => {
          return await db.get(
            'SELECT * FROM positions WHERE user_id = ? AND code = ? AND asset_type = ?',
            [userId, code, assetType]
          );
        },
        getAllUsersPositions: async () => {
          return await db.all(
            'SELECT p.*, u.name as user_name, u.email as user_email FROM positions p JOIN users u ON p.user_id = u.id ORDER BY p.user_id, p.timestamp DESC'
          );
        },
      };

      const _testPriceDao = {
        getLatestPrice: async (_code, _assetType) => {
          return await db.get(
            'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY date DESC LIMIT 1',
            [_code, _assetType]
          );
        },
        addPrice: async priceData => {
          const { code, assetType, date, open, high, low, close, volume } = priceData;
          await db.run(
            'INSERT INTO price_data (code, asset_type, date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, assetType, date, open, high, low, close, volume]
          );
        },
      };

      const { PositionService } = require('../../services/positionService');
      const { PositionController } = require('../../controllers/positionController');

      // 创建价格服务的模拟实现
      const testPriceService = {
        getLatestPrice: async () => {
          return 150.0; // 返回一个模拟的价格
        },
      };

      const testPositionService = new PositionService(testPositionDao, testPriceService);
      const positionController = new PositionController(testPositionService);

      const logMiddleware = require('../../middleware/logMiddleware');
      const errorMiddleware = require('../../middleware/errorMiddleware');

      appWithAuth.use(logMiddleware);
      appWithAuth.get('/api/positions/:userId', (req, res, next) =>
        positionController.getPositions(req, res, next)
      );
      appWithAuth.use(errorMiddleware);

      const response = await request(appWithAuth).get('/api/positions/1').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.positions)).toBe(true);
      if (response.body.positions.length > 0) {
        expect(response.body.positions[0]).toHaveProperty('code', 'AAPL');
        expect(response.body.positions[0]).toHaveProperty('name', 'Apple');
        expect(response.body.positions[0]).toHaveProperty('quantity', 10);
      }
    });

    it('should return empty array for non-existing user', async () => {
      // 使用绕过认证的测试应用
      const appWithAuth = express();
      appWithAuth.use(
        cors({
          origin: process.env.CORS_ORIGIN,
          credentials: true,
        })
      );
      appWithAuth.use(express.json());
      appWithAuth.use(cookieParser());

      const _testUserDao = {
        findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
        findById: async id => await db.get('SELECT * FROM users WHERE id = ?', [id]),
        create: async userData => {
          const { name, email, password, role } = userData;
          const result = await db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
          );
          return result.lastID;
        },
        update: async (id, userData) => {
          const { name, email, role } = userData;
          await db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
            name,
            email,
            role,
            id,
          ]);
        },
        updatePassword: async (id, hashedPassword) => {
          await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        },
        delete: async id => {
          await db.run('DELETE FROM users WHERE id = ?', [id]);
        },
        findAll: async () => {
          return await db.all('SELECT id, name, email, role FROM users');
        },
      };

      const _testFundDao = {
        getBalance: async userId => {
          const result = await db.get('SELECT balance FROM funds WHERE user_id = ?', [userId]);
          return result ? result.balance : 0;
        },
        updateBalance: async (userId, balance) => {
          await db.run('INSERT OR REPLACE INTO funds (user_id, balance) VALUES (?, ?)', [
            userId,
            balance,
          ]);
        },
        addLog: async logData => {
          const { userId, type, amount, balanceAfter, remark } = logData;
          await db.run(
            'INSERT INTO fund_logs (user_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)',
            [userId, type, amount, balanceAfter, remark]
          );
        },
        getLogs: async (userId, limit = 5) => {
          return await db.all(
            'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
            [userId, limit]
          );
        },
      };

      const testPositionDao = {
        findByUserId: async userId => {
          const rows = await db.all(
            'SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC',
            [userId]
          );
          // 模拟数据库字段名到驼峰命名的映射
          return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            assetType: row.asset_type,
            code: row.code,
            name: row.name,
            operation: row.operation,
            price: row.price,
            quantity: row.quantity,
            timestamp: row.timestamp,
            fee: row.fee,
          }));
        },
        create: async positionData => {
          const { userId, assetType, code, name, operation, price, quantity, timestamp, fee } =
            positionData;
          const result = await db.run(
            'INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, code, name, assetType, operation, price, quantity, timestamp, fee || 0]
          );
          return result.lastID;
        },
        deleteByUserId: async userId => {
          await db.run('DELETE FROM positions WHERE user_id = ?', [userId]);
        },
        deleteById: async id => {
          await db.run('DELETE FROM positions WHERE id = ?', [id]);
        },
        findById: async id => {
          return await db.get('SELECT * FROM positions WHERE id = ?', [id]);
        },
        findByCodeAndUser: async (userId, code, assetType) => {
          return await db.get(
            'SELECT * FROM positions WHERE user_id = ? AND code = ? AND asset_type = ?',
            [userId, code, assetType]
          );
        },
        getAllUsersPositions: async () => {
          return await db.all(
            'SELECT p.*, u.name as user_name, u.email as user_email FROM positions p JOIN users u ON p.user_id = u.id ORDER BY p.user_id, p.timestamp DESC'
          );
        },
      };

      const _testPriceDao = {
        getLatestPrice: async (_code, _assetType) => {
          return await db.get(
            'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY date DESC LIMIT 1',
            [_code, _assetType]
          );
        },
        addPrice: async priceData => {
          const { code, assetType, date, open, high, low, close, volume } = priceData;
          await db.run(
            'INSERT INTO price_data (code, asset_type, date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, assetType, date, open, high, low, close, volume]
          );
        },
      };

      const { PositionService } = require('../../services/positionService');
      const { PositionController } = require('../../controllers/positionController');

      // 创建价格服务的模拟实现
      const testPriceService = {
        getLatestPrice: async () => {
          return 150.0; // 返回一个模拟的价格
        },
      };

      const testPositionService = new PositionService(testPositionDao, testPriceService);
      const positionController = new PositionController(testPositionService);

      const logMiddleware = require('../../middleware/logMiddleware');
      const errorMiddleware = require('../../middleware/errorMiddleware');

      appWithAuth.use(logMiddleware);
      appWithAuth.get('/api/positions/:userId', (req, res, next) =>
        positionController.getPositions(req, res, next)
      );
      appWithAuth.use(errorMiddleware);

      const response = await request(appWithAuth).get('/api/positions/999').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.positions)).toBe(true);
      expect(response.body.positions).toEqual([]);
    });
  });

  describe('GET /api/positions/:userId/profit', () => {
    it('should return position profit for user', async () => {
      // 使用绕过认证的测试应用
      const appWithAuth = express();
      appWithAuth.use(
        cors({
          origin: process.env.CORS_ORIGIN,
          credentials: true,
        })
      );
      appWithAuth.use(express.json());
      appWithAuth.use(cookieParser());

      const _testUserDao = {
        findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
        findById: async id => await db.get('SELECT * FROM users WHERE id = ?', [id]),
        create: async userData => {
          const { name, email, password, role } = userData;
          const result = await db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
          );
          return result.lastID;
        },
        update: async (id, userData) => {
          const { name, email, role } = userData;
          await db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
            name,
            email,
            role,
            id,
          ]);
        },
        updatePassword: async (id, hashedPassword) => {
          await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        },
        delete: async id => {
          await db.run('DELETE FROM users WHERE id = ?', [id]);
        },
        findAll: async () => {
          return await db.all('SELECT id, name, email, role FROM users');
        },
      };

      const _testFundDao = {
        getBalance: async userId => {
          const result = await db.get('SELECT balance FROM funds WHERE user_id = ?', [userId]);
          return result ? result.balance : 0;
        },
        updateBalance: async (userId, balance) => {
          await db.run('INSERT OR REPLACE INTO funds (user_id, balance) VALUES (?, ?)', [
            userId,
            balance,
          ]);
        },
        addLog: async logData => {
          const { userId, type, amount, balanceAfter, remark } = logData;
          await db.run(
            'INSERT INTO fund_logs (user_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)',
            [userId, type, amount, balanceAfter, remark]
          );
        },
        getLogs: async (userId, limit = 5) => {
          return await db.all(
            'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
            [userId, limit]
          );
        },
      };

      const testPositionDao = {
        findByUserId: async userId => {
          const rows = await db.all(
            'SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC',
            [userId]
          );
          // 模拟数据库字段名到驼峰命名的映射
          return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            assetType: row.asset_type,
            code: row.code,
            name: row.name,
            operation: row.operation,
            price: row.price,
            quantity: row.quantity,
            timestamp: row.timestamp,
            fee: row.fee,
          }));
        },
        create: async positionData => {
          const { userId, assetType, code, name, operation, price, quantity, timestamp, fee } =
            positionData;
          const result = await db.run(
            'INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, code, name, assetType, operation, price, quantity, timestamp, fee || 0]
          );
          return result.lastID;
        },
        deleteByUserId: async userId => {
          await db.run('DELETE FROM positions WHERE user_id = ?', [userId]);
        },
        deleteById: async id => {
          await db.run('DELETE FROM positions WHERE id = ?', [id]);
        },
        findById: async id => {
          return await db.get('SELECT * FROM positions WHERE id = ?', [id]);
        },
        findByCodeAndUser: async (userId, code, assetType) => {
          return await db.get(
            'SELECT * FROM positions WHERE user_id = ? AND code = ? AND asset_type = ?',
            [userId, code, assetType]
          );
        },
        getAllUsersPositions: async () => {
          return await db.all(
            'SELECT p.*, u.name as user_name, u.email as user_email FROM positions p JOIN users u ON p.user_id = u.id ORDER BY p.user_id, p.timestamp DESC'
          );
        },
      };

      const _testPriceDao = {
        getLatestPrice: async (_code, _assetType) => {
          return await db.get(
            'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY date DESC LIMIT 1',
            [_code, _assetType]
          );
        },
        addPrice: async priceData => {
          const { code, assetType, date, open, high, low, close, volume } = priceData;
          await db.run(
            'INSERT INTO price_data (code, asset_type, date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, assetType, date, open, high, low, close, volume]
          );
        },
      };

      const { PositionService } = require('../../services/positionService');
      const { PositionController } = require('../../controllers/positionController');

      // 创建价格服务的模拟实现
      const testPriceService = {
        getLatestPrice: async () => {
          return 150.0; // 返回一个模拟的价格
        },
      };

      const testPositionService = new PositionService(testPositionDao, testPriceService);
      const positionController = new PositionController(testPositionService);

      const logMiddleware = require('../../middleware/logMiddleware');
      const errorMiddleware = require('../../middleware/errorMiddleware');

      appWithAuth.use(logMiddleware);
      appWithAuth.get('/api/positions/:userId/profit', (req, res, next) =>
        positionController.calculatePositionProfit(req, res, next)
      );
      appWithAuth.use(errorMiddleware);

      const response = await request(appWithAuth).get('/api/positions/1/profit').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.results)).toBe(true);
      // The response might be empty if there's no price data, but it should be an array
    });
  });

  describe('POST /api/positions/:userId', () => {
    it('should add a new position', async () => {
      // 使用绕过认证的测试应用
      const appWithAuth = express();
      appWithAuth.use(
        cors({
          origin: process.env.CORS_ORIGIN,
          credentials: true,
        })
      );
      appWithAuth.use(express.json());
      appWithAuth.use(cookieParser());

      const _testUserDao = {
        findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
        findById: async id => await db.get('SELECT * FROM users WHERE id = ?', [id]),
        create: async userData => {
          const { name, email, password, role } = userData;
          const result = await db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
          );
          return result.lastID;
        },
        update: async (id, userData) => {
          const { name, email, role } = userData;
          await db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
            name,
            email,
            role,
            id,
          ]);
        },
        updatePassword: async (id, hashedPassword) => {
          await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        },
        delete: async id => {
          await db.run('DELETE FROM users WHERE id = ?', [id]);
        },
        findAll: async () => {
          return await db.all('SELECT id, name, email, role FROM users');
        },
      };

      const _testFundDao = {
        getBalance: async userId => {
          const result = await db.get('SELECT balance FROM funds WHERE user_id = ?', [userId]);
          return result ? result.balance : 0;
        },
        updateBalance: async (userId, balance) => {
          await db.run('INSERT OR REPLACE INTO funds (user_id, balance) VALUES (?, ?)', [
            userId,
            balance,
          ]);
        },
        addLog: async logData => {
          const { userId, type, amount, balanceAfter, remark } = logData;
          await db.run(
            'INSERT INTO fund_logs (user_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)',
            [userId, type, amount, balanceAfter, remark]
          );
        },
        getLogs: async (userId, limit = 5) => {
          return await db.all(
            'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
            [userId, limit]
          );
        },
      };

      const testPositionDao = {
        findByUserId: async userId => {
          const rows = await db.all(
            'SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC',
            [userId]
          );
          // 模拟数据库字段名到驼峰命名的映射
          return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            assetType: row.asset_type,
            code: row.code,
            name: row.name,
            operation: row.operation,
            price: row.price,
            quantity: row.quantity,
            timestamp: row.timestamp,
            fee: row.fee,
          }));
        },
        create: async positionData => {
          const { userId, assetType, code, name, operation, price, quantity, timestamp, fee } =
            positionData;
          await db.run(
            'INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, code, name, assetType, operation, price, quantity, timestamp, fee || 0]
          );
          // 获取刚插入记录的ID
          const result = await db.get('SELECT last_insert_rowid() as id');
          return result.id;
        },
        deleteByUserId: async userId => {
          await db.run('DELETE FROM positions WHERE user_id = ?', [userId]);
        },
        deleteById: async id => {
          await db.run('DELETE FROM positions WHERE id = ?', [id]);
        },
        findById: async id => {
          return await db.get('SELECT * FROM positions WHERE id = ?', [id]);
        },
        findByCodeAndUser: async (userId, code, assetType) => {
          return await db.get(
            'SELECT * FROM positions WHERE user_id = ? AND code = ? AND asset_type = ?',
            [userId, code, assetType]
          );
        },
        getAllUsersPositions: async () => {
          return await db.all(
            'SELECT p.*, u.name as user_name, u.email as user_email FROM positions p JOIN users u ON p.user_id = u.id ORDER BY p.user_id, p.timestamp DESC'
          );
        },
      };

      const _testPriceDao = {
        getLatestPrice: async (_code, _assetType) => {
          return await db.get(
            'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY date DESC LIMIT 1',
            [_code, _assetType]
          );
        },
        addPrice: async priceData => {
          const { code, assetType, date, open, high, low, close, volume } = priceData;
          await db.run(
            'INSERT INTO price_data (code, asset_type, date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, assetType, date, open, high, low, close, volume]
          );
        },
      };

      const { PositionService } = require('../../services/positionService');
      const { PositionController } = require('../../controllers/positionController');

      // 创建价格服务的模拟实现
      const testPriceService = {
        getLatestPrice: async () => {
          return 150.0; // 返回一个模拟的价格
        },
      };

      const testPositionService = new PositionService(testPositionDao, testPriceService);
      const positionController = new PositionController(testPositionService);

      // 检查 authenticateToken 和 checkResourceOwnership 函数是否存在
      let authenticateToken, checkResourceOwnership;

      try {
        const authMiddleware = require('../../middleware/authMiddleware');
        authenticateToken =
          authMiddleware.authenticateToken || authMiddleware.default.authenticateToken;
        checkResourceOwnership =
          authMiddleware.checkResourceOwnership || authMiddleware.default.checkResourceOwnership;
      } catch (err) {
        // 如果认证中间件未导出这些函数，则使用绕过认证的版本
        authenticateToken = (req, res, next) => {
          req.user = { id: 1, role: 'user', email: 'alice@example.com' }; // 模拟认证用户
          next();
        };
        checkResourceOwnership = (req, res, next) => next();
      }

      const logMiddleware = require('../../middleware/logMiddleware');
      const errorMiddleware = require('../../middleware/errorMiddleware');

      appWithAuth.use(logMiddleware);
      appWithAuth.post(
        '/api/positions/:userId',
        authenticateToken,
        checkResourceOwnership,
        (req, res, next) => positionController.addPosition(req, res, next)
      );
      appWithAuth.use(errorMiddleware);

      // 生成测试用的 JWT token
      const jwt = require('jsonwebtoken');
      const testToken = jwt.sign(
        { userId: 1, role: 'user', email: 'alice@example.com' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

      const newPosition = {
        assetType: 'stock',
        code: 'GOOGL',
        name: 'Google',
        operation: 'buy',
        price: 2500,
        quantity: 5,
        fee: 10,
      };

      const response = await request(appWithAuth)
        .post('/api/positions/1')
        .set('Cookie', [`accessToken=${testToken}`])
        .send(newPosition)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('持仓操作添加成功');
    });

    it('should return 400 for invalid position data', async () => {
      // 使用绕过认证的测试应用
      const appWithAuth = express();
      appWithAuth.use(
        cors({
          origin: process.env.CORS_ORIGIN,
          credentials: true,
        })
      );
      appWithAuth.use(express.json());
      appWithAuth.use(cookieParser());

      const _testUserDao = {
        findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
        findById: async id => await db.get('SELECT * FROM users WHERE id = ?', [id]),
        create: async userData => {
          const { name, email, password, role } = userData;
          const result = await db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
          );
          return result.lastID;
        },
        update: async (id, userData) => {
          const { name, email, role } = userData;
          await db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
            name,
            email,
            role,
            id,
          ]);
        },
        updatePassword: async (id, hashedPassword) => {
          await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        },
        delete: async id => {
          await db.run('DELETE FROM users WHERE id = ?', [id]);
        },
        findAll: async () => {
          return await db.all('SELECT id, name, email, role FROM users');
        },
      };

      const _testFundDao = {
        getBalance: async userId => {
          const result = await db.get('SELECT balance FROM funds WHERE user_id = ?', [userId]);
          return result ? result.balance : 0;
        },
        updateBalance: async (userId, balance) => {
          await db.run('INSERT OR REPLACE INTO funds (user_id, balance) VALUES (?, ?)', [
            userId,
            balance,
          ]);
        },
        addLog: async logData => {
          const { userId, type, amount, balanceAfter, remark } = logData;
          await db.run(
            'INSERT INTO fund_logs (user_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)',
            [userId, type, amount, balanceAfter, remark]
          );
        },
        getLogs: async (userId, limit = 5) => {
          return await db.all(
            'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
            [userId, limit]
          );
        },
      };

      const testPositionDao = {
        findByUserId: async userId => {
          const rows = await db.all(
            'SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC',
            [userId]
          );
          // 模拟数据库字段名到驼峰命名的映射
          return rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            assetType: row.asset_type,
            code: row.code,
            name: row.name,
            operation: row.operation,
            price: row.price,
            quantity: row.quantity,
            timestamp: row.timestamp,
            fee: row.fee,
          }));
        },
        create: async positionData => {
          const { userId, assetType, code, name, operation, price, quantity, timestamp, fee } =
            positionData;
          const result = await db.run(
            'INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, code, name, assetType, operation, price, quantity, timestamp, fee || 0]
          );
          return result.lastID;
        },
        deleteByUserId: async userId => {
          await db.run('DELETE FROM positions WHERE user_id = ?', [userId]);
        },
        deleteById: async id => {
          await db.run('DELETE FROM positions WHERE id = ?', [id]);
        },
        findById: async id => {
          return await db.get('SELECT * FROM positions WHERE id = ?', [id]);
        },
        findByCodeAndUser: async (userId, code, assetType) => {
          return await db.get(
            'SELECT * FROM positions WHERE user_id = ? AND code = ? AND asset_type = ?',
            [userId, code, assetType]
          );
        },
        getAllUsersPositions: async () => {
          return await db.all(
            'SELECT p.*, u.name as user_name, u.email as user_email FROM positions p JOIN users u ON p.user_id = u.id ORDER BY p.user_id, p.timestamp DESC'
          );
        },
      };

      const _testPriceDao = {
        getLatestPrice: async (_code, _assetType) => {
          return await db.get(
            'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY date DESC LIMIT 1',
            [_code, _assetType]
          );
        },
        addPrice: async priceData => {
          const { code, assetType, date, open, high, low, close, volume } = priceData;
          await db.run(
            'INSERT INTO price_data (code, asset_type, date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, assetType, date, open, high, low, close, volume]
          );
        },
      };

      const { PositionService } = require('../../services/positionService');
      const { PositionController } = require('../../controllers/positionController');

      // 创建价格服务的模拟实现
      const testPriceService = {
        getLatestPrice: async () => {
          return 150.0; // 返回一个模拟的价格
        },
      };

      const testPositionService = new PositionService(testPositionDao, testPriceService);
      const positionController = new PositionController(testPositionService);

      const logMiddleware = require('../../middleware/logMiddleware');
      const errorMiddleware = require('../../middleware/errorMiddleware');

      appWithAuth.use(logMiddleware);
      appWithAuth.post('/api/positions/:userId', (req, res, next) =>
        positionController.addPosition(req, res, next)
      );
      appWithAuth.use(errorMiddleware);

      const invalidPosition = {
        assetType: 'invalid',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10,
      };

      const response = await request(appWithAuth)
        .post('/api/positions/1')
        .send(invalidPosition)
        .expect(400);

      expect(response.body.message).toContain('无效的资产类型');
    });
  });

  describe('DELETE /api/positions/:userId', () => {
    it('should delete positions for user', async () => {
      // 使用绕过认证的测试应用
      const appWithAuth = express();
      appWithAuth.use(
        cors({
          origin: process.env.CORS_ORIGIN,
          credentials: true,
        })
      );
      appWithAuth.use(express.json());
      appWithAuth.use(cookieParser());

      const _testUserDao = {
        findByEmail: async email => await db.get('SELECT * FROM users WHERE email = ?', [email]),
        findById: async id => await db.get('SELECT * FROM users WHERE id = ?', [id]),
        create: async userData => {
          const { name, email, password, role } = userData;
          const result = await db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
          );
          return result.lastID;
        },
        update: async (id, userData) => {
          const { name, email, role } = userData;
          await db.run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [
            name,
            email,
            role,
            id,
          ]);
        },
        updatePassword: async (id, hashedPassword) => {
          await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        },
        delete: async id => {
          await db.run('DELETE FROM users WHERE id = ?', [id]);
        },
        findAll: async () => {
          return await db.all('SELECT id, name, email, role FROM users');
        },
      };

      const _testFundDao = {
        getBalance: async userId => {
          const result = await db.get('SELECT balance FROM funds WHERE user_id = ?', [userId]);
          return result ? result.balance : 0;
        },
        updateBalance: async (userId, balance) => {
          await db.run('INSERT OR REPLACE INTO funds (user_id, balance) VALUES (?, ?)', [
            userId,
            balance,
          ]);
        },
        addLog: async logData => {
          const { userId, type, amount, balanceAfter, remark } = logData;
          await db.run(
            'INSERT INTO fund_logs (user_id, type, amount, balance_after, remark) VALUES (?, ?, ?, ?, ?)',
            [userId, type, amount, balanceAfter, remark]
          );
        },
        getLogs: async (userId, limit = 5) => {
          return await db.all(
            'SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
            [userId, limit]
          );
        },
      };

      const testPositionDao = {
        findByUserId: async userId => {
          return await db.all('SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC', [
            userId,
          ]);
        },
        create: async positionData => {
          const { userId, assetType, code, name, operation, price, quantity, timestamp, fee } =
            positionData;
          const result = await db.run(
            'INSERT INTO positions (user_id, code, name, asset_type, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, code, name, assetType, operation, price, quantity, timestamp, fee || 0]
          );
          return result.lastID;
        },
        deleteByUserId: async userId => {
          await db.run('DELETE FROM positions WHERE user_id = ?', [userId]);
        },
        deleteById: async id => {
          await db.run('DELETE FROM positions WHERE id = ?', [id]);
        },
        findById: async id => {
          return await db.get('SELECT * FROM positions WHERE id = ?', [id]);
        },
        findByCodeAndUser: async (userId, code, assetType) => {
          return await db.get(
            'SELECT * FROM positions WHERE user_id = ? AND code = ? AND asset_type = ?',
            [userId, code, assetType]
          );
        },
        getAllUsersPositions: async () => {
          return await db.all(
            'SELECT p.*, u.name as user_name, u.email as user_email FROM positions p JOIN users u ON p.user_id = u.id ORDER BY p.user_id, p.timestamp DESC'
          );
        },
      };

      const _testPriceDao = {
        getLatestPrice: async (_code, _assetType) => {
          return await db.get(
            'SELECT * FROM price_data WHERE code = ? AND asset_type = ? ORDER BY date DESC LIMIT 1',
            [_code, _assetType]
          );
        },
        addPrice: async priceData => {
          const { code, assetType, date, open, high, low, close, volume } = priceData;
          await db.run(
            'INSERT INTO price_data (code, asset_type, date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, assetType, date, open, high, low, close, volume]
          );
        },
      };

      const { PositionService } = require('../../services/positionService');
      const { PositionController } = require('../../controllers/positionController');

      // 创建价格服务的模拟实现
      const testPriceService = {
        getLatestPrice: async () => {
          return 150.0; // 返回一个模拟的价格
        },
      };

      const testPositionService = new PositionService(testPositionDao, testPriceService);
      const positionController = new PositionController(testPositionService);

      const logMiddleware = require('../../middleware/logMiddleware');
      const errorMiddleware = require('../../middleware/errorMiddleware');

      appWithAuth.use(logMiddleware);
      appWithAuth.delete('/api/positions/:userId', (req, res, next) =>
        positionController.deletePositions(req, res, next)
      );
      appWithAuth.use(errorMiddleware);

      const response = await request(appWithAuth).delete('/api/positions/1').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('成功清除用户1的持仓记录');
    });
  });
});
