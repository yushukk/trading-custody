const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // Setup base URL - 使用3000端口（前端）和3001端口（后端）
    baseUrl: 'http://localhost:3000',
    
    // Configure viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Setup video recording
    video: false,
    
    // Setup screenshots - 只在失败时截图
    screenshotOnRunFailure: true,
    screenshotsFolder: 'tests/cypress/screenshots',
    
    // Setup videos folder
    videosFolder: 'tests/cypress/videos',
    
    // Setup fixtures
    fixturesFolder: 'tests/cypress/fixtures',
    
    // Setup support files
    supportFile: 'tests/cypress/support/e2e.js',
    
    // Setup spec files
    specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Setup downloads
    downloadsFolder: 'tests/cypress/downloads',
    
    // Setup retries - 减少重试次数加快速度
    retries: {
      runMode: 1,  // 从 2 改为 1
      openMode: 0
    },
    
    // Setup default browser
    browser: 'chrome',
    
    // Setup experimental features
    experimentalStudio: true,
    
    // 性能优化配置
    defaultCommandTimeout: 8000,  // 从默认 4000ms 增加到 8000ms，减少不必要的重试
    pageLoadTimeout: 60000,       // 页面加载超时
    requestTimeout: 10000,        // 请求超时
    responseTimeout: 30000,       // 响应超时
    
    // 减少等待时间
    waitForAnimations: false,     // 不等待动画完成
    animationDistanceThreshold: 5,
    
    // 禁用不必要的功能以提升速度
    watchForFileChanges: false,   // 不监听文件变化
    
    // 并行执行相关配置
    numTestsKeptInMemory: 10,     // 减少内存中保留的测试数量
    
    // 浏览器启动参数优化
    chromeWebSecurity: false,     // 禁用同源策略检查
    
    // 环境变量
    env: {
      // 可以在这里添加环境变量
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack'
    }
  }
})