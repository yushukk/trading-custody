import { Toast } from 'antd-mobile';

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * 错误消息映射
 */
export const ERROR_MESSAGES = {
  401: '未授权，请重新登录',
  403: '权限不足',
  404: '请求的资源不存在',
  500: '服务器错误，请稍后重试',
  NETWORK_ERROR: '网络连接失败，请检查网络',
  TOKEN_EXPIRED: 'Token 已过期，请重新登录'
};

/**
 * 统一错误处理函数
 * @param {Error|ApiError} error - 错误对象
 * @param {Function} navigate - 路由导航函数（可选）
 */
export const handleError = (error, navigate) => {
  console.error('Error:', error);
  
  if (error instanceof ApiError) {
    const message = ERROR_MESSAGES[error.status] || error.message;
    
    Toast.show({
      icon: 'fail',
      content: message
    });
    
    // 401 错误跳转到登录页
    if (error.status === 401 && navigate) {
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    }
  } else if (error.message === 'Failed to fetch' || error.message === 'Network request failed') {
    Toast.show({
      icon: 'fail',
      content: ERROR_MESSAGES.NETWORK_ERROR
    });
  } else {
    Toast.show({
      icon: 'fail',
      content: error.message || '操作失败'
    });
  }
};

export default handleError;
