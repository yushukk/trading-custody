const fundService = require('../../services/fundService');
const AppError = require('../../utils/AppError');

// Mock数据库
jest.mock('../../utils/database', () => {
  return {
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn(),
    serialize: jest.fn()
  };
});

const db = require('../../utils/database');

describe('FundService', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();
    
    // Mock serialize方法
    db.serialize.mockImplementation((callback) => {
      callback();
    });
  });

  describe('getFundBalance', () => {
    it('should return fund balance for existing user', async () => {
      const mockBalance = { user_id: 1, balance: 1000 };
      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockBalance);
      });

      const result = await fundService.getFundBalance(1);
      expect(result).toEqual(mockBalance);
      expect(db.get).toHaveBeenCalledWith(
        "SELECT * FROM funds WHERE user_id = ?",
        [1],
        expect.any(Function)
      );
    });

    it('should return zero balance for non-existing user', async () => {
      db.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const result = await fundService.getFundBalance(999);
      expect(result).toEqual({ user_id: 999, balance: 0 });
    });

    it('should throw error when database query fails', async () => {
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.get.mockImplementation((query, params, callback) => {
        callback(dbError, null);
      });

      await expect(fundService.getFundBalance(1))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getFundLogs', () => {
    it('should return fund logs for user', async () => {
      const mockLogs = [
        { id: 1, user_id: 1, type: 'deposit', amount: 1000, remark: 'Initial deposit' },
        { id: 2, user_id: 1, type: 'withdraw', amount: 500, remark: 'Withdrawal' }
      ];
      db.all.mockImplementation((query, params, callback) => {
        callback(null, mockLogs);
      });

      const result = await fundService.getFundLogs(1);
      expect(result).toEqual(mockLogs);
      expect(db.all).toHaveBeenCalledWith(
        "SELECT * FROM fund_logs WHERE user_id = ? ORDER BY timestamp DESC",
        [1],
        expect.any(Function)
      );
    });

    it('should return empty array when no logs found', async () => {
      db.all.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      const result = await fundService.getFundLogs(999);
      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.all.mockImplementation((query, params, callback) => {
        callback(dbError, null);
      });

      await expect(fundService.getFundLogs(1))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('handleFundOperation', () => {
    it('should throw error for invalid operation type', async () => {
      await expect(fundService.handleFundOperation(1, 'invalid', 100, 'Test'))
        .rejects
        .toThrow('无效的操作类型');
    });

    it('should throw error for invalid amount', async () => {
      await expect(fundService.handleFundOperation(1, 'deposit', -100, 'Test'))
        .rejects
        .toThrow('金额必须为正数');
    });

    it('should handle initial fund operation', async () => {
      const mockBalance = { user_id: 1, balance: 0 };
      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockBalance);
      });
      
      db.run.mockImplementation((query, params, callback) => {
        callback(null);
      });

      const result = await fundService.handleFundOperation(1, 'initial', 1000, 'Initial deposit');
      expect(result).toEqual({ message: '操作成功', balance: 1000 });
    });

    it('should throw error when database query fails', async () => {
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.get.mockImplementation((query, params, callback) => {
        callback(dbError, null);
      });

      await expect(fundService.handleFundOperation(1, 'initial', 1000, 'Initial deposit'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle deposit operation', async () => {
      const mockBalance = { user_id: 1, balance: 500 };
      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockBalance);
      });
      
      db.run.mockImplementation((query, params, callback) => {
        callback(null);
      });

      const result = await fundService.handleFundOperation(1, 'deposit', 200, 'Deposit');
      expect(result).toEqual({ message: '操作成功', balance: 700 });
    });

    it('should throw error when database query fails', async () => {
      const mockBalance = { user_id: 1, balance: 500 };
      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockBalance);
      });
      
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.run.mockImplementation((query, params, callback) => {
        callback(dbError, null);
      });

      await expect(fundService.handleFundOperation(1, 'deposit', 200, 'Deposit'))
        .rejects
        .toThrow(AppError);
    });

    it('should handle withdraw operation', async () => {
      const mockBalance = { user_id: 1, balance: 1000 };
      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockBalance);
      });
      
      db.run.mockImplementation((query, params, callback) => {
        callback(null);
      });

      const result = await fundService.handleFundOperation(1, 'withdraw', 200, 'Withdrawal');
      expect(result).toEqual({ message: '操作成功', balance: 800 });
    });

    it('should throw error when database query fails', async () => {
      const mockBalance = { user_id: 1, balance: 1000 };
      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockBalance);
      });
      
      const dbError = new AppError('Database error', 'DATABASE_ERROR');
      db.run.mockImplementation((query, params, callback) => {
        callback(dbError, null);
      });

      await expect(fundService.handleFundOperation(1, 'withdraw', 200, 'Withdrawal'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for insufficient balance on withdrawal', async () => {
      const mockBalance = { user_id: 1, balance: 100 };
      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockBalance);
      });

      await expect(fundService.handleFundOperation(1, 'withdraw', 200, 'Withdrawal'))
        .rejects
        .toThrow('余额不足');
    });
  });
});