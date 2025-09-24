const request = require('supertest');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 在文件顶部设置环境变量，确保在导入任何模块之前设置
const testDbPath = path.join(__dirname, '../test-database.db');
process.env.DATABASE_PATH = testDbPath;

// 创建测试应用
const app = express();
app.use(cors());
app.use(express.json());

describe('User API Integration', () => {
  let db;
  let userController;
  let logMiddleware;
  let errorHandler;
  
  // 增加测试超时时间
  jest.setTimeout(30000);
  
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
        db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, role TEXT)", (err) => {
          if (err) {
            done(err);
            return;
          }
          
          // 插入测试数据
          const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
          stmt.run("Alice", "alice@example.com", "password123", "user");
          stmt.run("Bob", "bob@example.com", "password456", "admin");
          stmt.finalize(() => {
            // 在数据库初始化完成后导入控制器
            userController = require('../../controllers/userController');
            logMiddleware = require('../../middleware/logMiddleware');
            errorHandler = require('../../middleware/errorMiddleware');
            
            // 设置中间件和路由
            app.use(logMiddleware);
            app.post('/api/login', userController.login);
            app.put('/api/update-password', userController.updatePassword);
            app.get('/api/users', userController.getAllUsers);
            app.post('/api/users', userController.createUser);
            app.put('/api/users/:id/password', userController.updateUserPasswordById);
            app.delete('/api/users/:id', userController.deleteUser);
            app.use(errorHandler);
            
            done();
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

  describe('POST /api/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'Alice', password: 'password123' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.role).toBe('user');
      expect(response.body.id).toBe(1);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'Alice', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // 注意：由于测试过程中可能添加了额外的用户，我们检查至少包含Alice和Bob
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      const alice = response.body.find(user => user.name === 'Alice');
      const bob = response.body.find(user => user.name === 'Bob');
      expect(alice).toBeDefined();
      expect(bob).toBeDefined();
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'password789',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(200);

      expect(response.body.name).toBe('Charlie');
      expect(response.body.email).toBe('charlie@example.com');
      expect(response.body.role).toBe('user');
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should update user password by id', async () => {
      const response = await request(app)
        .put('/api/users/1/password')
        .send({ newPassword: 'updatedpassword' })
        .expect(200);

      expect(response.body.message).toBe('Password updated successfully');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user by id', async () => {
      const response = await request(app)
        .delete('/api/users/3')
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
    });
  });
});