const { body, param } = require('express-validator');
const { VALIDATION, ERROR_MESSAGES, FUND_OPERATION_TYPE_VALUES } = require('../constants');

/**
 * 用户ID参数验证
 */
const userIdParamValidation = [
  param('userId')
    .isInt({ min: VALIDATION.USER_ID.MIN })
    .withMessage(ERROR_MESSAGES.INVALID_USER_ID)
    .toInt(),
];

/**
 * 资金操作验证规则
 */
const fundOperationValidation = [
  ...userIdParamValidation,

  body('type')
    .notEmpty()
    .withMessage(ERROR_MESSAGES.TYPE_REQUIRED)
    .isIn(FUND_OPERATION_TYPE_VALUES)
    .withMessage(ERROR_MESSAGES.INVALID_OPERATION_TYPE),

  body('amount')
    .notEmpty()
    .withMessage(ERROR_MESSAGES.AMOUNT_REQUIRED)
    .isFloat({ min: VALIDATION.AMOUNT.MIN, max: VALIDATION.AMOUNT.MAX })
    .withMessage(`金额必须在${VALIDATION.AMOUNT.MIN}-${VALIDATION.AMOUNT.MAX}之间`)
    .toFloat(),

  body('remark').optional().trim().isLength({ max: 200 }).withMessage('备注长度不能超过200个字符'),
];

/**
 * 获取资金余额验证规则
 */
const getFundBalanceValidation = userIdParamValidation;

/**
 * 获取资金日志验证规则
 */
const getFundLogsValidation = userIdParamValidation;

module.exports = {
  fundOperationValidation,
  getFundBalanceValidation,
  getFundLogsValidation,
};
