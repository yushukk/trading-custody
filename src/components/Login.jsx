import React, { useState } from 'react';
import './Login.css';
import { Input, Button } from 'antd-mobile'; // 替换输入组件

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      onLogin(data.token, data.role, username, data.id); // 从登录接口获取用户ID
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <h1>DEMO</h1>
      <Input
        placeholder="用户名"
        value={username}
        onChange={setUsername}
        className="login-input"
      />
      <Input
        type="password"
        placeholder="密码"
        value={password}
        onChange={setPassword}
        className="login-input"
      />
      <Button 
        block 
        color="primary" 
        onClick={handleLogin}
        className="login-button"
      >
        登录
      </Button>
    </div>
  );
};

export default Login;