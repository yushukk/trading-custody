const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * JWT 工具类
 * @module JwtHelper
 */

class JwtHelper {
  /**
   * 生成访问令牌（Access Token）
   * @param {Object} payload - 令牌载荷
   * @param {string} payload.userId - 用户ID
   * @param {string} payload.username - 用户名
   * @param {string} payload.role - 用户角色
   * @returns {string} JWT 访问令牌
   */
  static generateAccessToken(payload) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET 未配置');
    }

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
  }

  /**
   * 生成刷新令牌（Refresh Token）
   * @param {Object} payload - 令牌载荷
   * @param {string} payload.userId - 用户ID
   * @param {string} payload.username - 用户名
   * @param {string} payload.role - 用户角色
   * @returns {string} JWT 刷新令牌
   */
  static generateRefreshToken(payload) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET 未配置');
    }

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  /**
   * 验证访问令牌
   * @param {string} token - JWT 访问令牌
   * @returns {Object} 解码后的令牌载荷
   * @throws {Error} 令牌无效或已过期
   */
  static verifyAccessToken(token) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET 未配置');
    }

    return jwt.verify(token, secret);
  }

  /**
   * 验证刷新令牌
   * @param {string} token - JWT 刷新令牌
   * @returns {Object} 解码后的令牌载荷
   * @throws {Error} 令牌无效或已过期
   */
  static verifyRefreshToken(token) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET 未配置');
    }

    return jwt.verify(token, secret);
  }

  /**
   * 解码令牌（不验证签名）
   * @param {string} token - JWT 令牌
   * @returns {Object} 解码后的令牌载荷
   */
  static decode(token) {
    return jwt.decode(token);
  }
}

module.exports = JwtHelper;
