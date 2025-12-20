const userService = require('../../services/userService').default;
const AppError = require('../../utils/AppError');

// Mock DAO and PasswordHelper
jest.mock('../../dao/userDao', () => {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  };
});

jest.mock('../../utils/passwordHelper', () => {
  return {
    hash: jest.fn(),
  };
});

const userDao = require('../../dao/userDao');
const passwordHelper = require('../../utils/passwordHelper');

describe('UserService', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, name: 'User1', email: 'user1@example.com', role: 'user' },
        { id: 2, name: 'User2', email: 'user2@example.com', role: 'admin' },
      ];
      userDao.findAll.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();
      expect(result).toEqual(mockUsers);
      expect(userDao.findAll).toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      userDao.findAll.mockRejectedValue(new Error('Database error'));

      await expect(userService.getAllUsers()).rejects.toThrow(AppError);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: 1, name: 'User1', email: 'user1@example.com', role: 'user' };
      userDao.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);
      expect(result).toEqual(mockUser);
      expect(userDao.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error when database query fails', async () => {
      userDao.findById.mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserById(1)).rejects.toThrow(AppError);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = { id: 1, name: 'User1', email: 'user1@example.com', role: 'user' };
      userDao.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('user1@example.com');
      expect(result).toEqual(mockUser);
      expect(userDao.findByEmail).toHaveBeenCalledWith('user1@example.com');
    });

    it('should throw error when database query fails', async () => {
      userDao.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserByEmail('user1@example.com')).rejects.toThrow(AppError);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
      };
      const hashedPassword = 'hashedPassword';
      const userId = 1;

      userDao.findByEmail.mockResolvedValue(null); // No existing user
      passwordHelper.hash.mockResolvedValue(hashedPassword);
      userDao.create.mockResolvedValue(userId);

      const result = await userService.createUser(userData);
      expect(result).toEqual({
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      });
      expect(userDao.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(passwordHelper.hash).toHaveBeenCalledWith(userData.password);
      expect(userDao.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      });
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
      };
      const existingUser = {
        id: 1,
        name: 'Existing User',
        email: 'newuser@example.com',
        role: 'user',
      };

      userDao.findByEmail.mockResolvedValue(existingUser);

      await expect(userService.createUser(userData)).rejects.toThrow(AppError);
    });

    it('should throw error when database query fails', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user',
      };

      userDao.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(userService.createUser(userData)).rejects.toThrow(AppError);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const userId = 1;
      const userData = { name: 'Updated Name', email: 'updated@example.com', role: 'admin' };

      await userService.updateUser(userId, userData);
      expect(userDao.update).toHaveBeenCalledWith(userId, userData);
    });

    it('should throw error when database query fails', async () => {
      const userId = 1;
      const userData = { name: 'Updated Name', email: 'updated@example.com', role: 'admin' };

      userDao.update.mockRejectedValue(new Error('Database error'));

      await expect(userService.updateUser(userId, userData)).rejects.toThrow(AppError);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userId = 1;
      const newPassword = 'newpassword123';
      const hashedPassword = 'hashedNewPassword';

      passwordHelper.hash.mockResolvedValue(hashedPassword);

      await userService.updatePassword(userId, newPassword);
      expect(passwordHelper.hash).toHaveBeenCalledWith(newPassword);
      expect(userDao.updatePassword).toHaveBeenCalledWith(userId, hashedPassword);
    });

    it('should throw error when database query fails', async () => {
      const userId = 1;
      const newPassword = 'newpassword123';

      userDao.updatePassword.mockRejectedValue(new Error('Database error'));

      await expect(userService.updatePassword(userId, newPassword)).rejects.toThrow(AppError);
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const userId = 1;

      await userService.deleteUser(userId);
      expect(userDao.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw error when database query fails', async () => {
      const userId = 1;

      userDao.delete.mockRejectedValue(new Error('Database error'));

      await expect(userService.deleteUser(userId)).rejects.toThrow(AppError);
    });
  });
});
