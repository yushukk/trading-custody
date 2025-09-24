const request = require('supertest');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 导入应用组件
const fundController = require('../../controllers/fundController');
const logMiddleware = require('../../middleware/logMiddleware');
const errorHandler = require('../../middleware/errorMiddleware');

// 创建测试应用
const app = express();
app.use(cors());
app.use(express.json());
app.use(logMiddleware);

// 资金相关路由
app.get('/api/funds/:userId', fundController.getFundBalance);
app.get('/api/funds/:userId/logs', fundController.getFundLogs);
app.post('/api/funds/:userId/:type', fundController.handleFundOperation);

// 错误处理中间件
app.use(errorHandler);

// 测试数据库路径
const testDbPath = path.join(__dirname, '../../test-fund-database.db');

describe('Fund API Integration', () => {
  let db;
  
  beforeAll((done) => {
    // 删除测试数据库文件（如果存在）
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // 创建测试数据库
    db = new sqlite3.Database(testDbPath, (err) => {
      if (err) {
        done(err);
        return;
      }
      
      // 初始化表结构
      db.serialize(() => {
        // 创建用户表
        db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, role TEXT)", (err) => {
          if (err) {
            done(err);
            return;
          }
          
          // 创建资金表
          db.run("CREATE TABLE funds (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, balance REAL DEFAULT 0)", (err) => {
            if (err) {
              done(err);
              return;
            }
            
            // 创建资金流水表
            db.run("CREATE TABLE fund_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, type TEXT, amount REAL, remark TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)", (err) => {
              if (err) {
                done(err);
                return;
              }
              
              // 插入测试数据
              const userStmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
              userStmt.run("Alice", "alice@example.com", "password123", "user");
              userStmt.finalize(() => {
                const fundStmt = db.prepare("INSERT INTO funds (user_id, balance) VALUES (?, ?)");
                fundStmt.run(1, 1000);
                fundStmt.finalize(done);
              });
            });
          });
        });
      });
    });
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

      expect(response.body.user_id).toBe(999);
      expect(response.body.balance).toBe(0);
    });
  });

  describe('GET /api/funds/:userId/logs', () => {
    it('should return fund logs for user', async () => {
      const response = await request(app)
        .get('/api/funds/1/logs')
        .expect(200);

      expect(response.body).toEqual([]);
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