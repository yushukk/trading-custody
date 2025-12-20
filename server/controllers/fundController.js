class FundController {
  constructor(fundService) {
    this.fundService = fundService;
  }

  // 获取用户资金余额
  async getFundBalance(req, res, next) {
    try {
      const balance = await this.fundService.getFundBalance(req.params.userId);
      res.json({
        success: true,
        user_id: req.params.userId,
        balance,
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取资金日志
  async getFundLogs(req, res, next) {
    try {
      const logs = await this.fundService.getFundLogs(req.params.userId, 5);
      res.json({
        success: true,
        logs,
      });
    } catch (error) {
      next(error);
    }
  }

  // 处理资金操作
  async handleFundOperation(req, res, next) {
    try {
      const result = await this.fundService.handleFundOperation(
        req.params.userId,
        req.body.type,
        req.body.amount,
        req.body.remark
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

// 导出类本身以便测试使用
module.exports.FundController = FundController;

// 默认导出实例
const fundService = require('../services/fundService');
module.exports.default = new FundController(fundService);
