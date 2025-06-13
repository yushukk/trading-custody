import React from 'react';
import { useNavigate } from 'react-router-dom'; // 新增：引入 useNavigate

const AdminDashboard = ({ username, onLogout, onNavigate, onOpenUserManagement }) => {
  const navigate = useNavigate(); // 新增：使用 useNavigate 钩子

  return (
    <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f5f5f5' }}>
      <h1>欢迎管理员 {username}</h1>
      <p>这里是管理员视角的主页面。</p>
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
      <button
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
        onClick={() => navigate('/user-management')} // 修改：直接使用 navigate 跳转到用户管理页面
      >
        用户管理
      </button>
      <button
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
        onClick={() => navigate('/position-management')} // 新增：持仓管理跳转按钮
      >
        持仓管理
      </button>
      <button
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
        onClick={() => navigate('/fund-management')} // 新增：资金管理跳转按钮
      >
        资金管理
      </button>
      <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        管理功能
      </button>
    </div>
  );
};

export default AdminDashboard;