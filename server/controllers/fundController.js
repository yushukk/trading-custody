const fundService = require('../services/fundService');
const AppError = require('../utils/AppError');

class FundController {
  // 获取用户资金余额
  async getFundBalance(req, res, next) {
    try {
      const balance = await fundService.getFundBalance(req.params.userId);
      res.json({ balance });
    } catch (error) {
      next(error);
    }
  }

  // 获取资金日志
  async getFundLogs(req, res, next) {
    try {
      const logs = await fundService.getFundLogs(req.params.userId, 5);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }

  // 处理资金操作
  async handleFundOperation(req, res, next) {
    try {
      const result = await fundService.handleFundOperation(
        req.params.userId, 
        req.body.type, 
        req.body.amount, 
        req.body.remark
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FundController();