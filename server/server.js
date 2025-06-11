const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

// 创建内存数据库
const db = new sqlite3.Database(':memory:');

// 初始化数据
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)");
  const stmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
  [
    ["Alice", "alice@example.com"],
    ["Bob", "bob@example.com"],
    ["Charlie", "charlie@example.com"]
  ].forEach(([name, email]) => stmt.run(name, email));
  stmt.finalize();
});

app.use(cors());
app.use(express.json());

// API路由
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});