import React, { useState } from 'react';
import './Login.css';

// 设置API基础URL，统一使用window.API_BASE_URL
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
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
      onLogin(data.token, data.role, username, data.id);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo">D</div>
      <h1 className="login-title">欢迎回来</h1>
      <div className="login-input-group">
        <label className="login-input-label">用户名</label>
        <input
          type="text"
          placeholder="请输入用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          className="login-input"
        />
      </div>
      <div className="login-input-group">
        <label className="login-input-label">密码</label>
        <input
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="login-input"
        />
      </div>
      <button 
        onClick={handleLogin}
        className="login-button"
      >
        登录
      </button>
    </div>
  );
};

export default Login;