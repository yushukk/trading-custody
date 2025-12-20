const bcrypt = require('bcrypt');

/**
 * 密码加密工具类
 * @module PasswordHelper
 */

const SALT_ROUNDS = 10;

class PasswordHelper {
  /**
   * 加密密码
   * @param {string} password - 明文密码
   * @returns {Promise<string>} 加密后的密码哈希
   */
  static async hash(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * 验证密码
   * @param {string} password - 明文密码
   * @param {string} hash - 密码哈希
   * @returns {Promise<boolean>} 密码是否匹配
   */
  static async verify(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

module.exports = PasswordHelper;
