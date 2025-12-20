/**
 * 自定义应用错误类
 */
class AppError extends Error {
  /**
   * 构造函数
   * @param {string} message - 错误消息
   * @param {string} errorCode - 错误码
   * @param {number} statusCode - HTTP状态码
   */
  constructor(message, errorCode, statusCode = 500) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;

    // 确保堆栈跟踪正确
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
