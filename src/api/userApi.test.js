import * as userApi from './userApi';
import apiClient from './apiClient';

// Mock apiClient
jest.mock('./apiClient');

describe('userApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call login API with correct parameters', async () => {
      const mockResponse = { token: 'test-token', role: 'user', id: 1 };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await userApi.login('testuser', 'password');

      expect(apiClient.post).toHaveBeenCalledWith('/api/login', {
        username: 'testuser',
        password: 'password',
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
