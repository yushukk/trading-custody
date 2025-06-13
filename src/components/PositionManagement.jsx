import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Row, Col, message, Form, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const PositionManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [positions, setPositions] = useState([]);
  const [form] = Form.useForm();
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

  const fetchPositions = async (userId) => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/positions/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    fetchPositions(userId);
  };

  const onFinish = async (values) => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/positions/${selectedUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: values.assetType,
          code: values.code,
          name: values.name,
          operation: values.operation,
          price: values.price,
          quantity: values.quantity,
          timestamp: values.timestamp ? values.timestamp.toISOString() : undefined
        })
      });

      if (!response.ok) throw new Error('持仓操作失败');
      
      message.success('操作成功');
      form.resetFields();
      fetchPositions(selectedUserId);
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '10px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>持仓管理</h1>
      <Button type="default" block onClick={() => navigate('/')} style={{ marginBottom: '10px' }}>返回仪表盘</Button>
      
      <Card style={{ width: '100%', margin: '0 0 20px', padding: '10px' }}>
        <Select 
          placeholder="选择用户"
          onChange={handleUserSelect}
          style={{ width: '100%', marginBottom: '15px' }}
        >
          {users.map(user => (
            <Option key={user.id} value={user.id}>
              {`${user.name} (${user.email})`}
            </Option>
          ))}
        </Select>

        {selectedUserId && (
          <>
            <Form form={form} onFinish={onFinish} layout="vertical">
              <Form.Item label="资产类型" name="assetType" rules={[{ required: true }]}>
                <Select placeholder="选择资产类型">
                  <Option value="stock">股票</Option>
                  <Option value="future">期货</Option>
                  <Option value="fund">基金</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="代码" name="code" rules={[{ required: true }]}>
                <Input placeholder="请输入代码" />
              </Form.Item>
              
              <Form.Item label="名称" name="name" rules={[{ required: true }]}>
                <Input placeholder="请输入名称" />
              </Form.Item>
              
              <Form.Item label="操作类型" name="operation" rules={[{ required: true }]}>
                <Select placeholder="选择操作类型">
                  <Option value="buy">买入</Option>
                  <Option value="sell">卖出</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="价格" name="price" rules={[
                { required: true, message: '请输入价格' }
              ]}>
                <Input type="number" placeholder="请输入价格" />
              </Form.Item>
              
              <Form.Item label="数量" name="quantity" rules={[
                { required: true, message: '请输入数量' }
              ]}>
                <Input type="number" placeholder="请输入数量" />
              </Form.Item>
              
              <Form.Item label="时间" name="timestamp">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" block htmlType="submit">提交</Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>

      {selectedUserId && (
        <Card title="持仓记录" style={{ width: '100%', margin: '10px 0' }}>
          {positions.length === 0 ? (
            <p>暂无持仓记录</p>
          ) : (
            positions.map(position => (
              <Row key={position.id} style={{ marginBottom: '10px', borderBottom: '1px solid #e8e8e8', paddingBottom: '10px' }}>
                <Col span={6}>{new Date(position.timestamp).toLocaleString()}</Col>
                <Col span={4}>{position.asset_type === 'stock' ? '股票' : position.asset_type === 'future' ? '期货' : '基金'}</Col>
                <Col span={4}>{position.code}</Col>
                <Col span={4}>{position.name}</Col>
                <Col span={4}>{position.operation === 'buy' ? '买入' : '卖出'}</Col>
                <Col span={6}>
                  ￥{position.price.toFixed(2)} x {position.quantity} = ￥{(position.price * position.quantity).toFixed(2)}
                </Col>
              </Row>
            ))
          )}
        </Card>
      )}
    </div>
  );
};

export default PositionManagement;