import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROUTES } from '../constants';

const ProtectedRoute = ({ children, meta = {} }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (meta.requiresAuth && !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  
  if (meta.requiresAdmin && user?.role !== ROLES.ADMIN) {
    return <Navigate to={ROUTES.USER_FUND_POSITION} replace />;
  }
  
  return children;
};

export default ProtectedRoute;