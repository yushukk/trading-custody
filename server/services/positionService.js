const db = require('../utils/database');
const { getDbLatestPrice } = require('../utils/priceUtils');

/**
 * 获取用户持仓服务
 * @param {number} userId - 用户ID
 * @returns {Promise} 持仓列表Promise
 */
exports.getPositions = (userId) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

/**
 * 添加持仓操作服务
 * @param {number} userId - 用户ID
 * @param {Object} positionData - 持仓数据
 * @returns {Promise} 操作结果Promise
 */
exports.addPosition = (userId, positionData) => {
  const { assetType, code, name, operation, price, quantity, timestamp, fee } = positionData;
  
  // 参数验证
  if (!['stock', 'future', 'fund'].includes(assetType)) {
    return Promise.reject(new Error('无效的资产类型'));
  }
  if (!operation || !['buy', 'sell'].includes(operation)) {
    return Promise.reject(new Error('无效的操作类型'));
  }
  
  // 将费用转换为数字
  const parsedFee = parseFloat(fee) || 0;
  
  // 将字符串转换为数字，如果转换后不是有效数字则返回错误
  const parsedPrice = parseFloat(price);
  const parsedQuantity = parseFloat(quantity);
  
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return Promise.reject(new Error('价格必须为正数'));
  }
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return Promise.reject(new Error('数量必须为正数'));
  }
  
  return new Promise((resolve, reject) => {
    // 插入持仓记录时包含费用字段
    db.run("INSERT INTO positions (user_id, asset_type, code, name, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [userId, assetType, code, name, operation, price, quantity, timestamp || new Date().toISOString(), parsedFee], 
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ message: '操作成功', id: this.lastID });
        }
      });
  });
};

/**
 * 计算持仓收益服务
 * @param {number} userId - 用户ID
 * @returns {Promise} 收益计算结果Promise
 */
exports.calculatePositionProfit = (userId) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp ASC", [userId], async (err, rows) => {
      if (err) {
        reject(err);
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
        let totalFee = 0;
        const queue = [];

        transactions.forEach(tx => {
          const quantity = tx.quantity;
          const price = tx.price;
          const fee = tx.fee || 0;
          totalFee += fee;

          if (tx.operation === 'buy') {
            queue.push({ quantity, price, fee });
          } else if (tx.operation === 'sell') {
            let remaining = quantity;

            while (remaining > 0 && queue.length > 0) {
              const head = queue[0];

              if (head.quantity <= remaining) {
                const tradeQuantity = head.quantity;
                const cost = head.price * tradeQuantity;
                const revenue = price * tradeQuantity;
                realizedPnL += revenue - cost;
                
                remaining -= tradeQuantity;
                queue.shift();
              } else {
                const tradeQuantity = remaining;
                const cost = head.price * tradeQuantity;
                const revenue = price * tradeQuantity;
                realizedPnL += revenue - cost;
                
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
          fee: totalFee
        });
      }

      resolve(results);
    });
  });
};

/**
 * 删除用户持仓服务
 * @param {number} userId - 用户ID
 * @returns {Promise} 删除结果Promise
 */
exports.deletePositions = (userId) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM positions WHERE user_id = ?", [userId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ message: `成功清除用户${userId}的${this.changes}条交易记录` });
      }
    });
  });
};