const JwtHelper = require('../utils/jwtHelper');

/**
 * 认证中间件 - 验证JWT令牌（从 Cookie 读取）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一步函数
 */
exports.authenticateToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = JwtHelper.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

/**
 * 管理员权限验证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一步函数
 */
exports.adminOnly = (req, res, next) => {
  // 首先检查是否已通过认证
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // 检查用户角色是否为管理员
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * 资源所有权验证中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一步函数
 */
exports.checkResourceOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // 从路径参数获取请求的用户ID
  const requestedUserId = parseInt(req.params.userId);
  const currentUserId = req.user.userId;
  const isAdmin = req.user.role === 'admin';

  // 管理员可以访问所有资源，普通用户只能访问自己的资源
  if (!isAdmin && requestedUserId !== currentUserId) {
    return res.status(403).json({ error: 'Access denied: You can only access your own resources' });
  }

  next();
};
