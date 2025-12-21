-- 移除 email 字段的 UNIQUE 约束
-- SQLite 不支持直接修改列约束，需要重建表

-- 1. 创建新表（没有 email UNIQUE 约束）
CREATE TABLE IF NOT EXISTS users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  name TEXT, 
  email TEXT, 
  password TEXT, 
  role TEXT, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 复制数据
INSERT INTO users_new (id, name, email, password, role, created_at, updated_at)
SELECT id, name, email, password, role, created_at, updated_at FROM users;

-- 3. 删除旧表
DROP TABLE users;

-- 4. 重命名新表
ALTER TABLE users_new RENAME TO users;

-- 5. 重新创建触发器
DROP TRIGGER IF EXISTS update_users_timestamp;
CREATE TRIGGER update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
