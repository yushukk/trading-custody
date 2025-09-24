import { renderHook, act } from '@testing-library/react';
import { useFund } from './useFund';
import * as fundApi from '../api/fundApi';

// Mock fundApi
jest.mock('../api/fundApi');

describe('useFund', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch fund info', async () => {
    const mockBalance = { balance: 1000 };
    const mockLogs = [
      { id: 1, type: 'deposit', amount: 1000, remark: 'Initial deposit' }
    ];
    
    fundApi.getFundBalance.mockResolvedValue(mockBalance);
    fundApi.getFundLogs.mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useFund());

    await act(async () => {
      await result.current.fetchFundInfo(1);
    });

    expect(result.current.balance).toBe(1000);
    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch fund info error', async () => {
    const errorMessage = 'Failed to fetch fund info';
    fundApi.getFundBalance.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useFund());

    await act(async () => {
      await result.current.fetchFundInfo(1);
    });

    expect(result.current.balance).toBe(0);
    expect(result.current.logs).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle fund operation', async () => {
    const operationResult = { message: '操作成功', balance: 1200 };
    const mockLogs = [
      { id: 1, type: 'deposit', amount: 1000, remark: 'Initial deposit' },
      { id: 2, type: 'deposit', amount: 200, remark: 'Additional deposit' }
    ];
    
    fundApi.handleFundOperation.mockResolvedValue(operationResult);
    fundApi.getFundLogs.mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useFund());

    await act(async () => {
      await result.current.handleFundOperation(1, 'deposit', 200, 'Additional deposit');
    });

    expect(result.current.balance).toBe(1200);
    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});