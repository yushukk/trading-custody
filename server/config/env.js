// 从项目根目录加载环境变量
require('dotenv').config({ path: '../.env' });

const path = require('path');
const SecretsManager = require('../utils/secretsManager');
const logger = require('../utils/logger');

// 自动生成缺失的 JWT 密钥 (跳过测试环境)
if (process.env.NODE_ENV !== 'test') {
  SecretsManager.ensureSecrets({
    envFilePath: path.join(__dirname, '../../.env'),
    logger,
  });
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.SERVER_PORT) || 3001,

  database: {
    path: process.env.DATABASE_PATH || './server/database.db',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  externalApis: {
    stock: process.env.STOCK_API_URL,
    future: process.env.FUTURE_API_URL,
  },

  cron: {
    priceSync: process.env.PRICE_SYNC_CRON || '0 17 * * *',
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },
};

module.exports = config;
