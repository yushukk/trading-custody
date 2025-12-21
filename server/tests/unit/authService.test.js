const AuthService = require('../../services/authService');
const userDao = require('../../dao/userDao');
const PasswordHelper = require('../../utils/passwordHelper');
const JwtHelper = require('../../utils/jwtHelper');

// Mock DAO and utils
jest.mock('../../dao/userDao', () => ({
  findByEmail: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../utils/passwordHelper', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('../../utils/jwtHelper', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    // 使用AuthService实例
    authService = AuthService;
    // 清除所有mock调用
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user',
      };

      userDao.findByName.mockResolvedValue(mockUser);
      PasswordHelper.verify.mockResolvedValue(true);
      JwtHelper.generateAccessToken.mockReturnValue('access_token');
      JwtHelper.generateRefreshToken.mockReturnValue('refresh_token');

      const result = await authService.login('Test User', 'password');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.name).toBe('Test User');
      expect(PasswordHelper.verify).toHaveBeenCalledWith('password', 'hashedPassword');
    });

    it('should throw error when user not found', async () => {
      userDao.findByName.mockResolvedValue(null);

      await expect(authService.login('NonExistentUser', 'password')).rejects.toThrow('用户不存在');
    });

    it('should throw error when password is invalid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      userDao.findByName.mockResolvedValue(mockUser);
      PasswordHelper.verify.mockResolvedValue(false);

      await expect(authService.login('Test User', 'wrongpassword')).rejects.toThrow('密码错误');
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      userDao.findByEmail.mockResolvedValue(null); // No existing user
      PasswordHelper.hash.mockResolvedValue('hashedPassword');
      userDao.create.mockResolvedValue(1);

      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
      };

      const result = await authService.register(userData);

      expect(result).toBe(1);
      expect(userDao.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(PasswordHelper.hash).toHaveBeenCalledWith('password123');
      expect(userDao.create).toHaveBeenCalledWith({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        role: 'user',
      });
    });

    it('should throw error if email already exists', async () => {
      const existingUser = {
        id: 1,
        name: 'Existing User',
        email: 'existing@example.com',
        role: 'user',
      };

      userDao.findByEmail.mockResolvedValue(existingUser);

      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'user',
      };

      await expect(authService.register(userData)).rejects.toThrow('邮箱已被注册');
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when refresh token is valid', async () => {
      const mockPayload = {
        userId: 1,
        username: 'Test User',
        role: 'user',
      };

      JwtHelper.verifyRefreshToken.mockReturnValue(mockPayload);
      JwtHelper.generateAccessToken.mockReturnValue('new_access_token');

      const result = await authService.refreshToken('valid_refresh_token');

      expect(result).toBe('new_access_token');
      expect(JwtHelper.verifyRefreshToken).toHaveBeenCalledWith('valid_refresh_token');
      expect(JwtHelper.generateAccessToken).toHaveBeenCalledWith(mockPayload);
    });

    it('should throw error when refresh token is invalid', async () => {
      JwtHelper.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid_refresh_token')).rejects.toThrow(
        'Refresh token 无效'
      );
    });
  });
});
