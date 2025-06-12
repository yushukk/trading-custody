const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken'); // 引入 jsonwebtoken 库

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

// API路由
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE name = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      // 使用 jsonwebtoken 生成 token
      const token = jwt.sign({ username: row.name, role: row.role }, 'your-secret-key', { expiresIn: '1h' });
      res.json({ token, role: row.role });
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});