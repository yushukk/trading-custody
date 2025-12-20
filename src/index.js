import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// 引入环境变量配置 - 使用空字符串，通过 proxy 转发
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// 将 API_BASE_URL 挂载到全局对象中，以便在其他地方使用
window.API_BASE_URL = API_BASE_URL;

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
