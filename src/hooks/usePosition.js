import { useState, useEffect, useRef } from 'react';
import * as positionApi from '../api/positionApi';

/**
 * 持仓管理Hook
 * @returns {Object} 包含持仓相关状态和操作的对象
 */
export const usePosition = () => {
  const [positions, setPositions] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * 获取用户持仓
   * @param {number} userId - 用户ID
   */
  const fetchPositions = async userId => {
    if (!userId) return;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const data = await positionApi.getPositions(userId, {
        signal: abortControllerRef.current.signal,
      });
      setPositions(data);
    } catch (err) {
      // 忽略取消请求的错误
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取持仓收益
   * @param {number} userId - 用户ID
   */
  const fetchPositionProfit = async userId => {
    if (!userId) return;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const data = await positionApi.getPositionProfit(userId, {
        signal: abortControllerRef.current.signal,
      });
      setProfitData(data);
    } catch (err) {
      // 忽略取消请求的错误
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 添加持仓操作
   * @param {number} userId - 用户ID
   * @param {Object} positionData - 持仓数据
   */
  const addPosition = async (userId, positionData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await positionApi.addPosition(userId, positionData);

      // 重新获取持仓数据
      await fetchPositions(userId);
      await fetchPositionProfit(userId);

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除用户持仓
   * @param {number} userId - 用户ID
   */
  const deletePositions = async userId => {
    setLoading(true);
    setError(null);
    try {
      const result = await positionApi.deletePositions(userId);
      setPositions([]);
      setProfitData([]);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    positions,
    profitData,
    loading,
    error,
    fetchPositions,
    fetchPositionProfit,
    addPosition,
    deletePositions,
  };
};
