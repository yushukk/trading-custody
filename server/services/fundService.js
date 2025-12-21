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

  async addFundLog(userId, type, amount, balanceAfter, timestamp, remark = null) {
    try {
      const logId = await this.fundDao.addFundLog(
        userId,
        type,
        amount,
        balanceAfter,
        timestamp,
        remark
      );
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
      let fundAmount = 0; // 实际要添加到 funds 表的金额

      // 根据操作类型更新余额
      if (type === 'initial') {
        // 设置初始资金：直接重置为设置的金额
        newBalance = numericAmount;
        fundAmount = numericAmount - currentBalance; // 计算需要调整的差额
      } else if (type === 'deposit') {
        newBalance += numericAmount;
        fundAmount = numericAmount;
      } else if (type === 'withdraw') {
        // 取出资金：允许超额取出，因为可能投资赚到钱了
        // 这里的余额只是资金的余额，不是账户的实际余额
        newBalance -= numericAmount;
        fundAmount = -numericAmount;
      }

      // 添加资金记录
      const timestamp = new Date().toISOString();
      logger.debug('Adding funds', {
        userId,
        amount: fundAmount,
        timestamp,
      });
      await this.addFunds(userId, fundAmount, timestamp);

      // 添加资金日志
      logger.debug('Adding fund log', {
        userId,
        type,
        amount: numericAmount,
        balanceAfter: newBalance,
        timestamp,
        remark,
      });
      await this.addFundLog(userId, type, numericAmount, newBalance, timestamp, remark);

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
