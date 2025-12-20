import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants';
import './AdminDashboard.css'; // 提取公共样式到CSS文件

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // 通用按钮样式
  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
  };

  const handleLogout = useCallback(async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  }, [logout, navigate]);

  return (
    <div className="admin-dashboard">
      <h1>欢迎管理员 {user?.name || user?.username}</h1>
      <p>这里是管理员视角的主页面。</p>
      {/* 使用统一样式 */}
      <button style={buttonStyle} onClick={handleLogout}>
        退出登录
      </button>
      <button style={buttonStyle} onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}>
        修改密码
      </button>
      <button style={buttonStyle} onClick={() => navigate(ROUTES.USER_MANAGEMENT)}>
        用户管理
      </button>
      <button style={buttonStyle} onClick={() => navigate(ROUTES.POSITION_MANAGEMENT)}>
        持仓管理
      </button>
      <button style={buttonStyle} onClick={() => navigate(ROUTES.FUND_MANAGEMENT)}>
        资金管理
      </button>
    </div>
  );
};

export default React.memo(AdminDashboard);
