describe('Authorization and Access Control', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
  })

  describe('Unauthenticated Access', () => {
    it('should redirect to login when accessing admin dashboard without auth', () => {
      cy.visit('/')
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing user management without auth', () => {
      cy.visit('/user-management')
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing fund management without auth', () => {
      cy.visit('/fund-management')
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing position management without auth', () => {
      cy.visit('/position-management')
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing user fund position without auth', () => {
      cy.visit('/user-fund-position')
      cy.url().should('include', '/login')
    })

    it('should redirect to login when accessing change password without auth', () => {
      cy.visit('/change-password')
      cy.url().should('include', '/login')
    })
  })

  describe('Regular User Access Control', () => {
    beforeEach(() => {
      // Login as regular user
      cy.visit('/login')
      cy.get('.login-input').eq(0).type('test')
      cy.get('.login-input').eq(1).type('test')
      cy.get('.login-button').click()
      cy.url().should('include', '/user-fund-position')
    })

    it('should redirect regular user to user-fund-position when accessing root', () => {
      cy.visit('/')
      cy.url().should('include', '/user-fund-position')
    })

    it('should prevent regular user from accessing user management', () => {
      cy.visit('/user-management')
      // Should redirect to user fund position
      cy.url().should('include', '/user-fund-position')
    })

    it('should prevent regular user from accessing fund management', () => {
      cy.visit('/fund-management')
      // Should redirect to user fund position
      cy.url().should('include', '/user-fund-position')
    })

    it('should prevent regular user from accessing position management', () => {
      cy.visit('/position-management')
      // Should redirect to user fund position
      cy.url().should('include', '/user-fund-position')
    })

    it('should allow regular user to access their own fund position', () => {
      cy.visit('/user-fund-position')
      cy.url().should('include', '/user-fund-position')
      cy.contains('我的资金与持仓').should('be.visible')
    })

    it('should allow regular user to access change password', () => {
      // Navigate from user fund position page
      cy.contains('修改密码').click()
      cy.url().should('include', '/change-password', { timeout: 10000 })
      cy.get('h1').should('contain', '修改密码')
    })

    it('should verify regular user role in localStorage', () => {
      cy.window().then((window) => {
        expect(window.localStorage.getItem('userRole')).to.equal('user')
        expect(window.localStorage.getItem('username')).to.equal('test')
      })
    })
  })

  describe('Admin User Access Control', () => {
    beforeEach(() => {
      // Login as admin
      cy.visit('/login')
      cy.get('.login-input').eq(0).type('admin')
      cy.get('.login-input').eq(1).type('admin123')
      cy.get('.login-button').click()
      cy.url().should('eq', 'http://localhost:3000/')
    })

    it('should allow admin to access admin dashboard', () => {
      cy.visit('/')
      cy.url().should('eq', 'http://localhost:3000/')
      cy.get('h1').should('contain', '欢迎管理员')
    })

    it('should allow admin to access user management', () => {
      cy.visit('/user-management')
      cy.url().should('include', '/user-management')
    })

    it('should allow admin to access fund management', () => {
      cy.visit('/fund-management')
      cy.url().should('include', '/fund-management')
    })

    it('should allow admin to access position management', () => {
      cy.visit('/position-management')
      cy.url().should('include', '/position-management')
    })

    it('should allow admin to access change password', () => {
      cy.visit('/change-password')
      cy.url().should('include', '/change-password')
      cy.contains('修改密码').should('be.visible')
    })

    it('should verify admin role in localStorage', () => {
      cy.window().then((window) => {
        expect(window.localStorage.getItem('userRole')).to.equal('admin')
        expect(window.localStorage.getItem('username')).to.equal('admin')
      })
    })
  })

  describe('Session Persistence', () => {
    it('should maintain admin session after page reload', () => {
      // Login as admin
      cy.visit('/login')
      cy.get('.login-input').eq(0).type('admin')
      cy.get('.login-input').eq(1).type('admin123')
      cy.get('.login-button').click()
      
      // Reload page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('eq', 'http://localhost:3000/')
      cy.window().then((window) => {
        expect(window.localStorage.getItem('authToken')).to.exist
      })
    })

    it('should maintain regular user session after page reload', () => {
      // Login as regular user
      cy.visit('/login')
      cy.get('.login-input').eq(0).type('test')
      cy.get('.login-input').eq(1).type('test')
      cy.get('.login-button').click()
      
      // Reload page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', '/user-fund-position')
      cy.window().then((window) => {
        expect(window.localStorage.getItem('authToken')).to.exist
      })
    })

    it('should lose session after logout', () => {
      // Login
      cy.visit('/login')
      cy.get('.login-input').eq(0).type('admin')
      cy.get('.login-input').eq(1).type('admin123')
      cy.get('.login-button').click()
      
      // Logout
      cy.contains('退出登录').click()
      
      // Try to access protected route
      cy.visit('/')
      cy.url().should('include', '/login')
    })
  })

  describe('Cross-Role Navigation', () => {
    it('should prevent navigation from regular user to admin pages via URL', () => {
      // Login as regular user
      cy.visit('/login')
      cy.get('.login-input').eq(0).type('test')
      cy.get('.login-input').eq(1).type('test')
      cy.get('.login-button').click()
      
      // Try to access admin pages directly
      const adminPages = ['/user-management', '/fund-management', '/position-management']
      
      adminPages.forEach(page => {
        cy.visit(page)
        cy.url().should('include', '/user-fund-position')
      })
    })

    it('should allow switching between admin pages', () => {
      // Login as admin
      cy.visit('/login')
      cy.get('.login-input').eq(0).type('admin')
      cy.get('.login-input').eq(1).type('admin123')
      cy.get('.login-button').click()
      
      // Navigate between admin pages
      cy.contains('用户管理').click()
      cy.url().should('include', '/user-management')
      
      cy.visit('/')
      cy.contains('资金管理').click()
      cy.url().should('include', '/fund-management')
      
      cy.visit('/')
      cy.contains('持仓管理').click()
      cy.url().should('include', '/position-management')
    })
  })
})
