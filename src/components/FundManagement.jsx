import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Row, Col, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const FundManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [balance, setBalance] = useState(0);
  const [operationType, setOperationType] = useState('initial');
  const [amount, setAmount] = useState('');
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      message.error(error.message);
    }
  };

  const fetchFundInfo = async (userId) => {
    try {
      const balanceRes = await fetch(`${window.API_BASE_URL}/api/funds/${userId}`);
      const logsRes = await fetch(`${window.API_BASE_URL}/api/funds/${userId}/logs`);
      
      if (!balanceRes.ok || !logsRes.ok) throw new Error('Failed to fetch fund info');
      
      const balanceData = await balanceRes.json();
      const logsData = await logsRes.json();
      
      setBalance(balanceData.balance || 0);
      setLogs(logsData);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    fetchFundInfo(userId);
  };

  const handleFundOperation = async () => {
    if (!selectedUserId || !amount || amount <= 0) {
      message.error('请选择用户并输入有效金额');
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/funds/${selectedUserId}/${operationType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      if (!response.ok) throw new Error('资金操作失败');
      
      message.success('操作成功');
      fetchFundInfo(selectedUserId);
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '10px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>资金管理</h1>
      <Button type="default" block onClick={() => navigate('/')} style={{ marginBottom: '10px' }}>返回仪表盘</Button>
      
      <Card style={{ width: '100%', margin: '0 0 20px', padding: '10px' }}>
        <UserSelect users={users} onSelect={handleUserSelect} />

        {selectedUserId && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <p>当前余额：￥{balance.toFixed(2)}</p>
            </div>

            <Select
              value={operationType}
              onChange={setOperationType}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              <Option value="initial">设置初始资金</Option>
              <Option value="deposit">追加资金</Option>
              <Option value="withdraw">取出资金</Option>
            </Select>

            <Input
              type="number"
              placeholder="金额"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
            <p>暂无资金流水</p>
          ) : (
            logs.map(log => (
              <Row key={log.id} style={{ marginBottom: '10px' }}>
                <Col span={8}>{new Date(log.timestamp).toLocaleString()}</Col>
                <Col span={8}>{log.type === 'initial' ? '初始资金' : log.type === 'deposit' ? '追加资金' : '取出资金'}</Col>
                <Col span={8}>￥{log.amount.toFixed(2)}</Col>
              </Row>
            ))
          )}
        </Card>
      )}
    </div>
  );
};

export default FundManagement;

// 将用户选择组件抽象为独立组件
const UserSelect = ({ users, onSelect }) => (
  <Select
    placeholder="选择用户"
    onChange={onSelect}
    style={{ width: '100%', marginBottom: '15px' }}
  >
    {users.map(user => (
      <Option key={user.id} value={user.id}>
        {`${user.name} (${user.email})`}
      </Option>
    ))}
  </Select>
);
