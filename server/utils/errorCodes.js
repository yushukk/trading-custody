/**
 * 标准化错误码定义
 */
const ERROR_CODES = {
  // 认证相关错误
  AUTH_001: { code: 'AUTH_001', message: '无效凭证', statusCode: 401 },
  AUTH_002: { code: 'AUTH_002', message: '令牌过期', statusCode: 401 },

  // 用户相关错误
  USER_001: { code: 'USER_001', message: '用户不存在', statusCode: 404 },
  USER_002: { code: 'USER_002', message: '用户已存在', statusCode: 409 },

  // 资金相关错误
  FUND_001: { code: 'FUND_001', message: '余额不足', statusCode: 400 },

  // 持仓相关错误
  POSITION_001: { code: 'POSITION_001', message: '持仓不存在', statusCode: 404 },
  POSITION_002: { code: 'POSITION_002', message: '无效的资产类型', statusCode: 400 },
  POSITION_003: { code: 'POSITION_003', message: '无效的操作类型', statusCode: 400 },
  POSITION_004: { code: 'POSITION_004', message: '价格必须为正数', statusCode: 400 },
  POSITION_005: { code: 'POSITION_005', message: '数量必须为正数', statusCode: 400 },

  // 参数验证错误
  VALIDATION_001: { code: 'VALIDATION_001', message: '参数验证失败', statusCode: 400 },

  // 内部服务器错误
  INTERNAL_001: { code: 'INTERNAL_001', message: '内部服务器错误', statusCode: 500 },
};

module.exports = ERROR_CODES;
