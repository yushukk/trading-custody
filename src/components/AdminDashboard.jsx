import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants';
import NavBar from './NavBar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="admin-dashboard">
      <NavBar title="管理员控制台" showBack={false} />
      <div className="admin-content">
        <div className="welcome-section">
          <h1>欢迎，{user?.name || user?.username}</h1>
        </div>

        <div className="admin-actions">
          <div className="action-grid">
            <button
              className="admin-action-button primary"
              onClick={() => navigate(ROUTES.USER_MANAGEMENT)}
            >
              <span className="button-icon">👥</span>
              <span className="button-text">用户管理</span>
            </button>

            <button
              className="admin-action-button primary"
              onClick={() => navigate(ROUTES.POSITION_MANAGEMENT)}
            >
              <span className="button-icon">📊</span>
              <span className="button-text">持仓管理</span>
            </button>

            <button
              className="admin-action-button primary"
              onClick={() => navigate(ROUTES.FUND_MANAGEMENT)}
            >
              <span className="button-icon">💰</span>
              <span className="button-text">资金管理</span>
            </button>

            <button
              className="admin-action-button secondary"
              onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}
            >
              <span className="button-icon">🔒</span>
              <span className="button-text">修改密码</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdminDashboard);
