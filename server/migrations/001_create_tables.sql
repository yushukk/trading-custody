-- 创建基础用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  name TEXT, 
  email TEXT UNIQUE, 
  password TEXT, 
  role TEXT, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 资金相关表
CREATE TABLE IF NOT EXISTS funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  user_id INTEGER UNIQUE, 
  balance REAL DEFAULT 0, 
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fund_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  user_id INTEGER, 
  type TEXT, 
  amount REAL, 
  remark TEXT, 
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 持仓相关表
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  user_id INTEGER, 
  asset_type TEXT, 
  code TEXT, 
  name TEXT, 
  operation TEXT, 
  price REAL, 
  quantity INTEGER, 
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
  fee REAL DEFAULT 0
);

-- 新增价格信息表
CREATE TABLE IF NOT EXISTS price_data (
  code TEXT, 
  asset_type TEXT, 
  current_price REAL, 
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
  PRIMARY KEY(code, asset_type)
);

-- 添加触发器自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;