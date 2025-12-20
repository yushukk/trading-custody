import { renderHook, act } from '@testing-library/react';
import { useUser } from '../../src/hooks/useUser';
import * as userApi from '../../src/api/userApi';

// Mock userApi
jest.mock('../../src/api/userApi');

describe('useUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch users on mount', async () => {
    const mockUsers = [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user' },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin' },
    ];

    userApi.getAllUsers.mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useUser());

    // 手动调用 fetchUsers
    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch users error', async () => {
    const errorMessage = 'Failed to fetch users';
    userApi.getAllUsers.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUser());

    // 手动调用 fetchUsers
    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should create user', async () => {
    const newUser = { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' };
    userApi.createUser.mockResolvedValue(newUser);

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.createUser({
        name: 'Charlie',
        email: 'charlie@example.com',
        role: 'user',
      });
    });

    expect(result.current.users).toContainEqual(newUser);
    expect(result.current.loading).toBe(false);
  });

  it('should delete user', async () => {
    const mockUsers = [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user' },
      { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin' },
    ];

    userApi.getAllUsers.mockResolvedValue(mockUsers);
    userApi.deleteUser.mockResolvedValue();

    const { result } = renderHook(() => useUser());

    // 先加载用户列表
    await act(async () => {
      await result.current.fetchUsers();
    });

    // 验证用户列表已加载
    expect(result.current.users).toEqual(mockUsers);

    // 删除用户
    await act(async () => {
      await result.current.deleteUser(1);
    });

    expect(userApi.deleteUser).toHaveBeenCalledWith(1);
    expect(result.current.users).toEqual([mockUsers[1]]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
