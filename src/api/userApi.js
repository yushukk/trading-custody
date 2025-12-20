/**
 * 用户相关API调用封装
 * @module userApi
 */

import apiClient from './apiClient';

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise} 登录结果Promise
 */
export const login = async (username, password) => {
  return await apiClient.post('/api/login', { username, password });
};

/**
 * 登出
 * @returns {Promise} 登出结果Promise
 */
export const logout = async () => {
  return await apiClient.post('/api/logout');
};

/**
 * 刷新 Token
 * @returns {Promise} 刷新结果Promise
 */
export const refreshToken = async () => {
  return await apiClient.post('/api/auth/refresh');
};

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息Promise
 */
export const getCurrentUser = async () => {
  return await apiClient.get('/api/users/me');
};

/**
 * 更新用户密码
 * @param {string} username - 用户名
 * @param {string} newPassword - 新密码
 * @returns {Promise} 更新结果Promise
 */
export const updatePassword = async (username, newPassword) => {
  return await apiClient.put('/api/update-password', { username, newPassword });
};

/**
 * 获取所有用户
 * @returns {Promise} 用户列表Promise
 */
export const getAllUsers = async () => {
  return await apiClient.get('/api/users');
};

/**
 * 创建用户
 * @param {Object} userData - 用户数据
 * @returns {Promise} 创建结果Promise
 */
export const createUser = async userData => {
  return await apiClient.post('/api/users', userData);
};

/**
 * 根据ID更新用户密码
 * @param {number} id - 用户ID
 * @param {string} newPassword - 新密码
 * @returns {Promise} 更新结果Promise
 */
export const updateUserPasswordById = async (id, newPassword) => {
  return await apiClient.put(`/api/users/${id}/password`, { newPassword });
};

/**
 * 删除用户
 * @param {number} id - 用户ID
 * @returns {Promise} 删除结果Promise
 */
export const deleteUser = async id => {
  return await apiClient.delete(`/api/users/${id}`);
};
