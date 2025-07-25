const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const http = require('http');
const fs = require('fs');
const config = require('./config'); // 引入配置文件

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
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE name = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      // 使用 jsonwebtoken 生成 token，并返回用户ID
      const token = jwt.sign({ username: row.name, role: row.role }, 'your-secret-key', { expiresIn: '1h' });
      res.json({ token, role: row.role, id: row.id }); // 添加用户ID返回
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

app.put('/api/update-password', (req, res) => {
  const { username, newPassword } = req.body;
  db.run("UPDATE users SET password = ? WHERE name = ?", [newPassword, username], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Password updated successfully' });
  });
});

// 新增 API 路由
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, password, role } = req.body;
  db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, email, password, role });
  });
});

app.put('/api/users/:id/password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Password updated successfully' });
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// 新增资金管理API接口

// 获取用户资金余额
app.get('/api/funds/:userId', (req, res) => {
  const { userId } = req.params;
  db.get("SELECT * FROM funds WHERE user_id = ?", [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row || { user_id: userId, balance: 0 });
  });
});

// 获取资金流水
app.get('/api/funds/:userId/logs', (req, res) => {
  const { userId } = req.params;
  db.all("SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
});

// 处理资金操作
app.post('/api/funds/:userId/:type', (req, res) => {
  const { userId, type } = req.params;
  const { amount, remark } = req.body; // 保留remark解构用于日志
  
  // 验证操作类型
  if (!['initial', 'deposit', 'withdraw'].includes(type)) {
    return res.status(400).json({ error: '无效的操作类型' });
  }
  
  // 验证金额
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: '金额必须为正数' });
  }
  
  db.serialize(() => {
    // 获取当前余额
    db.get("SELECT * FROM funds WHERE user_id = ?", [userId], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      let currentBalance = row?.balance || 0;
      let newBalance = currentBalance;
      
      // 根据操作类型更新余额
      if (type === 'initial') {
        newBalance = amount;
      } else if (type === 'deposit') {
        newBalance += amount;
      } else if (type === 'withdraw') {
        if (currentBalance < amount) {
          res.status(400).json({ error: '余额不足' });
          return;
        }
        newBalance -= amount;
      }
      
      // 更新资金余额（不再包含remark）
      if (row) {
        db.run("UPDATE funds SET balance = ? WHERE user_id = ?", [newBalance, userId]);
      } else {
        db.run("INSERT INTO funds (user_id, balance) VALUES (?, ?)", [userId, newBalance]);
      }
      
      // 记录资金流水（保留remark）
      db.run("INSERT INTO fund_logs (user_id, type, amount, remark) VALUES (?, ?, ?, ?)", [userId, type, amount, remark || '']);
      
      res.json({ message: '操作成功', balance: newBalance });
    });
  });
});

// 新增持仓管理API接口
// 获取用户持仓
app.get('/api/positions/:userId', (req, res) => {
  const { userId } = req.params;
  db.all("SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
});

// 添加持仓操作
app.post('/api/positions/:userId', (req, res) => {
  const { userId } = req.params;
  const { assetType, code, name, operation, price, quantity, timestamp, fee } = req.body; // 新增fee解构
  
  // 参数验证
  if (!['stock', 'future', 'fund'].includes(assetType)) {
    return res.status(400).json({ error: '无效的资产类型' });
  }
  if (!operation || !['buy', 'sell'].includes(operation)) {
    return res.status(400).json({ error: '无效的操作类型' });
  }
  
  // 将费用转换为数字
  const parsedFee = parseFloat(fee) || 0; // 新增费用解析
  
  // 将字符串转换为数字，如果转换后不是有效数字则返回错误
  const parsedPrice = parseFloat(price);
  const parsedQuantity = parseFloat(quantity);
  
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: '价格必须为正数' });
  }
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ error: '数量必须为正数' });
  }
  
  // 使用事务确保数据一致性
  db.serialize(() => {
    // 插入持仓记录时包含费用字段
    db.run("INSERT INTO positions (user_id, asset_type, code, name, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [userId, assetType, code, name, operation, price, quantity, timestamp || new Date().toISOString(), parsedFee], // 新增费用参数
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: '操作成功', id: this.lastID });
      });
  });
});

// 修改获取持仓收益接口
app.get('/api/positions/profit/:userId', (req, res) => {
  const { userId } = req.params;

  db.all("SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp ASC", [userId], async (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const positionsMap = {};
    rows.forEach(row => {
      if (!positionsMap[row.code]) {
        positionsMap[row.code] = [];
      }
      positionsMap[row.code].push(row);
    });

    const results = [];

    for (const [code, transactions] of Object.entries(positionsMap)) {
      let realizedPnL = 0;
      let totalFee = 0; // 新增总费用统计
      const queue = [];

      transactions.forEach(tx => {
        const quantity = tx.quantity;
        const price = tx.price;
        const fee = tx.fee || 0; // 获取交易费用
        totalFee += fee; // 累计买入费用


        if (tx.operation === 'buy') {
          queue.push({ quantity, price, fee }); // 将费用加入队列
        } else if (tx.operation === 'sell') {
          let remaining = quantity;

          while (remaining > 0 && queue.length > 0) {
            const head = queue[0];

            if (head.quantity <= remaining) {
              const tradeQuantity = head.quantity;
              const cost = head.price * tradeQuantity ; // 成本包含费用
              const revenue = price * tradeQuantity; // 收入扣除费用
              realizedPnL += revenue - cost; // 计算盈亏
              
              remaining -= tradeQuantity;
              queue.shift();
            } else {
              const tradeQuantity = remaining;
              const cost = head.price * tradeQuantity; // 按比例分配费用
              const revenue = price * tradeQuantity; // 收入扣除费用
              realizedPnL += revenue - cost; // 计算盈亏
              
              head.quantity -= tradeQuantity;
              remaining = 0;
            }
          }
        }
      });
      realizedPnL -= totalFee;

      const currentQuantity = queue.reduce((sum, item) => sum + item.quantity, 0);
      let latestPrice = 0;
      let unrealizedPnL = 0;

      if (currentQuantity > 0) {
        latestPrice = await getDbLatestPrice(code, transactions[0].asset_type);
        // 计算平均成本包含费用
        const totalCost = queue.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const averageCost = totalCost / currentQuantity;
        unrealizedPnL = currentQuantity * (latestPrice - averageCost);
      }

      results.push({
        code,
        name: transactions[0].name,
        assetType: transactions[0].asset_type,
        quantity: currentQuantity,
        totalPnL: realizedPnL + unrealizedPnL,
        realizedPnL,
        unrealizedPnL,
        latestPrice,
        fee: totalFee // 返回总费用
      });
    }

    res.json(results);
  });
});

// 在API路由部分新增DELETE接口
app.get('/api/positions/delete/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.run("DELETE FROM positions WHERE user_id = ?", [userId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `成功清除用户${userId}的${this.changes}条交易记录` });
  });
});

app.get('/api/syncPriceData', (req, res) => {
  syncPriceData();
  res.json({ message: '价格数据同步任务已触发' });
});

// 新增定时任务逻辑（在数据库初始化完成后添加）
schedule.scheduleJob(CRON_EXPRESSION, async () => {
  syncPriceData();
});

function syncPriceData() {
  console.log('开始同步最新价格数据...');
  
  db.all("SELECT DISTINCT code, asset_type FROM positions", [], async (err, rows) => {
    if (err) {
      console.error('数据库查询错误:', err);
      return;
    }
    
    for (const row of rows) {
      try {
        console.log(`正在获取 ${row.code}(${row.asset_type}) 的最新价格...`); // 新增开始日志
        const latestPrice = await getLatestPrice(row.code, row.asset_type);
        
        if (latestPrice <= 0) {
          console.warn(`无效价格跳过更新 ${row.code}: ${latestPrice}`); // 新增警告
          continue;
        }
        
        db.run("INSERT OR REPLACE INTO price_data (code, asset_type, current_price) VALUES (?, ?, ?)", 
          [row.code, row.asset_type, latestPrice],
          function(err) {
            if (err) {
              console.error(`价格更新失败 ${row.code}(${row.asset_type}):`, err.message); // 新增详细错误
            } else {
              console.log(`价格更新成功 ${row.code}: ${latestPrice}`); // 新增成功日志
            }
          }
        );
      } catch (error) {
        console.error(`处理异常 ${row.code}(${row.asset_type}):`, error.message); // 新增错误处理
      }
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});