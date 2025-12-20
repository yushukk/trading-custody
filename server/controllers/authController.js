const authService = require('../services/authService');
const AppError = require('../utils/AppError');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, user } = await authService.login(email, password);
      
      // 设置 HttpOnly Cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15分钟
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
      });
      
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async register(req, res, next) {
    try {
      const userId = await authService.register(req.body);
      res.status(201).json({
        success: true,
        userId
      });
    } catch (error) {
      next(error);
    }
  }
  
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new AppError('缺少刷新令牌', 'MISSING_REFRESH_TOKEN', 401);
      }
      
      const newAccessToken = await authService.refreshToken(refreshToken);
      
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15分钟
      });
      
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
    res.json(req.user);
  }
}

module.exports = new AuthController();