/**
 * 应用常量定义
 */

// API相关常量
export const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001';

// 资产类型常量
export const ASSET_TYPES = {
  STOCK: 'stock',
  FUTURE: 'future',
  FUND: 'fund'
};

// 操作类型常量
export const OPERATION_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
  INITIAL: 'initial',
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw'
};

// 资金操作类型文本
export const FUND_OPERATION_LABELS = {
  [OPERATION_TYPES.INITIAL]: '设置初始资金',
  [OPERATION_TYPES.DEPOSIT]: '追加资金',
  [OPERATION_TYPES.WITHDRAW]: '取出资金'
};

// 持仓操作类型文本
export const POSITION_OPERATION_LABELS = {
  [OPERATION_TYPES.BUY]: '买入',
  [OPERATION_TYPES.SELL]: '卖出'
};

// 资产类型文本
export const ASSET_TYPE_LABELS = {
  [ASSET_TYPES.STOCK]: '股票',
  [ASSET_TYPES.FUTURE]: '期货',
  [ASSET_TYPES.FUND]: '基金'
};

// 颜色常量
export const COLORS = {
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a',
  DANGER: '#f5222d',
  WARNING: '#faad14',
  INFO: '#1890ff',
  DEFAULT: '#d9d9d9'
};