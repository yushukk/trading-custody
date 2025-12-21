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
        let totalFee = 0; // 新增总费用统计
        const queue = [];

        transactions.forEach(transaction => {
          const { operation, price, quantity, fee = 0 } = transaction;
          totalFee += fee; // 累加费用

          if (operation === 'buy') {
            queue.push({ price, quantity });
          } else if (operation === 'sell') {
            let remaining = quantity;
            while (remaining > 0 && queue.length > 0) {
              const head = queue[0];

              if (head.quantity <= remaining) {
                const tradeQuantity = head.quantity;
                const cost = head.price * tradeQuantity; // 成本包含费用
                const revenue = price * tradeQuantity; // 收入扣除费用
                realizedPnL += revenue - cost; // 计算盈亏

                remaining -= tradeQuantity;
                queue.shift();
              } else {
                const tradeQuantity = remaining;
                const cost = head.price * tradeQuantity; // 按比例分配费用
                const revenue = price * tradeQuantity; // 收入扣除费用
                realizedPnL += revenue - cost; // 计算盈亏

                head.quantity -= tradeQuantity;
                remaining = 0;
              }
            }
          }
        });
        realizedPnL -= totalFee;

        const currentQuantity = queue.reduce((sum, item) => sum + item.quantity, 0);

        // 获取最新价格（无论持仓数量是否为0都要获取）
        const latestPrice = await this.priceService.getLatestPrice(
          code,
          transactions[0].assetType || transactions[0].asset_type
        );

        // 计算未实现盈亏（只有持仓数量>0时才计算）
        let unrealizedPnL = 0;
        if (currentQuantity > 0) {
          // 计算平均成本包含费用
          const totalCost = queue.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const averageCost = totalCost / currentQuantity;
          unrealizedPnL = currentQuantity * (latestPrice - averageCost);
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
          fee: totalFee, // 返回总费用
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
}

// 导出实例
const positionDao = require('../dao/positionDao');
const priceService = require('./priceService');
const positionServiceInstance = new PositionService(positionDao, priceService);

module.exports = positionServiceInstance;
module.exports.default = positionServiceInstance;
module.exports.PositionService = PositionService;
