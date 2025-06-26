import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd-mobile'; // 替换按钮组件

const UserDashboard = ({ username, onLogout }) => {
  const navigate = useNavigate(); // 初始化navigate函数

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <h1 style={{ marginBottom: '16px' }}>欢迎用户 {username}</h1>
      <Button 
        block 
        color="primary" 
        onClick={() => onLogout()}
        style={{ marginBottom: '12px' }}
      >
        退出登录
      </Button>
      {/* 修复：使用useNavigate直接跳转，避免onNavigate参数可能导致的路由错误 */}
      <Button 
        block 
        color="primary"
        onClick={() => navigate('/change-password')}
        style={{ marginBottom: '12px' }}
      >
        修改密码
      </Button>
      <Button 
        block 
        color="success"
        onClick={() => navigate('/user-fund-position')}
      >
        我的资金持仓
      </Button>
    </div>
  );
};

export default UserDashboard;