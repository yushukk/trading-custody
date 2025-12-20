const crypto = require('crypto');

/**
 * 生成安全的随机密钥
 * 用于 JWT 签名等安全场景
 */

const generateSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

console.log('='.repeat(80));
console.log('生成的安全密钥（请复制到 .env 文件中）：');
console.log('='.repeat(80));
console.log('');
console.log(`JWT_ACCESS_SECRET=${generateSecret()}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret()}`);
console.log('');
console.log('='.repeat(80));
console.log('提示：');
console.log('1. 请将上述密钥复制到项目根目录的 .env 文件中');
console.log('2. 不要将 .env 文件提交到版本控制系统');
console.log('3. 生产环境请使用不同的密钥');
console.log('='.repeat(80));
