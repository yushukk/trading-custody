const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { FUND_OPERATION_TYPE_VALUES, ERROR_MESSAGES } = require('../constants');

class FundService {
  constructor(fundDao) {
    this.fundDao = fundDao;
  }

  async getFundBalance(userId) {
    try {
      const balance = await this.fundDao.getBalance(userId);
      return balance;
    } catch (error) {
      logger.error('getFundBalance error', { error: error.message, stack: error.stack });
      throw new AppError(`查询资金余额失败: ${error.message}`, 'DATABASE_ERROR', 500);
    }
  }

  async addFunds(userId, amount, timestamp) {
    logger.debug('addFunds called', { userId, amount, timestamp });
    try {
      const fundId = await this.fundDao.addFunds(userId, amount, timestamp);
      logger.debug('addFunds result', { fundId });
      return fundId;
    } catch (error) {
      logger.error('addFunds error', { error: error.message, stack: error.stack });
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
    logger.debug('handleFundOperation called', { userId, type, amount, remark });
    // 验证操作类型
    if (!FUND_OPERATION_TYPE_VALUES.includes(type)) {
      throw new AppError(ERROR_MESSAGES.INVALID_OPERATION_TYPE, 'INVALID_OPERATION', 400);
    }

    // 转换金额为数字并验证
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (typeof numericAmount !== 'number' || isNaN(numericAmount) || numericAmount <= 0) {
      throw new AppError(ERROR_MESSAGES.INVALID_AMOUNT, 'INVALID_AMOUNT', 400);
    }

    try {
      // 获取当前余额
      const currentBalance = await this.getFundBalance(userId);
      logger.debug('Current balance', { userId, currentBalance });

      let newBalance = currentBalance;

      // 根据操作类型更新余额
      if (type === 'initial') {
        newBalance = numericAmount;
      } else if (type === 'deposit') {
        newBalance += numericAmount;
      } else if (type === 'withdraw') {
        if (currentBalance < numericAmount) {
          throw new AppError(ERROR_MESSAGES.INSUFFICIENT_BALANCE, 'INSUFFICIENT_BALANCE', 400);
        }
        newBalance -= numericAmount;
      }

      // 添加资金记录
      const timestamp = new Date().toISOString();
      logger.debug('Adding funds', {
        userId,
        amount: type === 'withdraw' ? -numericAmount : numericAmount,
        timestamp,
      });
      await this.addFunds(userId, type === 'withdraw' ? -numericAmount : numericAmount, timestamp);

      // 添加资金日志
      logger.debug('Adding fund log', {
        userId,
        type,
        amount: numericAmount,
        balanceAfter: newBalance,
        timestamp,
      });
      await this.addFundLog(userId, type, numericAmount, newBalance, timestamp);

      logger.info('Fund operation completed', { userId, type, amount: numericAmount, newBalance });
      return { message: ERROR_MESSAGES.OPERATION_SUCCESS, balance: newBalance };
    } catch (error) {
      logger.error('handleFundOperation error', { error: error.message, stack: error.stack });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ERROR_MESSAGES.DATABASE_ERROR, 'DATABASE_ERROR', 500);
    }
  }
}

// 导出实例
const fundDao = require('../dao/fundDao');
const fundServiceInstance = new FundService(fundDao);

module.exports = fundServiceInstance;
module.exports.default = fundServiceInstance;
module.exports.FundService = FundService;
