import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/global.css'; // 引入全局样式
import MainLayout from './layouts/MainLayout'; // 引入主布局
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ChangePassword from './components/ChangePassword';
import UserManagement from './components/UserManagement';
import FundManagement from './components/FundManagement';
import PositionManagement from './components/PositionManagement';
import UserFundPosition from './components/UserFundPosition';

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// 包裹App内容并使用useNavigate
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [view, setView] = useState('login');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      const role = localStorage.getItem('userRole');
      const storedUsername = localStorage.getItem('username');
      const storedUserId = localStorage.getItem('userId');
      setIsAdmin(role === 'admin');
      setUsername(storedUsername || token);
      setUserId(storedUserId || '');
      if (role != 'admin') {
        navigate('/user-fund-position');
      }
    }
  }, []);

  const handleLogin = (token, role, username, userId) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', userId);
    setIsLoggedIn(true);
    setIsAdmin(role === 'admin');
    setUsername(username);
    setUserId(userId);
    if (role === 'admin') {
      navigate('/');
    } else {
      navigate('/user-fund-position');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/" element={<MainLayout />}>
        {/* 使用统一的ProtectedRoute组件 */}
        <Route index element={
          <ProtectedRoute>
            <AdminDashboard username={username} onLogout={handleLogout} onNavigate={setView} onOpenUserManagement={() => setView('user-management')} />
          </ProtectedRoute>
        } />
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
      </Route>
    </Routes>
  );
}

// 修改受保护路由高阶组件
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('authToken');
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  const location = useLocation();
  
  // 如果未登录，重定向到登录页
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 新增：处理根路径跳转逻辑
  if (location.pathname === '/') {
    if (!isAdmin) {
      // 非管理员用户重定向到资金持仓页面
      return <Navigate to="/user-fund-position" replace />;
    }
  }
  
  // 对于管理员专用路由的处理
  if (location.pathname.startsWith('/user-management') || 
      location.pathname.startsWith('/fund-management') || 
      location.pathname.startsWith('/position-management')) {
    if (!isAdmin) {
      // 非管理员用户重定向到资金持仓页面
      return <Navigate to="/user-fund-position" replace />;
    }
  }
  
  // 允许访问
  return children;
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