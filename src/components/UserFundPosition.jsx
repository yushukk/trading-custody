import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Toast, Button } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';

const UserFundPosition = () => {
  const navigate = useNavigate();
  const [fundInfo, setFundInfo] = useState({ balance: 0, logs: [] });
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consolidatedPositions, setConsolidatedPositions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    fetchFundInfo(userId);
    fetchPositions(userId);
    fetchTradeHistory(userId);
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
      console.error(error.message);
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
      console.error(error.message);
    }
  };

  const fetchTradeHistory = async (userId) => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/positions/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch trade history');
      const data = await response.json();
      setTradeHistory(data);
    } catch (error) {
      console.error('获取历史交易记录失败:', error);
    }
  };

  useEffect(() => {
    if (positions.length === 0) return;

    const adaptedPositions = positions.map(pos => ({
      ...pos,
      asset_type: pos.assetType,
      price: pos.latestPrice ?? 0,
      costBasis: (pos.latestPrice ?? 0) - ((pos.totalPnL ?? 0) / (pos.quantity ?? 1)),
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

  const getOperationText = (operation) => {
    switch(operation) {
      case 'buy': return '买入';
      case 'sell': return '卖出';
      default: return operation;
    }
  };

  const getAssetTypeText = (assetType) => {
    switch(assetType) {
      case 'stock': return '股票';
      case 'future': return '期货';
      case 'fund': return '基金';
      default: return assetType;
    }
  };

  useEffect(() => {
    if (loading) {
      Toast.show({
        icon: 'loading',
        content: '加载中...',
        duration: 0
      });
    } else {
      Toast.clear();
    }
    return () => Toast.clear();
  }, [loading]);

  // 格式化时间显示
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // 如果是今天，只显示时间
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 如果是今年，显示月日和时间
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // 其他情况显示完整日期
    return date.toLocaleString('zh-CN', { 
      year: '2-digit',
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{ 
      width: '100%',
      backgroundColor: '#f0f2f5',
      minHeight: '100vh',
      padding: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '16px',
        color: '#1890ff',
        fontSize: '20px',
        fontWeight: '600',
        paddingTop: '8px'
      }}>
        我的资金与持仓
      </div>
      
      {loading ? (
        null
      ) : (
        <>
          {/* 资金概览卡片 */}
          <Card 
            style={{ 
              marginBottom: '16px', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              border: 'none',
              // 添加左右内边距，使其与其他卡片一致
              paddingLeft: '16px',
              paddingRight: '16px'
            }}
          >
            <div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 500,
                textAlign: 'left',
                marginBottom: '12px',
                color: '#333'
              }}>
                资产总览
              </div>
              
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 600,
                textAlign: 'left',
                marginBottom: '16px',
                color: '#1890ff'
              }}>
                ¥{(fundInfo.balance + totalPnL).toFixed(2)}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>投入金额</div> 
                  <div style={{ fontSize: '16px', color: '#333', fontWeight: 500 }}>¥{fundInfo.balance.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>总盈亏</div> 
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 500,
                    color: totalPnL >= 0 ? '#f5222d' : '#52c41a'
                  }}>
                    ¥{totalPnL.toFixed(2)}
                    <span style={{ 
                      fontSize: '12px', 
                      marginLeft: '4px',
                      color: totalPnL >= 0 ? '#f5222d' : '#52c41a'
                    }}>
                      ({totalPnL >= 0 ? '+' : ''}{((totalPnL / fundInfo.balance) * 100 || 0).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 持仓概览卡片 */}
          <Card 
            title={
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>持仓明细</span> 
            }
            style={{ 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              marginBottom: '16px',
              border: 'none',
              // 已经有左右内边距，无需额外设置
            }}
          >
            {consolidatedPositions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}> 
                暂无持仓
              </div>
            ) : (
              <div>
                {consolidatedPositions.map(position => (
                  <div 
                    key={`${position.asset_type}-${position.code}`}
                    style={{ 
                      padding: '12px 0',
                      borderBottom: consolidatedPositions.indexOf(position) !== consolidatedPositions.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 500, 
                          fontSize: '15px', 
                          color: '#333',
                          marginBottom: '4px'
                        }}>
                          {position.name}
                          <Badge 
                            content={getAssetTypeText(position.asset_type)}
                            style={{ 
                              backgroundColor: position.asset_type === 'stock' ? '#ffd700' : position.asset_type === 'future' ? '#ffa500' : '#e6fffb',
                              color: position.asset_type === 'stock' ? '#000000' : position.asset_type === 'future' ? '#000000' : '#13c2c2',
                              fontSize: '10px', 
                              padding: '0 4px', 
                              borderRadius: '4px',
                              fontWeight: 500,
                              marginLeft: '8px'
                            }}
                          />
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999'
                        }}>
                          {position.code}
                        </div>
                      </div>

                      <div style={{ 
                        textAlign: 'right',
                        flex: 1
                      }}>
                        <div style={{ 
                          fontSize: '15px', 
                          fontWeight: 500,
                          color: '#333'
                        }}>
                          {position.quantity}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999'
                        }}>
                          数量
                        </div>
                      </div>

                      <div style={{ 
                        textAlign: 'right',
                        flex: 1
                      }}>
                        <div style={{ 
                          fontSize: '15px', 
                          fontWeight: 500,
                          color: position.unrealizedPnL >= 0 ? '#f5222d' : '#52c41a'
                        }}>
                          ¥{position.totalPnL.toFixed(2)}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999'
                        }}>
                          盈亏
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      marginTop: '8px'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        textAlign: 'right'
                      }}>
                        现价: ¥{position.price.toFixed(2)} | 成本: ¥{position.costBasis.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 交易记录卡片 */}
          <Card 
            title={
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>交易记录</span> 
            }
            style={{ 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              marginBottom: '16px',
              border: 'none',
              // 已经有左右内边距，无需额外设置
            }}
          >
            {tradeHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}> 
                暂无交易记录
              </div>
            ) : (
              <div>
                {tradeHistory.map(record => (
                  <div 
                    key={record.id}
                    style={{ 
                      padding: '12px 0',
                      borderBottom: tradeHistory.indexOf(record) !== tradeHistory.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 500, 
                          fontSize: '15px', 
                          color: '#333',
                          marginBottom: '4px'
                        }}>
                          {record.name}
                          <Badge 
                            content={getAssetTypeText(record.asset_type)}
                            style={{ 
                              backgroundColor: record.asset_type === 'stock' ? '#ffd700' : record.asset_type === 'future' ? '#ffa500' : '#e6fffb',
                              color: record.asset_type === 'stock' ? '#000000' : record.asset_type === 'future' ? '#000000' : '#13c2c2',
                              fontSize: '10px', 
                              padding: '0 4px', 
                              borderRadius: '4px',
                              fontWeight: 500,
                              marginLeft: '8px'
                            }}
                          />
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999'
                        }}>
                          {record.code}
                        </div>
                      </div>
                      
                      <div style={{ 
                        textAlign: 'center',
                        flex: 1
                      }}>
                        <div style={{ 
                          fontSize: '15px', 
                          fontWeight: 500,
                          color: record.operation === 'buy' ? '#f5222d' : '#52c41a'
                        }}>
                          {getOperationText(record.operation)}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999'
                        }}>
                          
                        </div>
                      </div>
                      
                      <div style={{ 
                        textAlign: 'right',
                        flex: 1
                      }}>
                        <div style={{ 
                          fontSize: '15px', 
                          fontWeight: 500,
                          color: '#333'
                        }}>
                          ¥{record.price.toFixed(2)}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#999'
                        }}>
                          价格
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginTop: '8px'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999'
                      }}>
                        数量: {record.quantity}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999'
                      }}>
                        交易费用: ¥{record.fee.toFixed(2)}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999'
                      }}>
                        {formatTime(record.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', margin: '16px 0' }}>
        <Button 
          style={{ 
            backgroundColor: '#ffffff',
            color: '#333',
            border: '1px solid #d9d9d9',
            padding: '10px 0',
            fontSize: '15px',
            flex: 1,
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
          }}
          onClick={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            localStorage.removeItem('userId');
            navigate('/login');
          }}
        >
          退出登录
        </Button>
        <Button 
          style={{ 
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            padding: '10px 0',
            fontSize: '15px',
            flex: 1,
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
          }}
          onClick={() => navigate('/change-password')}
        >
          修改密码
        </Button>
      </div>
    </div>
  );
};

export default UserFundPosition;