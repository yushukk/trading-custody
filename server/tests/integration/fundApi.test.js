const request = require('supertest');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// 在文件顶部设置环境变量，确保在导入任何模块之前设置
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_testing_purposes_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_testing_purposes_only';
process.env.DATABASE_PATH = path.join(__dirname, '../test-fund-database.db');
process.env.CORS_ORIGIN = 'http://localhost:8085';

// 创建测试应用
const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

describe('Fund API Integration', () => {
  let db;
  const testDbPath = path.join(__dirname, '../test-fund-database.db');
  
  // 增加测试超时时间
  jest.setTimeout(30000);
  
  beforeAll(async () => {
    // 删除测试数据库文件（如果存在）
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // 设置环境变量后再导入模块
    const fundController = require('../../controllers/fundController');
    const logMiddleware = require('../../middleware/logMiddleware');
    const errorHandler = require('../../middleware/errorMiddleware');
    db = require('../../utils/database');
    
    // 初始化数据库
    await db.initialize();
    
    // 设置中间件和路由
    app.use(logMiddleware);
    app.get('/api/funds/:userId', fundController.getFundBalance);
    app.get('/api/funds/:userId/logs', fundController.getFundLogs);
    app.post('/api/funds/:userId/:type', fundController.handleFundOperation);
    app.use(errorHandler);
    
    // 插入测试数据
    await db.run("INSERT INTO users (id, name, email, password, role) VALUES (1, 'Alice', 'alice@example.com', 'password123', 'user')");
    await db.run("INSERT INTO funds (user_id, balance) VALUES (1, 1000)");
  });

  afterAll((done) => {
    // 关闭数据库连接
    db.close(() => {
      // 删除测试数据库文件
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      done();
    });
  });

  describe('GET /api/funds/:userId', () => {
    it('should return fund balance for existing user', async () => {
      const response = await request(app)
        .get('/api/funds/1')
        .expect(200);

      expect(response.body.user_id).toBe(1);
      expect(response.body.balance).toBe(1000);
    });

    it('should return zero balance for non-existing user', async () => {
      const response = await request(app)
        .get('/api/funds/999')
        .expect(200);

      expect(response.body.user_id).toBe('999');
      expect(response.body.balance).toBe(0);
    });
  });

  describe('GET /api/funds/:userId/logs', () => {
    it('should return fund logs for user', async () => {
      const response = await request(app)
        .get('/api/funds/1/logs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/funds/:userId/:type', () => {
    it('should handle initial fund operation', async () => {
      // 先删除现有资金记录
      db.run("DELETE FROM funds WHERE user_id = 1");
      
      const response = await request(app)
        .post('/api/funds/1/initial')
        .send({ amount: 2000, remark: 'Initial deposit' })
        .expect(200);

      expect(response.body.message).toBe('操作成功');
      expect(response.body.balance).toBe(2000);
    });

    it('should handle deposit operation', async () => {
      const response = await request(app)
        .post('/api/funds/1/deposit')
        .send({ amount: 500, remark: 'Additional deposit' })
        .expect(200);

      expect(response.body.message).toBe('操作成功');
      expect(response.body.balance).toBe(2500);
    });

    it('should handle withdraw operation', async () => {
      const response = await request(app)
        .post('/api/funds/1/withdraw')
        .send({ amount: 300, remark: 'Withdrawal' })
        .expect(200);

      expect(response.body.message).toBe('操作成功');
      expect(response.body.balance).toBe(2200);
    });

    it('should return 400 for insufficient balance on withdrawal', async () => {
      const response = await request(app)
        .post('/api/funds/1/withdraw')
        .send({ amount: 5000, remark: 'Large withdrawal' })
        .expect(400);

      expect(response.body.error).toBe('余额不足');
    });

    it('should return 400 for invalid operation type', async () => {
      const response = await request(app)
        .post('/api/funds/1/invalid')
        .send({ amount: 100, remark: 'Invalid operation' })
        .expect(400);

      expect(response.body.error).toBe('无效的操作类型');
    });
  });
});