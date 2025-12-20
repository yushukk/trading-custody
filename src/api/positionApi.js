/**
 * 持仓相关API调用封装
 */

// 使用空字符串，通过 proxy 转发
const API_BASE_URL = window.API_BASE_URL || '';

/**
 * 获取用户持仓
 * @param {number} userId - 用户ID
 * @returns {Promise} 持仓列表Promise
 */
export const getPositions = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/positions/${userId}`);
  
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
    body: JSON.stringify(positionData)
  });
  
  if (!response.ok) {
    throw new Error('持仓操作失败');
  }
  
  return response.json();
};

/**
 * 获取持仓收益
 * @param {number} userId - 用户ID
 * @returns {Promise} 收益计算结果Promise
 */
export const getPositionProfit = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/positions/profit/${userId}`);
  
  if (!response.ok) {
    throw new Error('获取持仓收益失败');
  }
  
  return response.json();
};

/**
 * 删除用户持仓
 * @param {number} userId - 用户ID
 * @returns {Promise} 删除结果Promise
 */
export const deletePositions = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/positions/delete/${userId}`);
  
  if (!response.ok) {
    throw new Error('清除持仓失败');
  }
  
  return response.json();
};

/**
 * 同步价格数据
 * @returns {Promise} 同步结果Promise
 */
export const syncPriceData = async () => {
  const response = await fetch(`${API_BASE_URL}/api/syncPriceData`);
  
  if (!response.ok) {
    throw new Error('同步价格数据失败');
  }
  
  return response.json();
};