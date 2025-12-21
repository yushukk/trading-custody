import React, { useState, useEffect, useCallback } from 'react';
import { Toast, Form, Input, Button, Selector, DatePicker } from 'antd-mobile';
import apiClient from '../api/apiClient';
import { handleError } from '../utils/errorHandler';
import NavBar from './NavBar';
import UserSelect from './UserSelect';
import './PositionManagement.css';

const PositionManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [positions, setPositions] = useState([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newPosition, setNewPosition] = useState({
    assetType: 'stock',
    code: '',
    name: '',
    operation: 'buy',
    price: '',
    quantity: '',
    fee: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const data = await apiClient.get('/api/users');
        if (isMounted) {
          setUsers(data.users || []);
        }
      } catch (error) {
        if (isMounted) {
          handleError(error);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPositions = useCallback(async userId => {
    try {
      const data = await apiClient.get(`/api/positions/${userId}`);
      setPositions(data.positions || []);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const handleUserSelect = useCallback(
    userId => {
      setSelectedUserId(userId);
      fetchPositions(userId);
    },
    [fetchPositions]
  );

  const handleAddPosition = async () => {
    // 表单验证
    if (!selectedUserId) {
      Toast.show({ content: '请先选择用户', duration: 1500, icon: 'fail' });
      return;
    }
    if (!newPosition.code) {
      Toast.show({ content: '请输入代码', duration: 1500, icon: 'fail' });
      return;
    }
    if (!newPosition.name) {
      Toast.show({ content: '请输入名称', duration: 1500, icon: 'fail' });
      return;
    }
    if (!newPosition.price) {
      Toast.show({ content: '请输入价格', duration: 1500, icon: 'fail' });
      return;
    }
    if (!newPosition.quantity) {
      Toast.show({ content: '请输入数量', duration: 1500, icon: 'fail' });
      return;
    }

    try {
      await apiClient.post(`/api/positions/${selectedUserId}`, {
        assetType: newPosition.assetType,
        code: newPosition.code,
        name: newPosition.name,
        operation: newPosition.operation,
        price: parseFloat(newPosition.price),
        quantity: parseFloat(newPosition.quantity),
        fee: parseFloat(newPosition.fee) || 0,
        timestamp: selectedDate.toISOString(),
      });

      fetchPositions(selectedUserId);
      setNewPosition({
        assetType: 'stock',
        code: '',
        name: '',
        operation: 'buy',
        price: '',
        quantity: '',
        fee: '',
      });
      setSelectedDate(new Date());
      Toast.show({ content: '添加持仓成功', duration: 1000, icon: 'success' });
    } catch (error) {
      handleError(error);
    }
  };

  const formatDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="position-management">
      <NavBar title="持仓管理" />

      {/* 用户选择 */}
      <div className="user-select-card">
        <h2>👤 选择用户</h2>
        <UserSelect users={users} onSelect={handleUserSelect} />
      </div>

      {/* 添加持仓表单 */}
      {selectedUserId && (
        <div className="add-position-card">
          <h2>✨ 添加持仓记录</h2>
          <Form layout="horizontal" className="add-position-form">
            <Form.Item label="资产类型">
              <Selector
                options={[
                  { label: '股票', value: 'stock' },
                  { label: '期货', value: 'future' },
                  { label: '基金', value: 'fund' },
                ]}
                value={[newPosition.assetType]}
                onChange={arr => setNewPosition({ ...newPosition, assetType: arr[0] })}
              />
            </Form.Item>
            <Form.Item label="代码">
              <Input
                placeholder="请输入代码"
                value={newPosition.code}
                onChange={val => setNewPosition({ ...newPosition, code: val })}
                clearable
              />
            </Form.Item>
            <Form.Item label="名称">
              <Input
                placeholder="请输入名称"
                value={newPosition.name}
                onChange={val => setNewPosition({ ...newPosition, name: val })}
                clearable
              />
            </Form.Item>
            <Form.Item label="操作类型">
              <Selector
                options={[
                  { label: '买入', value: 'buy' },
                  { label: '卖出', value: 'sell' },
                ]}
                value={[newPosition.operation]}
                onChange={arr => setNewPosition({ ...newPosition, operation: arr[0] })}
              />
            </Form.Item>
            <Form.Item label="价格">
              <Input
                placeholder="请输入价格"
                type="number"
                value={newPosition.price}
                onChange={val => setNewPosition({ ...newPosition, price: val })}
                clearable
              />
            </Form.Item>
            <Form.Item label="数量">
              <Input
                placeholder="请输入数量"
                type="number"
                value={newPosition.quantity}
                onChange={val => setNewPosition({ ...newPosition, quantity: val })}
                clearable
              />
            </Form.Item>
            <Form.Item label="交易费用">
              <Input
                placeholder="请输入交易费用"
                type="number"
                value={newPosition.fee}
                onChange={val => setNewPosition({ ...newPosition, fee: val })}
                clearable
              />
            </Form.Item>
            <Form.Item label="交易时间">
              <div className="date-picker-trigger" onClick={() => setDatePickerVisible(true)}>
                {formatDate(selectedDate)}
              </div>
            </Form.Item>
          </Form>
          <Button
            block
            color="primary"
            size="large"
            onClick={handleAddPosition}
            className="add-position-button"
          >
            添加持仓
          </Button>
        </div>
      )}

      {/* 持仓记录列表 */}
      {selectedUserId && (
        <div className="position-list-section">
          <h2>持仓记录</h2>
          {positions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-text">暂无持仓记录</p>
            </div>
          ) : (
            <div className="position-list">
              {positions.map(position => (
                <div key={position.id} className="position-card">
                  <div className="position-header">
                    <span className="position-name-code">
                      {position.name}({position.code})
                    </span>
                    <span
                      className={`position-type-badge ${position.assetType || position.asset_type}`}
                    >
                      {(position.assetType || position.asset_type) === 'stock'
                        ? '股票'
                        : (position.assetType || position.asset_type) === 'future'
                          ? '期货'
                          : '基金'}
                    </span>
                  </div>
                  <div className="position-details">
                    <div className="position-operation">
                      <span className={`operation-badge ${position.operation}`}>
                        {position.operation === 'buy' ? '买入' : '卖出'}
                      </span>
                    </div>
                    <div className="position-amount">
                      <span className="amount-text">
                        ￥{position.price.toFixed(2)} × {position.quantity} = ￥
                        {(position.price * position.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="position-fee">
                    <span className="fee-label">交易费用:</span>
                    <span className="fee-value">￥{position.fee.toFixed(2)}</span>
                  </div>
                  <div className="position-time">
                    {new Date(position.timestamp).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 日期选择器 */}
      <DatePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        precision="minute"
        value={selectedDate}
        onConfirm={val => {
          setSelectedDate(val);
          setDatePickerVisible(false);
        }}
      />
    </div>
  );
};

export default React.memo(PositionManagement);
