import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = ({ username, onLogout, onNavigate }) => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f5f5f5' }}>
      <h1>欢迎用户 {username}</h1>
      <p>这里是普通用户视角的主页面。</p>
      <button
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
        onClick={() => onLogout()}
      >
        退出登录
      </button>
      <button
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
        onClick={() => onNavigate('change-password')}
      >
        修改密码
      </button>
      {/* 新增：持仓管理按钮 */}
      <button
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        onClick={() => navigate('/position-management')}
      >
        持仓管理
      </button>
      {/* 新增：资金持仓管理按钮 */}
      <button
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          marginLeft: '10px'
        }}
        onClick={() => navigate('/user-fund-position')}
      >
        我的资金持仓
      </button>
    </div>
  );
};

export default UserDashboard;