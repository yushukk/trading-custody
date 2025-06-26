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
  const [userId, setUserId] = useState(''); // 新增：存储用户ID
  const [view, setView] = useState('login');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      const role = localStorage.getItem('userRole');
      const storedUsername = localStorage.getItem('username');
      const storedUserId = localStorage.getItem('userId'); // 获取用户ID
      setIsAdmin(role === 'admin');
      setUsername(storedUsername || token);
      setUserId(storedUserId || ''); // 设置用户ID
      setView('dashboard');
    }
  }, []);

  const handleLogin = (token, role, username, userId) => { // 修改：添加userId参数
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', userId); // 存储用户ID
    setIsLoggedIn(true);
    setIsAdmin(role === 'admin');
    setUsername(username);
    setUserId(userId); // 设置用户ID
    setView('dashboard');
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('userId'); // 秒速用户名
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
    setView('login');
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
      {/* 新增修改密码页面的独立路由 */}
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePassword username={username} onLogout={handleLogout} onBack={() => navigate('/')} />
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
        ) :  (
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