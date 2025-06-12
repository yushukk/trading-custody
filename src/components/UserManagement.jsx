import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Row, Col, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
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

      if (!response.ok) {
        throw new Error('Failed to add user');
      }

      fetchUsers();
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      message.success('添加用户成功');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdatePassword = async (userId, newPassword) => {
    if (!newPassword) {
      message.error('请输入新密码');
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

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      fetchUsers();
      message.success('密码更新成功');
    } catch (error) {
      message.error(error.message);
    }
  };

  // 新增：删除用户功能
  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      fetchUsers();
      message.success('用户删除成功');
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ textAlign: 'center' }}>用户管理</h1>
      <Button type="primary" style={{ display: 'block', margin: '20px auto' }} onClick={() => navigate(-1)}>
        返回
      </Button>
      <Card title="添加新用户" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <Input
          placeholder="用户名"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          style={{ marginBottom: '10px', width: '100%' }}
        />
        <Input
          placeholder="邮箱"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          style={{ marginBottom: '10px', width: '100%' }}
        />
        <Input.Password
          placeholder="密码"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          style={{ marginBottom: '10px', width: '100%' }}
        />
        <Select
          value={newUser.role}
          onChange={(value) => setNewUser({ ...newUser, role: value })}
          style={{ marginBottom: '10px', width: '100%' }}
        >
          <Select.Option value="user">普通用户</Select.Option>
          <Select.Option value="admin">管理员</Select.Option>
        </Select>
        <Button type="primary" block onClick={handleAddUser}>
          添加用户
        </Button>
      </Card>
      <Card title="用户列表" style={{ width: '100%', margin: '20px auto' }}>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <Row gutter={[16, 16]}>
          {users.map((user) => (
            <Col key={user.id} span={8} xs={24} sm={12} md={8}>
              <Card style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p><strong>用户名:</strong> {user.name}</p>
                  <p><strong>邮箱:</strong> {user.email}</p>
                  <p><strong>角色:</strong> {user.role}</p>
                  <Input.Password
                    placeholder="新密码"
                    onChange={(e) => handleUpdatePassword(user.id, e.target.value)}
                    style={{ marginBottom: '10px', width: '100%' }}
                  />
                  <Button type="primary" block onClick={() => handleUpdatePassword(user.id, prompt('请输入新密码'))}>
                    修改密码
                  </Button>
                  {/* 新增：删除用户按钮 */}
                  <Button type="danger" block onClick={() => handleDeleteUser(user.id)} style={{ marginTop: '10px' }}>
                    删除用户
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default UserManagement;