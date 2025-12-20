const userDao = require('../../dao/userDao');
const db = require('../../utils/database');

// Mock the database
jest.mock('../../utils/database', () => ({
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn(),
}));

describe('UserDao', () => {
  beforeEach(() => {
    // 清除所有mock调用
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' };
      db.get.mockResolvedValue(mockUser);

      const result = await userDao.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(db.get).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', [
        'test@example.com',
      ]);
    });

    it('should return null when user not found', async () => {
      db.get.mockResolvedValue(null);

      const result = await userDao.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' };
      db.get.mockResolvedValue(mockUser);

      const result = await userDao.findById(1);

      expect(result).toEqual(mockUser);
      expect(db.get).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
    });

    it('should return null when user not found', async () => {
      db.get.mockResolvedValue(null);

      const result = await userDao.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const mockResult = { lastID: 1 };
      db.run.mockResolvedValue(mockResult);

      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        role: 'user',
      };

      const result = await userDao.create(userData);

      expect(result).toBe(1); // lastID
      expect(db.run).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['New User', 'newuser@example.com', 'hashedPassword', 'user']
      );
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const mockResult = { changes: 1 };
      db.run.mockResolvedValue(mockResult);

      const userData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin',
      };

      await userDao.update(1, userData);

      expect(db.run).toHaveBeenCalledWith(
        'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
        ['Updated Name', 'updated@example.com', 'admin', 1]
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const mockResult = { changes: 1 };
      db.run.mockResolvedValue(mockResult);

      await userDao.updatePassword(1, 'newHashedPassword');

      expect(db.run).toHaveBeenCalledWith('UPDATE users SET password = ? WHERE id = ?', [
        'newHashedPassword',
        1,
      ]);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const mockResult = { changes: 1 };
      db.run.mockResolvedValue(mockResult);

      await userDao.delete(1);

      expect(db.run).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [1]);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, name: 'User1', email: 'user1@example.com', role: 'user' },
        { id: 2, name: 'User2', email: 'user2@example.com', role: 'admin' },
      ];
      db.all.mockResolvedValue(mockUsers);

      const result = await userDao.findAll();

      expect(result).toEqual(mockUsers);
      expect(db.all).toHaveBeenCalledWith('SELECT id, name, email, role FROM users');
    });
  });
});
