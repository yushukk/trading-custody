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
    console.log('===== 开始创建用户 =====');
    console.log('接收到的用户数据:', JSON.stringify(userData, null, 2));

    try {
      const { name, email, password, role } = userData;
      console.log('解构后的字段:', { name, email, password: '***', role });

      // 检查用户名是否已存在
      console.log('检查用户名是否已存在:', name);
      const existingUserByName = await this.userDao.findByName(name);
      if (existingUserByName) {
        console.log('用户名已存在，抛出错误');
        throw new AppError('用户名已被注册', 'USERNAME_EXISTS', 400);
      }
      console.log('用户名未被注册，继续检查');

      // 只在邮箱不为空时检查是否已存在
      if (email && email.trim()) {
        console.log('检查邮箱是否已存在:', email);
        const existingUser = await this.userDao.findByEmail(email);
        if (existingUser) {
          console.log('邮箱已存在，抛出错误');
          throw new AppError('邮箱已被注册', 'EMAIL_EXISTS', 400);
        }
        console.log('邮箱未被注册，继续创建');
      } else {
        console.log('邮箱为空，跳过重复检查');
      }

      console.log('开始加密密码...');
      const hashedPassword = await PasswordHelper.hash(password);
      console.log('密码加密完成');

      const finalEmail = email && email.trim() ? email : null;
      console.log('最终邮箱值:', finalEmail);

      const createData = {
        name,
        email: finalEmail,
        password: hashedPassword,
        role,
      };
      console.log('准备插入数据库的数据:', { ...createData, password: '***' });

      const userId = await this.userDao.create(createData);
      console.log('用户创建成功，ID:', userId);

      const result = { id: userId, name, email: finalEmail, role };
      console.log('准备返回的结果:', result);
      console.log('===== 创建用户成功 =====');

      return result;
    } catch (error) {
      console.error('===== 创建用户过程中发生错误 =====');
      console.error('错误类型:', error.constructor.name);
      console.error('错误信息:', error.message);
      console.error('错误堆栈:', error.stack);

      if (error instanceof AppError) {
        console.log('这是一个 AppError，直接抛出');
        throw error;
      }
      console.error('这是一个未知错误，包装后抛出');
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
