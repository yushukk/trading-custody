const AppError = require('../utils/AppError');

class PositionService {
  constructor(positionDao, priceService) {
    this.positionDao = positionDao;
    this.priceService = priceService;
  }

  async getPositions(userId) {
    try {
      const positions = await this.positionDao.findByUserId(userId);
      // 返回倒序排列的交易记录（最新的在前面）
      return positions.reverse();
    } catch (error) {
      throw new AppError('获取持仓失败', 'GET_POSITIONS_FAILED', 500);
    }
  }

  async addPositionOperation(userId, positionData) {
    try {
      const {
        assetType,
        code,
        name,
        operation,
        price,
        quantity,
        timestamp,
        fee = 0,
      } = positionData;

      // 参数验证
      if (!['stock', 'future', 'fund'].includes(assetType)) {
        throw new AppError('无效的资产类型', 'POSITION_002', 400);
      }
      if (!operation || !['buy', 'sell'].includes(operation)) {
        throw new AppError('无效的操作类型', 'POSITION_003', 400);
      }

      // 将费用转换为数字
      const parsedFee = parseFloat(fee) || 0;

      // 将字符串转换为数字，如果转换后不是有效数字则返回错误
      const parsedPrice = parseFloat(price);
      const parsedQuantity = parseFloat(quantity);

      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new AppError('价格必须为正数', 'POSITION_004', 400);
      }
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        throw new AppError('数量必须为正数', 'POSITION_005', 400);
      }

      return await this.positionDao.create({
        userId,
        assetType,
        code,
        name,
        operation,
        price: parsedPrice,
        quantity: parsedQuantity,
        timestamp: timestamp || new Date().toISOString(),
        fee: parsedFee,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('添加持仓操作失败', 'ADD_POSITION_FAILED', 500);
    }
  }

  async calculatePositionProfit(userId) {
    try {
      const transactions = await this.positionDao.findByUserId(userId);

      const positionsMap = {};
      transactions.forEach(row => {
        if (!positionsMap[row.code]) {
          positionsMap[row.code] = [];
        }
        positionsMap[row.code].push(row);
      });

      const results = [];

      for (const [code, transactions] of Object.entries(positionsMap)) {
        let realizedPnL = 0;
        let totalFee = 0;
        // 双队列：分别管理多仓和空仓
        const longQueue = []; // 多仓队列（买入建立）
        const shortQueue = []; // 空仓队列（卖出建立）

        transactions.forEach(transaction => {
          const { operation, price, quantity, fee = 0 } = transaction;
          totalFee += fee;

          if (operation === 'buy') {
            let remaining = quantity;

            // 买入时，优先平空仓
            while (remaining > 0 && shortQueue.length > 0) {
              const head = shortQueue[0];

              if (head.quantity <= remaining) {
                // 完全平掉这笔空仓
                const tradeQuantity = head.quantity;
                const revenue = head.price * tradeQuantity; // 空仓开仓时的卖出收入
                const cost = price * tradeQuantity; // 平仓时的买入成本
                realizedPnL += revenue - cost; // 空仓盈亏 = 卖出价 - 买入价

                remaining -= tradeQuantity;
                shortQueue.shift();
              } else {
                // 部分平仓
                const tradeQuantity = remaining;
                const revenue = head.price * tradeQuantity;
                const cost = price * tradeQuantity;
                realizedPnL += revenue - cost;

                head.quantity -= tradeQuantity;
                remaining = 0;
              }
            }

            // 剩余数量建立多仓
            if (remaining > 0) {
              longQueue.push({ price, quantity: remaining });
            }
          } else if (operation === 'sell') {
            let remaining = quantity;

            // 卖出时，优先平多仓
            while (remaining > 0 && longQueue.length > 0) {
              const head = longQueue[0];

              if (head.quantity <= remaining) {
                // 完全平掉这笔多仓
                const tradeQuantity = head.quantity;
                const cost = head.price * tradeQuantity; // 多仓开仓时的买入成本
                const revenue = price * tradeQuantity; // 平仓时的卖出收入
                realizedPnL += revenue - cost; // 多仓盈亏 = 卖出价 - 买入价

                remaining -= tradeQuantity;
                longQueue.shift();
              } else {
                // 部分平仓
                const tradeQuantity = remaining;
                const cost = head.price * tradeQuantity;
                const revenue = price * tradeQuantity;
                realizedPnL += revenue - cost;

                head.quantity -= tradeQuantity;
                remaining = 0;
              }
            }

            // 剩余数量建立空仓
            if (remaining > 0) {
              shortQueue.push({ price, quantity: remaining });
            }
          }
        });

        // 扣除总费用
        realizedPnL -= totalFee;

        // 计算当前持仓数量（多仓为正，空仓为负）
        const longQuantity = longQueue.reduce((sum, item) => sum + item.quantity, 0);
        const shortQuantity = shortQueue.reduce((sum, item) => sum + item.quantity, 0);
        const currentQuantity = longQuantity - shortQuantity;

        // 获取最新价格
        const latestPrice = await this.priceService.getLatestPrice(
          code,
          transactions[0].assetType || transactions[0].asset_type
        );

        // 计算未实现盈亏
        let unrealizedPnL = 0;
        if (currentQuantity > 0) {
          // 多仓未实现盈亏
          const totalCost = longQueue.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const averageCost = totalCost / currentQuantity;
          unrealizedPnL = currentQuantity * (latestPrice - averageCost);
        } else if (currentQuantity < 0) {
          // 空仓未实现盈亏
          const totalRevenue = shortQueue.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          const averagePrice = totalRevenue / shortQuantity;
          unrealizedPnL = shortQuantity * (averagePrice - latestPrice);
        }

        results.push({
          code,
          name: transactions[0].name,
          assetType: transactions[0].assetType || transactions[0].asset_type,
          quantity: currentQuantity,
          totalPnL: realizedPnL + unrealizedPnL,
          realizedPnL,
          unrealizedPnL,
          latestPrice,
          fee: totalFee,
        });
      }

      return results;
    } catch (error) {
      throw new AppError('计算持仓收益失败', 'CALCULATE_PROFIT_FAILED', 500);
    }
  }

  async deletePositions(userId) {
    try {
      await this.positionDao.deleteByUserId(userId);
    } catch (error) {
      throw new AppError('删除持仓失败', 'DELETE_POSITIONS_FAILED', 500);
    }
  }

  // 添加更新code的业务逻辑
  async updatePositionCode(originalCode, newCode) {
    try {
      // 参数验证
      if (!originalCode || !newCode) {
        throw new AppError('原始代码和新代码不能为空', 'INVALID_CODE', 400);
      }

      if (originalCode === newCode) {
        throw new AppError('原始代码和新代码不能相同', 'SAME_CODE', 400);
      }

      // 执行更新操作
      const affectedRows = await this.positionDao.updateCodeByOriginalCode(originalCode, newCode);

      if (affectedRows === 0) {
        throw new AppError(`未找到代码为 ${originalCode} 的持仓记录`, 'POSITION_NOT_FOUND', 404);
      }

      return {
        success: true,
        affectedRows,
        message: `成功将 ${affectedRows} 条持仓记录的代码从 ${originalCode} 更新为 ${newCode}`,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新持仓代码失败', 'UPDATE_POSITION_CODE_FAILED', 500);
    }
  }
}

// 导出实例
const positionDao = require('../dao/positionDao');
const priceService = require('./priceService');
const positionServiceInstance = new PositionService(positionDao, priceService);

module.exports = positionServiceInstance;
module.exports.default = positionServiceInstance;
module.exports.PositionService = PositionService;
