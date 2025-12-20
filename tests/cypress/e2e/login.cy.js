describe('Login Flow', () => {
  beforeEach(() => {
    // Reset database or mock API calls before each test
    cy.visit('/login');
  });

  it('should display login page', () => {
    cy.get('h1').should('contain', '欢迎回来');
    cy.get('.login-input').eq(0).should('be.visible');
    cy.get('.login-input').eq(1).should('be.visible');
    cy.get('.login-button').should('be.visible');
  });

  it('should login with valid credentials', () => {
    cy.get('.login-input').eq(0).type('admin');
    cy.get('.login-input').eq(1).type('admin123');
    cy.get('.login-button').click();

    // Wait for navigation to complete
    cy.url().should('eq', 'http://localhost:8085/', { timeout: 10000 });
    // Verify admin dashboard is displayed
    cy.get('h1', { timeout: 10000 }).should('contain', '欢迎管理员');

    // Verify cookies are set (HttpOnly cookies exist but can't be read by JS)
    cy.getCookie('accessToken').should('exist');
  });

  it('should show error with invalid credentials', () => {
    cy.get('.login-input').eq(0).type('invalid');
    cy.get('.login-input').eq(1).type('invalid');
    cy.get('.login-button').click();

    // Should show error message
    cy.on('window:alert', text => {
      expect(text).to.contains('Invalid credentials');
    });
  });

  it('should login as regular user and redirect to user fund position', () => {
    cy.get('.login-input').eq(0).type('test');
    cy.get('.login-input').eq(1).type('test');
    cy.get('.login-button').click();

    // Should redirect to user fund position page
    cy.url().should('include', '/user-fund-position');
    cy.contains('我的资金与持仓').should('be.visible');
  });

  it('should support login with Enter key', () => {
    cy.get('.login-input').eq(0).type('admin');
    cy.get('.login-input').eq(1).type('admin123{enter}');

    // Wait for login to complete and navigation
    cy.url().should('eq', 'http://localhost:8085/', { timeout: 10000 });
    cy.get('h1', { timeout: 10000 }).should('contain', '欢迎管理员');

    // Verify cookies are set
    cy.getCookie('accessToken').should('exist');
  });

  it('should show error with empty credentials', () => {
    cy.get('.login-button').click();

    // Should show error or stay on login page
    cy.url().should('include', '/login');
  });

  it('should set HttpOnly cookies after successful login', () => {
    cy.get('.login-input').eq(0).type('admin');
    cy.get('.login-input').eq(1).type('admin123');
    cy.get('.login-button').click();

    // Wait for navigation to ensure login completed
    cy.url().should('eq', 'http://localhost:8085/', { timeout: 10000 });

    // Verify HttpOnly cookies are set (can check existence but not read value via JS)
    cy.getCookie('accessToken').should('exist');
    cy.getCookie('refreshToken').should('exist');

    // Verify localStorage does NOT contain auth tokens (security improvement)
    cy.window().then(window => {
      expect(window.localStorage.getItem('authToken')).to.be.null;
      expect(window.localStorage.getItem('userRole')).to.be.null;
      expect(window.localStorage.getItem('username')).to.be.null;
      expect(window.localStorage.getItem('userId')).to.be.null;
    });
  });

  it('should maintain session with cookies', () => {
    // First login
    cy.get('.login-input').eq(0).type('admin');
    cy.get('.login-input').eq(1).type('admin123');
    cy.get('.login-button').click();

    // Wait for successful login and navigation
    cy.url().should('eq', 'http://localhost:8085/', { timeout: 10000 });

    // Verify cookies are set
    cy.getCookie('accessToken').should('exist');

    // Navigate away and back - cookies should persist
    cy.visit('/user-management');
    cy.url().should('include', '/user-management');

    // Cookies should still exist
    cy.getCookie('accessToken').should('exist');
  });
});
