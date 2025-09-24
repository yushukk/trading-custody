const db = require('../utils/database');

/**
 * 资金控制器
 * @module FundController
 */

/**
 * 获取用户资金余额控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.userId - 用户ID
 * @param {Object} res - 响应对象
 * @returns {Object} 包含用户资金余额的响应对象
 */
exports.getFundBalance = (req, res) => {
  const { userId } = req.params;
  db.get("SELECT * FROM funds WHERE user_id = ?", [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row || { user_id: userId, balance: 0 });
  });
};

/**
 * 获取资金流水控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.userId - 用户ID
 * @param {Object} res - 响应对象
 * @returns {Array} 资金流水记录数组
 */
exports.getFundLogs = (req, res) => {
  const { userId } = req.params;
  db.all("SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
};

/**
 * 处理资金操作控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.userId - 用户ID
 * @param {string} req.params.type - 操作类型 (initial, deposit, withdraw)
 * @param {Object} req.body - 请求体
 * @param {number} req.body.amount - 金额
 * @param {string} req.body.remark - 备注
 * @param {Object} res - 响应对象
 * @returns {Object} 包含操作结果和新余额的响应对象
 */
exports.handleFundOperation = (req, res) => {
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
};