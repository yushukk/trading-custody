const priceService = require('../../services/priceService');
const priceDao = require('../../dao/priceDao');
const positionDao = require('../../dao/positionDao');
const http = require('http');

// Mock positionDao
jest.mock('../../dao/positionDao', () => ({
  findAll: jest.fn(),
}));

// Mock DAO and external API
jest.mock('../../dao/priceDao', () => ({
  getLatestPrice: jest.fn(),
  getAllPricesByCode: jest.fn(),
  createPriceData: jest.fn(),
  getAllDistinctAssets: jest.fn(),
}));

// Mock http module
jest.mock('http', () => ({
  get: jest.fn((url, callback) => {
    // Create a mock response object
    const mockRes = {
      statusCode: 200,
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          // Simulate receiving data - 支持新的期货接口格式
          // 根据URL判断是期货还是股票
          const isFuture = url.includes('futures_zh_minute_sina');
          const mockData = isFuture
            ? [
                {
                  datetime: '2026-02-06 22:00:00',
                  open: 4968,
                  high: 5010,
                  low: 4960,
                  close: 4978,
                  volume: 320991,
                  hold: 1126074,
                },
                {
                  datetime: '2026-02-06 23:00:00',
                  open: 4977,
                  high: 4979,
                  low: 4954,
                  close: 4965,
                  volume: 3691,
                  hold: 1111625,
                },
              ]
            : [{ 日期: '2023-01-01', 收盘: '150.00' }];
          handler(JSON.stringify(mockData));
        } else if (event === 'end') {
          // Simulate end of response
          handler();
        }
        return mockRes;
      }),
    };

    // Call the callback with our mock response
    callback(mockRes);

    // Return a mock request object with on method for error handling
    return {
      on: jest.fn(),
      setTimeout: jest.fn(),
    };
  }),
}));

describe('PriceService', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();
  });

  describe('getLatestPrice', () => {
    it('should return latest price from database if exists', async () => {
      const mockPriceData = {
        code: 'AAPL',
        name: 'Apple Inc.',
        current: 150.0,
        change: 2.5,
        changePercent: 1.69,
        asset_type: 'stock',
      };

      priceDao.getLatestPrice.mockResolvedValue(mockPriceData);

      const result = await priceService.getLatestPrice('AAPL', 'stock');

      expect(result).toEqual(mockPriceData);
      expect(priceDao.getLatestPrice).toHaveBeenCalledWith('AAPL', 'stock');
    });
  });

  describe('getAllPricesByCode', () => {
    it('should return all prices for a code from database', async () => {
      const mockPriceData = [
        { date: '2023-01-01', price: 140.0 },
        { date: '2023-01-02', price: 145.0 },
        { date: '2023-01-03', price: 150.0 },
      ];

      priceDao.getAllPricesByCode.mockResolvedValue(mockPriceData);

      const result = await priceService.getAllPricesByCode('AAPL', 'stock');

      expect(result).toEqual(mockPriceData);
      expect(priceDao.getAllPricesByCode).toHaveBeenCalledWith('AAPL', 'stock');
    });
  });

  describe('fetchLatestPrice', () => {
    it('should fetch price from external API for stock', async () => {
      const result = await priceService.fetchLatestPrice('AAPL', 'stock');

      expect(http.get).toHaveBeenCalled();
      expect(typeof result).toBe('number');
      expect(result).toBe(150.0);
    });

    it('should fetch price from external API for future with new API', async () => {
      const result = await priceService.fetchLatestPrice('V2605', 'future');

      expect(http.get).toHaveBeenCalled();
      // 验证API URL包含symbol和period参数
      const callArgs = http.get.mock.calls[http.get.mock.calls.length - 1];
      const apiUrl = callArgs[0];
      expect(apiUrl).toContain('symbol=');
      expect(apiUrl).toContain('period=60');
      expect(apiUrl).toContain('futures_zh_minute_sina');
      expect(apiUrl).not.toContain('start_date');
      expect(apiUrl).not.toContain('end_date');

      expect(typeof result).toBe('number');
      expect(result).toBe(4965); // 最新时间的收盘价
    });

    it('should handle future API response with datetime field', async () => {
      // Mock返回新接口格式的数据（datetime字段）
      const mockData = [
        {
          datetime: '2026-02-06 22:00:00',
          open: 4968,
          high: 5010,
          low: 4960,
          close: 4978,
          volume: 320991,
          hold: 1126074,
        },
        {
          datetime: '2026-02-06 23:00:00',
          open: 4977,
          high: 4979,
          low: 4954,
          close: 4965,
          volume: 3691,
          hold: 1111625,
        },
      ];

      http.get.mockImplementationOnce((url, callback) => {
        const mockRes = {
          statusCode: 200,
          on: jest.fn((event, handler) => {
            if (event === 'data') {
              handler(JSON.stringify(mockData));
            } else if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
        };
        callback(mockRes);
        return { on: jest.fn(), setTimeout: jest.fn() };
      });

      const result = await priceService.fetchLatestPrice('V2605', 'future');

      // 应该返回最新时间的收盘价
      expect(result).toBe(4965);
    });

    it('should return 0.0 for unsupported asset type', async () => {
      const result = await priceService.fetchLatestPrice('INVALID', 'crypto');

      expect(result).toBe(0.0);
    });
  });

  describe('syncPriceData', () => {
    beforeEach(() => {
      // 重置同步锁状态
      const PriceService = require('../../services/priceService').constructor;
      PriceService.syncInProgress = false;
    });

    it('should sync price data when no positions exist', async () => {
      // Mock 数据库返回空列表，表示没有持仓
      positionDao.findAll.mockResolvedValue([]);

      const result = await priceService.syncPriceData();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', '没有持仓数据，无需同步价格');
      expect(positionDao.findAll).toHaveBeenCalled();
    });

    it('should sync price data for existing assets', async () => {
      // Mock 数据库返回一些持仓
      positionDao.findAll.mockResolvedValue([
        { code: 'AAPL', asset_type: 'stock' },
        { code: 'AAPL', asset_type: 'stock' }, // 重复的会被去重
        { code: 'RB2201', asset_type: 'future' },
      ]);

      // Mock createPriceData 成功
      priceDao.createPriceData.mockResolvedValue();

      const result = await priceService.syncPriceData();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('details');
      expect(positionDao.findAll).toHaveBeenCalled();
      // 由于外部API被mock，实际会失败，但不影响测试
    }, 10000); // 增加超时时间到10秒

    it('should sync specific assets when provided', async () => {
      // 测试传递特定资产列表
      const specificAssets = [
        { code: 'AAPL', assetType: 'stock' },
        { code: 'TSLA', assetType: 'stock' },
      ];

      // Mock createPriceData 成功
      priceDao.createPriceData.mockResolvedValue();

      const result = await priceService.syncPriceData(specificAssets);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('details');
      expect(result.details.total).toBe(2);
      // 不应该调用 positionDao.findAll，因为传递了特定资产
      expect(positionDao.findAll).not.toHaveBeenCalled();
    }, 10000);

    it('should prevent concurrent synchronization', async () => {
      // 设置同步锁为进行中
      const PriceService = require('../../services/priceService').constructor;
      PriceService.syncInProgress = true;

      const result = await priceService.syncPriceData();

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', '价格同步正在进行中，请稍后再试');
    });

    it('should skip expired futures with existing price data', async () => {
      // Mock 数据库返回一个期货持仓
      positionDao.findAll.mockResolvedValue([{ code: 'SC2412', asset_type: 'future' }]);

      // Mock fetchLatestPrice 返回 0（模拟过期合约）
      jest.spyOn(priceService, 'fetchLatestPrice').mockResolvedValue(0);

      // Mock 有历史价格数据
      priceDao.getLatestPrice.mockResolvedValue(75.5);

      const result = await priceService.syncPriceData();

      expect(result).toHaveProperty('success', true);
      expect(result.details.skipped).toBe(1);
      expect(result.details.skippedAssets).toContain('SC2412');
      expect(result.details.failed).toBe(0);

      // 恢复 mock
      priceService.fetchLatestPrice.mockRestore();
    });

    it('should count as failed when no historical price exists', async () => {
      // Mock 数据库返回一个新的期货持仓
      positionDao.findAll.mockResolvedValue([{ code: 'NEW2501', asset_type: 'future' }]);

      // Mock fetchLatestPrice 返回 0
      jest.spyOn(priceService, 'fetchLatestPrice').mockResolvedValue(0);

      // Mock 没有历史价格数据
      priceDao.getLatestPrice.mockResolvedValue(0);

      const result = await priceService.syncPriceData();

      expect(result).toHaveProperty('success', true);
      expect(result.details.skipped).toBe(0);
      expect(result.details.failed).toBe(1);

      // 恢复 mock
      priceService.fetchLatestPrice.mockRestore();
    });

    it('should handle empty specific assets array', async () => {
      const result = await priceService.syncPriceData([]);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', '没有需要同步的资产');
    });

    it('should filter invalid assets from specific assets list', async () => {
      const specificAssets = [
        { code: 'AAPL', assetType: 'stock' }, // 有效
        { code: '', assetType: 'stock' }, // 无效：code为空
        { code: 'TSLA' }, // 无效：缺少assetType
        { assetType: 'future' }, // 无效：缺少code
      ];

      // Mock createPriceData 成功
      priceDao.createPriceData.mockResolvedValue();

      const result = await priceService.syncPriceData(specificAssets);

      expect(result).toHaveProperty('success', true);
      expect(result.details.total).toBe(1); // 只有一个有效资产
    }, 10000);
  });
});
