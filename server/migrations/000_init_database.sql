-- ==========================================
-- Trading Custody System - 数据库初始化脚本
-- ==========================================
-- 此文件合并了所有迁移文件，用于全新部署时一次性初始化数据库
-- 创建时间：2024-12-21
-- ==========================================

-- ==========================================
-- 1. 创建基础表结构
-- ==========================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 资金表（流水模式）
CREATE TABLE IF NOT EXISTS funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 资金变动日志表
CREATE TABLE IF NOT EXISTS fund_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  remark TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 持仓表
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  asset_type TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT,
  operation TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  fee REAL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 价格数据表
CREATE TABLE IF NOT EXISTS price_data (
  code TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  current_price REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(code, asset_type)
);

-- ==========================================
-- 2. 创建索引
-- ==========================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 资金表索引
CREATE INDEX IF NOT EXISTS idx_funds_user_id ON funds(user_id);
CREATE INDEX IF NOT EXISTS idx_funds_timestamp ON funds(timestamp DESC);

-- 资金日志表索引
CREATE INDEX IF NOT EXISTS idx_fund_logs_user_id ON fund_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_logs_timestamp ON fund_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fund_logs_type ON fund_logs(type);

-- 持仓表索引
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_code ON positions(code);
CREATE INDEX IF NOT EXISTS idx_positions_asset_type ON positions(asset_type);
CREATE INDEX IF NOT EXISTS idx_positions_timestamp ON positions(timestamp);
CREATE INDEX IF NOT EXISTS idx_positions_user_code ON positions(user_id, code, asset_type);

-- 价格数据表索引
CREATE INDEX IF NOT EXISTS idx_price_data_code_type ON price_data(code, asset_type);
CREATE INDEX IF NOT EXISTS idx_price_data_timestamp ON price_data(timestamp);

-- ==========================================
-- 3. 创建触发器
-- ==========================================

-- 自动更新 users 表的 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==========================================
-- 4. 插入默认数据
-- ==========================================

-- 创建默认管理员账号
-- 用户名：admin
-- 密码：admin
-- 邮箱：admin@example.com
INSERT OR IGNORE INTO users (name, email, password, role) VALUES (
  'admin',
  'admin@example.com',
  '$2b$10$9Z5P5314p4w3h734243434oWJy7s861v8.234567890123456789012',
  'admin'
);

-- ==========================================
-- 初始化完成
-- ==========================================
