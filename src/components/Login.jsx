import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import { useAuth } from '../contexts/AuthContext';
import { handleError } from '../utils/errorHandler';
import { ROLES, ROUTES, KEYS } from '../constants';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleLogin = useCallback(async () => {
    if (!username || !password) {
      Toast.show({
        icon: 'fail',
        content: '请输入用户名和密码'
      });
      return;
    }

    setLoading(true);
    try {
      const data = await authLogin(username, password);
      
      if (data.success && data.user) {
        Toast.show({
          icon: 'success',
          content: '登录成功'
        });
        
        // 根据用户角色导航到不同页面
        if (data.user.role === ROLES.ADMIN) {
          navigate(ROUTES.ADMIN_DASHBOARD);
        } else {
          navigate(ROUTES.USER_FUND_POSITION);
        }
      }
    } catch (error) {
      handleError(error, navigate);
    } finally {
      setLoading(false);
    }
  }, [username, password, authLogin, navigate]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === KEYS.ENTER) {
      handleLogin();
    }
  }, [handleLogin]);

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
        disabled={loading}
      >
        {loading ? '登录中...' : '登录'}
      </button>
    </div>
  );
};

export default React.memo(Login);