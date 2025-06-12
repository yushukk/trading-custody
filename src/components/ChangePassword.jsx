import React, { useState } from 'react';

const ChangePassword = ({ username, onBack }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, newPassword }),
      });

      if (!response.ok) {
        throw new Error('修改密码失败');
      }

      alert('密码修改成功');
      onBack();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f5f5f5' }}>
      <h1>修改密码</h1>
      <input
        type="password"
        placeholder="新密码"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ margin: '10px 0', padding: '10px', width: '300px' }}
      />
      <input
        type="password"
        placeholder="确认新密码"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={{ margin: '10px 0', padding: '10px', width: '300px' }}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
        onClick={handleUpdatePassword}
      >
        确认修改
      </button>
      <button
        style={{ padding: '10px 20px', backgroundColor: '#ccc', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        onClick={onBack}
      >
        返回
      </button>
    </div>
  );
};

export default ChangePassword;