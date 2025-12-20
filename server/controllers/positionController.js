const positionService = require('../services/positionService');
const AppError = require('../utils/AppError');

class PositionController {
  // 获取用户持仓
  async getPositions(req, res, next) {
    try {
      const positions = await positionService.getPositions(req.params.userId);
      res.json(positions);
    } catch (error) {
      next(error);
    }
  }

  // 计算持仓收益
  async calculatePositionProfit(req, res, next) {
    try {
      const results = await positionService.calculatePositionProfit(req.params.userId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  // 添加持仓操作
  async addPosition(req, res, next) {
    try {
      const result = await positionService.addPositionOperation(req.params.userId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // 删除用户持仓
  async deletePositions(req, res, next) {
    try {
      await positionService.deletePositions(req.params.userId);
      res.json({ message: `成功清除用户${req.params.userId}的持仓记录` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PositionController();