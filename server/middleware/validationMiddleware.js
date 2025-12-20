const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../constants');

/**
 * 验证中间件 - 处理验证结果
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一步函数
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: '输入验证失败',
      errors: errorMessages,
    });
  }

  next();
};

module.exports = validate;
