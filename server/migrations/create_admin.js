const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

// 使用刚生成的密码哈希 (admin123)
const hashedPassword = '$2b$10$6WibOC7ROaXW72QdawExYeCzKhVCw4h2wnL4StDSIWurE6455uzoO';

db.serialize(() => {
  // 先删除可能存在的 admin 用户
  db.run('DELETE FROM users WHERE email = ?', ['admin'], err => {
    if (err) {
      console.error('删除旧用户失败:', err);
    } else {
      console.log('已删除旧的 admin 用户（如果存在）');
    }
  });

  // 插入新的 admin 用户
  db.run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['admin', 'admin', hashedPassword, 'admin'],
    function (err) {
      if (err) {
        console.error('创建 admin 用户失败:', err);
      } else {
        console.log('✓ 成功创建 admin 用户');
        console.log('  用户名: admin');
        console.log('  密码: admin123');
        console.log('  用户ID:', this.lastID);
      }
      db.close();
    }
  );
});
