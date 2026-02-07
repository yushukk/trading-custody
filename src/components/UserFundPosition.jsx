/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Toast, Button } from 'antd-mobile';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import { syncPriceData } from '../api/positionApi';
import { LIMITS } from '../constants';
import NavBar from './NavBar';

const UserFundPosition = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const [fundInfo, setFundInfo] = useState({ balance: 0, logs: [] });
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consolidatedPositions, setConsolidatedPositions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [viewUserName, setViewUserName] = useState('');

  // 获取要查看的用户ID：优先使用URL参数中的userId（管理员查看模式），否则使用当前登录用户的ID
  const viewUserId = searchParams.get('userId') || (user ? user.id : null);
  // 判断是否为管理员查看模式（有userId参数）
  const isAdminView = !!searchParams.get('userId');

  useEffect(() => {
    const abortController = new AbortController();

    if (viewUserId) {
      fetchFundInfo(viewUserId, abortController.signal);
      fetchPositions(viewUserId, abortController.signal);
      fetchTradeHistory(viewUserId, abortController.signal);

      // 如果是管理员查看模式，获取被查看用户的用户名
      if (isAdminView) {
        fetchUserName(viewUserId, abortController.signal);
      }
    }

    return () => {
      abortController.abort();
    };
  }, [viewUserId, isAdminView]);

  const fetchFundInfo = async (userId, signal) => {
    try {
      const balanceData = await apiClient.get(`/api/funds/${userId}`, { signal });
      const logsData = await apiClient.get(`/api/funds/${userId}/logs`, { signal });

      const logs = Array.isArray(logsData) ? logsData : logsData.logs || [];
      setFundInfo({
        balance: balanceData.balance || 0,
        logs: logs.slice(0, LIMITS.FUND_LOGS),
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async (userId, signal) => {
    try {
      const data = await apiClient.get(`/api/positions/profit/${userId}`, { signal });
      setPositions(Array.isArray(data) ? data : data.results || data.positions || []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error.message);
      }
    }
  };

  const fetchTradeHistory = async (userId, signal) => {
    try {
      const data = await apiClient.get(`/api/positions/${userId}`, { signal });
      setTradeHistory(Array.isArray(data) ? data : data.positions || []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('获取历史交易记录失败:', error);
      }
    }
  };

  const fetchUserName = async (userId, signal) => {
    try {
      const data = await apiClient.get('/api/users', { signal });
      const users = data.users || [];
      const targetUser = users.find(u => u.id === parseInt(userId));
      if (targetUser) {
        setViewUserName(targetUser.name);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('获取用户名失败:', error);
      }
    }
  };

  useEffect(() => {
    if (positions.length === 0) return;

    const adaptedPositions = positions.map(pos => ({
      ...pos,
      asset_type: pos.assetType,
      price: pos.latestPrice ?? 0,
      // 成本基础计算：现价 - (未实现盈亏 / 持仓数量)
      // 对于多仓和空仓都适用
      costBasis:
        pos.quantity !== 0 ? (pos.latestPrice ?? 0) - (pos.unrealizedPnL ?? 0) / pos.quantity : 0,
      quantity: pos.quantity ?? 0,
      unrealizedPnL: pos.unrealizedPnL ?? 0,
    }));

    setConsolidatedPositions(adaptedPositions);
  }, [positions]);

  const totalPnL = useMemo(() => {
    return consolidatedPositions.reduce((sum, pos) => sum + pos.totalPnL, 0);
  }, [consolidatedPositions]);

  const getOperationText = operation => {
    switch (operation) {
      case 'buy':
        return '买';
      case 'sell':
        return '卖';
      default:
        return operation;
    }
  };

  const getAssetTypeText = assetType => {
    switch (assetType) {
      case 'stock':
        return '股票';
      case 'future':
        return '期货';
      case 'fund':
        return '基金';
      default:
        return assetType;
    }
  };

  useEffect(() => {
    if (loading) {
      Toast.show({
        icon: 'loading',
        content: '加载中...',
        duration: 0,
      });
    } else {
      Toast.clear();
    }
    return () => Toast.clear();
  }, [loading]);

  // 格式化时间显示
  const formatTime = timestamp => {
    const date = new Date(timestamp);

    // 始终显示完整的年月日和时分秒
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 刷新价格数据
  const handleSyncPrice = async () => {
    setSyncing(true);
    Toast.show({
      icon: 'loading',
      content: '正在同步价格...',
      duration: 0,
    });

    try {
      // 获取当前页面显示的非空持仓标的
      const nonEmptyAssets = consolidatedPositions
        .filter(pos => pos.quantity !== 0) // 过滤持仓数量不为0的标的
        .map(pos => ({
          code: pos.code,
          assetType: pos.asset_type || pos.assetType,
        }));

      let result;
      if (nonEmptyAssets.length > 0) {
        // 只同步非空持仓的标的
        result = await syncPriceData(nonEmptyAssets);
      } else {
        // 如果没有非空持仓，提示用户
        Toast.show({
          icon: 'success',
          content: '当前没有持仓标的需要同步价格',
          duration: 2000,
        });
        return;
      }

      // 根据同步结果显示不同的提示
      const details = result?.details || {};
      const successCount = details.success || 0;
      const failedCount = details.failed || 0;
      const skippedCount = details.skipped || 0;
      const total = details.total || 0;

      if (successCount > 0 && failedCount === 0 && skippedCount === 0) {
        // 全部成功
        Toast.show({
          icon: 'success',
          content: `价格同步成功：${successCount} 个`,
          duration: 2000,
        });
      } else if (successCount > 0) {
        // 部分成功
        const parts = [`成功 ${successCount} 个`];
        if (skippedCount > 0) parts.push(`跳过 ${skippedCount} 个`);
        if (failedCount > 0) parts.push(`失败 ${failedCount} 个`);
        Toast.show({
          icon: 'success',
          content: `价格同步完成：${parts.join('，')}`,
          duration: 3000,
        });
      } else if (failedCount > 0) {
        // 全部失败
        Toast.show({
          icon: 'fail',
          content: `价格同步失败：${failedCount} 个资产同步失败`,
          duration: 3000,
        });
      } else {
        // 没有资产需要同步
        Toast.show({
          icon: 'success',
          content: result?.message || '价格同步完成',
          duration: 2000,
        });
      }

      // 只有在有成功的情况下才重新获取数据
      if (successCount > 0 && viewUserId) {
        await Promise.all([
          fetchFundInfo(viewUserId),
          fetchPositions(viewUserId),
          fetchTradeHistory(viewUserId),
        ]);
      }
    } catch (error) {
      console.error('同步价格失败:', error);
      Toast.show({
        icon: 'fail',
        content: error.message || '价格同步失败',
        duration: 2000,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#f0f2f5',
        minHeight: '100vh',
        padding: isAdminView ? '60px 6px 6px' : '6px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* 管理员查看模式时显示导航栏 */}
      {isAdminView && <NavBar title={viewUserName ? `${viewUserName}-资金和持仓` : '资金和持仓'} />}

      {loading ? null : (
        <>
          {/* 资金概览卡片 */}
          <Card
            style={{
              marginBottom: '12px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              border: 'none',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#333',
                  }}
                >
                  资产总览
                </div>
                <Button
                  size="small"
                  disabled={syncing}
                  style={{
                    backgroundColor: syncing ? '#f5f5f5' : '#1890ff',
                    color: syncing ? '#999' : 'white',
                    border: 'none',
                    padding: '4px 12px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    height: 'auto',
                  }}
                  onClick={handleSyncPrice}
                >
                  {syncing ? '同步中...' : '刷新价格'}
                </Button>
              </div>

              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  textAlign: 'left',
                  marginBottom: '14px',
                  color: '#1890ff',
                }}
              >
                ¥{(fundInfo.balance + totalPnL).toFixed(2)}
              </div>

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    投入金额
                  </div>
                  <div style={{ fontSize: '16px', color: '#333', fontWeight: 500 }}>
                    ¥{fundInfo.balance.toFixed(2)}
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
                    ¥{totalPnL.toFixed(2)}
                    <span
                      style={{
                        fontSize: '12px',
                        marginLeft: '4px',
                        color: totalPnL >= 0 ? '#f5222d' : '#52c41a',
                      }}
                    >
                      ({totalPnL >= 0 ? '+' : ''}
                      {((totalPnL / fundInfo.balance) * 100 || 0).toFixed(2)}%)
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
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              marginBottom: '12px',
              border: 'none',
            }}
          >
            {consolidatedPositions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无持仓</div>
            ) : (
              <div>
                {consolidatedPositions.map(position => (
                  <div
                    key={`${position.asset_type}-${position.code}`}
                    style={{
                      padding: '10px 0',
                      borderBottom:
                        consolidatedPositions.indexOf(position) !== consolidatedPositions.length - 1
                          ? '1px solid #f0f0f0'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1.5, textAlign: 'left' }}>
                        {' '}
                        {/* 增加标的名称区域宽度 */}
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: '15px',
                            color: '#333',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                          }}
                        >
                          <span style={{ marginRight: '8px' }}>{position.name}</span>
                          <Badge
                            content={getAssetTypeText(position.asset_type)}
                            style={{
                              backgroundColor:
                                position.asset_type === 'stock'
                                  ? '#ffd700'
                                  : position.asset_type === 'future'
                                    ? '#ffa500'
                                    : '#e6fffb',
                              color:
                                position.asset_type === 'stock'
                                  ? '#000000'
                                  : position.asset_type === 'future'
                                    ? '#000000'
                                    : '#13c2c2',
                              fontSize: '10px',
                              padding: '0 4px',
                              borderRadius: '4px',
                              fontWeight: 500,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999',
                            textAlign: 'left',
                          }}
                        >
                          {position.code}
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: 'center',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 500,
                            // 空仓（负数）用绿色标识，多仓用黑色
                            color: position.quantity < 0 ? '#52c41a' : '#333',
                          }}
                        >
                          {position.quantity}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999',
                          }}
                        >
                          数量
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: 'right',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 500,
                            color: position.unrealizedPnL >= 0 ? '#f5222d' : '#52c41a',
                          }}
                        >
                          ¥{position.totalPnL.toFixed(2)}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999',
                          }}
                        >
                          盈亏
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#999',
                          textAlign: 'right',
                        }}
                      >
                        现价: ¥{position.price.toFixed(2)} |{' '}
                        {position.quantity > 0
                          ? '成本'
                          : position.quantity < 0
                            ? '开仓均价'
                            : '成本'}
                        : {position.quantity !== 0 ? `¥${position.costBasis.toFixed(2)}` : '-'}
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
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              marginBottom: '12px',
              border: 'none',
            }}
          >
            {tradeHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                暂无交易记录
              </div>
            ) : (
              <div>
                {tradeHistory.map(record => (
                  <div
                    key={record.id}
                    style={{
                      padding: '10px 0',
                      borderBottom:
                        tradeHistory.indexOf(record) !== tradeHistory.length - 1
                          ? '1px solid #f0f0f0'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1.5, textAlign: 'left' }}>
                        {' '}
                        {/* 增加标的名称区域宽度以对齐持仓明细 */}
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: '15px',
                            color: '#333',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                          }}
                        >
                          <span style={{ marginRight: '8px' }}>{record.name}</span>
                          <Badge
                            content={getAssetTypeText(record.asset_type)}
                            style={{
                              backgroundColor:
                                record.asset_type === 'stock'
                                  ? '#ffd700'
                                  : record.asset_type === 'future'
                                    ? '#ffa500'
                                    : '#e6fffb',
                              color:
                                record.asset_type === 'stock'
                                  ? '#000000'
                                  : record.asset_type === 'future'
                                    ? '#000000'
                                    : '#13c2c2',
                              fontSize: '10px',
                              padding: '0 4px',
                              borderRadius: '4px',
                              fontWeight: 500,
                              marginRight: '8px',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 500,
                              color: '#ffffff',
                              backgroundColor: record.operation === 'buy' ? '#f5222d' : '#52c41a',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {getOperationText(record.operation)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999',
                            textAlign: 'left',
                          }}
                        >
                          {record.code}
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: 'center',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 500,
                            color: '#333',
                          }}
                        >
                          {record.quantity}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999',
                          }}
                        >
                          数量
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: 'right',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 500,
                            color: '#333',
                          }}
                        >
                          ¥{record.price.toFixed(2)}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999',
                          }}
                        >
                          价格
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#999',
                        }}
                      >
                        {formatTime(record.timestamp)}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#999',
                        }}
                      >
                        交易费用: ¥{record.fee.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', margin: '12px 0' }}
      >
        <Button
          style={{
            backgroundColor: '#ffffff',
            color: '#333',
            border: '1px solid #d9d9d9',
            padding: '8px 0',
            fontSize: '15px',
            flex: 1,
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
          onClick={async () => {
            await logout();
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
            padding: '8px 0',
            fontSize: '15px',
            flex: 1,
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
          }}
          onClick={() => navigate('/change-password')}
        >
          修改密码
        </Button>
      </div>
    </div>
  );
};

export default React.memo(UserFundPosition);
