const AppError = require('../utils/AppError');
const PasswordHelper = require('../utils/passwordHelper');

class UserService {
  constructor(userDao) {
    this.userDao = userDao;
  }

  async getAllUsers() {
    try {
      return await this.userDao.findAll();
    } catch (error) {
      throw new AppError('获取用户列表失败', 'DATABASE_ERROR', 500);
    }
  }

  async getUserById(id) {
    try {
      return await this.userDao.findById(id);
    } catch (error) {
      throw new AppError('获取用户信息失败', 'DATABASE_ERROR', 500);
    }
  }

  async getUserByEmail(email) {
    try {
      return await this.userDao.findByEmail(email);
    } catch (error) {
      throw new AppError('获取用户信息失败', 'DATABASE_ERROR', 500);
    }
  }

  async createUser(userData) {
    try {
      // 检查邮箱是否已存在
      const existingUser = await this.userDao.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('邮箱已被注册', 'EMAIL_EXISTS', 400);
      }

      const { name, email, password, role } = userData;
      const hashedPassword = await PasswordHelper.hash(password);
      const userId = await this.userDao.create({
        name,
        email,
        password: hashedPassword,
        role,
      });
      return { id: userId, name, email, role };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建用户失败', 'DATABASE_ERROR', 500);
    }
  }

  async updateUser(id, userData) {
    try {
      const { name, email, role } = userData;
      await this.userDao.update(id, { name, email, role });
      return { id, name, email, role };
    } catch (error) {
      throw new AppError('更新用户失败', 'DATABASE_ERROR', 500);
    }
  }

  async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await PasswordHelper.hash(newPassword);
      await this.userDao.updatePassword(id, hashedPassword);
    } catch (error) {
      console.error('更新密码失败，详细错误:', error);
      throw new AppError(`更新密码失败: ${error.message}`, 'DATABASE_ERROR', 500);
    }
  }

  async deleteUser(id) {
    try {
      await this.userDao.delete(id);
    } catch (error) {
      throw new AppError('删除用户失败', 'DATABASE_ERROR', 500);
    }
  }
}

// 导出实例
const userDao = require('../dao/userDao');
const userServiceInstance = new UserService(userDao);

module.exports = userServiceInstance;
module.exports.default = userServiceInstance;
module.exports.UserService = UserService;
