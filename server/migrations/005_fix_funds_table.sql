-- 修复 funds 表结构
-- 将 funds 表从"余额模式"改为"流水模式"

-- 1. 备份现有数据（如果有）
CREATE TABLE IF NOT EXISTS funds_backup AS SELECT * FROM funds;

-- 2. 删除旧表
DROP TABLE IF EXISTS funds;

-- 3. 创建新的 funds 表（流水模式）
CREATE TABLE funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 4. 如果备份表中有数据，将余额转换为初始资金记录
INSERT INTO funds (user_id, amount, timestamp)
SELECT user_id, balance, CURRENT_TIMESTAMP
FROM funds_backup
WHERE balance > 0;

-- 5. 删除备份表
DROP TABLE IF EXISTS funds_backup;

-- 6. 同时修复 fund_logs 表，添加缺失的 balance_after 字段
-- 先检查是否需要添加该字段
CREATE TABLE IF NOT EXISTS fund_logs_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  remark TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 迁移现有数据
INSERT INTO fund_logs_new (id, user_id, type, amount, balance_after, remark, timestamp)
SELECT id, user_id, type, amount, 
       COALESCE(amount, 0) as balance_after,  -- 临时使用 amount 作为 balance_after
       remark, timestamp
FROM fund_logs;

-- 替换表
DROP TABLE fund_logs;
ALTER TABLE fund_logs_new RENAME TO fund_logs;

-- 7. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_funds_user_id ON funds(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_logs_user_id ON fund_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_logs_timestamp ON fund_logs(timestamp DESC);
