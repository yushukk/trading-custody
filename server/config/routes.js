const express = require('express');
const router = express.Router();

// 导入控制器
const authController = require('../controllers/authController').default;
const userController = require('../controllers/userController').default;
const fundController = require('../controllers/fundController').default;
const positionController = require('../controllers/positionController').default;
const priceService = require('../services/priceService');

// 导入认证中间件
const {
  authenticateToken,
  adminOnly,
  checkResourceOwnership,
} = require('../middleware/authMiddleware');

// 认证路由（无需认证）
router.post('/auth/login', (req, res, next) => authController.login(req, res, next));
router.post('/auth/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/auth/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/auth/me', authenticateToken, (req, res, next) => authController.me(req, res, next));

// 用户信息路由（需要认证）
router.get('/users/me', authenticateToken, (req, res, next) =>
  userController.getCurrentUser(req, res, next)
);
router.put('/users/password', authenticateToken, (req, res, next) =>
  userController.updatePassword(req, res, next)
);

// 用户管理路由（需要管理员权限）
router.get('/users', authenticateToken, adminOnly, (req, res, next) =>
  userController.getAllUsers(req, res, next)
);
router.post('/users', authenticateToken, adminOnly, (req, res, next) =>
  userController.createUser(req, res, next)
);
router.put('/users/:id', authenticateToken, adminOnly, (req, res, next) =>
  userController.updateUser(req, res, next)
);
router.delete('/users/:id', authenticateToken, adminOnly, (req, res, next) =>
  userController.deleteUser(req, res, next)
);

// 资金管理路由（需要认证和资源所有权验证）
router.get('/funds/:userId', authenticateToken, checkResourceOwnership, (req, res, next) =>
  fundController.getFundBalance(req, res, next)
);
router.get('/funds/:userId/logs', authenticateToken, checkResourceOwnership, (req, res, next) =>
  fundController.getFundLogs(req, res, next)
);
router.post('/funds/:userId', authenticateToken, checkResourceOwnership, (req, res, next) =>
  fundController.handleFundOperation(req, res, next)
);

// 持仓管理路由（需要认证和资源所有权验证）
router.get('/positions/:userId', authenticateToken, checkResourceOwnership, (req, res, next) =>
  positionController.getPositions(req, res, next)
);
router.post('/positions/:userId', authenticateToken, checkResourceOwnership, (req, res, next) =>
  positionController.addPosition(req, res, next)
);
router.get(
  '/positions/profit/:userId',
  authenticateToken,
  checkResourceOwnership,
  (req, res, next) => positionController.calculatePositionProfit(req, res, next)
);
router.delete('/positions/:userId', authenticateToken, checkResourceOwnership, (req, res, next) =>
  positionController.deletePositions(req, res, next)
);

// 价格同步路由（需要管理员权限）
router.get('/syncPriceData', authenticateToken, adminOnly, async (req, res, next) => {
  try {
    const result = await priceService.syncPriceData();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
