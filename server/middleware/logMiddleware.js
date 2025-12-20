const logger = require('../utils/logger');

/**
 * 日志记录中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一步函数
 */
const logMiddleware = (req, res, next) => {
  const start = Date.now();

  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    // 记录请求日志
    logger.info('HTTP Request', logData);
  });

  // 如果有错误，记录错误
  res.on('error', err => {
    logger.error('Response Error', {
      error: err.message,
      stack: err.stack,
    });
  });

  next();
};

module.exports = logMiddleware;
