/**
 * API 配置
 */

export const API_CONFIG = {
  // 使用相对路径，通过 proxy 转发到后端
  BASE_URL: process.env.REACT_APP_API_BASE_URL || '',
  TIMEOUT: 30000,
  RETRY_TIMES: 3,
};

export default API_CONFIG;
