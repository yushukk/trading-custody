describe('Login Flow', () => {
  beforeEach(() => {
    // Reset database or mock API calls before each test
    cy.visit('/login')
  })

  it('should display login page', () => {
    cy.get('h1').should('contain', 'DEMO')
    cy.get('.login-input').eq(0).should('be.visible')
    cy.get('.login-input').eq(1).should('be.visible')
    cy.get('.login-button').should('be.visible')
  })

  it('should login with valid credentials', () => {
    cy.get('.login-input').eq(0).type('admin')
    cy.get('.login-input').eq(1).type('admin123')
    cy.get('.login-button').click()
    
    // 修复：检查正确的URL
    cy.url().should('eq', 'http://localhost:8085/')
    // 修复：检查正确的标题文本
    cy.get('h1').should('contain', '欢迎管理员')
  })

  it('should show error with invalid credentials', () => {
    cy.get('.login-input').eq(0).type('invalid')
    cy.get('.login-input').eq(1).type('invalid')
    cy.get('.login-button').click()
    
    // Should show error message
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Invalid credentials')
    })
  })
})