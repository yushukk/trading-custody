const userService = require('../../services/userService');
const AppError = require('../../utils/AppError');

// Mock数据库
jest.mock('../../utils/database', () => {
  return {
    get: jest.fn(),
    run: jest.fn()
  };
});

const db = require('../../utils/database');

describe('UserService', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const mockUser = { id: 1, name: 'testuser', password: 'password', role: 'user' };
      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockUser);
      });

      const result = await userService.authenticateUser('testuser', 'password');
      expect(result).toEqual(mockUser);
      expect(db.get).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE name = ? AND password = ?",
        ['testuser', 'password'],
        expect.any(Function)
      );
    });

    it('should throw error for invalid credentials', async () => {
      db.get.mockImplementation((query, params, callback) => {
        callback(null, null);
      });

      await expect(userService.authenticateUser('testuser', 'wrongpassword'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error when database query fails', async () => {
      const dbError = new Error('Database error');
      db.get.mockImplementation((query, params, callback) => {
        callback(dbError, null);
      });

      await expect(userService.authenticateUser('testuser', 'password'))
        .rejects
        .toThrow(AppError);
    });
  });
});