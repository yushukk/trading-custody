import * as positionApi from './positionApi';

// Mock fetch
global.fetch = jest.fn();

describe('positionApi', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getPositions', () => {
    it('should call get positions API with correct parameters', async () => {
      const mockResponse = [
        { id: 1, code: 'AAPL', name: 'Apple', quantity: 10, price: 150 },
        { id: 2, code: 'GOOGL', name: 'Google', quantity: 5, price: 2500 },
      ];
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await positionApi.getPositions(1);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/positions/1', {});
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when get positions fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '获取持仓失败' }),
      });

      await expect(positionApi.getPositions(1)).rejects.toThrow('获取持仓失败');
    });
  });

  describe('getPositionProfit', () => {
    it('should call get position profit API with correct parameters', async () => {
      const mockResponse = [
        { code: 'AAPL', realizedPnL: 100, unrealizedPnL: 50 },
        { code: 'GOOGL', realizedPnL: 200, unrealizedPnL: -25 },
      ];
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await positionApi.getPositionProfit(1);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/positions/profit/1', {});
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when get position profit fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '获取持仓收益失败' }),
      });

      await expect(positionApi.getPositionProfit(1)).rejects.toThrow('获取持仓收益失败');
    });
  });

  describe('addPosition', () => {
    it('should call add position API with correct parameters', async () => {
      const newPosition = {
        code: 'MSFT',
        name: 'Microsoft',
        operation: 'buy',
        price: 300,
        quantity: 20,
      };
      const mockResponse = { success: true };
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await positionApi.addPosition(1, newPosition);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/positions/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPosition),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when add position fails', async () => {
      const newPosition = {
        code: 'MSFT',
        name: 'Microsoft',
        operation: 'buy',
        price: 300,
        quantity: 20,
      };
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '添加持仓失败' }),
      });

      await expect(positionApi.addPosition(1, newPosition)).rejects.toThrow('持仓操作失败');
    });
  });

  describe('deletePositions', () => {
    it('should call delete positions API with correct parameters', async () => {
      const mockResponse = { success: true };
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await positionApi.deletePositions(1);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/positions/delete/1', {});
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when delete positions fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '删除持仓失败' }),
      });

      await expect(positionApi.deletePositions(1)).rejects.toThrow('清除持仓失败');
    });
  });
});
