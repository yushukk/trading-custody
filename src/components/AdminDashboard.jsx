import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css'; // 提取公共样式到CSS文件

const AdminDashboard = ({ username, onLogout, onNavigate, onOpenUserManagement }) => {
  const navigate = useNavigate();

  // 通用按钮样式
  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px'
  };

  return (
    <div className="admin-dashboard">
      <h1>欢迎管理员 {username}</h1>
      <p>这里是管理员视角的主页面。</p>
      {/* 使用统一样式 */}
      <button style={buttonStyle} onClick={() => onLogout()}>退出登录</button>
      <button style={buttonStyle} onClick={() => onNavigate('change-password')}>修改密码</button>
      <button style={buttonStyle} onClick={() => navigate('/user-management')}>用户管理</button>
      <button style={buttonStyle} onClick={() => navigate('/position-management')}>持仓管理</button>
      <button style={buttonStyle} onClick={() => navigate('/fund-management')}>资金管理</button>
      <button style={buttonStyle}>管理功能</button>
    </div>
  );
};

export default AdminDashboard;