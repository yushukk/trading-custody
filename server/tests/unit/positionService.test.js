const positionService = require('../../services/positionService');
const AppError = require('../../utils/AppError');

// Mock DAO层和价格服务
jest.mock('../../dao/positionDao', () => ({
  findByUserId: jest.fn(),
  create: jest.fn(),
  deleteByUserId: jest.fn()
}));

jest.mock('../../services/priceService', () => ({
  getLatestPrice: jest.fn()
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
        { id: 1, user_id: 1, asset_type: 'stock', code: 'AAPL', name: 'Apple', operation: 'buy', price: 150, quantity: 10 },
        { id: 2, user_id: 1, asset_type: 'stock', code: 'GOOGL', name: 'Google', operation: 'buy', price: 2500, quantity: 5 }
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

      await expect(positionService.getPositions(1))
        .rejects
        .toThrow('获取持仓失败');
    });

  });

  describe('addPositionOperation', () => {
    it('should throw error for invalid asset type', async () => {
      await expect(positionService.addPositionOperation(1, {
        assetType: 'invalid',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10
      })).rejects.toThrow('无效的资产类型');
    });

    it('should throw error for invalid operation', async () => {
      await expect(positionService.addPositionOperation(1, {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'invalid',
        price: 150,
        quantity: 10
      })).rejects.toThrow('无效的操作类型');
    });

    it('should throw error for invalid price', async () => {
      await expect(positionService.addPositionOperation(1, {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: -150,
        quantity: 10
      })).rejects.toThrow('价格必须为正数');
    });

    it('should throw error for invalid quantity', async () => {
      await expect(positionService.addPositionOperation(1, {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: -10
      })).rejects.toThrow('数量必须为正数');
    });

    it('should add position successfully', async () => {
      // 创建一个带lastID属性的上下文对象
      const context = { lastID: 1 };
      
      
      const positionData = {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10,
        fee: 5
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
        fee: 5
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
        fee: 5
      };

      positionDao.create.mockRejectedValueOnce(new Error('Database error'));

      await expect(positionService.addPositionOperation(1, positionData))
        .rejects
        .toThrow('添加持仓操作失败');
    });

  });

  describe('calculatePositionProfit', () => {
    it('should calculate profit correctly', async () => {
      const mockPositions = [
        { code: 'AAPL', asset_type: 'stock', name: 'Apple', operation: 'buy', price: 100, quantity: 10, fee: 5 },
        { code: 'AAPL', asset_type: 'stock', name: 'Apple', operation: 'sell', price: 120, quantity: 5, fee: 5 }
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

      await expect(positionService.calculatePositionProfit(1))
        .rejects
        .toThrow('计算持仓收益失败');
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

      await expect(positionService.deletePositions(1))
        .rejects
        .toThrow('删除持仓失败');
    });

  });
});