/**
 * 格式化工具函数
 */

/**
 * 格式化货币显示
 * @param {number} amount - 金额
 * @param {string} currency - 货币符号
 * @returns {string} 格式化后的货币字符串
 */
export const formatCurrency = (amount, currency = '¥') => {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  return `${currency}${parseFloat(amount).toFixed(2)}`;
};

/**
 * 格式化百分比显示
 * @param {number} value - 百分比值
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * 格式化时间显示
 * @param {string|Date} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = timestamp => {
  if (!timestamp) return '';

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
      minute: '2-digit',
    });
  }

  // 其他情况显示完整日期
  return date.toLocaleString('zh-CN', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 获取操作类型文本
 * @param {string} operation - 操作类型
 * @returns {string} 操作类型文本
 */
export const getOperationText = operation => {
  switch (operation) {
    case 'buy':
      return '买入';
    case 'sell':
      return '卖出';
    case 'initial':
      return '初始资金';
    case 'deposit':
      return '追加资金';
    case 'withdraw':
      return '取出资金';
    default:
      return operation;
  }
};

/**
 * 获取资产类型文本
 * @param {string} assetType - 资产类型
 * @returns {string} 资产类型文本
 */
export const getAssetTypeText = assetType => {
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

/**
 * 获取操作类型颜色
 * @param {string} type - 操作类型
 * @returns {string} 颜色名称
 */
export const getOperationColor = type => {
  switch (type) {
    case 'initial':
      return 'blue';
    case 'deposit':
      return 'green';
    case 'withdraw':
      return 'red';
    case 'buy':
      return 'red';
    case 'sell':
      return 'green';
    default:
      return 'default';
  }
};
