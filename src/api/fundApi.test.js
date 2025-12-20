import * as fundApi from './fundApi';

// Mock fetch
global.fetch = jest.fn();

describe('fundApi', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getFundBalance', () => {
    it('should call get fund balance API with correct parameters', async () => {
      const mockResponse = { user_id: 1, balance: 1000 };
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fundApi.getFundBalance(1);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/funds/1', {});
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when get fund balance fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '获取资金余额失败' }),
      });

      await expect(fundApi.getFundBalance(1)).rejects.toThrow('获取资金余额失败');
    });
  });

  describe('getFundLogs', () => {
    it('should call get fund logs API with correct parameters', async () => {
      const mockResponse = [{ id: 1, amount: 1000, type: 'deposit' }];
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fundApi.getFundLogs(1);

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/funds/1/logs', {});
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when get fund logs fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '获取资金流水失败' }),
      });

      await expect(fundApi.getFundLogs(1)).rejects.toThrow('获取资金流水失败');
    });
  });

  describe('handleFundOperation', () => {
    it('should call handle fund operation API with correct parameters', async () => {
      const mockResponse = { message: '操作成功', balance: 1500 };
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fundApi.handleFundOperation(1, 'deposit', 500, 'Test deposit');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/funds/1/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500, remark: 'Test deposit' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when handle fund operation fails', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '资金操作失败' }),
      });

      await expect(fundApi.handleFundOperation(1, 'deposit', 500, 'Test')).rejects.toThrow(
        '资金操作失败'
      );
    });
  });
});
