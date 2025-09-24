const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // Setup base URL - 使用8085端口（前端）和8086端口（后端）
    baseUrl: 'http://localhost:8085',
    
    // Configure viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Setup video recording
    video: false,
    
    // Setup screenshots
    screenshotsFolder: 'cypress/screenshots',
    
    // Setup videos folder
    videosFolder: 'cypress/videos',
    
    // Setup fixtures
    fixturesFolder: 'cypress/fixtures',
    
    // Setup support files
    supportFile: 'cypress/support/e2e.js',
    
    // Setup spec files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Setup downloads
    downloadsFolder: 'cypress/downloads',
    
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