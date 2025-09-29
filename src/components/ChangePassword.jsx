import React, { useState } from 'react';
import './ChangePassword.css';

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUpdatePassword();
    }
  };

  return (
    <div className="change-password-container">
      <h1 className="change-password-title">修改密码</h1>
      <div className="change-password-input-group">
        <label className="change-password-input-label">新密码</label>
        <input
          type="password"
          placeholder="请输入新密码"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="change-password-input"
        />
      </div>
      <div className="change-password-input-group">
        <label className="change-password-input-label">确认新密码</label>
        <input
          type="password"
          placeholder="请再次输入新密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="change-password-input"
        />
      </div>
      {error && <p className="change-password-error">{error}</p>}
      <button
        onClick={handleUpdatePassword}
        className="change-password-button"
      >
        确认修改
      </button>
      <button
        onClick={onBack}
        className="change-password-back-button"
      >
        返回
      </button>
    </div>
  );
};

export default ChangePassword;