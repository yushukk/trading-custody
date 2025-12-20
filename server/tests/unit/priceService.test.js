const priceService = require('../../services/priceService');
const priceDao = require('../../dao/priceDao');
const http = require('http');

// Mock DAO and external API
jest.mock('../../dao/priceDao', () => ({
  getLatestPrice: jest.fn(),
  getAllPricesByCode: jest.fn(),
  savePrice: jest.fn(),
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
    it('should sync price data', async () => {
      const result = await priceService.syncPriceData();

      expect(result).toEqual({ success: true, message: '价格数据同步任务已完成' });
    });
  });
});
