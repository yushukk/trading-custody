import React from 'react';

const UserDashboard = ({ username, onLogout, onNavigate }) => {
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
      <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        用户功能
      </button>
    </div>
  );
};

export default UserDashboard;