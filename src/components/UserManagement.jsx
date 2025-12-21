import React, { useState, useEffect, useCallback } from 'react';
import { Toast, Form, Input, Button, Selector, Dialog } from 'antd-mobile';
import apiClient from '../api/apiClient';
import { handleError } from '../utils/errorHandler';
import { ROLES } from '../constants';
import NavBar from './NavBar';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: ROLES.USER });
  const [passwordInputs, setPasswordInputs] = useState({}); // 用于存储每个用户的密码输入

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/users');
      setUsers(data.users || []);
    } catch (error) {
      handleError(error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const data = await apiClient.get('/api/users');
        if (isMounted) {
          setUsers(data.users || []);
        }
      } catch (error) {
        if (isMounted) {
          handleError(error);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddUser = async () => {
    // 详细的表单验证
    if (!newUser.name) {
      Toast.show({ content: '请输入用户名', duration: 1500, icon: 'fail' });
      return;
    }
    if (!newUser.password) {
      Toast.show({ content: '请输入密码', duration: 1500, icon: 'fail' });
      return;
    }

    try {
      await apiClient.post('/api/users', newUser);

      fetchUsers();
      setNewUser({ name: '', email: '', password: '', role: ROLES.USER });
      Toast.show({ content: '添加用户成功', duration: 1000, icon: 'success' });
    } catch (error) {
      handleError(error);
    }
  };

  const handleUpdatePassword = async (userId, newPassword) => {
    if (!newPassword) {
      Toast.show({ content: '请输入新密码', duration: 1500, icon: 'fail' });
      return;
    }

    try {
      await apiClient.put(`/api/users/${userId}/password`, { newPassword });

      fetchUsers();
      // 清空密码输入
      setPasswordInputs(prev => ({ ...prev, [userId]: '' }));
      Toast.show({ content: '密码更新成功', duration: 1000, icon: 'success' });
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteUser = async userId => {
    try {
      await apiClient.delete(`/api/users/${userId}`);

      fetchUsers();
      Toast.show({ content: '用户删除成功', duration: 1000, icon: 'success' });
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="user-management">
      <NavBar title="用户管理" />

      {/* 添加用户表单 */}
      <div className="add-user-card">
        <h2>✨ 添加新用户</h2>
        <Form layout="horizontal" className="add-user-form">
          <Form.Item label="用户名">
            <Input
              placeholder="请输入用户名"
              value={newUser.name}
              onChange={val => setNewUser({ ...newUser, name: val })}
              clearable
            />
          </Form.Item>
          <Form.Item label="邮箱">
            <Input
              placeholder="请输入邮箱"
              type="email"
              value={newUser.email}
              onChange={val => setNewUser({ ...newUser, email: val })}
              clearable
            />
          </Form.Item>
          <Form.Item label="密码">
            <Input
              placeholder="请输入密码"
              type="password"
              value={newUser.password}
              onChange={val => setNewUser({ ...newUser, password: val })}
              clearable
            />
          </Form.Item>
          <Form.Item label="角色">
            <Selector
              options={[
                { label: '普通用户', value: ROLES.USER },
                { label: '管理员', value: ROLES.ADMIN },
              ]}
              value={[newUser.role]}
              onChange={arr => setNewUser({ ...newUser, role: arr[0] })}
            />
          </Form.Item>
        </Form>
        <Button
          block
          color="primary"
          size="large"
          onClick={handleAddUser}
          className="add-user-button"
        >
          添加用户
        </Button>
      </div>

      {/* 用户列表 */}
      <div className="user-list-section">
        <h2>用户列表</h2>
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">暂无用户数据</p>
          </div>
        ) : (
          <div className="user-list">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <div className="user-info-item">
                    <span className="user-info-label">用户名:</span>
                    <span className="user-info-value">{user.name}</span>
                  </div>
                  <div className="user-info-item">
                    <span className="user-info-label">邮箱:</span>
                    <span className="user-info-value">{user.email || '未设置'}</span>
                  </div>
                  <div className="user-info-item">
                    <span className="user-info-label">角色:</span>
                    <span className={`user-role-badge ${user.role}`}>
                      {user.role === ROLES.ADMIN ? '管理员' : '普通用户'}
                    </span>
                  </div>
                </div>

                <div className="password-section">
                  <input
                    className="password-input"
                    type="password"
                    placeholder="输入新密码"
                    value={passwordInputs[user.id] || ''}
                    onChange={e =>
                      setPasswordInputs(prev => ({ ...prev, [user.id]: e.target.value }))
                    }
                  />
                  <div className="user-actions">
                    <button
                      className="action-button update"
                      onClick={() => {
                        const password = passwordInputs[user.id] || '';
                        if (!password) {
                          Toast.show({
                            content: '请输入新密码',
                            duration: 1500,
                            icon: 'fail',
                          });
                          return;
                        }
                        handleUpdatePassword(user.id, password);
                      }}
                    >
                      修改
                    </button>
                    <button
                      className="action-button delete"
                      onClick={async () => {
                        const result = await Dialog.confirm({
                          content: `确定要删除用户 "${user.name}" 吗？`,
                          confirmText: '删除',
                          cancelText: '取消',
                        });
                        if (result) {
                          handleDeleteUser(user.id);
                        }
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(UserManagement);
