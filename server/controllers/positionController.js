class PositionController {
  constructor(positionService) {
    this.positionService = positionService;
  }

  // 获取用户持仓
  async getPositions(req, res, next) {
    try {
      const positions = await this.positionService.getPositions(req.params.userId);
      res.json({
        success: true,
        positions,
      });
    } catch (error) {
      next(error);
    }
  }

  // 计算持仓收益
  async calculatePositionProfit(req, res, next) {
    try {
      const results = await this.positionService.calculatePositionProfit(req.params.userId);
      res.json({
        success: true,
        results,
      });
    } catch (error) {
      next(error);
    }
  }

  // 添加持仓操作
  async addPosition(req, res, next) {
    try {
      await this.positionService.addPositionOperation(req.params.userId, req.body);
      res.status(201).json({
        success: true,
        message: '持仓操作添加成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除用户持仓
  async deletePositions(req, res, next) {
    try {
      await this.positionService.deletePositions(req.params.userId);
      res.json({
        success: true,
        message: `成功清除用户${req.params.userId}的持仓记录`,
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新持仓代码
  async updatePositionCode(req, res, next) {
    try {
      const { originalCode, newCode } = req.body;

      const result = await this.positionService.updatePositionCode(originalCode, newCode);

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
module.exports.PositionController = PositionController;

// 默认导出实例
const positionService = require('../services/positionService');
module.exports.default = new PositionController(positionService);
