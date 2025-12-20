import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import apiClient from '../api/apiClient';
import * as userApi from '../api/userApi';

// Mock dependencies
jest.mock('../api/apiClient');
jest.mock('../api/userApi');

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide auth context', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('checkAuth');
    });

    it('should initialize with loading state', () => {
      userApi.getCurrentUser.mockImplementation(() => new Promise(() => {}));

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
    });

    it('should check auth on mount and set user', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
      userApi.getCurrentUser.mockResolvedValue(mockUser);

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(userApi.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle auth check failure', async () => {
      userApi.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
      const mockResponse = { success: true, user: mockUser };

      userApi.getCurrentUser.mockResolvedValue(null);
      apiClient.post.mockResolvedValue(mockResponse);

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password');
      });

      expect(loginResult).toEqual(mockResponse);
      expect(result.current.user).toEqual(mockUser);
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle login failure', async () => {
      userApi.getCurrentUser.mockResolvedValue(null);
      apiClient.post.mockRejectedValue(new Error('Invalid credentials'));

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBe(null);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockUser = { id: 1, name: 'Test User' };
      userApi.getCurrentUser.mockResolvedValue(mockUser);
      apiClient.post.mockResolvedValue({ success: true });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBe(null);
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
    });
  });

  describe('checkAuth', () => {
    it('should refresh user data', async () => {
      const initialUser = { id: 1, name: 'Initial User' };
      const updatedUser = { id: 1, name: 'Updated User' };

      userApi.getCurrentUser.mockResolvedValueOnce(initialUser);

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(initialUser);
      });

      userApi.getCurrentUser.mockResolvedValueOnce(updatedUser);

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toEqual(updatedUser);
    });
  });

  describe('useAuth', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      console.error = originalError;
    });
  });
});
