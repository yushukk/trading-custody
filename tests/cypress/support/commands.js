// ***********************************************
// Custom commands for Cypress E2E tests
// 使用 Session 缓存登录状态，大幅提升测试速度
// ***********************************************

/**
 * Login command with session caching
 * 使用 Cypress session 缓存登录状态，避免每个测试都重新登录
 * 这是加速 E2E 测试最有效的方法之一
 */
Cypress.Commands.add('login', (username, password) => {
  cy.session(
    [username, password],
    () => {
      cy.visit('/login')
      cy.get('.login-input').eq(0).type(username)
      cy.get('.login-input').eq(1).type(password)
      cy.get('.login-button').click()
      
      // Wait for login to complete
      cy.url().should('not.include', '/login', { timeout: 10000 })
      
      // Verify localStorage has token
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.exist
      })
    },
    {
      validate() {
        // Validate session is still valid
        cy.window().then((win) => {
          expect(win.localStorage.getItem('token')).to.exist
        })
      },
      cacheAcrossSpecs: true  // 跨测试文件缓存会话，大幅减少登录次数
    }
  )
})

/**
 * Login as admin with cached session
 * 管理员登录（带缓存）
 */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin', 'admin123')
})

/**
 * Login as regular user with cached session
 * 普通用户登录（带缓存）
 */
Cypress.Commands.add('loginAsUser', () => {
  cy.login('test', 'test')
})

/**
 * Clear all data and logout
 * 清除所有数据并登出
 */
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
  cy.clearCookies()
  cy.clearLocalStorage()
})

/**
 * Navigate to a page after ensuring admin login
 * 以管理员身份访问页面
 */
Cypress.Commands.add('visitAsAdmin', (url) => {
  cy.loginAsAdmin()
  cy.visit(url)
})

/**
 * Navigate to a page after ensuring user login
 * 以普通用户身份访问页面
 */
Cypress.Commands.add('visitAsUser', (url) => {
  cy.loginAsUser()
  cy.visit(url)
})

/**
 * Wait for element with custom timeout
 * 等待元素出现（自定义超时）
 */
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible')
})

/**
 * Type faster without delay
 * 快速输入（无延迟）
 */
Cypress.Commands.add('fastType', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).clear().type(text, { delay: 0 })
})