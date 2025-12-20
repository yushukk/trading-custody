import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <header className="main-header">
        <h1>交易与托管系统</h1>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="main-footer">
        <p>&copy; 2025 交易与托管系统. 保留所有权利.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
