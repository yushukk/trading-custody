import { useState, useEffect } from 'react';
import * as fundApi from '../api/fundApi';

/**
 * 资金管理Hook
 * @returns {Object} 包含资金相关状态和操作的对象
 */
export const useFund = () => {
  const [balance, setBalance] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 获取资金信息（余额和流水）
   * @param {number} userId - 用户ID
   */
  const fetchFundInfo = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const [balanceData, logsData] = await Promise.all([
        fundApi.getFundBalance(userId),
        fundApi.getFundLogs(userId)
      ]);
      
      setBalance(balanceData.balance || 0);
      setLogs(logsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理资金操作
   * @param {number} userId - 用户ID
   * @param {string} type - 操作类型
   * @param {number} amount - 金额
   * @param {string} remark - 备注
   */
  const handleFundOperation = async (userId, type, amount, remark) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fundApi.handleFundOperation(userId, type, amount, remark);
      setBalance(result.balance);
      
      // 重新获取资金流水
      const logsData = await fundApi.getFundLogs(userId);
      setLogs(logsData);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    logs,
    loading,
    error,
    fetchFundInfo,
    handleFundOperation
  };
};