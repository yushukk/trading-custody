import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';
import apiClient from '../api/apiClient';
import { handleError } from '../utils/errorHandler';
import { KEYS } from '../constants';
import NavBar from './NavBar';
import './ChangePassword.css';

const ChangePassword = ({ onBack }) => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleUpdatePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      await apiClient.put('/api/users/password', {
        oldPassword,
        newPassword,
      });

      Toast.show({
        icon: 'success',
        content: '密码修改成功',
        duration: 1500,
      });

      // 1.5秒后返回
      setTimeout(() => {
        if (onBack) {
          onBack();
        } else {
          navigate(-1);
        }
      }, 1500);
    } catch (error) {
      handleError(error);
    }
  }, [oldPassword, newPassword, confirmPassword, onBack, navigate]);

  const handleKeyPress = useCallback(
    e => {
      if (e.key === KEYS.ENTER) {
        handleUpdatePassword();
      }
    },
    [handleUpdatePassword]
  );

  return (
    <div className="change-password-container">
      <NavBar title="修改密码" />
      <div className="change-password-input-group">
        <label className="change-password-input-label">旧密码</label>
        <input
          type="password"
          placeholder="请输入旧密码"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="change-password-input"
        />
      </div>
      <div className="change-password-input-group">
        <label className="change-password-input-label">新密码</label>
        <input
          type="password"
          placeholder="请输入新密码"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
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
          onChange={e => setConfirmPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="change-password-input"
        />
      </div>
      {error && <p className="change-password-error">{error}</p>}
      <button onClick={handleUpdatePassword} className="change-password-button">
        确认修改
      </button>
    </div>
  );
};

export default React.memo(ChangePassword);
