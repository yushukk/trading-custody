import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// 懒加载组件 - 在路由配置中定义
const Login = lazy(() => import('../components/Login'));
const AdminDashboard = lazy(() => import('../components/AdminDashboard'));
const UserFundPosition = lazy(() => import('../components/UserFundPosition'));
const UserManagement = lazy(() => import('../components/UserManagement'));
const FundManagement = lazy(() => import('../components/FundManagement'));
const PositionManagement = lazy(() => import('../components/PositionManagement'));
const ChangePassword = lazy(() => import('../components/ChangePassword'));

// 路由配置
const routes = [
  {
    path: '/login',
    element: <Login />,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    element: <AdminDashboard />,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/user-fund-position',
    element: <UserFundPosition />,
    meta: { requiresAuth: true },
  },
  {
    path: '/user-management',
    element: <UserManagement />,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/fund-management',
    element: <FundManagement />,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/position-management',
    element: <PositionManagement />,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/change-password',
    element: <ChangePassword />,
    meta: { requiresAuth: true },
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export default routes;
