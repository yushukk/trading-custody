const positionService = require('../../services/positionService').default;

// Mock DAO层和价格服务
jest.mock('../../dao/positionDao', () => ({
  findByUserId: jest.fn(),
  create: jest.fn(),
  deleteByUserId: jest.fn(),
}));

jest.mock('../../services/priceService', () => ({
  getLatestPrice: jest.fn(),
}));

const positionDao = require('../../dao/positionDao');
const { getLatestPrice } = require('../../services/priceService');

describe('PositionService', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();
  });

  describe('getPositions', () => {
    it('should return positions for user', async () => {
      const mockPositions = [
        {
          id: 1,
          user_id: 1,
          asset_type: 'stock',
          code: 'AAPL',
          name: 'Apple',
          operation: 'buy',
          price: 150,
          quantity: 10,
        },
        {
          id: 2,
          user_id: 1,
          asset_type: 'stock',
          code: 'GOOGL',
          name: 'Google',
          operation: 'buy',
          price: 2500,
          quantity: 5,
        },
      ];
      positionDao.findByUserId.mockResolvedValue(mockPositions);

      const result = await positionService.getPositions(1);
      expect(result).toEqual(mockPositions);
      expect(positionDao.findByUserId).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no positions found', async () => {
      positionDao.findByUserId.mockResolvedValue([]);

      const result = await positionService.getPositions(999);
      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      positionDao.findByUserId.mockRejectedValueOnce(new Error('Database error'));

      await expect(positionService.getPositions(1)).rejects.toThrow('获取持仓失败');
    });
  });

  describe('addPositionOperation', () => {
    it('should throw error for invalid asset type', async () => {
      await expect(
        positionService.addPositionOperation(1, {
          assetType: 'invalid',
          code: 'AAPL',
          name: 'Apple',
          operation: 'buy',
          price: 150,
          quantity: 10,
        })
      ).rejects.toThrow('无效的资产类型');
    });

    it('should throw error for invalid operation', async () => {
      await expect(
        positionService.addPositionOperation(1, {
          assetType: 'stock',
          code: 'AAPL',
          name: 'Apple',
          operation: 'invalid',
          price: 150,
          quantity: 10,
        })
      ).rejects.toThrow('无效的操作类型');
    });

    it('should throw error for invalid price', async () => {
      await expect(
        positionService.addPositionOperation(1, {
          assetType: 'stock',
          code: 'AAPL',
          name: 'Apple',
          operation: 'buy',
          price: -150,
          quantity: 10,
        })
      ).rejects.toThrow('价格必须为正数');
    });

    it('should throw error for invalid quantity', async () => {
      await expect(
        positionService.addPositionOperation(1, {
          assetType: 'stock',
          code: 'AAPL',
          name: 'Apple',
          operation: 'buy',
          price: 150,
          quantity: -10,
        })
      ).rejects.toThrow('数量必须为正数');
    });

    it('should add position successfully', async () => {
      // 创建一个带lastID属性的上下文对象

      const positionData = {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10,
        fee: 5,
      };

      positionDao.create.mockResolvedValueOnce(1);

      const result = await positionService.addPositionOperation(1, positionData);
      expect(result).toBe(1);
      expect(positionDao.create).toHaveBeenCalledWith({
        userId: 1,
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10,
        timestamp: expect.any(String),
        fee: 5,
      });
    });

    it('should throw error when database query fails', async () => {
      const positionData = {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10,
        fee: 5,
      };

      positionDao.create.mockRejectedValueOnce(new Error('Database error'));

      await expect(positionService.addPositionOperation(1, positionData)).rejects.toThrow(
        '添加持仓操作失败'
      );
    });
  });

  describe('calculatePositionProfit', () => {
    it('should calculate profit correctly', async () => {
      const mockPositions = [
        {
          code: 'AAPL',
          asset_type: 'stock',
          name: 'Apple',
          operation: 'buy',
          price: 100,
          quantity: 10,
          fee: 5,
        },
        {
          code: 'AAPL',
          asset_type: 'stock',
          name: 'Apple',
          operation: 'sell',
          price: 120,
          quantity: 5,
          fee: 5,
        },
      ];

      positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
      getLatestPrice.mockResolvedValue(130);
      const result = await positionService.calculatePositionProfit(1);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('AAPL');
      expect(result[0].realizedPnL).toBeCloseTo(90); // (120-100)*5 - 5 - 5
      expect(result[0].unrealizedPnL).toBeCloseTo(150); // (130-100)*5
    });

    it('should throw error when database query fails', async () => {
      positionDao.findByUserId.mockRejectedValueOnce(new Error('Database error'));

      await expect(positionService.calculatePositionProfit(1)).rejects.toThrow('计算持仓收益失败');
    });
  });

  describe('deletePositions', () => {
    it('should delete positions for user', async () => {
      positionDao.deleteByUserId.mockResolvedValueOnce(2);

      await positionService.deletePositions(1);
      expect(positionDao.deleteByUserId).toHaveBeenCalledWith(1);
    });

    it('should throw error when database query fails', async () => {
      positionDao.deleteByUserId.mockRejectedValueOnce(new Error('Database error'));

      await expect(positionService.deletePositions(1)).rejects.toThrow('删除持仓失败');
    });
  });

  // 做空功能测试
  describe('Short Selling Support', () => {
    describe('Open short position', () => {
      it('should allow selling without existing position (direct short)', async () => {
        // 直接开空仓：初始持仓为0，直接卖出100股
        const mockPositions = [
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 100,
            fee: 10,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(95); // 价格下跌，空仓盈利

        const result = await positionService.calculatePositionProfit(1);

        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('AAPL');
        expect(result[0].quantity).toBe(-100); // 持仓为负数
        expect(result[0].realizedPnL).toBe(-10); // 只有费用
        expect(result[0].unrealizedPnL).toBeCloseTo(500); // (100-95)*100 = 500
        expect(result[0].totalPnL).toBeCloseTo(490); // 500 - 10
      });

      it('should open short position after selling all long positions', async () => {
        // 先买入50股，再卖出150股，最终持仓-100股
        const mockPositions = [
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'buy',
            price: 90,
            quantity: 50,
            fee: 5,
          },
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 150,
            fee: 15,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(95);

        const result = await positionService.calculatePositionProfit(1);

        expect(result).toHaveLength(1);
        expect(result[0].quantity).toBe(-100); // 最终持仓-100
        expect(result[0].realizedPnL).toBeCloseTo(480); // (100-90)*50 - 5 - 15 = 480
        expect(result[0].unrealizedPnL).toBeCloseTo(500); // (100-95)*100 = 500
        expect(result[0].totalPnL).toBeCloseTo(980);
      });
    });

    describe('Close short position', () => {
      it('should calculate profit when closing short position with profit', async () => {
        // 开空仓100股@100，平仓100股@90，盈利
        const mockPositions = [
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 100,
            fee: 10,
          },
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'buy',
            price: 90,
            quantity: 100,
            fee: 10,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(95);

        const result = await positionService.calculatePositionProfit(1);

        expect(result).toHaveLength(1);
        expect(result[0].quantity).toBe(0); // 平仓后持仓为0
        expect(result[0].realizedPnL).toBeCloseTo(980); // (100-90)*100 - 10 - 10 = 980
        expect(result[0].unrealizedPnL).toBe(0); // 无未实现盈亏
        expect(result[0].totalPnL).toBeCloseTo(980);
      });

      it('should calculate loss when closing short position with loss', async () => {
        // 开空仓100股@100，平仓100股@110，亏损
        const mockPositions = [
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 100,
            fee: 10,
          },
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'buy',
            price: 110,
            quantity: 100,
            fee: 10,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(105);

        const result = await positionService.calculatePositionProfit(1);

        expect(result).toHaveLength(1);
        expect(result[0].quantity).toBe(0);
        expect(result[0].realizedPnL).toBeCloseTo(-1020); // (100-110)*100 - 10 - 10 = -1020
        expect(result[0].unrealizedPnL).toBe(0);
        expect(result[0].totalPnL).toBeCloseTo(-1020);
      });

      it('should handle partial close of short position', async () => {
        // 开空仓100股@100，部分平仓50股@90
        const mockPositions = [
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 100,
            fee: 10,
          },
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'buy',
            price: 90,
            quantity: 50,
            fee: 5,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(95);

        const result = await positionService.calculatePositionProfit(1);

        expect(result).toHaveLength(1);
        expect(result[0].quantity).toBe(-50); // 剩余空仓-50
        expect(result[0].realizedPnL).toBeCloseTo(485); // (100-90)*50 - 10 - 5 = 485
        expect(result[0].unrealizedPnL).toBeCloseTo(250); // (100-95)*50 = 250
        expect(result[0].totalPnL).toBeCloseTo(735);
      });
    });

    describe('Mixed long and short positions', () => {
      it('should handle multiple switches between long and short', async () => {
        // 多空反复切换
        const mockPositions = [
          // 买入100股@90
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'buy',
            price: 90,
            quantity: 100,
            fee: 10,
          },
          // 卖出150股@100，平掉100股多仓，开空50股
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 150,
            fee: 15,
          },
          // 买入80股@95，平掉前面的50股空仓，开多30股
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'buy',
            price: 95,
            quantity: 80,
            fee: 8,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(105);

        const result = await positionService.calculatePositionProfit(1);

        expect(result).toHaveLength(1);
        expect(result[0].quantity).toBe(30); // 最终持仓为多仓30股
        // 已实现盈亏 = (100-90)*100 + (100-95)*50 - 10 - 15 - 8 = 1000 + 250 - 33 = 1217
        expect(result[0].realizedPnL).toBeCloseTo(1217);
        // 未实现盈亏 = (105-95)*30 = 300
        expect(result[0].unrealizedPnL).toBeCloseTo(300);
        expect(result[0].totalPnL).toBeCloseTo(1517);
      });
    });

    describe('Unrealized PnL for short positions', () => {
      it('should calculate unrealized profit when price drops', async () => {
        // 空仓，价格下跌，未实现盈利
        const mockPositions = [
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 100,
            fee: 10,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(80); // 价格下跌到80

        const result = await positionService.calculatePositionProfit(1);

        expect(result[0].quantity).toBe(-100);
        expect(result[0].unrealizedPnL).toBeCloseTo(2000); // (100-80)*100 = 2000
      });

      it('should calculate unrealized loss when price rises', async () => {
        // 空仓，价格上涨，未实现亏损
        const mockPositions = [
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 100,
            fee: 10,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(120); // 价格上涨到120

        const result = await positionService.calculatePositionProfit(1);

        expect(result[0].quantity).toBe(-100);
        expect(result[0].unrealizedPnL).toBeCloseTo(-2000); // (100-120)*100 = -2000
      });

      it('should calculate unrealized PnL with multiple short positions at different prices', async () => {
        // 多笔不同价格的空仓
        const mockPositions = [
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 100,
            quantity: 50,
            fee: 5,
          },
          {
            code: 'AAPL',
            asset_type: 'stock',
            name: 'Apple',
            operation: 'sell',
            price: 110,
            quantity: 50,
            fee: 5,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(95);

        const result = await positionService.calculatePositionProfit(1);

        expect(result[0].quantity).toBe(-100);
        // 平均开仓价 = (100*50 + 110*50) / 100 = 105
        // 未实现盈亏 = (105-95)*100 = 1000
        expect(result[0].unrealizedPnL).toBeCloseTo(1000);
      });
    });

    describe('Support for all asset types', () => {
      it('should support short selling for stocks', async () => {
        const mockPositions = [
          {
            code: '600000',
            asset_type: 'stock',
            name: '浦发银行',
            operation: 'sell',
            price: 10,
            quantity: 1000,
            fee: 10,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(9);

        const result = await positionService.calculatePositionProfit(1);

        expect(result[0].quantity).toBe(-1000);
        expect(result[0].assetType).toBe('stock');
        expect(result[0].unrealizedPnL).toBeCloseTo(1000);
      });

      it('should support short selling for futures', async () => {
        const mockPositions = [
          {
            code: 'IF2401',
            asset_type: 'future',
            name: '沪深300期货',
            operation: 'sell',
            price: 4000,
            quantity: 10,
            fee: 50,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(3900);

        const result = await positionService.calculatePositionProfit(1);

        expect(result[0].quantity).toBe(-10);
        expect(result[0].assetType).toBe('future');
        expect(result[0].unrealizedPnL).toBeCloseTo(1000);
      });

      it('should support short selling for funds', async () => {
        const mockPositions = [
          {
            code: '510300',
            asset_type: 'fund',
            name: '沪深300ETF',
            operation: 'sell',
            price: 4.5,
            quantity: 10000,
            fee: 10,
          },
        ];

        positionDao.findByUserId.mockResolvedValueOnce(mockPositions);
        getLatestPrice.mockResolvedValue(4.3);

        const result = await positionService.calculatePositionProfit(1);

        expect(result[0].quantity).toBe(-10000);
        expect(result[0].assetType).toBe('fund');
        expect(result[0].unrealizedPnL).toBeCloseTo(2000);
      });
    });
  });
});
