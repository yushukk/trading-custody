import React, { Suspense } from 'react';
import './App.css';
import './styles/global.css'; // 引入全局样式
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import routes from './routes';
import ProtectedRoute from './routes/ProtectedRoute';
import { SpinLoading } from 'antd-mobile';

// 加载中组件
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <SpinLoading color="primary" />
  </div>
);

// 包裹App内容并使用useNavigate
function AppContent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {routes.map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={<ProtectedRoute meta={route.meta}>{route.element}</ProtectedRoute>}
          />
        ))}
      </Routes>
    </Suspense>
  );
}

// 主App组件包裹Router
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}
