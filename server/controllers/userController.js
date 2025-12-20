const userService = require('../services/userService');
const PasswordHelper = require('../utils/passwordHelper');
const AppError = require('../utils/AppError');

class UserController {
  // 获取所有用户
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  // 获取当前用户信息
  async getCurrentUser(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建用户
  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  // 更新用户
  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  // 删除用户
  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      res.json({ message: '用户删除成功' });
    } catch (error) {
      next(error);
    }
  }

  // 更新密码
  async updatePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId;
      
      // 验证旧密码
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new AppError('用户不存在', 'USER_NOT_FOUND', 404);
      }
      
      const isValid = await PasswordHelper.verify(oldPassword, user.password);
      if (!isValid) {
        throw new AppError('旧密码错误', 'INVALID_PASSWORD', 401);
      }
      
      // 更新密码
      await userService.updatePassword(userId, newPassword);
      res.json({ message: '密码更新成功' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();