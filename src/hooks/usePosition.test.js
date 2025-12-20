import { renderHook, act } from '@testing-library/react';
import { usePosition } from './usePosition';
import * as positionApi from '../api/positionApi';

// Mock the positionApi module
jest.mock('../api/positionApi', () => ({
  getPositions: jest.fn(),
  getPositionProfit: jest.fn(),
  addPosition: jest.fn(),
  deletePositions: jest.fn(),
}));

describe('usePosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePosition());

    expect(result.current.positions).toEqual([]);
    expect(result.current.profitData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch positions successfully', async () => {
    const mockPositions = [
      { id: 1, code: 'AAPL', name: 'Apple', quantity: 10, price: 150 },
      { id: 2, code: 'GOOGL', name: 'Google', quantity: 5, price: 2500 },
    ];

    positionApi.getPositions.mockResolvedValue(mockPositions);

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.fetchPositions(1);
    });

    expect(result.current.positions).toEqual(mockPositions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch position profit successfully', async () => {
    const mockProfitData = [
      { code: 'AAPL', realizedPnL: 100, unrealizedPnL: 50 },
      { code: 'GOOGL', realizedPnL: 200, unrealizedPnL: -25 },
    ];

    positionApi.getPositionProfit.mockResolvedValue(mockProfitData);

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.fetchPositionProfit(1);
    });

    expect(result.current.profitData).toEqual(mockProfitData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add position successfully', async () => {
    const newPosition = { code: 'MSFT', name: 'Microsoft', quantity: 20, price: 300 };
    const mockPositions = [
      { id: 1, code: 'AAPL', name: 'Apple', quantity: 10, price: 150 },
      newPosition,
    ];
    const mockProfitData = [
      { code: 'AAPL', realizedPnL: 100, unrealizedPnL: 50 },
      { code: 'MSFT', realizedPnL: 0, unrealizedPnL: 100 },
    ];

    positionApi.addPosition.mockResolvedValue({ success: true });
    positionApi.getPositions.mockResolvedValue(mockPositions);
    positionApi.getPositionProfit.mockResolvedValue(mockProfitData);

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      const addResult = await result.current.addPosition(1, newPosition);
      expect(addResult).toEqual({ success: true });
    });

    expect(result.current.positions).toEqual(mockPositions);
    expect(result.current.profitData).toEqual(mockProfitData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should delete positions successfully', async () => {
    positionApi.deletePositions.mockResolvedValue({ success: true });

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      const deleteResult = await result.current.deletePositions(1);
      expect(deleteResult).toEqual({ success: true });
    });

    expect(result.current.positions).toEqual([]);
    expect(result.current.profitData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle API error correctly', async () => {
    const errorMessage = 'API Error';
    positionApi.getPositions.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.fetchPositions(1);
    });

    expect(result.current.positions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should not fetch positions if userId is not provided', async () => {
    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.fetchPositions(null);
    });

    expect(positionApi.getPositions).not.toHaveBeenCalled();
  });

  it('should not fetch position profit if userId is not provided', async () => {
    const { result } = renderHook(() => usePosition());

    await act(async () => {
      await result.current.fetchPositionProfit(null);
    });

    expect(positionApi.getPositionProfit).not.toHaveBeenCalled();
  });
});
