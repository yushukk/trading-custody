const sqlite3 = require('sqlite3').verbose();
const PasswordHelper = require('../utils/passwordHelper');
const path = require('path');

/**
 * 重置 admin 用户密码为 "admin"
 */

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

async function resetAdminPassword() {
  console.log('开始重置 admin 密码...');

  try {
    // 加密新密码 "admin"
    const hashedPassword = await PasswordHelper.hash('admin');
    console.log('新密码已加密');

    // 更新数据库
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password = ? WHERE name = ?', [hashedPassword, 'admin'], err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('✓ admin 密码已重置为: admin');
    console.log('现在可以使用 username: admin, password: admin 登录了');
  } catch (error) {
    console.error('重置密码失败:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 执行重置
resetAdminPassword()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
