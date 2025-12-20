const PasswordHelper = require('../utils/passwordHelper');
const JwtHelper = require('../utils/jwtHelper');
const AppError = require('../utils/AppError');

class AuthService {
  constructor(userDao) {
    this.userDao = userDao;
  }

  async login(username, password) {
    const user = await this.userDao.findByName(username);
    if (!user) {
      throw new AppError('用户不存在', 'USER_NOT_FOUND', 404);
    }

    const isValid = await PasswordHelper.verify(password, user.password);
    if (!isValid) {
      throw new AppError('密码错误', 'INVALID_PASSWORD', 401);
    }

    const payload = {
      userId: user.id,
      username: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtHelper.generateAccessToken(payload);
    const refreshToken = JwtHelper.generateRefreshToken(payload);

    return { accessToken, refreshToken, user };
  }

  async register(userData) {
    const existingUser = await this.userDao.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('邮箱已被注册', 'EMAIL_EXISTS', 400);
    }

    const hashedPassword = await PasswordHelper.hash(userData.password);
    const userId = await this.userDao.create({
      ...userData,
      password: hashedPassword,
    });

    return userId;
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = JwtHelper.verifyRefreshToken(refreshToken);
      const payload = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };

      const newAccessToken = JwtHelper.generateAccessToken(payload);
      return newAccessToken;
    } catch (error) {
      throw new AppError('Refresh token 无效', 'INVALID_REFRESH_TOKEN', 401);
    }
  }
}

// 导出实例
const userDao = require('../dao/userDao');
const authServiceInstance = new AuthService(userDao);

module.exports = authServiceInstance;
module.exports.default = authServiceInstance;
module.exports.AuthService = AuthService;
