const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;

// 数据库文件路径
const dbPath = path.join(__dirname, 'database.db');

// 检查数据库文件是否存在
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  // 创建数据库文件
  const db = new sqlite3.Database(dbPath);

  // 初始化数据
  db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, role TEXT)");
    const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    [
      ["Alice", "alice@example.com", "user", "user"],
      ["Bob", "bob@example.com", "user", "user"],
      ["Charlie", "charlie@example.com", "user", "user"],
      ["admin", "admin@example.com", "admin", "admin"]
    ].forEach(([name, email, password, role]) => stmt.run(name, email, password, role));
    stmt.finalize();
  });

  db.close();
}

// 使用已存在的数据库文件
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());

// 合并数据库初始化代码
db.serialize(() => {
  // 创建基础用户表
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, role TEXT)");
  
  // 资金相关表
  db.run("CREATE TABLE IF NOT EXISTS funds (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, balance REAL DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))");
  db.run("CREATE TABLE IF NOT EXISTS fund_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, type TEXT, amount REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))");
  
  // 持仓相关表
  db.run("CREATE TABLE IF NOT EXISTS positions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, asset_type TEXT, code TEXT, name TEXT, operation TEXT, price REAL, quantity INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))");
});

// API路由
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE name = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      // 使用 jsonwebtoken 生成 token，并返回用户ID
      const token = jwt.sign({ username: row.name, role: row.role }, 'your-secret-key', { expiresIn: '1h' });
      res.json({ token, role: row.role, id: row.id }); // 添加用户ID返回
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

app.put('/api/update-password', (req, res) => {
  const { username, newPassword } = req.body;
  db.run("UPDATE users SET password = ? WHERE name = ?", [newPassword, username], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Password updated successfully' });
  });
});

// 新增 API 路由
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, password, role } = req.body;
  db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, email, password, role });
  });
});

app.put('/api/users/:id/password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Password updated successfully' });
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// 新增资金管理API接口

// 获取用户资金余额
app.get('/api/funds/:userId', (req, res) => {
  const { userId } = req.params;
  db.get("SELECT * FROM funds WHERE user_id = ?", [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row || { user_id: userId, balance: 0 });
  });
});

// 获取资金流水
app.get('/api/funds/:userId/logs', (req, res) => {
  const { userId } = req.params;
  db.all("SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
});

// 处理资金操作
app.post('/api/funds/:userId/:type', (req, res) => {
  const { userId, type } = req.params;
  const { amount } = req.body;
  
  // 验证操作类型
  if (!['initial', 'deposit', 'withdraw'].includes(type)) {
    return res.status(400).json({ error: '无效的操作类型' });
  }
  
  // 验证金额
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: '金额必须为正数' });
  }
  
  db.serialize(() => {
    // 获取当前余额
    db.get("SELECT * FROM funds WHERE user_id = ?", [userId], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      let currentBalance = row?.balance || 0;
      let newBalance = currentBalance;
      
      // 根据操作类型更新余额
      if (type === 'initial') {
        newBalance = amount;
      } else if (type === 'deposit') {
        newBalance += amount;
      } else if (type === 'withdraw') {
        if (currentBalance < amount) {
          res.status(400).json({ error: '余额不足' });
          return;
        }
        newBalance -= amount;
      }
      
      // 更新资金余额
      if (row) {
        db.run("UPDATE funds SET balance = ? WHERE user_id = ?", [newBalance, userId]);
      } else {
        db.run("INSERT INTO funds (user_id, balance) VALUES (?, ?)", [userId, newBalance]);
      }
      
      // 记录资金流水
      db.run("INSERT INTO fund_logs (user_id, type, amount) VALUES (?, ?, ?)", [userId, type, amount]);
      
      res.json({ message: '操作成功', balance: newBalance });
    });
  });
});

// 新增持仓管理API接口
// 获取用户持仓
app.get('/api/positions/:userId', (req, res) => {
  const { userId } = req.params;
  db.all("SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
});

// 添加持仓操作
app.post('/api/positions/:userId', (req, res) => {
  const { userId } = req.params;
  const { assetType, code, name, operation, price, quantity, timestamp } = req.body;
  
  // 参数验证
  if (!['stock', 'future', 'fund'].includes(assetType)) {
    return res.status(400).json({ error: '无效的资产类型' });
  }
  if (!operation || !['buy', 'sell'].includes(operation)) {
    return res.status(400).json({ error: '无效的操作类型' });
  }
  
  // 将字符串转换为数字，如果转换后不是有效数字则返回错误
  const parsedPrice = parseFloat(price);
  const parsedQuantity = parseFloat(quantity);
  
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: '价格必须为正数' });
  }
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ error: '数量必须为正数' });
  }
  
  // 使用事务确保数据一致性
  db.serialize(() => {
    // 插入持仓记录
    db.run("INSERT INTO positions (user_id, asset_type, code, name, operation, price, quantity, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
      [userId, assetType, code, name, operation, price, quantity, timestamp || new Date().toISOString()],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: '操作成功', id: this.lastID });
      });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});