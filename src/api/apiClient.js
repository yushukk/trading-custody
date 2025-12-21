import { API_CONFIG } from '../config/api';
import { ApiError } from '../utils/errorHandler';

/**
 * API 客户端类
 * 统一管理所有 API 请求
 */
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.navigateToLogin = null; // 用于存储导航函数
    this.isRefreshing = false; // 是否正在刷新 Token
    this.failedQueue = []; // 失败请求队列
  }

  /**
   * 设置导航函数
   * @param {Function} navigateFn - React Router 的 navigate 函数
   */
  setNavigate(navigateFn) {
    this.navigateToLogin = navigateFn;
  }

  /**
   * 处理失败队列
   * @param {Error|null} error - 错误对象，如果为 null 表示刷新成功
   */
  processQueue(error = null) {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  /**
   * 刷新 Access Token
   * @returns {Promise<boolean>} 是否刷新成功
   */
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('刷新 Token 失败:', error);
      return false;
    }
  }

  /**
   * 跳转到登录页
   */
  redirectToLogin() {
    // 清除本地存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 跳转到登录页
    if (this.navigateToLogin) {
      this.navigateToLogin('/login', { replace: true });
    } else {
      // 如果没有设置 navigate 函数，使用 window.location
      window.location.href = '/login';
    }
  }

  /**
   * 发送 HTTP 请求
   * @param {string} endpoint - API 端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 响应数据
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // 如果options中已经提供了signal，则使用它，否则创建新的AbortController
    const controller = options.signal ? null : new AbortController();
    const signal = options.signal || controller.signal;

    const config = {
      ...options,
      credentials: 'include', // 携带 Cookie
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal, // 添加signal到配置中
    };

    try {
      let timeoutId;
      if (controller) {
        timeoutId = setTimeout(() => controller.abort(), this.timeout);
      }

      const response = await fetch(url, config);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 尝试解析 JSON 响应
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // 处理 401 未授权错误，尝试刷新 Token
        if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
          // 如果正在刷新，将请求加入队列
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve: () => {
                  resolve(this.request(endpoint, options));
                },
                reject: error => {
                  reject(error);
                },
              });
            });
          }

          this.isRefreshing = true;

          try {
            // 尝试刷新 Token
            const refreshSuccess = await this.refreshAccessToken();

            if (refreshSuccess) {
              // 刷新成功，处理队列中的请求
              this.processQueue();
              this.isRefreshing = false;
              // 重试当前请求
              return this.request(endpoint, options);
            } else {
              // 刷新失败，清空队列并跳转登录页
              const error = new ApiError(401, '登录已过期，请重新登录', null);
              this.processQueue(error);
              this.isRefreshing = false;
              this.redirectToLogin();
              throw error;
            }
          } catch (error) {
            this.processQueue(error);
            this.isRefreshing = false;
            this.redirectToLogin();
            throw error;
          }
        }

        throw new ApiError(response.status, data.error || data.message || '请求失败', data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError(0, '请求超时', null);
      }

      throw new ApiError(0, error.message || '网络错误', null);
    }
  }

  /**
   * GET 请求
   * @param {string} endpoint - API 端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 响应数据
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST 请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise} 响应数据
   */
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT 请求
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求数据
   * @param {Object} options - 请求选项
   * @returns {Promise} 响应数据
   */
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE 请求
   * @param {string} endpoint - API 端点
   * @param {Object} options - 请求选项
   * @returns {Promise} 响应数据
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// 导出单例
const apiClient = new ApiClient();
export default apiClient;
