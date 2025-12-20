import { renderHook, act } from '@testing-library/react';
import { useFund } from './useFund';
import * as fundApi from '../api/fundApi';

// Mock the fundApi module
jest.mock('../api/fundApi', () => ({
  getFundBalance: jest.fn(),
  getFundLogs: jest.fn(),
  handleFundOperation: jest.fn(),
}));

describe('useFund', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFund());

    expect(result.current.balance).toBe(0);
    expect(result.current.logs).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch fund info successfully', async () => {
    const mockBalance = { balance: 1000 };
    const mockLogs = [{ id: 1, amount: 1000, type: 'deposit' }];

    fundApi.getFundBalance.mockResolvedValue(mockBalance);
    fundApi.getFundLogs.mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useFund());

    await act(async () => {
      await result.current.fetchFundInfo(1);
    });

    expect(result.current.balance).toBe(1000);
    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fund operation successfully', async () => {
    const mockResult = { balance: 1500 };
    const mockLogs = [
      { id: 1, amount: 1000, type: 'deposit' },
      { id: 2, amount: 500, type: 'deposit' },
    ];

    fundApi.handleFundOperation.mockResolvedValue(mockResult);
    fundApi.getFundLogs.mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useFund());

    await act(async () => {
      const operationResult = await result.current.handleFundOperation(
        1,
        'deposit',
        500,
        'Test deposit'
      );
      expect(operationResult).toEqual(mockResult);
    });

    expect(result.current.balance).toBe(1500);
    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle API error correctly', async () => {
    const errorMessage = 'API Error';
    fundApi.getFundBalance.mockRejectedValue(new Error(errorMessage));
    fundApi.getFundLogs.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useFund());

    await act(async () => {
      await result.current.fetchFundInfo(1);
    });

    expect(result.current.balance).toBe(0);
    expect(result.current.logs).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should not fetch fund info if userId is not provided', async () => {
    const { result } = renderHook(() => useFund());

    await act(async () => {
      await result.current.fetchFundInfo(null);
    });

    expect(fundApi.getFundBalance).not.toHaveBeenCalled();
    expect(fundApi.getFundLogs).not.toHaveBeenCalled();
  });
});
