import { useState, useEffect, useRef } from 'react';
import * as userApi from '../api/userApi';

/**
 * 用户管理Hook
 * @module useUser
 */

/**
 * 用户管理Hook
 * @returns {Object} 包含用户相关状态和操作的对象
 */
export const useUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * 获取所有用户
   */
  const fetchUsers = async () => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const data = await userApi.getAllUsers();
      setUsers(data);
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
   * 创建用户
   * @param {Object} userData - 用户数据
   */
  const createUser = async userData => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await userApi.createUser(userData);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除用户
   * @param {number} userId - 用户ID
   */
  const deleteUser = async userId => {
    setLoading(true);
    setError(null);
    try {
      await userApi.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
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

  // 移除了自动获取用户列表的useEffect，改为手动调用fetchUsers

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    deleteUser,
  };
};
