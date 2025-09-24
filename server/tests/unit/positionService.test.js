const positionService = require('../../services/positionService');
const AppError = require('../../utils/AppError');

// Mock数据库和价格工具
jest.mock('../../utils/database', () => {
  return {
    all: jest.fn(),
    run: jest.fn(),
    serialize: jest.fn(),
    get: jest.fn()
  };
});

jest.mock('../../utils/priceUtils', () => {
  return {
    getDbLatestPrice: jest.fn()
  };
});

const db = require('../../utils/database');
const { getDbLatestPrice } = require('../../utils/priceUtils');

describe('PositionService', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();
    
    // Mock serialize方法
    db.serialize.mockImplementation((callback) => {
      callback();
    });
  });

  describe('getPositions', () => {
    it('should return positions for user', async () => {
      const mockPositions = [
        { id: 1, user_id: 1, asset_type: 'stock', code: 'AAPL', name: 'Apple', operation: 'buy', price: 150, quantity: 10 },
        { id: 2, user_id: 1, asset_type: 'stock', code: 'GOOGL', name: 'Google', operation: 'buy', price: 2500, quantity: 5 }
      ];
      db.all.mockImplementation((query, params, callback) => {
        callback(null, mockPositions);
      });

      const result = await positionService.getPositions(1);
      expect(result).toEqual(mockPositions);
      expect(db.all).toHaveBeenCalledWith(
        "SELECT * FROM positions WHERE user_id = ? ORDER BY timestamp DESC",
        [1],
        expect.any(Function)
      );
    });

    it('should return empty array when no positions found', async () => {
      db.all.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const result = await positionService.getPositions(999);
      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.all.mockImplementation((query, params, callback) => {
        callback(dbError, null);
      });

      await expect(positionService.getPositions(1))
        .rejects
        .toThrow(AppError);
    });

  });

  describe('addPosition', () => {
    it('should throw error for invalid asset type', async () => {
      await expect(positionService.addPosition(1, {
        assetType: 'invalid',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10
      })).rejects.toThrow('无效的资产类型');
    });

    it('should throw error for invalid operation', async () => {
      await expect(positionService.addPosition(1, {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'invalid',
        price: 150,
        quantity: 10
      })).rejects.toThrow('无效的操作类型');
    });

    it('should throw error for invalid price', async () => {
      await expect(positionService.addPosition(1, {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: -150,
        quantity: 10
      })).rejects.toThrow('价格必须为正数');
    });

    it('should throw error for invalid quantity', async () => {
      await expect(positionService.addPosition(1, {
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
      
      db.run.mockImplementation(function(query, params, callback) {
        callback.call(context, null);
      });

      const positionData = {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10,
        fee: 5
      };

      const result = await positionService.addPosition(1, positionData);
      expect(result).toEqual({ message: '操作成功', id: 1 });
      expect(db.run).toHaveBeenCalledWith(
        "INSERT INTO positions (user_id, asset_type, code, name, operation, price, quantity, timestamp, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [1, 'stock', 'AAPL', 'Apple', 'buy', 150, 10, expect.any(String), 5],
        expect.any(Function)
      );
    });

    it('should throw error when database query fails', async () => {
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.run.mockImplementation(function(query, params, callback) {
        callback(dbError);
        this.lastID = 1;
      });

      const positionData = {
        assetType: 'stock',
        code: 'AAPL',
        name: 'Apple',
        operation: 'buy',
        price: 150,
        quantity: 10,
        fee: 5
      };

      await expect(positionService.addPosition(1, positionData))
        .rejects
        .toThrow(AppError);
    });

  });

  describe('calculatePositionProfit', () => {
    it('should calculate profit correctly', async () => {
      const mockPositions = [
        { code: 'AAPL', asset_type: 'stock', name: 'Apple', operation: 'buy', price: 100, quantity: 10, fee: 5 },
        { code: 'AAPL', asset_type: 'stock', name: 'Apple', operation: 'sell', price: 120, quantity: 5, fee: 5 }
      ];
      
      db.all.mockImplementation((query, params, callback) => {
        callback(null, mockPositions);
      });
      
      getDbLatestPrice.mockResolvedValue(130);

      const result = await positionService.calculatePositionProfit(1);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('AAPL');
      expect(result[0].realizedPnL).toBeCloseTo(90); // (120-100)*5 - 5 - 5
      expect(result[0].unrealizedPnL).toBeCloseTo(150); // (130-100)*5
    });

    it('should throw error when database query fails', async () => {
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.all.mockImplementation((query, params, callback) => {
        callback(dbError, null);
      });

      await expect(positionService.calculatePositionProfit(1))
        .rejects
        .toThrow(AppError);
    });

  });

  describe('deletePositions', () => {
    it('should delete positions for user', async () => {
      // 创建一个带changes属性的上下文对象
      const context = { changes: 2 };
      
      db.run.mockImplementation(function(query, params, callback) {
        callback.call(context, null);
      });

      const result = await positionService.deletePositions(1);
      expect(result).toEqual({ message: '成功清除用户1的2条交易记录' });
      expect(db.run).toHaveBeenCalledWith(
        "DELETE FROM positions WHERE user_id = ?",
        [1],
        expect.any(Function)
      );
    });

    it('should throw error when database query fails', async () => {
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.run.mockImplementation(function(query, params, callback) {
        callback(dbError);
        this.changes = 2;
      });

      await expect(positionService.deletePositions(1))
        .rejects
        .toThrow(AppError);
    });

  });
});