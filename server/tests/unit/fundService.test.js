const fundService = require('../../services/fundService');
const AppError = require('../../utils/AppError');

// Mock DAO
jest.mock('../../dao/fundDao', () => {
  return {
    getBalance: jest.fn(),
    addFunds: jest.fn(),
    getFundLogs: jest.fn(),
    addFundLog: jest.fn(),
  };
});

const fundDao = require('../../dao/fundDao');

describe('FundService', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();
  });

  describe('getFundBalance', () => {
    it('should return fund balance for existing user', async () => {
      const mockBalance = 1000;
      fundDao.getBalance.mockResolvedValue(mockBalance);

      const result = await fundService.getFundBalance(1);
      expect(result).toEqual(mockBalance);
      expect(fundDao.getBalance).toHaveBeenCalledWith(1);
    });

    it('should return zero balance for non-existing user', async () => {
      fundDao.getBalance.mockResolvedValue(0);

      const result = await fundService.getFundBalance(999);
      expect(result).toEqual(0);
    });

    it('should throw error when database query fails', async () => {
      fundDao.getBalance.mockRejectedValue(new Error('Database error'));

      await expect(fundService.getFundBalance(1)).rejects.toThrow(AppError);
    });
  });

  describe('getFundLogs', () => {
    it('should return fund logs for user', async () => {
      const mockLogs = [
        { id: 1, user_id: 1, type: 'deposit', amount: 1000, remark: 'Initial deposit' },
        { id: 2, user_id: 1, type: 'withdraw', amount: 500, remark: 'Withdrawal' },
      ];
      fundDao.getFundLogs.mockResolvedValue(mockLogs);

      const result = await fundService.getFundLogs(1);
      expect(result).toEqual(mockLogs);
      expect(fundDao.getFundLogs).toHaveBeenCalledWith(1, 5);
    });

    it('should return empty array when no logs found', async () => {
      fundDao.getFundLogs.mockResolvedValue([]);

      const result = await fundService.getFundLogs(999);
      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      fundDao.getFundLogs.mockRejectedValue(new Error('Database error'));

      await expect(fundService.getFundLogs(1)).rejects.toThrow(AppError);
    });
  });

  describe('handleFundOperation', () => {
    it('should throw error for invalid operation type', async () => {
      await expect(fundService.handleFundOperation(1, 'invalid', 100, 'Test')).rejects.toThrow(
        AppError
      );
    });

    it('should throw error for invalid amount', async () => {
      await expect(fundService.handleFundOperation(1, 'deposit', -100, 'Test')).rejects.toThrow(
        AppError
      );
    });

    it('should handle initial fund operation', async () => {
      fundDao.getBalance.mockResolvedValue(0);
      fundDao.addFunds.mockResolvedValue(1);
      fundDao.addFundLog.mockResolvedValue(1);

      const result = await fundService.handleFundOperation(1, 'initial', 1000, 'Initial deposit');
      expect(result).toEqual({ message: '操作成功', balance: 1000 });
      // 确保 mock 函数被正确调用
      expect(fundDao.getBalance).toHaveBeenCalledWith(1);
      expect(fundDao.addFunds).toHaveBeenCalledWith(1, 1000, expect.any(String));
      expect(fundDao.addFundLog).toHaveBeenCalledWith(
        1,
        'initial',
        1000,
        1000,
        expect.any(String),
        'Initial deposit'
      );
    });

    it('should throw error when database query fails', async () => {
      fundDao.getBalance.mockRejectedValue(new Error('Database error'));

      await expect(
        fundService.handleFundOperation(1, 'initial', 1000, 'Initial deposit')
      ).rejects.toThrow(AppError);
    });

    it('should handle deposit operation', async () => {
      fundDao.getBalance.mockResolvedValue(500);
      fundDao.addFunds.mockResolvedValue(1);
      fundDao.addFundLog.mockResolvedValue(1);

      const result = await fundService.handleFundOperation(1, 'deposit', 200, 'Deposit');
      expect(result).toEqual({ message: '操作成功', balance: 700 });
    });

    it('should handle withdraw operation', async () => {
      fundDao.getBalance.mockResolvedValue(1000);
      fundDao.addFunds.mockResolvedValue(1);
      fundDao.addFundLog.mockResolvedValue(1);

      const result = await fundService.handleFundOperation(1, 'withdraw', 200, 'Withdrawal');
      expect(result).toEqual({ message: '操作成功', balance: 800 });
    });

    it('should allow withdrawal even with insufficient balance (balance can go negative)', async () => {
      fundDao.getBalance.mockResolvedValue(100);
      fundDao.addFunds.mockResolvedValue(1);
      fundDao.addFundLog.mockResolvedValue(1);

      const result = await fundService.handleFundOperation(1, 'withdraw', 200, 'Withdrawal');
      expect(result).toEqual({ message: '操作成功', balance: -100 });
    });
  });
});
