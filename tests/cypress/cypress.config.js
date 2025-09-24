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
    
    // Setup screenshots
    screenshotsFolder: 'screenshots',
    
    // Setup videos folder
    videosFolder: 'videos',
    
    // Setup fixtures
    fixturesFolder: 'fixtures',
    
    // Setup support files
    supportFile: 'support/e2e.js',
    
    // Setup spec files
    specPattern: 'e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Setup downloads
    downloadsFolder: 'downloads',
    
    // Setup retries
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Setup default browser
    browser: 'chrome',
    
    // Setup experimental features
    experimentalStudio: true
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack'
    }
  }
})