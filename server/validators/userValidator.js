const { body, param } = require('express-validator');
const { VALIDATION, ERROR_MESSAGES } = require('../constants');

/**
 * 用户ID参数验证
 */
const userIdParamValidation = [
  param('id')
    .isInt({ min: VALIDATION.USER_ID.MIN })
    .withMessage(ERROR_MESSAGES.INVALID_USER_ID)
    .toInt(),
];

/**
 * 创建用户验证规则
 */
const createUserValidation = [
  body('name').trim().notEmpty().withMessage('用户名不能为空'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .isLength({ min: VALIDATION.EMAIL.MIN_LENGTH, max: VALIDATION.EMAIL.MAX_LENGTH })
    .withMessage(
      `邮箱长度必须在${VALIDATION.EMAIL.MIN_LENGTH}-${VALIDATION.EMAIL.MAX_LENGTH}个字符之间`
    ),

  body('password')
    .notEmpty()
    .withMessage(ERROR_MESSAGES.PASSWORD_REQUIRED)
    .isLength({ min: VALIDATION.PASSWORD.MIN_LENGTH, max: VALIDATION.PASSWORD.MAX_LENGTH })
    .withMessage(ERROR_MESSAGES.INVALID_PASSWORD),

  body('role').optional().isIn(['admin', 'user']).withMessage('角色必须是 admin 或 user'),
];

/**
 * 更新用户验证规则
 */
const updateUserValidation = [
  ...userIdParamValidation,

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: VALIDATION.USERNAME.MIN_LENGTH, max: VALIDATION.USERNAME.MAX_LENGTH })
    .withMessage(
      `用户名长度必须在${VALIDATION.USERNAME.MIN_LENGTH}-${VALIDATION.USERNAME.MAX_LENGTH}个字符之间`
    ),

  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.EMAIL_REQUIRED)
    .isEmail()
    .withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .isLength({ min: VALIDATION.EMAIL.MIN_LENGTH, max: VALIDATION.EMAIL.MAX_LENGTH })
    .withMessage(
      `邮箱长度必须在${VALIDATION.EMAIL.MIN_LENGTH}-${VALIDATION.EMAIL.MAX_LENGTH}个字符之间`
    ),

  body('role').optional().isIn(['admin', 'user']).withMessage('角色必须是 admin 或 user'),
];

/**
 * 删除用户验证规则
 */
const deleteUserValidation = userIdParamValidation;

module.exports = {
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
};
