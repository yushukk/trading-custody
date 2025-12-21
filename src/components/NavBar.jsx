import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeftOutline } from 'antd-mobile-icons';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants';
import './NavBar.css';

const NavBar = ({ title, onBack, showBack = true, showLogout = true }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  }, [logout, navigate]);

  return (
    <div className="custom-navbar">
      <div className="navbar-left">
        {showBack && (
          <div className="navbar-back" onClick={handleBack}>
            <LeftOutline fontSize={24} />
          </div>
        )}
      </div>
      <div className="navbar-title">{title}</div>
      <div className="navbar-right">
        {showLogout && (
          <button className="navbar-logout" onClick={handleLogout}>
            退出
          </button>
        )}
      </div>
    </div>
  );
};

export default NavBar;
