module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.js', '**/tests/integration/**/*.test.js'],
  collectCoverageFrom: [
    '../controllers/**/*.js',
    '../services/**/*.js',
    '../dao/**/*.js',
    '../middleware/**/*.js',
    '../utils/**/*.js',
    '!../utils/database.js', // 排除数据库连接文件
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  setupFiles: ['<rootDir>/../config/env.js'], // 加载环境变量
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/../src/', // 忽略 src 目录下的文件
    '<rootDir>/../tests/cypress/',
    '<rootDir>/../tests/unit/', // 忽略项目根目录下的单元测试
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/../src/', // 忽略 src 目录
    '<rootDir>/../tests/', // 忽略根级tests目录
  ],
};
