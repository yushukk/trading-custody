const express = require('express');
const router = express.Router();

// 导入控制器
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const fundController = require('../controllers/fundController');
const positionController = require('../controllers/positionController');
const priceService = require('../services/priceService');

// 导入认证中间件
const { authenticateToken, adminOnly, checkResourceOwnership } = require('../middleware/authMiddleware');

// 认证路由（无需认证）
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticateToken, authController.me);

// 用户信息路由（需要认证）
router.get('/users/me', authenticateToken, userController.getCurrentUser);
router.put('/users/password', authenticateToken, userController.updatePassword);

// 用户管理路由（需要管理员权限）
router.get('/users', authenticateToken, adminOnly, userController.getAllUsers);
router.post('/users', authenticateToken, adminOnly, userController.createUser);
router.put('/users/:id', authenticateToken, adminOnly, userController.updateUser);
router.delete('/users/:id', authenticateToken, adminOnly, userController.deleteUser);

// 资金管理路由（需要认证和资源所有权验证）
router.get('/funds/:userId', authenticateToken, checkResourceOwnership, fundController.getFundBalance);
router.get('/funds/:userId/logs', authenticateToken, checkResourceOwnership, fundController.getFundLogs);
router.post('/funds/:userId', authenticateToken, checkResourceOwnership, fundController.handleFundOperation);

// 持仓管理路由（需要认证和资源所有权验证）
router.get('/positions/:userId', authenticateToken, checkResourceOwnership, positionController.getPositions);
router.post('/positions/:userId', authenticateToken, checkResourceOwnership, positionController.addPosition);
router.get('/positions/profit/:userId', authenticateToken, checkResourceOwnership, positionController.calculatePositionProfit);
router.delete('/positions/:userId', authenticateToken, checkResourceOwnership, positionController.deletePositions);

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