import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Selector, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [passwordInputs, setPasswordInputs] = useState({}); // 用于存储每个用户的密码输入
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error('Failed to add user');

      fetchUsers();
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      Toast.show({ content: '添加用户成功', duration: 1000 });
    } catch (error) {
      Toast.show({ content: error.message, duration: 2000, color: 'danger' });
    }
  };

  const handleUpdatePassword = async (userId, newPassword) => {
    if (!newPassword) {
      Toast.show({ content: '请输入新密码', duration: 1500, color: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) throw new Error('Failed to update password');

      fetchUsers();
      // 清空密码输入
      setPasswordInputs(prev => ({ ...prev, [userId]: '' }));
      Toast.show({ content: '密码更新成功', duration: 1000 });
    } catch (error) {
      Toast.show({ content: error.message, duration: 2000, color: 'danger' });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      fetchUsers();
      Toast.show({ content: '用户删除成功', duration: 1000 });
    } catch (error) {
      Toast.show({ content: error.message, duration: 2000, color: 'danger' });
    }
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '16px' }}>用户管理</h1>
      
      <Button 
        block 
        color="primary" 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '16px' }}
      >
        返回
      </Button>

      {/* 添加用户卡片 */}
      <Card 
        title="添加新用户"
        style={{ marginBottom: '16px' }}
      >
        <Input
          placeholder="用户名"
          value={newUser.name}
          onChange={(val) => setNewUser({ ...newUser, name: val })}
          style={{ marginBottom: '12px' }}
        />
        <Input
          placeholder="邮箱"
          value={newUser.email}
          onChange={(val) => setNewUser({ ...newUser, email: val })}
          style={{ marginBottom: '12px' }}
        />
        <Input
          placeholder="密码"
          type="password"
          value={newUser.password}
          onChange={(val) => setNewUser({ ...newUser, password: val })}
          style={{ marginBottom: '12px' }}
        />
        <Selector
          options={[
            { label: '普通用户', value: 'user' },
            { label: '管理员', value: 'admin' }
          ]}
          value={[newUser.role]}
          onChange={(val) => setNewUser({ ...newUser, role: val[0] })}
          style={{ marginBottom: '12px' }}
        />
        <Button 
          block 
          color="primary" 
          onClick={handleAddUser}
        >
          添加用户
        </Button>
      </Card>

      {/* 用户列表卡片 */}
      <Card title="用户列表">
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        <div>
          {users.map((user) => (
            <Card key={user.id}>
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p><strong>用户名:</strong> {user.name}</p>
                  <p><strong>邮箱:</strong> {user.email}</p>
                </div>
                <p><strong>角色:</strong> {user.role}</p>
                
                <Input
                  placeholder="新密码"
                  type="password"
                  value={passwordInputs[user.id] || ''}
                  onChange={(val) => setPasswordInputs(prev => ({ ...prev, [user.id]: val }))}
                  style={{ marginBottom: '12px' }}
                />
                
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', width: '100%' }}>
                  <Button 
                    color="primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const password = passwordInputs[user.id] || '';
                      if (!password) {
                        Toast.show({ content: '请输入新密码', duration: 1500, color: 'warning' });
                        return;
                      }
                      handleUpdatePassword(user.id, password);
                    }}
                  >
                    修改密码
                  </Button>
                  <Button 
                    color="danger"
                    style={{ flex: 1 }}
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    删除用户
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default UserManagement;