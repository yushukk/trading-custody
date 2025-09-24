import { useState, useEffect } from 'react';
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

  /**
   * 获取用户持仓
   * @param {number} userId - 用户ID
   */
  const fetchPositions = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await positionApi.getPositions(userId);
      setPositions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取持仓收益
   * @param {number} userId - 用户ID
   */
  const fetchPositionProfit = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await positionApi.getPositionProfit(userId);
      setProfitData(data);
    } catch (err) {
      setError(err.message);
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
  const deletePositions = async (userId) => {
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

  return {
    positions,
    profitData,
    loading,
    error,
    fetchPositions,
    fetchPositionProfit,
    addPosition,
    deletePositions
  };
};