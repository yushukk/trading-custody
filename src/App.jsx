import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login'; // 导入 Login 组件

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // 检查是否已登录
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      setIsAdmin(token === 'admin');
    }
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('authToken', token);
    setIsLoggedIn(true);
    setIsAdmin(role === 'admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  const handleUpdatePassword = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, newPassword }),
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : isAdmin ? (
        <div>
          <h1>Admin Dashboard</h1>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button onClick={handleUpdatePassword}>Update Password</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <h1>User Dashboard</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;