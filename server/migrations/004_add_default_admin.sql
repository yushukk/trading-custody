-- 添加默认管理员用户（如果不存在）
-- 使用 INSERT OR IGNORE 避免重复插入
INSERT OR IGNORE INTO users (name, email, password, role) VALUES (
  'admin',
  'admin@example.com',
  '$2b$10$9Z5P5314p4w3h734243434oWJy7s861v8.234567890123456789012',  -- 密码为 "admin"
  'admin'
);