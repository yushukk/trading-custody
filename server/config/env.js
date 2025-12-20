// 从项目根目录加载环境变量
require('dotenv').config({ path: '../.env' });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.SERVER_PORT) || 3001,
  
  database: {
    path: process.env.DATABASE_PATH || './server/database.db'
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  externalApis: {
    stock: process.env.STOCK_API_URL,
    future: process.env.FUTURE_API_URL
  },
  
  cron: {
    priceSync: process.env.PRICE_SYNC_CRON || '0 17 * * *'
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log'
  }
};

// 验证必需的环境变量 (跳过测试环境)
if (process.env.NODE_ENV !== 'test') {
  const requiredEnvVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

  if (missingEnvVars.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missingEnvVars.join(', ')}`);
  }
}

module.exports = config;