const jwt = require('jsonwebtoken');
const db = require('../utils/database');

/**
 * 用户控制器
 * @module UserController
 */

/**
 * 用户登录控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.username - 用户名
 * @param {string} req.body.password - 密码
 * @param {Object} res - 响应对象
 * @returns {Object} 包含token、角色和用户ID的响应对象
 */
exports.login = (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE name = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      // 使用 jsonwebtoken 生成 token，并返回用户ID
      const token = jwt.sign({ username: row.name, role: row.role }, 'your-secret-key', { expiresIn: '1h' });
      res.json({ token, role: row.role, id: row.id }); // 添加用户ID返回
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
};

/**
 * 更新用户密码控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.username - 用户名
 * @param {string} req.body.newPassword - 新密码
 * @param {Object} res - 响应对象
 * @returns {Object} 包含成功消息的响应对象
 */
exports.updatePassword = (req, res) => {
  const { username, newPassword } = req.body;
  db.run("UPDATE users SET password = ? WHERE name = ?", [newPassword, username], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Password updated successfully' });
  });
};

/**
 * 获取所有用户控制器
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Array} 用户列表数组
 */
exports.getAllUsers = (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
};

/**
 * 创建用户控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.name - 用户名
 * @param {string} req.body.email - 邮箱
 * @param {string} req.body.password - 密码
 * @param {string} req.body.role - 角色
 * @param {Object} res - 响应对象
 * @returns {Object} 包含新创建用户信息的响应对象
 */
exports.createUser = (req, res) => {
  const { name, email, password, role } = req.body;
  db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, email, password, role });
  });
};

/**
 * 更新用户密码控制器（通过ID）
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.id - 用户ID
 * @param {Object} req.body - 请求体
 * @param {string} req.body.newPassword - 新密码
 * @param {Object} res - 响应对象
 * @returns {Object} 包含成功消息的响应对象
 */
exports.updateUserPasswordById = (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  db.run("UPDATE users SET password = ? WHERE id = ?", [newPassword, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Password updated successfully' });
  });
};

/**
 * 删除用户控制器
 * @param {Object} req - 请求对象
 * @param {Object} req.params - 请求参数
 * @param {string} req.params.id - 用户ID
 * @param {Object} res - 响应对象
 * @returns {Object} 包含成功消息的响应对象
 */
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  });
};