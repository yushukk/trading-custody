import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// 引入环境变量配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// 将 API_BASE_URL 挂载到全局对象中，以便在其他地方使用
window.API_BASE_URL = API_BASE_URL;

const root = document.getElementById('root');
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  root
);