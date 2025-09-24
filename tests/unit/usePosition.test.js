import { renderHook, act } from '@testing-library/react';
import { usePosition } from '../../src/hooks/usePosition';
import * as positionApi from '../../src/api/positionApi';

// Mock positionApi
jest.mock('../../src/api/positionApi');

describe('usePosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch positions', async () => {
    const mockPositions = [
      { id: 1, asset_type: 'stock', code: 'AAPL', name: 'Apple', operation: 'buy', price: 150, quantity: 10 }
    ];
    
    positionApi.getPositions.mockResolvedValue(mockPositions);

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.fetchPositions(1);
    });

    expect(result.current.positions).toEqual(mockPositions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should fetch position profit', async () => {
    const mockProfitData = [
      { code: 'AAPL', name: 'Apple', totalPnL: 200, realizedPnL: 100, unrealizedPnL: 100 }
    ];
    
    positionApi.getPositionProfit.mockResolvedValue(mockProfitData);

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.fetchPositionProfit(1);
    });

    expect(result.current.profitData).toEqual(mockProfitData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should add position', async () => {
    const addResult = { message: '操作成功', id: 2 };
    const mockPositions = [
      { id: 1, asset_type: 'stock', code: 'AAPL', name: 'Apple', operation: 'buy', price: 150, quantity: 10 },
      { id: 2, asset_type: 'stock', code: 'GOOGL', name: 'Google', operation: 'buy', price: 2500, quantity: 5 }
    ];
    
    positionApi.addPosition.mockResolvedValue(addResult);
    positionApi.getPositions.mockResolvedValue(mockPositions);
    positionApi.getPositionProfit.mockResolvedValue([]);

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.addPosition(1, {
        assetType: 'stock',
        code: 'GOOGL',
        name: 'Google',
        operation: 'buy',
        price: 2500,
        quantity: 5
      });
    });

    expect(result.current.positions).toEqual(mockPositions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should delete positions', async () => {
    const deleteResult = { message: '成功清除用户1的2条交易记录' };
    
    positionApi.deletePositions.mockResolvedValue(deleteResult);

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.deletePositions(1);
    });

    expect(result.current.positions).toEqual([]);
    expect(result.current.profitData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});