const db = require('../utils/database');
const AppError = require('../utils/AppError');

/**
 * 获取用户资金余额服务
 * @param {number} userId - 用户ID
 * @returns {Promise} 资金余额Promise
 */
exports.getFundBalance = (userId) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM funds WHERE user_id = ?", [userId], (err, row) => {
      if (err) {
        reject(new AppError(err.message, 'DATABASE_ERROR'));
      } else {
        resolve(row || { user_id: userId, balance: 0 });
      }
    });
  });
};

/**
 * 获取资金流水服务
 * @param {number} userId - 用户ID
 * @returns {Promise} 资金流水Promise
 */
exports.getFundLogs = (userId) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC", [userId], (err, rows) => {
      if (err) {
        reject(new AppError(err.message, 'DATABASE_ERROR'));
      } else {
        resolve(rows || []);
      }
    });
  });
};

/**
 * 处理资金操作服务
 * @param {number} userId - 用户ID
 * @param {string} type - 操作类型
 * @param {number} amount - 金额
 * @param {string} remark - 备注
 * @returns {Promise} 操作结果Promise
 */
exports.handleFundOperation = (userId, type, amount, remark) => {
  // 验证操作类型
  if (!['initial', 'deposit', 'withdraw'].includes(type)) {
    return Promise.reject(new AppError('无效的操作类型', 'INVALID_OPERATION'));
  }
  
  // 验证金额
  if (typeof amount !== 'number' || amount <= 0) {
    return Promise.reject(new AppError('金额必须为正数', 'INVALID_AMOUNT'));
  }
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 获取当前余额
      db.get("SELECT * FROM funds WHERE user_id = ?", [userId], (err, row) => {
        if (err) {
          reject(new AppError(err.message, 'DATABASE_ERROR'));
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
            reject(new AppError('余额不足', 'INSUFFICIENT_BALANCE'));
            return;
          }
          newBalance -= amount;
        }
        
        // 更新资金余额
        const updateBalance = () => {
          return new Promise((resolve, reject) => {
            if (row) {
              db.run("UPDATE funds SET balance = ? WHERE user_id = ?", [newBalance, userId], (err) => {
                if (err) {
                  reject(new AppError(err.message, 'DATABASE_ERROR'));
                } else {
                  resolve();
                }
              });
            } else {
              db.run("INSERT INTO funds (user_id, balance) VALUES (?, ?)", [userId, newBalance], (err) => {
                if (err) {
                  reject(new AppError(err.message, 'DATABASE_ERROR'));
                } else {
                  resolve();
                }
              });
            }
          });
        };
        
        // 记录资金流水
        const recordFundLog = () => {
          return new Promise((resolve, reject) => {
            db.run("INSERT INTO fund_logs (user_id, type, amount, remark) VALUES (?, ?, ?, ?)", [userId, type, amount, remark || ''], (err) => {
              if (err) {
                reject(new AppError(err.message, 'DATABASE_ERROR'));
              } else {
                resolve();
              }
            });
          });
        };
        
        // 执行操作
        updateBalance()
          .then(() => recordFundLog())
          .then(() => resolve({ message: '操作成功', balance: newBalance }))
          .catch(reject);
      });
    });
  });
};