import { ApiError, ERROR_MESSAGES, handleError } from './errorHandler';
import { Toast } from 'antd-mobile';

// Mock antd-mobile Toast
jest.mock('antd-mobile', () => ({
  Toast: {
    show: jest.fn(),
  },
}));

describe('ApiError', () => {
  it('should create ApiError with correct properties', () => {
    const error = new ApiError(404, 'Not found', { detail: 'test' });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.data).toEqual({ detail: 'test' });
  });

  it('should have correct error message', () => {
    const error = new ApiError(500, 'Server error');

    expect(error.message).toBe('Server error');
    expect(error.toString()).toContain('Server error');
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have correct error messages', () => {
    expect(ERROR_MESSAGES[401]).toBe('未授权，请重新登录');
    expect(ERROR_MESSAGES[403]).toBe('权限不足');
    expect(ERROR_MESSAGES[404]).toBe('请求的资源不存在');
    expect(ERROR_MESSAGES[500]).toBe('服务器错误，请稍后重试');
    expect(ERROR_MESSAGES.NETWORK_ERROR).toBe('网络连接失败，请检查网络');
    expect(ERROR_MESSAGES.TOKEN_EXPIRED).toBe('Token 已过期，请重新登录');
  });
});

describe('handleError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should handle ApiError with status code', () => {
    const error = new ApiError(404, 'Not found');

    handleError(error);

    expect(console.error).toHaveBeenCalledWith('Error:', error);
    expect(Toast.show).toHaveBeenCalledWith({
      icon: 'fail',
      content: ERROR_MESSAGES[404],
    });
  });

  it('should handle ApiError with custom message', () => {
    const error = new ApiError(999, 'Custom error');

    handleError(error);

    expect(Toast.show).toHaveBeenCalledWith({
      icon: 'fail',
      content: 'Custom error',
    });
  });

  it('should handle 401 error and navigate to login', () => {
    const error = new ApiError(401, 'Unauthorized');
    const navigate = jest.fn();

    handleError(error, navigate);

    expect(Toast.show).toHaveBeenCalledWith({
      icon: 'fail',
      content: ERROR_MESSAGES[401],
    });

    // Fast-forward time to trigger navigation
    jest.advanceTimersByTime(1000);

    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('should not navigate if navigate function not provided', () => {
    const error = new ApiError(401, 'Unauthorized');

    handleError(error);

    expect(Toast.show).toHaveBeenCalled();
    // Should not throw error
  });

  it('should handle network error', () => {
    const error = new Error('Failed to fetch');

    handleError(error);

    expect(Toast.show).toHaveBeenCalledWith({
      icon: 'fail',
      content: ERROR_MESSAGES.NETWORK_ERROR,
    });
  });

  it('should handle generic error', () => {
    const error = new Error('Something went wrong');

    handleError(error);

    expect(Toast.show).toHaveBeenCalledWith({
      icon: 'fail',
      content: 'Something went wrong',
    });
  });

  it('should handle error without message', () => {
    const error = new Error();

    handleError(error);

    expect(Toast.show).toHaveBeenCalledWith({
      icon: 'fail',
      content: '操作失败',
    });
  });
});
