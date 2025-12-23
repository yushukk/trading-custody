const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 密钥管理工具
 * 负责自动生成和管理 JWT 密钥
 */

class SecretsManager {
  /**
   * 生成安全的随机密钥
   * @param {number} length - 字节长度，默认 64
   * @returns {string} 十六进制格式的密钥
   */
  static generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 检查并自动生成缺失的密钥
   * @param {Object} options - 配置选项
   * @param {string} options.envFilePath - .env 文件路径
   * @param {Function} options.logger - 日志记录器
   * @returns {Object} 包含 accessSecret 和 refreshSecret 的对象
   */
  static ensureSecrets(options = {}) {
    const { envFilePath = path.join(process.cwd(), '.env'), logger = console } = options;

    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    let accessSecret = process.env.JWT_ACCESS_SECRET;
    let refreshSecret = process.env.JWT_REFRESH_SECRET;

    // 先验证现有密钥（如果存在）
    if (accessSecret || refreshSecret) {
      const accessValidation = this.validateSecretStrength(accessSecret);
      const refreshValidation = this.validateSecretStrength(refreshSecret);

      // 生产环境：检测到示例密钥或弱密钥，拒绝启动
      if (isProduction) {
        if (!accessValidation.isValid || !refreshValidation.isValid) {
          const errors = [
            ...(!accessValidation.isValid
              ? accessValidation.warnings.map(w => `JWT_ACCESS_SECRET: ${w}`)
              : []),
            ...(!refreshValidation.isValid
              ? refreshValidation.warnings.map(w => `JWT_REFRESH_SECRET: ${w}`)
              : []),
          ];
          logger.error('');
          logger.error('='.repeat(80));
          logger.error('❌ 生产环境检测到不安全的 JWT 密钥配置');
          errors.forEach(e => logger.error(`   ${e}`));
          logger.error('');
          logger.error('请使用以下方式生成安全的密钥：');
          logger.error('   node scripts/generate-secrets.js');
          logger.error('='.repeat(80));
          logger.error('');
          throw new Error('生产环境不允许使用示例密钥或弱密钥');
        }
      }
    }

    // 检查是否需要生成密钥
    if (!accessSecret || !refreshSecret) {
      logger.info('检测到 JWT 密钥缺失，正在自动生成...');

      if (!accessSecret) {
        accessSecret = this.generateSecret();
        process.env.JWT_ACCESS_SECRET = accessSecret;
        logger.info('✓ JWT_ACCESS_SECRET 已自动生成');
      }

      if (!refreshSecret) {
        refreshSecret = this.generateSecret();
        process.env.JWT_REFRESH_SECRET = refreshSecret;
        logger.info('✓ JWT_REFRESH_SECRET 已自动生成');
      }

      // 尝试保存到 .env 文件
      try {
        this.saveSecretsToEnvFile(envFilePath, {
          accessSecret,
          refreshSecret,
        });
        logger.info(`✓ 密钥已保存到 ${envFilePath}`);

        // 生产环境：给出明确的风险提示
        if (isProduction) {
          logger.info('');
          logger.info('ℹ️  生产环境风险提示：');
          logger.info('   • 当前使用自动生成的密钥');
          logger.info('   • 多实例部署时，请确保所有实例使用相同的密钥文件');
          logger.info('   • 建议定期轮换密钥以提高安全性');
          logger.info('');
        }

        // 开发环境：显示详细信息
        if (isDevelopment) {
          logger.info('');
          logger.info('密钥生成信息：');
          logger.info(`   生成时间: ${new Date().toISOString()}`);
          logger.info(`   保存位置: ${envFilePath}`);
          logger.info('');
        }
      } catch (error) {
        logger.warn(`⚠️  无法保存密钥到 .env 文件: ${error.message}`);
        logger.warn('   密钥仅在当前进程中有效，重启后需要重新生成');

        // 生产环境：保存失败时给出更明确的提示
        if (isProduction) {
          logger.warn('');
          logger.warn('⚠️  生产环境建议：');
          logger.warn('   请手动配置 JWT 密钥到环境变量或 .env 文件');
          logger.warn('   使用 node scripts/generate-secrets.js 生成密钥');
          logger.warn('');
        }
      }
    }

    return {
      accessSecret,
      refreshSecret,
    };
  }

  /**
   * 将密钥保存到 .env 文件
   * @param {string} envFilePath - .env 文件路径
   * @param {Object} secrets - 密钥对象
   * @param {string} secrets.accessSecret - 访问令牌密钥
   * @param {string} secrets.refreshSecret - 刷新令牌密钥
   */
  static saveSecretsToEnvFile(envFilePath, secrets) {
    const { accessSecret, refreshSecret } = secrets;

    // 读取现有的 .env 文件内容
    let envContent = '';
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, 'utf8');
    }

    // 检查是否已存在密钥配置
    const hasAccessSecret = /^JWT_ACCESS_SECRET=/m.test(envContent);
    const hasRefreshSecret = /^JWT_REFRESH_SECRET=/m.test(envContent);

    if (hasAccessSecret && hasRefreshSecret) {
      // 如果已存在，替换现有值
      envContent = envContent.replace(
        /^JWT_ACCESS_SECRET=.*/m,
        `JWT_ACCESS_SECRET=${accessSecret}`
      );
      envContent = envContent.replace(
        /^JWT_REFRESH_SECRET=.*/m,
        `JWT_REFRESH_SECRET=${refreshSecret}`
      );
    } else {
      // 如果不存在，追加到文件末尾
      const timestamp = new Date().toISOString();
      const secretsBlock = `
# JWT 密钥（自动生成于 ${timestamp}）
JWT_ACCESS_SECRET=${accessSecret}
JWT_REFRESH_SECRET=${refreshSecret}
`;
      envContent = envContent.trim() + '\n' + secretsBlock;
    }

    // 写入文件
    fs.writeFileSync(envFilePath, envContent, 'utf8');
  }

  /**
   * 验证密钥强度
   * @param {string} secret - 要验证的密钥
   * @returns {Object} 验证结果
   */
  static validateSecretStrength(secret) {
    const result = {
      isValid: true,
      warnings: [],
    };

    if (!secret) {
      result.isValid = false;
      result.warnings.push('密钥不能为空');
      return result;
    }

    if (secret.length < 32) {
      result.warnings.push('密钥长度小于 32 字符，建议使用更长的密钥');
    }

    // 检查是否为示例密钥
    const examplePatterns = [
      /PLEASE_CHANGE/i,
      /your.*secret/i,
      /change.*this/i,
      /example/i,
      /test/i,
    ];

    for (const pattern of examplePatterns) {
      if (pattern.test(secret)) {
        result.isValid = false;
        result.warnings.push('检测到示例密钥，请更换为安全的随机密钥');
        break;
      }
    }

    // 检查是否为弱密钥
    const weakPatterns = [/^123+$/, /^abc+$/i, /^password/i, /^admin/i];

    for (const pattern of weakPatterns) {
      if (pattern.test(secret)) {
        result.isValid = false;
        result.warnings.push('检测到弱密钥，请使用更安全的随机密钥');
        break;
      }
    }

    return result;
  }
}

module.exports = SecretsManager;
