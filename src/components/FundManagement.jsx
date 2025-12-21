import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Selector, Toast, Form } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { handleError } from '../utils/errorHandler';
import NavBar from './NavBar';
import UserSelect from './UserSelect';
import './FundManagement.css';

const FundManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [operationType, setOperationType] = useState('initial');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [logs, setLogs] = useState([]);
  const [totalPnL, setTotalPnL] = useState(0);

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
      const data = await apiClient.get(`/api/positions/profit/${userId}`);
      const positionsData = Array.isArray(data) ? data : data.results || data.positions || [];

      // 计算总盈亏
      const pnl = positionsData.reduce((sum, pos) => sum + (pos.totalPnL || 0), 0);
      setTotalPnL(pnl);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const fetchFundInfo = useCallback(
    async userId => {
      try {
        const balanceData = await apiClient.get(`/api/funds/${userId}`);
        const logsData = await apiClient.get(`/api/funds/${userId}/logs`);

        setBalance(balanceData.balance || 0);
        setLogs(logsData.logs || []);

        // 获取持仓数据以计算总盈亏
        fetchPositions(userId);
      } catch (error) {
        handleError(error);
      }
    },
    [fetchPositions]
  );

  const handleUserSelect = useCallback(
    userId => {
      setSelectedUserId(userId);
      fetchFundInfo(userId);
    },
    [fetchFundInfo]
  );

  const handleFundOperation = useCallback(async () => {
    if (!selectedUserId) {
      Toast.show({ content: '请先选择用户', duration: 1500, icon: 'fail' });
      return;
    }
    if (!amount || amount <= 0) {
      Toast.show({ content: '请输入有效金额', duration: 1500, icon: 'fail' });
      return;
    }

    try {
      await apiClient.post(`/api/funds/${selectedUserId}`, {
        type: operationType,
        amount: parseFloat(amount),
        remark: remark,
      });

      Toast.show({ content: '操作成功', duration: 1000, icon: 'success' });
      fetchFundInfo(selectedUserId);
      setAmount('');
      setRemark('');
    } catch (error) {
      handleError(error);
    }
  }, [selectedUserId, amount, operationType, remark, fetchFundInfo]);

  const getOperationTypeLabel = type => {
    switch (type) {
      case 'initial':
        return '初始资金';
      case 'deposit':
        return '追加资金';
      case 'withdraw':
        return '取出资金';
      default:
        return type;
    }
  };

  return (
    <div className="fund-management">
      <NavBar title="资金管理" />

      {/* 用户选择 */}
      <div className="user-select-card">
        <h2>👤 选择用户</h2>
        <UserSelect users={users} onSelect={handleUserSelect} />
      </div>

      {/* 资产总览显示 */}
      {selectedUserId && (
        <div className="balance-card">
          <div className="balance-label">资产总额</div>
          <div className="balance-amount">￥{(balance + totalPnL).toFixed(2)}</div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>投入金额</div>
              <div style={{ fontSize: '16px', color: '#333', fontWeight: 500 }}>
                ￥{balance.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right', flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>总盈亏</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: totalPnL >= 0 ? '#f5222d' : '#52c41a',
                }}
              >
                {totalPnL >= 0 ? '+' : ''}￥{totalPnL.toFixed(2)}
              </div>
            </div>
          </div>

          <Button
            color="primary"
            fill="outline"
            size="small"
            style={{ marginTop: '16px', width: '100%' }}
            onClick={() => navigate(`/user-fund-position?userId=${selectedUserId}`)}
          >
            👁️ 查看用户资金和持仓
          </Button>
        </div>
      )}

      {/* 资金操作表单 */}
      {selectedUserId && (
        <div className="fund-operation-card">
          <h2>💰 资金操作</h2>
          <Form layout="horizontal" className="fund-operation-form">
            <Form.Item label="操作类型">
              <Selector
                options={[
                  { label: '设置初始资金', value: 'initial' },
                  { label: '追加资金', value: 'deposit' },
                  { label: '取出资金', value: 'withdraw' },
                ]}
                value={[operationType]}
                onChange={arr => setOperationType(arr[0])}
              />
            </Form.Item>
            <Form.Item label="金额">
              <Input
                type="number"
                placeholder="请输入金额"
                value={amount}
                onChange={val => setAmount(val)}
                clearable
              />
            </Form.Item>
            <Form.Item label="备注">
              <Input
                type="text"
                placeholder="请输入备注（可选）"
                value={remark}
                onChange={val => setRemark(val)}
                clearable
              />
            </Form.Item>
          </Form>
          <Button
            block
            color="primary"
            size="large"
            onClick={handleFundOperation}
            className="fund-operation-button"
          >
            确认
            {operationType === 'initial' ? '设置' : operationType === 'deposit' ? '追加' : '取出'}
          </Button>
        </div>
      )}

      {/* 资金流水列表 */}
      {selectedUserId && (
        <div className="fund-logs-section">
          <h2>📊 资金流水</h2>
          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-text">暂无资金流水</p>
            </div>
          ) : (
            <div className="fund-logs-list">
              {logs.map(log => (
                <div key={log.id} className="fund-log-item">
                  <div className="fund-log-header">
                    <span className="fund-log-type">{getOperationTypeLabel(log.type)}</span>
                    <span className={`fund-log-type-badge ${log.type}`}>
                      {log.type === 'initial' ? '初始' : log.type === 'deposit' ? '追加' : '取出'}
                    </span>
                  </div>
                  <div className="fund-log-amount-time">
                    <div className={`fund-log-amount ${log.type}`}>
                      {log.type === 'withdraw' ? '-' : '+'}￥{log.amount.toFixed(2)}
                    </div>
                    <div className="fund-log-time">
                      {new Date(log.timestamp).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {log.remark && <div className="fund-log-remark">💬 {log.remark}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(FundManagement);
