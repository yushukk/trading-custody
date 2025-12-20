const sqlite3 = require('sqlite3').verbose();
const PasswordHelper = require('../utils/passwordHelper');
const path = require('path');

/**
 * 密码加密迁移脚本
 * 将数据库中所有明文密码加密
 */

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

async function migratePasswords() {
  console.log('开始密码加密迁移...');
  
  return new Promise((resolve, reject) => {
    // 获取所有用户
    db.all("SELECT id, name, password FROM users", [], async (err, users) => {
      if (err) {
        console.error('获取用户失败:', err);
        reject(err);
        return;
      }
      
      console.log(`找到 ${users.length} 个用户需要迁移`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // 逐个加密用户密码
      for (const user of users) {
        try {
          // 检查密码是否已经是 bcrypt 哈希（bcrypt 哈希以 $2a$、$2b$ 或 $2y$ 开头）
          if (user.password && user.password.match(/^\$2[aby]\$/)) {
            console.log(`用户 ${user.name} (ID: ${user.id}) 的密码已加密，跳过`);
            successCount++;
            continue;
          }
          
          // 加密密码
          const hashedPassword = await PasswordHelper.hash(user.password);
          
          // 更新数据库
          await new Promise((resolveUpdate, rejectUpdate) => {
            db.run(
              "UPDATE users SET password = ? WHERE id = ?",
              [hashedPassword, user.id],
              (updateErr) => {
                if (updateErr) {
                  rejectUpdate(updateErr);
                } else {
                  resolveUpdate();
                }
              }
            );
          });
          
          console.log(`✓ 用户 ${user.name} (ID: ${user.id}) 密码加密成功`);
          successCount++;
        } catch (error) {
          console.error(`✗ 用户 ${user.name} (ID: ${user.id}) 密码加密失败:`, error.message);
          errorCount++;
        }
      }
      
      console.log('\n密码加密迁移完成！');
      console.log(`成功: ${successCount} 个用户`);
      console.log(`失败: ${errorCount} 个用户`);
      
      resolve({ successCount, errorCount });
    });
  });
}

// 执行迁移
migratePasswords()
  .then(({ successCount, errorCount }) => {
    db.close();
    if (errorCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('迁移失败:', error);
    db.close();
    process.exit(1);
  });
