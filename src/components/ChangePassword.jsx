import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { handleError } from '../utils/errorHandler';
import { KEYS } from '../constants';
import './ChangePassword.css';

const ChangePassword = ({ onBack }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleUpdatePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      await apiClient.put('/api/users/password', {
        newPassword
      });

      alert('密码修改成功');
      onBack();
    } catch (error) {
      handleError(error);
    }
  }, [newPassword, confirmPassword, onBack]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === KEYS.ENTER) {
      handleUpdatePassword();
    }
  }, [handleUpdatePassword]);

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

export default React.memo(ChangePassword);