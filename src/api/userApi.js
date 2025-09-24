/**
 * 用户相关API调用封装
 * @module userApi
 */

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001';

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise} 登录结果Promise
 */
export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    throw new Error('登录失败');
  }
  
  return response.json();
};

/**
 * 更新用户密码
 * @param {string} username - 用户名
 * @param {string} newPassword - 新密码
 * @returns {Promise} 更新结果Promise
 */
export const updatePassword = async (username, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/api/update-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, newPassword })
  });
  
  if (!response.ok) {
    throw new Error('密码更新失败');
  }
  
  return response.json();
};

/**
 * 获取所有用户
 * @returns {Promise} 用户列表Promise
 */
export const getAllUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/users`);
  
  if (!response.ok) {
    throw new Error('获取用户列表失败');
  }
  
  return response.json();
};

/**
 * 创建用户
 * @param {Object} userData - 用户数据
 * @returns {Promise} 创建结果Promise
 */
export const createUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    throw new Error('创建用户失败');
  }
  
  return response.json();
};

/**
 * 根据ID更新用户密码
 * @param {number} id - 用户ID
 * @param {string} newPassword - 新密码
 * @returns {Promise} 更新结果Promise
 */
export const updateUserPasswordById = async (id, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  });
  
  if (!response.ok) {
    throw new Error('密码更新失败');
  }
  
  return response.json();
};

/**
 * 删除用户
 * @param {number} id - 用户ID
 * @returns {Promise} 删除结果Promise
 */
export const deleteUser = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('删除用户失败');
  }
  
  return response.json();
};