-- 为 users 表的 name 字段添加 UNIQUE 约束
-- SQLite 不支持直接 ALTER TABLE ADD CONSTRAINT，需要重建表

-- 1. 处理重复的用户名：为重复的用户名添加后缀
-- 找出所有重复的用户名，并为除了第一个之外的所有记录添加序号后缀
UPDATE users
SET name = name || '_' || id
WHERE id NOT IN (
  SELECT MIN(id)
  FROM users
  GROUP BY name
);

-- 2. 创建新表结构（带 UNIQUE 约束）
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 复制数据到新表
INSERT INTO users_new (id, name, email, password, role, created_at, updated_at)
SELECT id, name, email, password, role, created_at, updated_at FROM users;

-- 4. 删除旧表
DROP TABLE users;

-- 5. 重命名新表
ALTER TABLE users_new RENAME TO users;

-- 6. 重新创建触发器
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
