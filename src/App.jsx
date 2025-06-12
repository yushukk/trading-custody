import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import ChangePassword from './components/ChangePassword';
import UserManagement from './components/UserManagement'; // 新增用户管理组件
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [view, setView] = useState('login'); // 默认视图设置为登录页面
  const [userManagementView, setUserManagementView] = useState(false); // 新增用户管理页面状态

  useEffect(() => {
    // 检查是否已登录
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      // 从 localStorage 中获取用户角色和用户名
      const role = localStorage.getItem('userRole');
      const storedUsername = localStorage.getItem('username'); // 获取用户名
      setIsAdmin(role === 'admin');
      setUsername(storedUsername || token); // 如果没有用户名，则回退到 token
      setView('dashboard'); // 登录后跳转到仪表盘
    }
  }, []);

  const handleLogin = (token, role, username) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role); // 存储用户角色到 localStorage
    localStorage.setItem('username', username); // 存储用户名到 localStorage
    setIsLoggedIn(true);
    setIsAdmin(role === 'admin');
    setUsername(username); // 设置用户名
    setView('dashboard'); // 登录后跳转到仪表盘
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole'); // 移除用户角色
    localStorage.removeItem('username'); // 秒速用户名
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
    setView('login'); // 登出后跳转到登录页面
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/user-management" element={
            isLoggedIn ? (
              <UserManagement />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          <Route path="/" element={
            view === 'dashboard' ? (
              isAdmin ? (
                <AdminDashboard username={username} onLogout={handleLogout} onNavigate={setView} onOpenUserManagement={() => setView('user-management')} />
              ) : (
                <UserDashboard username={username} onLogout={handleLogout} onNavigate={setView} />
              )
            ) : view === 'change-password' ? (
              <ChangePassword username={username} onBack={() => setView('dashboard')} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          } />
          {/* 添加重定向规则，确保未登录时跳转到登录页面 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;