/**
 * 持仓相关API调用封装
 */

import apiClient from './apiClient';

// 使用空字符串，通过 proxy 转发
const API_BASE_URL = window.API_BASE_URL || '';

/**
 * 获取用户持仓
 * @param {number} userId - 用户ID
 * @param {Object} options - fetch选项
 * @returns {Promise} 持仓列表Promise
 */
export const getPositions = async (userId, options = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/positions/${userId}`, options);

  if (!response.ok) {
    throw new Error('获取持仓失败');
  }

  return response.json();
};

/**
 * 添加持仓操作
 * @param {number} userId - 用户ID
 * @param {Object} positionData - 持仓数据
 * @returns {Promise} 操作结果Promise
 */
export const addPosition = async (userId, positionData) => {
  const response = await fetch(`${API_BASE_URL}/api/positions/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(positionData),
  });

  if (!response.ok) {
    throw new Error('持仓操作失败');
  }

  return response.json();
};

/**
 * 获取持仓收益
 * @param {number} userId - 用户ID
 * @param {Object} options - fetch选项
 * @returns {Promise} 收益计算结果Promise
 */
export const getPositionProfit = async (userId, options = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/positions/profit/${userId}`, options);

  if (!response.ok) {
    throw new Error('获取持仓收益失败');
  }

  return response.json();
};

/**
 * 删除用户持仓
 * @param {number} userId - 用户ID
 * @param {Object} options - fetch选项
 * @returns {Promise} 删除结果Promise
 */
export const deletePositions = async (userId, options = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/positions/delete/${userId}`, options);

  if (!response.ok) {
    throw new Error('清除持仓失败');
  }

  return response.json();
};

/**
 * 同步价格数据
 * @param {Array} assets - 可选，要同步的特定资产列表 [{code, assetType}]
 * @param {Object} options - 请求选项
 * @returns {Promise} 同步结果Promise
 */
export const syncPriceData = async (assets = null, options = {}) => {
  if (assets && Array.isArray(assets) && assets.length > 0) {
    // 传递特定资产列表进行同步
    return apiClient.post('/api/syncPriceData', { assets }, options);
  } else {
    // 同步所有资产（向后兼容）
    return apiClient.get('/api/syncPriceData', options);
  }
};
