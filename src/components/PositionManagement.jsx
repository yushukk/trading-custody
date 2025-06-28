import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Selector, Form, DatePicker,Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import UserSelect from './UserSelect';
import moment from 'moment';

const { Option } = Selector;

// 与FundManagement类似，提取公共组件
const PositionManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [positions, setPositions] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

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
          assetType: values.assetType[0],
          code: values.code,
          name: values.name,
          operation: values.operation[0],
          price: values.price,
          quantity: values.quantity,
          fee: values.fee,
          timestamp: values.timestamp ? values.timestamp.toISOString() : undefined
        })
      });

      if (!response.ok) throw new Error('持仓操作失败');

      Toast.show({ content: '操作成功', duration: 2000 });
      form.resetFields();
      fetchPositions(selectedUserId);
    } catch (error) {
        Toast.show({ content: error.message, duration: 2000 });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '10px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>持仓管理</h1>
      <Button block onClick={() => navigate('/')}>返回仪表盘</Button>

      <Card style={{ width: '100%', margin: '0 0 20px', padding: '10px' }}>
        <UserSelect users={users} onSelect={handleUserSelect} />
        {selectedUserId && (
          <>
            <Form form={form}
              initialValues={{
                assetType: 'stock',
                code: 'PVC主连',
                name: 'PVC主连',
                operation: ['buy'],
                price: 100,
                quantity: 1,
                fee: 0 // 新增默认费用
              }}
              onFinish={onFinish} layout="vertical">
              <Form.Item label="资产类型" name="assetType" >
                <Selector options={[
                { value: 'stock', label: '股票' },
                { value: 'future', label: '期货' },
                { value: 'fund', label: '基金' }
              ]} placeholder="选择资产类型"
              />
              </Form.Item>

              <Form.Item label="代码" name="code" >
                <Input placeholder="请输入代码" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="名称" name="name" >
                <Input placeholder="请输入名称" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="操作类型" name="operation" >
                <Selector options={[
                { value: 'buy', label: '买入' },
                { value: 'sell', label: '卖出' }
              ]} placeholder="选择操作类型"
              />
              </Form.Item>

              <Form.Item label="价格" name="price" >
                <Input type="number" placeholder="请输入价格" style={{ width: '100%' }} />
                </Form.Item>

              <Form.Item label="数量" name="quantity" >
                <Input type="number" placeholder="请输入数量" style={{ width: '100%' }} />
                </Form.Item>

              <Form.Item label="交易费用" name="fee" >
                <Input type="number" placeholder="请输入交易费用" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
              label="交易时间"
              name="tradeTime"
            >
              <div onClick={() => setVisible(true)}>
                  {form.getFieldValue('tradeTime') || '选择时间'}
                </div>
              <DatePicker
                visible={visible}
                onClose={() => setVisible(false)}
                onConfirm={(value) => {
                  const formattedTime = value ? moment(value).format('YYYY-MM-DD HH:mm') : '';
                  form.setFieldsValue({ tradeTime: formattedTime });
                }}
              >
                
              </DatePicker>
            </Form.Item>

              <Form.Item>
                <Button type="submit" block color="primary">
                  提交
                </Button>
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
              <div key={position.id} style={{ marginBottom: '10px', borderBottom: '1px solid #e8e8e8', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{new Date(position.timestamp).toLocaleString()}</span>
                  <span>{position.asset_type === 'stock' ? '股票' : position.asset_type === 'future' ? '期货' : '基金'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{position.code}</span>
                  <span>{position.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{position.operation === 'buy' ? '买入' : '卖出'}</span>
                  <span>￥{position.price.toFixed(2)} x {position.quantity} = ￥{(position.price * position.quantity).toFixed(2)}</span>
                  <span>交易费用: ￥{position.fee.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
};

export default PositionManagement;