const { body } = require('express-validator');
const { VALIDATION, ERROR_MESSAGES } = require('../constants');

/**
 * 登录验证规则
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.EMAIL_REQUIRED)
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
];

/**
 * 注册验证规则
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: VALIDATION.USERNAME.MIN_LENGTH, max: VALIDATION.USERNAME.MAX_LENGTH })
    .withMessage(
      `用户名长度必须在${VALIDATION.USERNAME.MIN_LENGTH}-${VALIDATION.USERNAME.MAX_LENGTH}个字符之间`
    ),

  body('email')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.EMAIL_REQUIRED)
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
 * 修改密码验证规则
 */
const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('旧密码不能为空'),

  body('newPassword')
    .notEmpty()
    .withMessage('新密码不能为空')
    .isLength({ min: VALIDATION.PASSWORD.MIN_LENGTH, max: VALIDATION.PASSWORD.MAX_LENGTH })
    .withMessage(ERROR_MESSAGES.INVALID_PASSWORD),
];

module.exports = {
  loginValidation,
  registerValidation,
  changePasswordValidation,
};
