/**
 * 应用常量定义
 * 集中管理所有魔法数字和字符串常量
 */

// ==================== 时间相关常量 ====================
const TIME = {
  // Token 过期时间（毫秒）
  ACCESS_TOKEN_EXPIRES: 15 * 60 * 1000, // 15分钟
  REFRESH_TOKEN_EXPIRES: 60 * 24 * 60 * 60 * 1000, // 60天

  // 限流时间窗口（毫秒）
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15分钟
  API_RATE_LIMIT_WINDOW: 1 * 60 * 1000, // 1分钟
};

// ==================== 限流相关常量 ====================
const RATE_LIMIT = {
  // 登录接口限流
  LOGIN_MAX_ATTEMPTS: 5, // 最多5次尝试
  LOGIN_WINDOW_MS: TIME.RATE_LIMIT_WINDOW,

  // 通用API限流
  API_MAX_REQUESTS: 100, // 最多100次请求
  API_WINDOW_MS: TIME.API_RATE_LIMIT_WINDOW,
};

// ==================== 资金操作类型 ====================
const FUND_OPERATION_TYPES = {
  INITIAL: 'initial', // 初始化资金
  DEPOSIT: 'deposit', // 存入
  WITHDRAW: 'withdraw', // 取出
};

// 资金操作类型数组（用于验证）
const FUND_OPERATION_TYPE_VALUES = Object.values(FUND_OPERATION_TYPES);

// ==================== 用户角色 ====================
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// ==================== 数据库配置 ====================
const DATABASE = {
  // SQLite PRAGMA 配置
  JOURNAL_MODE: 'WAL',
  SYNCHRONOUS: 'NORMAL',
  CACHE_SIZE: 10000,
  TEMP_STORE: 'MEMORY',
};

// ==================== 验证规则 ====================
const VALIDATION = {
  // 邮箱
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },

  // 密码
  PASSWORD: {
    MIN_LENGTH: 4,
    MAX_LENGTH: 50,
  },

  // 用户名
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },

  // 金额
  AMOUNT: {
    MIN: 0.01,
    MAX: 999999999.99,
  },

  // 用户ID
  USER_ID: {
    MIN: 1,
  },
};

// ==================== HTTP 状态码 ====================
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// ==================== 错误消息 ====================
const ERROR_MESSAGES = {
  // 认证相关
  INVALID_CREDENTIALS: '邮箱或密码错误',
  TOKEN_EXPIRED: 'Token已过期',
  TOKEN_INVALID: 'Token无效',
  MISSING_TOKEN: '缺少认证令牌',
  MISSING_REFRESH_TOKEN: '缺少刷新令牌',

  // 权限相关
  ADMIN_REQUIRED: '需要管理员权限',
  ACCESS_DENIED: '访问被拒绝',
  RESOURCE_ACCESS_DENIED: '您只能访问自己的资源',

  // 资金操作相关
  INVALID_OPERATION_TYPE: '无效的操作类型',
  INVALID_AMOUNT: '金额必须为正数',
  INSUFFICIENT_BALANCE: '余额不足',

  // 验证相关
  INVALID_EMAIL: '邮箱格式不正确',
  INVALID_PASSWORD: '密码长度必须在4-50个字符之间',
  INVALID_USER_ID: '用户ID必须为正整数',
  EMAIL_REQUIRED: '邮箱不能为空',
  PASSWORD_REQUIRED: '密码不能为空',
  AMOUNT_REQUIRED: '金额不能为空',
  TYPE_REQUIRED: '操作类型不能为空',

  // 限流相关
  TOO_MANY_LOGIN_ATTEMPTS: '登录尝试次数过多，请15分钟后再试',
  TOO_MANY_REQUESTS: '请求过于频繁，请稍后再试',

  // 数据库相关
  DATABASE_ERROR: '数据库操作失败',
  USER_NOT_FOUND: '用户不存在',
  EMAIL_EXISTS: '邮箱已被注册',
};

// ==================== 成功消息 ====================
const SUCCESS_MESSAGES = {
  OPERATION_SUCCESS: '操作成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '登出成功',
  PASSWORD_UPDATED: '密码更新成功',
  USER_CREATED: '用户创建成功',
  USER_UPDATED: '用户更新成功',
  USER_DELETED: '用户删除成功',
};

// ==================== Cookie 配置 ====================
const COOKIE_OPTIONS = {
  ACCESS_TOKEN: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TIME.ACCESS_TOKEN_EXPIRES,
  },
  REFRESH_TOKEN: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TIME.REFRESH_TOKEN_EXPIRES,
  },
};

module.exports = {
  TIME,
  RATE_LIMIT,
  FUND_OPERATION_TYPES,
  FUND_OPERATION_TYPE_VALUES,
  USER_ROLES,
  DATABASE,
  VALIDATION,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COOKIE_OPTIONS,
};
