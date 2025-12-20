const fundDao = require('../dao/fundDao');
const AppError = require('../utils/AppError');

class FundService {
  async getFundBalance(userId) {
    try {
      const balance = await fundDao.getBalance(userId);
      return balance;
    } catch (error) {
      throw new AppError('查询资金余额失败', 'DATABASE_ERROR', 500);
    }
  }

  async addFunds(userId, amount, timestamp) {
    try {
      const fundId = await fundDao.addFunds(userId, amount, timestamp);
      return { id: fundId };
    } catch (error) {
      throw new AppError('添加资金失败', 'DATABASE_ERROR', 500);
    }
  }

  async getFundLogs(userId, limit = 5) {
    try {
      return await fundDao.getFundLogs(userId, limit);
    } catch (error) {
      throw new AppError('查询资金日志失败', 'DATABASE_ERROR', 500);
    }
  }

  async addFundLog(userId, type, amount, balanceAfter, timestamp) {
    try {
      const logId = await fundDao.addFundLog(userId, type, amount, balanceAfter, timestamp);
      return { id: logId };
    } catch (error) {
      throw new AppError('添加资金日志失败', 'DATABASE_ERROR', 500);
    }
  }

  async handleFundOperation(userId, type, amount, remark) {
    // 验证操作类型
    if (!['initial', 'deposit', 'withdraw'].includes(type)) {
      throw new AppError('无效的操作类型', 'INVALID_OPERATION', 400);
    }
    
    // 验证金额
    if (typeof amount !== 'number' || amount <= 0) {
      throw new AppError('金额必须为正数', 'INVALID_AMOUNT', 400);
    }
    
    try {
      // 获取当前余额
      const currentBalance = await this.getFundBalance(userId);
      
      let newBalance = currentBalance;
      
      // 根据操作类型更新余额
      if (type === 'initial') {
        newBalance = amount;
      } else if (type === 'deposit') {
        newBalance += amount;
      } else if (type === 'withdraw') {
        if (currentBalance < amount) {
          throw new AppError('余额不足', 'INSUFFICIENT_BALANCE', 400);
        }
        newBalance -= amount;
      }
      
      // 添加资金记录
      const timestamp = new Date().toISOString();
      await this.addFunds(userId, type === 'withdraw' ? -amount : amount, timestamp);
      
      // 添加资金日志
      await this.addFundLog(userId, type, amount, newBalance, timestamp);
      
      return { message: '操作成功', balance: newBalance };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('资金操作失败', 'DATABASE_ERROR', 500);
    }
  }
}

module.exports = new FundService();