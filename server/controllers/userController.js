const PasswordHelper = require('../utils/passwordHelper');
const AppError = require('../utils/AppError');

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  // 获取所有用户
  async getAllUsers(req, res, next) {
    try {
      const users = await this.userService.getAllUsers();
      res.json({
        success: true,
        users,
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取当前用户信息
  async getCurrentUser(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建用户
  async createUser(req, res, next) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新用户
  async updateUser(req, res, next) {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除用户
  async deleteUser(req, res, next) {
    try {
      await this.userService.deleteUser(req.params.id);
      res.json({
        success: true,
        message: '用户删除成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新密码（用户修改自己的密码）
  async updatePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // 验证旧密码
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new AppError('用户不存在', 'USER_NOT_FOUND', 404);
      }

      const isValid = await PasswordHelper.verify(oldPassword, user.password);
      if (!isValid) {
        throw new AppError('旧密码错误', 'INVALID_PASSWORD', 400);
      }

      // 更新密码
      await this.userService.updatePassword(userId, newPassword);
      res.json({ message: '密码更新成功' });
    } catch (error) {
      next(error);
    }
  }

  // 管理员修改用户密码
  async updateUserPassword(req, res, next) {
    try {
      const { newPassword } = req.body;
      const userId = req.params.id;

      // 验证用户是否存在
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new AppError('用户不存在', 'USER_NOT_FOUND', 404);
      }

      // 更新密码
      await this.userService.updatePassword(userId, newPassword);
      res.json({
        success: true,
        message: '密码更新成功',
      });
    } catch (error) {
      next(error);
    }
  }
}

// 导出类和默认实例
module.exports = UserController;
module.exports.constructor = UserController;

// 默认导出实例
const userService = require('../services/userService');
module.exports.default = new UserController(userService);
