const ERROR_CODES = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * 统一错误处理中间件
 * @param {Object} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一步函数
 */
const errorHandler = (err, req, res, _next) => {
  // 记录错误日志
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // 如果是自定义错误码
  if (err.errorCode && ERROR_CODES[err.errorCode]) {
    const errorInfo = ERROR_CODES[err.errorCode];
    return res.status(errorInfo.statusCode).json({
      success: false,
      message: err.message || errorInfo.message,
      errorCode: err.errorCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // 标准化错误响应
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errorCode: err.errorCode || 'INTERNAL_001',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
