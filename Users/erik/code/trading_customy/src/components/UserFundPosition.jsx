
return (
    <div style={{ 
      backgroundColor: '#f5f2f5', 
      minHeight: '100vh',
      padding: '0 8px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '24px', // 增加标题与内容的间距
        color: '#1a73e8',
        fontSize: '24px', // 增大标题字体大小
        fontWeight: '700',
        paddingTop: '12px'
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
              marginBottom: '24px', // 增加卡片间距
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              backgroundColor: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px' }}>
              <div style={{ 
                fontSize: '24px', // 增大总资产字体大小
                fontWeight: 700,
                textAlign: 'left',
                marginBottom: '12px'
              }}>
                当前总资产
                <br />
                <span style={{fontWeight: 'bold', color: '#1a73e8'}}>{(fundInfo.balance + totalPnL).toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>投入金额</div>
                  <div style={{ fontSize: '18px', color: '#333' }}>￥{fundInfo.balance.toFixed(2)}</div> // 增大投入金额字体大小
                </div>
                <div style={{ textAlign: 'right', flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>总盈亏</div>
                  <div style={{ fontSize: '18px', color: totalPnL >= 0 ? '#2e7d32' : '#d32f2f' }}>￥{totalPnL.toFixed(2)}</div> // 增大总盈亏字体大小
                </div>
              </div>
            </div>
          </Card>

          {/* 持仓概览卡片 */}
          <Card 
            title={
              <span style={{ fontSize: '18px', fontWeight: 700 }}>持仓明细</span> // 增大持仓明细标题字体大小
            }
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              marginBottom: '8px'
            }}
          >
            {consolidatedPositions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                暂无持仓
              </div>
            ) : (
              <>
                <div style={{ 
                  display: 'flex',
                  borderBottom: '1px solid #eee', 
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  fontWeight: 600,
                  fontSize: '14px', // 增大表头字体大小
                  color: '#555'
                }}>
                  <div style={{ flex: 3 }}>资产</div>
                  <div style={{ flex: 1 }}>数量</div>
                  <div style={{ flex: 2 }}>价格</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>盈亏</div>
                </div>

                {consolidatedPositions.map(position => (
                  <div 
                    key={`${position.asset_type}-${position.code}`}
                    style={{ 
                      padding: '12px 16px',
                      borderBottom: '1px solid #eee',
                      backgroundColor: '#fff',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'start' }}>
                      <div style={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '16px', color: '#333' }}> // 增大资产名称字体大小
                          {position.name}
                        </span>
                        <span style={{ color: '#888', fontSize: '12px', marginBottom: '6px' }}>{position.code}</span>
                        <Badge 
                          content={position.asset_type === 'stock' ? '股票' : position.asset_type === 'future' ? '期货' : '基金'}
                          style={{ 
                            backgroundColor: position.asset_type === 'stock' ? '#ffe082' : position.asset_type === 'future' ? '#ce93d8' : '#81d4fa',
                            color: '#333',
                            fontSize: '11px',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            alignSelf: 'start',
                            fontWeight: 500
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, fontSize: '14px', textAlign: 'center', color: '#333' }}> // 增大数量字体大小
                        {position.quantity}
                      </div>
                      <div style={{ flex: 2, fontSize: '14px', textAlign: 'center', color: '#333' }}> // 增大价格字体大小
                        <div>{position.price.toFixed(2)}</div>
                        <div style={{ color: '#888', fontSize: '11px' }}>{position.costBasis.toFixed(2)}</div>
                      </div>
                      <div style={{ flex: 1, fontSize: '14px', textAlign: 'right' }}> // 增大盈亏字体大小
                        <span style={{ 
                          color: position.unrealizedPnL >= 0 ? '#2e7d32' : '#d32f2f',
                          fontWeight: 600
                        }}>
                          {position.unrealizedPnL.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </Card>
        </>
      )}
    </div>
);