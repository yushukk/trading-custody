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

// 导入路由
const routes = require('./config/routes');

const app = express();
const PORT = config.PORT;
const CRON_EXPRESSION = config.CRON_SCHEDULE.price_sync;

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8085',
  credentials: true // 允许携带 Cookie
}));
app.use(express.json());
app.use(cookieParser()); // 添加 cookie-parser 中间件

// 添加日志中间件
app.use(logMiddleware);

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
    console.log('价格数据同步任务完成');
  } catch (error) {
    console.error('价格数据同步任务失败:', error.message);
  }
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    const db = require('./utils/database');
    await db.initialize();
    console.log('数据库初始化完成');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();