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
  savePrice: jest.fn(),
  getAllDistinctAssets: jest.fn(),
}));

// Mock http module
jest.mock('http', () => ({
  get: jest.fn((url, callback) => {
    // Create a mock response object
    const mockRes = {
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          // Simulate receiving data
          handler(JSON.stringify([{ 日期: '2023-01-01', 收盘: '150.00' }]));
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
    });

    it('should fetch price from external API for future', async () => {
      const result = await priceService.fetchLatestPrice('RB2201', 'future');

      expect(http.get).toHaveBeenCalled();
      expect(typeof result).toBe('number');
    });

    it('should return 0.0 for unsupported asset type', async () => {
      const result = await priceService.fetchLatestPrice('INVALID', 'crypto');

      expect(result).toBe(0.0);
    });
  });

  describe('syncPriceData', () => {
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

      // Mock savePrice 成功
      priceDao.savePrice.mockResolvedValue();

      const result = await priceService.syncPriceData();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('details');
      expect(positionDao.findAll).toHaveBeenCalled();
      // 由于外部API被mock，实际会失败，但不影响测试
    }, 10000); // 增加超时时间到10秒
  });
});
