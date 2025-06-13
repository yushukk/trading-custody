import React, { useState, useEffect } from 'react';
import { Card, Row, Col, message, Spin, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';

const UserFundPosition = () => {
  const [fundInfo, setFundInfo] = useState({ balance: 0, logs: [] });
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
  
    if (!token || !username) {  
      navigate('/login');
      return;
    }
  
    try {
      const userId = username;
      fetchFundInfo(userId);
      fetchPositions(userId);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      navigate('/login');
    }
  }, []);

  const fetchFundInfo = async (userId) => {
    try {
      const balanceRes = await fetch(`${window.API_BASE_URL}/api/funds/${userId}`);
      const logsRes = await fetch(`${window.API_BASE_URL}/api/funds/${userId}/logs`);
      
      if (!balanceRes.ok || !logsRes.ok) throw new Error('Failed to fetch fund info');
      
      const balanceData = await balanceRes.json();
      const logsData = await logsRes.json();
      
      setFundInfo({
        balance: balanceData.balance || 0,
        logs: logsData.slice(0, 5)
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async (userId) => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/positions/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data.slice(0, 5));
    } catch (error) {
      message.error(error.message);
    }
  };

  const getOperationColor = (type) => {
    switch(type) {
      case 'initial': return 'blue';
      case 'deposit': return 'green';
      case 'withdraw': return 'red';
      default: return 'default';
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#1890ff' }}>我的资金与持仓</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* 资金概览 */}
          <Card 
            title="资金概览" 
            style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            extra={<Tag color="blue">最近5条记录</Tag>}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginBottom: '20px' }}>
                  当前余额：￥{fundInfo.balance.toFixed(2)}
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ fontSize: '16px' }}>
                  <strong>最近操作：</strong>
                  {fundInfo.logs.length > 0 ? (
                    fundInfo.logs.map(log => (
                      <div key={log.id} style={{ margin: '8px 0' }}>
                        <Tag color={getOperationColor(log.type)}>
                          {log.type === 'initial' ? '初始资金' : log.type === 'deposit' ? '追加' : '取出'}
                        </Tag>
                        <span style={{ marginLeft: '8px' }}>￥{log.amount.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#999', margin: '12px 0' }}>暂无记录</p>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          {/* 持仓概览 */}
          <Card 
            title="最近持仓" 
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            extra={<Tag color="green">最近5条持仓</Tag>}
          >
            {positions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>暂无持仓记录</p>
            ) : (
              positions.map(position => (
                <Row 
                  key={position.id} 
                  style={{ 
                    marginBottom: '15px', 
                    borderBottom: '1px solid #e8e8e8', 
                    paddingBottom: '10px',
                    paddingTop: '10px',
                    borderRadius: '4px',
                    backgroundColor: '#fff'
                  }}
                >
                  <Col xs={24} sm={6} style={{ fontWeight: 'bold' }}>{new Date(position.timestamp).toLocaleString()}</Col>
                  <Col xs={12} sm={4}>
                    <Tag color={position.asset_type === 'stock' ? 'orange' : position.asset_type === 'future' ? 'purple' : 'cyan'}>
                      {position.asset_type === 'stock' ? '股票' : position.asset_type === 'future' ? '期货' : '基金'}
                    </Tag>
                  </Col>
                  <Col xs={12} sm={4}>{position.code}</Col>
                  <Col xs={12} sm={4}>{position.name}</Col>
                  <Col xs={12} sm={4}>
                    <Tag color={position.operation === 'buy' ? 'green' : 'red'}>
                      {position.operation === 'buy' ? '买入' : '卖出'}
                    </Tag>
                  </Col>
                  <Col xs={24} sm={6} style={{ color: '#1890ff' }}>
                    ￥{position.price.toFixed(2)} x {position.quantity} = ￥{(position.price * position.quantity).toFixed(2)}
                  </Col>
                </Row>
              ))
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default UserFundPosition;