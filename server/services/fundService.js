const AppError = require('../utils/AppError');

class FundService {
  constructor(fundDao) {
    this.fundDao = fundDao;
  }

  async getFundBalance(userId) {
    try {
      const balance = await this.fundDao.getBalance(userId);
      return balance;
    } catch (error) {
      console.error('getFundBalance error:', error);
      throw new AppError(`查询资金余额失败: ${error.message}`, 'DATABASE_ERROR', 500);
    }
  }

  async addFunds(userId, amount, timestamp) {
    console.log('addFunds called with:', { userId, amount, timestamp }); // 调试日志
    try {
      const fundId = await this.fundDao.addFunds(userId, amount, timestamp);
      console.log('addFunds result:', fundId); // 调试日志
      return fundId;
    } catch (error) {
      console.error('addFunds error:', error.message, error.stack); // 调试日志
      throw new AppError('添加资金失败', 'DATABASE_ERROR', 500);
    }
  }

  async getFundLogs(userId, limit = 5) {
    try {
      return await this.fundDao.getFundLogs(userId, limit);
    } catch (error) {
      throw new AppError('查询资金日志失败', 'DATABASE_ERROR', 500);
    }
  }

  async addFundLog(userId, type, amount, balanceAfter, timestamp) {
    try {
      const logId = await this.fundDao.addFundLog(userId, type, amount, balanceAfter, timestamp);
      return { id: logId };
    } catch (error) {
      throw new AppError('添加资金日志失败', 'DATABASE_ERROR', 500);
    }
  }

  async handleFundOperation(userId, type, amount, remark) {
    console.log('handleFundOperation called with:', { userId, type, amount, remark }); // 调试日志
    // 验证操作类型
    if (!['initial', 'deposit', 'withdraw'].includes(type)) {
      throw new AppError('无效的操作类型', 'INVALID_OPERATION', 400);
    }

    // 转换金额为数字并验证
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (typeof numericAmount !== 'number' || isNaN(numericAmount) || numericAmount <= 0) {
      throw new AppError('金额必须为正数', 'INVALID_AMOUNT', 400);
    }

    try {
      // 获取当前余额
      const currentBalance = await this.getFundBalance(userId);
      console.log('Current balance:', currentBalance); // 调试日志

      let newBalance = currentBalance;

      // 根据操作类型更新余额
      if (type === 'initial') {
        newBalance = numericAmount;
      } else if (type === 'deposit') {
        newBalance += numericAmount;
      } else if (type === 'withdraw') {
        if (currentBalance < numericAmount) {
          throw new AppError('余额不足', 'INSUFFICIENT_BALANCE', 400);
        }
        newBalance -= numericAmount;
      }

      // 添加资金记录
      const timestamp = new Date().toISOString();
      console.log('Adding funds with:', {
        userId,
        amount: type === 'withdraw' ? -numericAmount : numericAmount,
        timestamp,
      }); // 调试日志
      await this.addFunds(userId, type === 'withdraw' ? -numericAmount : numericAmount, timestamp);

      // 添加资金日志
      console.log('Adding fund log with:', {
        userId,
        type,
        amount: numericAmount,
        balanceAfter: newBalance,
        timestamp,
      }); // 调试日志
      await this.addFundLog(userId, type, numericAmount, newBalance, timestamp);

      console.log('Operation result:', { message: '操作成功', balance: newBalance }); // 调试日志
      return { message: '操作成功', balance: newBalance };
    } catch (error) {
      console.error('handleFundOperation error:', error.message, error.stack); // 调试日志
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('资金操作失败', 'DATABASE_ERROR', 500);
    }
  }
}

// 导出实例
const fundDao = require('../dao/fundDao');
const fundServiceInstance = new FundService(fundDao);

module.exports = fundServiceInstance;
module.exports.default = fundServiceInstance;
module.exports.FundService = FundService;
