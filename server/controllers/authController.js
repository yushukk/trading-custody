const AppError = require('../utils/AppError');
const { COOKIE_OPTIONS, ERROR_MESSAGES } = require('../constants');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await this.authService.login(email, password);

      // 设置 HttpOnly Cookie
      res.cookie('accessToken', accessToken, COOKIE_OPTIONS.ACCESS_TOKEN);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS.REFRESH_TOKEN);

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const userId = await this.authService.register(req.body);
      res.status(201).json({
        success: true,
        userId,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new AppError(ERROR_MESSAGES.MISSING_REFRESH_TOKEN, 'MISSING_REFRESH_TOKEN', 401);
      }

      const newAccessToken = await this.authService.refreshToken(refreshToken);

      res.cookie('accessToken', newAccessToken, COOKIE_OPTIONS.ACCESS_TOKEN);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true });
  }

  async me(req, res) {
    res.json({
      success: true,
      user: {
        id: req.user.userId,
        name: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
}

// 导出实例
const authService = require('../services/authService');
const authControllerInstance = new AuthController(authService);

module.exports = authControllerInstance;
module.exports.default = authControllerInstance;
module.exports.AuthController = AuthController;
