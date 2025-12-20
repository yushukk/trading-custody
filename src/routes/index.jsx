import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import UserFundPosition from '../components/UserFundPosition';
import UserManagement from '../components/UserManagement';
import FundManagement from '../components/FundManagement';
import PositionManagement from '../components/PositionManagement';
import ChangePassword from '../components/ChangePassword';
import Login from '../components/Login';

// 路由配置
const routes = [
  {
    path: '/login',
    element: <Login />,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    element: <AdminDashboard />,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/user-fund-position',
    element: <UserFundPosition />,
    meta: { requiresAuth: true }
  },
  {
    path: '/user-management',
    element: <UserManagement />,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/fund-management',
    element: <FundManagement />,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/position-management',
    element: <PositionManagement />,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/change-password',
    element: <ChangePassword />,
    meta: { requiresAuth: true }
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
];

export default routes;