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
  
  // 参数验证错误
  VALIDATION_001: { code: 'VALIDATION_001', message: '参数验证失败', statusCode: 400 },
  
  // 内部服务器错误
  INTERNAL_001: { code: 'INTERNAL_001', message: '内部服务器错误', statusCode: 500 }
};

module.exports = ERROR_CODES;