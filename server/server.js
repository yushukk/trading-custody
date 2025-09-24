const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const http = require('http');
const fs = require('fs');
const config = require('./config'); // 引入配置文件

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 导入中间件
const logMiddleware = require('./middleware/logMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

// 导入控制器
const userController = require('./controllers/userController');
const fundController = require('./controllers/fundController');
const positionController = require('./controllers/positionController');

// 导入工具函数
const { syncPriceData } = require('./utils/priceUtils');

const app = express();
const PORT = config.PORT;
const CRON_EXPRESSION = config.CRON_SCHEDULE.price_sync;

// 数据库文件路径
const dbPath = config.DATABASE_PATH;

// 检查数据库文件是否存在
if (!fs.existsSync(dbPath)) {
  const db = new sqlite3.Database(dbPath);

  // 初始化数据
  db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, role TEXT)");
    const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    [
      ["Alice", "alice@example.com", "user", "user"],
      ["Bob", "bob@example.com", "user", "user"],
      ["Charlie", "charlie@example.com", "user", "user"],
      ["admin", "admin@example.com", "admin", "admin"]
    ].forEach(([name, email, password, role]) => stmt.run(name, email, password, role));
    stmt.finalize();
  });

  db.close();
}

// 使用已存在的数据库文件
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());

// 添加日志中间件
app.use(logMiddleware);

// 合并数据库初始化代码
db.serialize(() => {
  // 创建基础用户表
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password TEXT, role TEXT)");
  
  // 资金相关表
  db.run("CREATE TABLE IF NOT EXISTS funds (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, balance REAL DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))");
  db.run("CREATE TABLE IF NOT EXISTS fund_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, type TEXT, amount REAL, remark TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))");
  
  // 持仓相关表
  db.run("CREATE TABLE IF NOT EXISTS positions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, asset_type TEXT, code TEXT, name TEXT, operation TEXT, price REAL, quantity INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, fee REAL DEFAULT 0)");
  
  // 新增价格信息表
  db.run("CREATE TABLE IF NOT EXISTS price_data (code TEXT, asset_type TEXT, current_price REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(code, asset_type))");
});

// 修改 getDbLatestPrice 为返回 Promise
function getDbLatestPrice(code, asset_type) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT current_price FROM price_data WHERE code = ? AND asset_type = ?",
      [code, asset_type],
      (err, row) => {
        if (err) {
          console.error(`数据库查询失败 ${code}(${asset_type}):`, err.message);
          resolve(0); // 出错时返回 0
        } else {
          resolve(parseFloat(row?.current_price) || 0);
        }
      }
    );
  });
}

// 修改getLatestPrice函数使用配置
async function getLatestPrice(code, asset_type) {
  let apiUrl;

  //输出当前系统时间
  console.log(`当前时间: ${new Date().toISOString()}`);
  
  // 计算最近10天日期范围
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 10);
  // 解决服务器时区问题
  endDate.setDate(endDate.getDate() + 1);
  
  // 格式化日期为YYYYMMDD
  const formatDate = (date) => {
    return date.getFullYear() + 
      String(date.getMonth()+1).padStart(2, '0') + 
      String(date.getDate()).padStart(2, '0');
  };
  
  // 根据资产类型构建API URL
  if (asset_type === 'stock') {
    apiUrl = `${config.EXTERNAL_APIS.stock.zh_a_hist}?symbol=${code}&period=daily&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
  } else if (asset_type === 'future') {
    const encodedCode = encodeURIComponent(code);
    apiUrl = `${config.EXTERNAL_APIS.future.hist_em}?symbol=${encodedCode}&period=daily&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
  } else {
    return 0.0; // 不支持的资产类型返回默认值
  }
  console.log(`正在获取价格 ${code}(${asset_type}):`, apiUrl);
  
  try {
    // 使用Promise封装http请求
    const data = await new Promise((resolve, reject) => {
      http.get(apiUrl, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(body);
            console.log(`API响应数据 ${code}(${asset_type}):`, jsonData);
            resolve(jsonData);
          } catch (err) {
            console.error(`JSON解析失败 ${code}(${asset_type}):`, err.message);
            reject(err);
          }
        });
      }).on('error', err => {
        console.error(`HTTP请求错误 ${code}(${asset_type}):`, err.message);
        reject(err);
      });
    });

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`空数据返回 ${code}(${asset_type})`);
      return 0.0;
    }
    
    // 新增数据结构验证
    console.log(`原始数据示例 ${code}:`, data[0]);
    
    const latestRecord = data.reduce((latest, current) => {
      // 增加字段存在性检查 - 同时支持股票(日期)和期货(时间)格式
      const currentField = current.日期 ? '日期' : '时间';
      const latestField = latest.日期 ? '日期' : '时间';
      
      if (!current[currentField] || !latest[latestField]) {
        console.warn(`缺少时间字段 ${code}:`, current);
        return latest;
      }
      
      // 统一转换为时间戳进行比较
      return new Date(current[currentField]).getTime() > new Date(latest[latestField]).getTime() ? current : latest;
    }, data[0]);
    
    // 新增收盘价字段检查
    if (!latestRecord['收盘']) {
      console.error(`缺少收盘价字段 ${code}(${asset_type}):`, latestRecord);
      return 0.0;
    }
    
    const price = parseFloat(latestRecord['收盘']) || 0.0;
    console.log(`解析成功 ${code}(${asset_type}): ${price}`); // 新增调试日志
    return price;
    
  } catch (error) {
    console.error(`价格获取失败 ${code}(${asset_type}):`, error.message); // 新增错误详情
    console.error('错误堆栈:', error.stack); // 新增堆栈跟踪
    return 0.0; // 统一返回0.0并记录详细错误
  }
}

// API路由
app.post('/api/login', userController.login);
app.put('/api/update-password', userController.updatePassword);

// 用户管理路由
app.get('/api/users', userController.getAllUsers);
app.post('/api/users', userController.createUser);
app.put('/api/users/:id/password', userController.updateUserPasswordById);
app.delete('/api/users/:id', userController.deleteUser);

// 资金管理路由
app.get('/api/funds/:userId', fundController.getFundBalance);
app.get('/api/funds/:userId/logs', fundController.getFundLogs);
app.post('/api/funds/:userId/:type', fundController.handleFundOperation);

// 持仓管理路由
app.get('/api/positions/:userId', positionController.getPositions);
app.post('/api/positions/:userId', positionController.addPosition);
app.get('/api/positions/profit/:userId', positionController.getPositionProfit);
app.get('/api/positions/delete/:userId', positionController.deletePositions);
app.get('/api/syncPriceData', positionController.syncPriceData);

// 添加全局错误处理中间件
app.use(errorHandler);

// 新增定时任务逻辑（在数据库初始化完成后添加）
schedule.scheduleJob(CRON_EXPRESSION, async () => {
  syncPriceData();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});