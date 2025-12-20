import apiClient from './apiClient';
import { ApiError } from '../utils/errorHandler';
import { API_CONFIG } from '../config/api';

// Mock fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockData = { success: true, data: 'test' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: key => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make successful POST request', async () => {
      const mockData = { success: true };
      const postData = { name: 'test' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: key => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockData,
      });

      const result = await apiClient.post('/test', postData);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should make successful PUT request', async () => {
      const mockData = { success: true };
      const putData = { name: 'updated' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: key => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockData,
      });

      const result = await apiClient.put('/test/1', putData);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        })
      );
    });

    it('should make successful DELETE request', async () => {
      const mockData = { success: true };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: key => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockData,
      });

      const result = await apiClient.delete('/test/1');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/test/1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle non-JSON response', async () => {
      const mockText = 'Success';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: key => (key === 'content-type' ? 'text/plain' : null),
        },
        text: async () => mockText,
      });

      const result = await apiClient.get('/test');

      expect(result).toBe(mockText);
    });

    it('should throw ApiError on HTTP error', async () => {
      const errorData = { error: 'Not found' };
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: key => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => errorData,
      });

      try {
        await apiClient.get('/test');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(404);
        expect(error.message).toBe('Not found');
      }
    });

    it('should throw ApiError on network error', async () => {
      const networkError = new Error('Network error');
      global.fetch.mockRejectedValueOnce(networkError);

      try {
        await apiClient.get('/test');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(0);
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle AbortError', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      global.fetch.mockRejectedValueOnce(abortError);

      try {
        await apiClient.get('/test');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe('请求超时');
      }
    });

    it('should use custom signal if provided', async () => {
      const mockData = { success: true };
      const controller = new AbortController();

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: key => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockData,
      });

      await apiClient.get('/test', { signal: controller.signal });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });

    it('should include custom headers', async () => {
      const mockData = { success: true };
      const customHeaders = { 'X-Custom-Header': 'test' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: key => (key === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockData,
      });

      await apiClient.get('/test', { headers: customHeaders });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'test',
          }),
        })
      );
    });
  });
});
