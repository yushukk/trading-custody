const jwt = require('jsonwebtoken');
const db = require('../utils/database');

/**
 * 用户服务
 * @module UserService
 */

/**
 * 用户认证服务
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise} 认证结果Promise
 */
exports.authenticateUser = (username, password) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE name = ? AND password = ?", [username, password], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * 生成JWT令牌
 * @param {Object} user - 用户对象
 * @returns {string} JWT令牌
 */
exports.generateToken = (user) => {
  return jwt.sign({ username: user.name, role: user.role }, 'your-secret-key', { expiresIn: '1h' });
};

/**
 * 更新用户密码服务
 * @param {string} username - 用户名
 * @param {string} newPassword - 新密码
 * @returns {Promise} 更新结果Promise
 */
exports.updateUserPassword = (username, newPassword) => {
  return new Promise((resolve, reject) => {
    db.run("UPDATE users SET password = ? WHERE name = ?", [newPassword, username], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ message: 'Password updated successfully' });
      }
    });
  });
};

/**
 * 获取所有用户服务
 * @returns {Promise} 用户列表Promise
 */
exports.getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * 创建用户服务
 * @param {Object} userData - 用户数据
 * @returns {Promise} 创建结果Promise
 */
exports.createUser = (userData) => {
  const { name, email, password, role } = userData;
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, name, email, password, role });
      }
    });
  });
};

/**
 * 根据ID更新用户密码服务
 * @param {number} id - 用户ID
 * @param {string} newPassword - 新密码
 * @returns {Promise} 更新结果Promise
 */
exports.updateUserPasswordById = (id, newPassword) => {
  return new Promise((resolve, reject) => {
    db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ message: 'Password updated successfully' });
      }
    });
  });
};

/**
 * 删除用户服务
 * @param {number} id - 用户ID
 * @returns {Promise} 删除结果Promise
 */
exports.deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ message: 'User deleted successfully' });
      }
    });
  });
};