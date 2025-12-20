describe('Admin Dashboard', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('.login-input').eq(0).type('admin');
    cy.get('.login-input').eq(1).type('admin123');
    cy.get('.login-button').click();
  });

  it('should display admin dashboard', () => {
    // 修复：检查正确的URL
    cy.url().should('eq', 'http://localhost:8085/');
    // 修复：检查正确的标题文本
    cy.get('h1').should('contain', '欢迎管理员');

    // Check if management sections are displayed
    cy.contains('用户管理').should('be.visible');
    cy.contains('资金管理').should('be.visible');
    cy.contains('持仓管理').should('be.visible');
  });

  it('should navigate to user management', () => {
    cy.contains('用户管理').click();
    cy.url().should('include', '/user-management');
  });

  it('should navigate to fund management', () => {
    cy.contains('资金管理').click();
    cy.url().should('include', '/fund-management');
  });

  it('should navigate to position management', () => {
    cy.contains('持仓管理').click();
    cy.url().should('include', '/position-management');
  });

  it('should have logout button', () => {
    cy.contains('退出登录').should('be.visible');
  });

  it('should have change password button', () => {
    cy.contains('修改密码').should('be.visible');
  });

  it('should navigate to change password page', () => {
    cy.contains('修改密码').click();
    cy.url().should('include', '/change-password');
    cy.contains('修改密码').should('be.visible');
  });

  it('should logout successfully and clear cookies', () => {
    // Verify logged in state - cookies exist
    cy.getCookie('accessToken').should('exist');

    // Click logout
    cy.contains('退出登录').click();

    // Should redirect to login page
    cy.url().should('include', '/login');

    // Verify cookies are cleared
    cy.getCookie('accessToken').should('not.exist');
    cy.getCookie('refreshToken').should('not.exist');

    // Verify localStorage does NOT contain auth data (security improvement)
    cy.window().then(window => {
      expect(window.localStorage.getItem('authToken')).to.be.null;
      expect(window.localStorage.getItem('userRole')).to.be.null;
      expect(window.localStorage.getItem('username')).to.be.null;
      expect(window.localStorage.getItem('userId')).to.be.null;
    });
  });

  it('should display all management sections', () => {
    // Verify all three management buttons are visible
    const sections = ['用户管理', '资金管理', '持仓管理'];
    sections.forEach(section => {
      cy.contains(section).should('be.visible');
    });
  });
});
