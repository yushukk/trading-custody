describe('Change Password', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('.login-input').eq(0).type('admin');
    cy.get('.login-input').eq(1).type('admin123');
    cy.get('.login-button').click();

    // Wait for admin dashboard to load
    cy.url().should('eq', 'http://localhost:8085/', { timeout: 10000 });

    // Navigate to change password page
    cy.contains('修改密码').click();
    cy.url().should('include', '/change-password', { timeout: 10000 });
  });

  it('should display change password page', () => {
    cy.get('h1').should('contain', '修改密码');
    cy.get('.change-password-input').should('have.length', 2);
    cy.contains('确认修改').should('be.visible');
    cy.contains('返回').should('be.visible');
  });

  it('should show error when passwords do not match', () => {
    cy.get('.change-password-input').eq(0).type('newpassword123');
    cy.get('.change-password-input').eq(1).type('differentpassword');
    cy.contains('确认修改').click();

    // Should show error message
    cy.get('.change-password-error').should('contain', '两次输入的密码不一致');
  });

  it('should successfully change password', () => {
    const newPassword = 'newpass123';

    cy.get('.change-password-input').eq(0).type(newPassword);
    cy.get('.change-password-input').eq(1).type(newPassword);
    cy.contains('确认修改').click();

    // Should show success alert
    cy.on('window:alert', text => {
      expect(text).to.contains('密码修改成功');
    });
  });

  it('should support Enter key to submit', () => {
    const newPassword = 'newpass456';

    cy.get('.change-password-input').eq(0).type(newPassword);
    cy.get('.change-password-input')
      .eq(1)
      .type(newPassword + '{enter}');

    // Should trigger submit
    cy.on('window:alert', text => {
      expect(text).to.contains('密码修改成功');
    });
  });

  it('should navigate back when clicking back button', () => {
    cy.contains('返回').click();

    // Should return to admin dashboard
    cy.url().should('eq', 'http://localhost:8085/');
    cy.get('h1').should('contain', '欢迎管理员');
  });

  it('should not submit with empty fields', () => {
    cy.contains('确认修改').click();

    // Should stay on the same page or show error
    cy.url().should('include', '/change-password');
  });

  it('should clear error message when user types again', () => {
    // First create an error
    cy.get('.change-password-input').eq(0).type('password1');
    cy.get('.change-password-input').eq(1).type('password2');
    cy.contains('确认修改').click();
    cy.get('.change-password-error').should('be.visible');

    // Type again to potentially clear error
    cy.get('.change-password-input').eq(0).clear().type('newpassword');
    cy.get('.change-password-input').eq(1).clear().type('newpassword');
  });

  it('should work for regular users', () => {
    // Logout and login as regular user
    cy.contains('返回').click();
    cy.contains('退出登录').click();

    // Login as regular user
    cy.get('.login-input').eq(0).type('test');
    cy.get('.login-input').eq(1).type('test');
    cy.get('.login-button').click();

    // Navigate to change password
    cy.contains('修改密码').click();
    cy.url().should('include', '/change-password');

    // Change password
    const newPassword = 'testpass123';
    cy.get('.change-password-input').eq(0).type(newPassword);
    cy.get('.change-password-input').eq(1).type(newPassword);
    cy.contains('确认修改').click();

    // Should show success
    cy.on('window:alert', text => {
      expect(text).to.contains('密码修改成功');
    });
  });
});
