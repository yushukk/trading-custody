const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // 加载环境变量
const config = require('./config'); // 引入配置文件

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 导入中间件
const logMiddleware = require('./middleware/logMiddleware');
const errorHandler = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

// 导入路由
const routes = require('./config/routes');

const app = express();
const PORT = config.PORT;
const CRON_EXPRESSION = config.CRON_SCHEDULE.price_sync;

// CORS 配置
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8085',
    credentials: true, // 允许携带 Cookie
  })
);
app.use(express.json());
app.use(cookieParser()); // 添加 cookie-parser 中间件

// 添加日志中间件
app.use(logMiddleware);

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Trading Custody Backend API',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// 使用路由
app.use('/api', routes);

// 添加全局错误处理中间件
app.use(errorHandler);

// 导入服务
const priceService = require('./services/priceService');

// 新增定时任务逻辑
schedule.scheduleJob(CRON_EXPRESSION, async () => {
  try {
    await priceService.syncPriceData();
    logger.info('Price data synchronization task completed');
  } catch (error) {
    logger.error('Price data synchronization task failed', { error: error.message });
  }
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    const db = require('./utils/database').default;
    await db.initialize();
    logger.info('Database initialized successfully');

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Server startup failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();
