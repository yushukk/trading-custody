-- 用户表索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 资金表索引
CREATE INDEX IF NOT EXISTS idx_funds_user_id ON funds(user_id);

-- 资金日志表索引
CREATE INDEX IF NOT EXISTS idx_fund_logs_user_id ON fund_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_logs_timestamp ON fund_logs(timestamp);
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