/**
 * 资金相关API调用封装
 */

// 使用空字符串，通过 proxy 转发
const API_BASE_URL = window.API_BASE_URL || '';

/**
 * 获取用户资金余额
 * @param {number} userId - 用户ID
 * @returns {Promise} 资金余额Promise
 */
export const getFundBalance = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/funds/${userId}`);
  
  if (!response.ok) {
    throw new Error('获取资金余额失败');
  }
  
  return response.json();
};

/**
 * 获取资金流水
 * @param {number} userId - 用户ID
 * @returns {Promise} 资金流水Promise
 */
export const getFundLogs = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/funds/${userId}/logs`);
  
  if (!response.ok) {
    throw new Error('获取资金流水失败');
  }
  
  return response.json();
};

/**
 * 处理资金操作
 * @param {number} userId - 用户ID
 * @param {string} type - 操作类型
 * @param {number} amount - 金额
 * @param {string} remark - 备注
 * @returns {Promise} 操作结果Promise
 */
export const handleFundOperation = async (userId, type, amount, remark) => {
  const response = await fetch(`${API_BASE_URL}/api/funds/${userId}/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, remark })
  });
  
  if (!response.ok) {
    throw new Error('资金操作失败');
  }
  
  return response.json();
};