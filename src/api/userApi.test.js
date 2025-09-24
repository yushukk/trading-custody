import * as userApi from './userApi';

// Mock fetch
global.fetch = jest.fn();

describe('userApi', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('login', () => {
    it('should call login API with correct parameters', async () => {
      const mockResponse = { token: 'test-token', role: 'user', id: 1 };
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await userApi.login('testuser', 'password');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password' })
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when login fails', async () => {
      fetch.mockResolvedValue({
        ok: false
      });

      await expect(userApi.login('testuser', 'wrongpassword'))
        .rejects
        .toThrow('登录失败');
    });
  });
});