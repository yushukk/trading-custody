const db = require('../utils/database');
const { getDbLatestPrice } = require('../utils/priceUtils');

/**
 * 持仓控制器
 * @module PositionController
 */

/**
 * 获取用户持仓控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.userId - 用户ID
 * @param {Object} res - 响应对象
 * @returns {Array} 用户持仓记录数组
 */
exports.getPositions = (req, res) => {
  const { userId } = req.params;
  db.all("SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
};

/**
 * 添加持仓操作控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.userId - 用户ID
 * @param {Object} req.body - 请求体
 * @param {string} req.body.assetType - 资产类型
 * @param {string} req.body.code - 资产代码
 * @param {string} req.body.name - 资产名称
 * @param {string} req.body.operation - 操作类型
 * @param {number} req.body.price - 价格
 * @param {number} req.body.quantity - 数量
 * @param {string} req.body.timestamp - 时间戳
 * @param {number} req.body.fee - 交易费用
 * @param {Object} res - 响应对象
 * @returns {Object} 包含操作结果的响应对象
 */
exports.addPosition = (req, res) => {
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
};

/**
 * 获取持仓收益控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.userId - 用户ID
 * @param {Object} res - 响应对象
 * @returns {Array} 持仓收益计算结果数组
 */
exports.getPositionProfit = (req, res) => {
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
};

/**
 * 删除用户持仓控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.userId - 用户ID
 * @param {Object} res - 响应对象
 * @returns {Object} 包含删除结果的响应对象
 */
exports.deletePositions = (req, res) => {
  const { userId } = req.params;
  
  db.run("DELETE FROM positions WHERE user_id = ?", [userId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `成功清除用户${userId}的${this.changes}条交易记录` });
  });
};

/**
 * 同步价格数据控制器
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Object} 包含同步结果的响应对象
 */
exports.syncPriceData = (req, res) => {
  // 这里需要引用服务层的同步函数
  // 暂时直接调用，后续重构时会移到服务层
  syncPriceData();
  res.json({ message: '价格数据同步任务已触发' });
};