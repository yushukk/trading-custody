import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Selector, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { handleError } from '../utils/errorHandler';
import { OPERATION_TYPES } from '../constants/appConstants';
import UserSelect from './UserSelect';

const FundManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [operationType, setOperationType] = useState('initial');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState(''); // 新增remark状态
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/users');
      setUsers(data);
    } catch (error) {
      handleError(error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchFundInfo = useCallback(async (userId) => {
    try {
      const balanceData = await apiClient.get(`/api/funds/${userId}`);
      const logsData = await apiClient.get(`/api/funds/${userId}/logs`);
      
      setBalance(balanceData.balance || 0);
      setLogs(logsData);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const handleUserSelect = useCallback((userId) => {
    setSelectedUserId(userId);
    fetchFundInfo(userId);
  }, [fetchFundInfo]);

  const handleFundOperation = useCallback(async () => {
    if (!selectedUserId || !amount || amount <= 0) {
      Toast.show({ content: '请选择用户并输入有效金额', duration: 2000 });
      return;
    }

    try {
      await apiClient.post(`/api/funds/${selectedUserId}/${operationType}`, {
        amount: parseFloat(amount),
        remark: remark // 添加备注参数
      });
      
      Toast.show({ content: '操作成功', duration: 1000 });
      fetchFundInfo(selectedUserId);
      setRemark(''); // 清空备注输入框
    } catch (error) {
      handleError(error);
    }
  }, [selectedUserId, amount, operationType, remark, fetchFundInfo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '10px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>资金管理</h1>
      <Button block onClick={() => navigate('/')} style={{ marginBottom: '10px' }}>返回仪表盘</Button>
      
      <Card style={{ width: '100%', margin: '0 0 20px', padding: '10px' }}>
        <UserSelect users={users} onSelect={handleUserSelect} />

        {selectedUserId && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <p>当前余额：￥{balance.toFixed(2)}</p>
            </div>

            <Selector
              options={[
                { label: '设置初始资金', value: 'initial' },
                { label: '追加资金', value: 'deposit' },
                { label: '取出资金', value: 'withdraw' }
              ]}
              value={operationType}
              onChange={val => setOperationType(val)}
              style={{ width: '100%', marginBottom: '10px' }}
            />

            <Input
              type="number"
              placeholder="金额"
              value={amount}
              onChange={(val) => setAmount(val)}
              style={{ width: '100%', marginBottom: '15px' }}
            />
            
            {/* 新增备注输入框 */}
            <Input
              type="text"
              placeholder="备注（可选）"
              value={remark}
              onChange={(val) => setRemark(val)}
              style={{ width: '100%', marginBottom: '15px' }}
            />

            <Button type="primary" block onClick={handleFundOperation}>
              确认{operationType === 'initial' ? '设置' : operationType === 'deposit' ? '追加' : '取出'}
            </Button>
          </>
        )}
      </Card>

      {selectedUserId && (
        <Card title="资金流水" style={{ width: '100%', margin: '10px 0' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px', color: '#888' }}>暂无资金流水</div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ marginBottom: '10px', borderBottom: '1px solid #e8e8e8', paddingBottom: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>{new Date(log.timestamp).toLocaleString()}</div>
                <div style={{ fontSize: '14px', color: '#333' }}>{log.type === 'initial' ? '初始资金' : log.type === 'deposit' ? '追加资金' : '取出资金'}</div>
                <div style={{ fontSize: '14px', color: '#1a73e8' }}>￥{log.amount.toFixed(2)}</div>
                {/* 显示备注信息 */}
                {log.remark && <div style={{ fontSize: '14px', color: '#5f6368' }}>备注：{log.remark}</div>}
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
};

export default React.memo(FundManagement);