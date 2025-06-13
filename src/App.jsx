import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import ChangePassword from './components/ChangePassword';
import UserManagement from './components/UserManagement'; // 新增用户管理组件
import FundManagement from './components/FundManagement'; // 新增资金管理组件
import PositionManagement from './components/PositionManagement'; // 新增持仓管理组件
import UserFundPosition from './components/UserFundPosition'; // 新增资金持仓页面组件

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// 包裹App内容并使用useNavigate
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [view, setView] = useState('login'); // 默认视图设置为登录页面
  const navigate = useNavigate(); // 使用useNavigate进行导航

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
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', username); // 确保username正确存储
    setIsLoggedIn(true);
    setIsAdmin(role === 'admin');
    setUsername(username); // 设置用户名
    setView('dashboard'); // 设置视图为仪表盘
    navigate('/'); // 强制导航到根路径
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
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      {/* 使用统一的ProtectedRoute组件 */}
      <Route path="/user-management" element={
        <ProtectedRoute>
          <UserManagement />
        </ProtectedRoute>
      } />
      <Route path="/fund-management" element={
        <ProtectedRoute>
          <FundManagement />
        </ProtectedRoute>
      } />
      <Route path="/position-management" element={
        <ProtectedRoute>
          <PositionManagement />
        </ProtectedRoute>
      } />
      {/* 添加用户资金持仓页面路由 */}
      <Route path="/user-fund-position" element={
        <ProtectedRoute>
          <UserFundPosition />
        </ProtectedRoute>
      } />
      
      {/* 修改仪表盘路由定义 */}
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
    </Routes>
  );
}

// 创建受保护路由高阶组件
const ProtectedRoute = ({ children, redirectPath = '/login' }) => {
  const isLoggedIn = !!localStorage.getItem('authToken');
  return isLoggedIn ? children : <Navigate to={redirectPath} replace />;
};

// 主App组件包裹Router
export default function App() {
  return (
    <Router>
      <div className="App">
        <AppContent />
      </div>
    </Router>
  );
}