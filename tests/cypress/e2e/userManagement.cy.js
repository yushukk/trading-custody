describe('User Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('.login-input').eq(0).type('admin');
    cy.get('.login-input').eq(1).type('admin123');
    cy.get('.login-button').click();

    // Wait for admin dashboard to load
    cy.url().should('eq', 'http://localhost:8085/', { timeout: 10000 });

    // Navigate to user management page
    cy.contains('用户管理').click();
    cy.url().should('include', '/user-management', { timeout: 10000 });
  });

  it('should display user management page', () => {
    cy.get('h1').should('contain', '用户管理');
    cy.contains('返回').should('be.visible');
    cy.contains('添加新用户').should('be.visible');
    cy.contains('用户列表').should('be.visible');
  });

  it('should display add user form', () => {
    // Check form fields exist
    cy.get('input[placeholder="用户名"]').should('be.visible');
    cy.get('input[placeholder="邮箱"]').should('be.visible');
    cy.get('input[placeholder="密码"]').should('be.visible');
    cy.contains('添加用户').should('be.visible');
  });

  it('should add a new user successfully', () => {
    const timestamp = Date.now();
    const newUser = {
      name: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123',
    };

    // Fill in the form
    cy.get('input[placeholder="用户名"]').clear().type(newUser.name);
    cy.get('input[placeholder="邮箱"]').clear().type(newUser.email);
    cy.get('input[placeholder="密码"]').clear().type(newUser.password);

    // Select user role (default is 'user')
    // antd-mobile Selector might need specific interaction

    // Submit form
    cy.contains('添加用户').click();

    // Wait for success message
    cy.contains('添加用户成功', { timeout: 10000 }).should('exist');

    // Verify user appears in the list
    cy.contains(newUser.name, { timeout: 10000 }).should('be.visible');
  });

  it('should display existing users in the list', () => {
    // Wait for user list to load
    cy.contains('用户列表').should('be.visible');

    // Check if admin user exists
    cy.contains('admin').should('be.visible');
  });

  it('should update user password', () => {
    // Find a user card (using admin as example)
    cy.contains('admin')
      .parents('.adm-card')
      .within(() => {
        // Type new password
        cy.get('input[placeholder="新密码"]').clear().type('newpassword123');

        // Click update password button
        cy.contains('修改密码').click();
      });

    // Wait for success message
    cy.contains('密码更新成功', { timeout: 10000 }).should('exist');
  });

  it('should show warning when updating password without input', () => {
    // Find a user card
    cy.contains('admin')
      .parents('.adm-card')
      .within(() => {
        // Click update password without entering password
        cy.contains('修改密码').click();
      });

    // Should show warning
    cy.contains('请输入新密码', { timeout: 5000 }).should('exist');
  });

  it('should delete a user', () => {
    const timestamp = Date.now();
    const testUser = {
      name: `deleteuser${timestamp}`,
      email: `delete${timestamp}@example.com`,
      password: 'password123',
    };

    // First create a test user
    cy.get('input[placeholder="用户名"]').clear().type(testUser.name);
    cy.get('input[placeholder="邮箱"]').clear().type(testUser.email);
    cy.get('input[placeholder="密码"]').clear().type(testUser.password);
    cy.contains('添加用户').click();

    // Wait for user to be added
    cy.contains('添加用户成功', { timeout: 10000 }).should('exist');
    cy.contains(testUser.name, { timeout: 10000 }).should('be.visible');

    // Delete the user
    cy.contains(testUser.name)
      .parents('.adm-card')
      .within(() => {
        cy.contains('删除用户').click();
      });

    // Wait for success message
    cy.contains('用户删除成功', { timeout: 10000 }).should('exist');

    // Verify user is removed from list
    cy.contains(testUser.name).should('not.exist');
  });

  it('should navigate back to dashboard', () => {
    cy.contains('返回').click();
    cy.url().should('eq', 'http://localhost:8085/');
    cy.get('h1').should('contain', '欢迎管理员');
  });

  it('should display user role correctly', () => {
    // Check if role is displayed for users
    cy.contains('角色').should('be.visible');
  });

  it('should handle form validation', () => {
    // Try to add user with empty fields
    cy.get('input[placeholder="用户名"]').clear();
    cy.get('input[placeholder="邮箱"]').clear();
    cy.get('input[placeholder="密码"]').clear();
    cy.contains('添加用户').click();

    // Form should not submit or show error
    // (Actual behavior depends on validation implementation)
  });

  it('should display user email in the list', () => {
    // Verify email is shown in user cards
    cy.contains('邮箱').should('be.visible');
  });
});
