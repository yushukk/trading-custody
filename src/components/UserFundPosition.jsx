import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Toast, Button } from 'antd-mobile'; // 导入Button组件
import { useNavigate } from 'react-router-dom';

const UserFundPosition = () => {
  const navigate = useNavigate(); // 初始化navigate函数
  const [fundInfo, setFundInfo] = useState({ balance: 0, logs: [] });
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consolidatedPositions, setConsolidatedPositions] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    fetchFundInfo(userId);
    fetchPositions(userId);
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
      const response = await fetch(`${window.API_BASE_URL}/api/positions/profit/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data);
    } catch (error) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (positions.length === 0) return;

    // 使用接口返回的现成持仓数据，仅做格式适配
    const adaptedPositions = positions.map(pos => ({
      ...pos,
      asset_type: pos.assetType, // 固定资产类型为股票
      price: pos.latestPrice ?? 0, // 显式赋值 price 字段
      costBasis: (pos.latestPrice ?? 0) - ((pos.totalPnL ?? 0) / (pos.quantity ?? 1)), // 避免除以0
      quantity: pos.quantity ?? 0,
      unrealizedPnL: pos.unrealizedPnL ?? 0
    }));

    setConsolidatedPositions(adaptedPositions);
  }, [positions]);

  const totalPnL = useMemo(() => {
    return consolidatedPositions.reduce((sum, pos) => sum + pos.totalPnL, 0);
  }, [consolidatedPositions]);

  const getOperationColor = (type) => {
    switch(type) {
      case 'initial': return 'blue';
      case 'deposit': return 'green';
      case 'withdraw': return 'red';
      default: return 'default';
    }
  };

  // 新增加载状态提示
  useEffect(() => {
    if (loading) {
      Toast.show({
        icon: 'loading',
        content: '加载中...',
        duration: 0 // 持续显示直到手动隐藏
      });
    } else {
      Toast.clear(); // 替换 Toast.hide() 为 Toast.clear()
    }
    return () => Toast.clear(); // 组件卸载时清理
  }, [loading]);

  return (
    <div style={{ 
      width: '100%',
      backgroundColor: '#f5f2f5', 
      minHeight: '100vh',
      padding: '0 8px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '4px', 
        color: '#1a73e8',
        fontSize: '18px', 
        fontWeight: '700',
        paddingTop: '8px' 
      }}>
        我的资金与持仓
      </h2>
      
      {loading ? (
        null
      ) : (
        <>
          {/* 资金概览卡片 */}
          <Card 
            style={{ 
              marginBottom: '6px', 
              borderRadius: '10px', 
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)', 
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              position: 'relative' // 新增定位基准
            }}
          >
            {/* 新增：右上角按钮 */}
            <Button 
              style={{ 
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #ccc',
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px'
              }}
              onClick={() => navigate('/change-password')}
            >
              修改密码
            </Button>
            
            <div style={{ padding: '8px' }}> 
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 700,
                textAlign: 'left',
                marginBottom: '4px' 
              }}>
                当前总资产
                <br />
                <span style={{fontWeight: 'bold', color: '#1a73e8'}}>{(fundInfo.balance + totalPnL).toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>投入金额</div> 
                  <div style={{ fontSize: '14px', color: '#333' }}>￥{fundInfo.balance.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right', flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>总盈亏</div> 
                  <div style={{ fontSize: '14px', color: totalPnL >= 0 ? '#d32f2f' : '#2e7d32' }}>￥{totalPnL.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* 持仓概览卡片 */}
          <Card 
            title={
              <span style={{ fontSize: '15px', fontWeight: 700 }}>持仓明细</span> 
            }
            style={{ 
              borderRadius: '10px', 
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)', 
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              marginBottom: '6px' 
            }}
          >
            {consolidatedPositions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', color: '#888' }}> 
                暂无持仓
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'separate',
                  borderSpacing: '0 4px'
                }}>
                  <thead>
                    <tr style={{ 
                      backgroundColor: '#f8f9fa', 
                      fontWeight: 600,
                      fontSize: '12px', 
                      color: '#555'
                    }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>资产</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>数量</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>价格/成本</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>盈亏</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidatedPositions.map(position => (
                      <tr 
                        key={`${position.asset_type}-${position.code}`}
                        style={{ 
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}
                      >
                        <td style={{ 
                          padding: '8px', 
                          borderTopLeftRadius: '6px', 
                          borderBottomLeftRadius: '6px'
                        }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}> 
                              {position.name}
                            </span>
                            <br />
                            <span style={{ color: '#888', fontSize: '11px', marginBottom: '2px' }}> 
                              {position.code}
                            </span>
                            <br />
                            <Badge 
                              content={position.asset_type === 'stock' ? '股票' : position.asset_type === 'future' ? '期货' : '基金'}
                              style={{ 
                                backgroundColor: position.asset_type === 'stock' ? '#ffe082' : position.asset_type === 'future' ? '#ce93d8' : '#81d4fa',
                                color: '#333',
                                fontSize: '10px', 
                                padding: '2px 4px', 
                                borderRadius: '3px',
                                fontWeight: 500
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ 
                          textAlign: 'center', 
                          padding: '8px', 
                          fontSize: '12px', 
                          color: '#333',
                          verticalAlign: 'top'
                        }}> 
                          {position.quantity}
                        </td>
                        <td style={{ 
                          textAlign: 'center', 
                          padding: '8px', 
                          fontSize: '12px', 
                          color: '#333',
                          verticalAlign: 'top'
                        }}> 
                          <div>{position.price.toFixed(2)}</div>
                          <div style={{ color: '#888', fontSize: '10px' }}>{position.costBasis.toFixed(2)}</div>
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '8px', 
                          fontSize: '12px',
                          borderTopRightRadius: '6px', 
                          borderBottomRightRadius: '6px',
                          verticalAlign: 'top'
                        }}> 
                          <span style={{ 
                            color: position.unrealizedPnL >= 0 ? '#d32f2f' : '#2e7d32',
                            fontWeight: 600
                          }}>
                            {position.totalPnL.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default UserFundPosition;