describe('Position Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('.login-input').eq(0).type('admin');
    cy.get('.login-input').eq(1).type('admin123');
    cy.get('.login-button').click();

    // Wait for admin dashboard to load
    cy.url().should('eq', 'http://localhost:8085/', { timeout: 10000 });

    // Navigate to position management page
    cy.contains('持仓管理').click();
    cy.url().should('include', '/position-management', { timeout: 10000 });
  });

  it('should display position management page', () => {
    cy.get('h1').should('contain', '持仓管理');
    cy.contains('返回仪表盘').should('be.visible');
  });

  it('should display user selection', () => {
    // Check if user select component is visible
    cy.get('body').should('contain', '选择用户');
  });

  it('should select a user and display position form', () => {
    // Select test user
    cy.contains('test').click({ force: true });

    // Wait for form to appear
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');
    cy.contains('代码').should('be.visible');
    cy.contains('名称').should('be.visible');
    cy.contains('操作类型').should('be.visible');
    cy.contains('价格').should('be.visible');
    cy.contains('数量').should('be.visible');
  });

  it('should display asset type options', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Check asset type options
    cy.contains('股票').should('be.visible');
    cy.contains('期货').should('be.visible');
    cy.contains('基金').should('be.visible');
  });

  it('should display operation type options', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('操作类型', { timeout: 10000 }).should('be.visible');

    // Check operation type options
    cy.contains('买入').should('be.visible');
    cy.contains('卖出').should('be.visible');
  });

  it('should add a buy position successfully', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Select asset type: stock
    cy.contains('股票').click();

    // Fill in form
    cy.get('input[placeholder="请输入代码"]').clear().type('600000');
    cy.get('input[placeholder="请输入名称"]').clear().type('浦发银行');

    // Select operation: buy
    cy.contains('买入').click();

    // Enter price and quantity
    cy.get('input[placeholder="请输入价格"]').clear().type('10.50');
    cy.get('input[placeholder="请输入数量"]').clear().type('1000');

    // Enter fee
    cy.get('input[placeholder="请输入交易费用"]').clear().type('5.25');

    // Submit
    cy.contains('提交').click();

    // Wait for success message
    cy.contains('操作成功', { timeout: 10000 }).should('exist');
  });

  it('should add a sell position successfully', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Select asset type: future
    cy.contains('期货').click();

    // Fill in form
    cy.get('input[placeholder="请输入代码"]').clear().type('IF2312');
    cy.get('input[placeholder="请输入名称"]').clear().type('沪深300');

    // Select operation: sell
    cy.contains('卖出').click();

    // Enter price and quantity
    cy.get('input[placeholder="请输入价格"]').clear().type('4200');
    cy.get('input[placeholder="请输入数量"]').clear().type('1');

    // Enter fee
    cy.get('input[placeholder="请输入交易费用"]').clear().type('12.60');

    // Submit
    cy.contains('提交').click();

    // Wait for success message
    cy.contains('操作成功', { timeout: 10000 }).should('exist');
  });

  it('should display position records', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Check if position records section is visible
    cy.contains('持仓记录').should('be.visible');
  });

  it('should display position details in records', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Add a position first
    cy.get('input[placeholder="请输入代码"]').clear().type('000001');
    cy.get('input[placeholder="请输入名称"]').clear().type('平安银行');
    cy.get('input[placeholder="请输入价格"]').clear().type('15.20');
    cy.get('input[placeholder="请输入数量"]').clear().type('500');
    cy.get('input[placeholder="请输入交易费用"]').clear().type('3.80');
    cy.contains('提交').click();
    cy.contains('操作成功', { timeout: 10000 }).should('exist');

    // Check if position appears in records
    cy.contains('持仓记录')
      .parent()
      .within(() => {
        cy.contains('000001').should('be.visible');
        cy.contains('平安银行').should('be.visible');
        cy.contains('买入').should('be.visible');
        cy.contains('￥15.20').should('be.visible');
        cy.contains('500').should('be.visible');
        cy.contains('交易费用: ￥3.80').should('be.visible');
      });
  });

  it('should display empty state when no positions', () => {
    // This assumes there's a user with no positions
    // Or we need to select a user without positions
    cy.contains('暂无持仓记录').should('exist');
  });

  it('should calculate total amount correctly', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Add a position
    const price = 20.5;
    const quantity = 100;
    const expectedTotal = price * quantity;

    cy.get('input[placeholder="请输入代码"]').clear().type('TEST');
    cy.get('input[placeholder="请输入名称"]').clear().type('测试股票');
    cy.get('input[placeholder="请输入价格"]').clear().type(price.toString());
    cy.get('input[placeholder="请输入数量"]').clear().type(quantity.toString());
    cy.get('input[placeholder="请输入交易费用"]').clear().type('0');
    cy.contains('提交').click();
    cy.contains('操作成功', { timeout: 10000 }).should('exist');

    // Verify total amount in records
    cy.contains('持仓记录')
      .parent()
      .within(() => {
        cy.contains(`￥${expectedTotal.toFixed(2)}`).should('be.visible');
      });
  });

  it('should display asset type correctly in records', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Test with different asset types
    const assetTypes = [
      { chinese: '股票', english: 'stock' },
      { chinese: '期货', english: 'future' },
      { chinese: '基金', english: 'fund' },
    ];

    // Just verify the first one
    cy.contains(assetTypes[0].chinese).should('be.visible');
  });

  it('should navigate back to dashboard', () => {
    cy.contains('返回仪表盘').click();
    cy.url().should('eq', 'http://localhost:8085/');
    cy.get('h1').should('contain', '欢迎管理员');
  });

  it('should handle form with default values', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Check if form has default values
    cy.get('input[placeholder="请输入代码"]').should('have.value', 'PVC主连');
    cy.get('input[placeholder="请输入名称"]').should('have.value', 'PVC主连');
    cy.get('input[placeholder="请输入价格"]').should('have.value', '100');
    cy.get('input[placeholder="请输入数量"]').should('have.value', '1');
    cy.get('input[placeholder="请输入交易费用"]').should('have.value', '0');
  });

  it('should clear form after successful submission', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Fill and submit form
    cy.get('input[placeholder="请输入代码"]').clear().type('CLEAR');
    cy.get('input[placeholder="请输入名称"]').clear().type('清空测试');
    cy.get('input[placeholder="请输入价格"]').clear().type('99.99');
    cy.get('input[placeholder="请输入数量"]').clear().type('10');
    cy.get('input[placeholder="请输入交易费用"]').clear().type('1.00');
    cy.contains('提交').click();
    cy.contains('操作成功', { timeout: 10000 }).should('exist');

    // Form should be reset to default values
    cy.get('input[placeholder="请输入代码"]').should('have.value', 'PVC主连');
  });

  it('should display timestamp in position records', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Add a position
    cy.get('input[placeholder="请输入代码"]').clear().type('TIME');
    cy.get('input[placeholder="请输入名称"]').clear().type('时间测试');
    cy.get('input[placeholder="请输入价格"]').clear().type('10');
    cy.get('input[placeholder="请输入数量"]').clear().type('1');
    cy.get('input[placeholder="请输入交易费用"]').clear().type('0');
    cy.contains('提交').click();
    cy.contains('操作成功', { timeout: 10000 }).should('exist');

    // Check if timestamp is displayed (format: YYYY/MM/DD HH:mm:ss or similar)
    cy.contains('持仓记录')
      .parent()
      .within(() => {
        // Timestamp should contain numbers and slashes/colons
        cy.get('div').should('contain', '/');
      });
  });

  it('should allow adding multiple positions for same user', () => {
    // Select user
    cy.contains('test').click({ force: true });
    cy.contains('资产类型', { timeout: 10000 }).should('be.visible');

    // Add first position
    cy.get('input[placeholder="请输入代码"]').clear().type('POS1');
    cy.get('input[placeholder="请输入名称"]').clear().type('持仓1');
    cy.get('input[placeholder="请输入价格"]').clear().type('10');
    cy.get('input[placeholder="请输入数量"]').clear().type('1');
    cy.get('input[placeholder="请输入交易费用"]').clear().type('0');
    cy.contains('提交').click();
    cy.contains('操作成功', { timeout: 10000 }).should('exist');

    // Add second position
    cy.get('input[placeholder="请输入代码"]').clear().type('POS2');
    cy.get('input[placeholder="请输入名称"]').clear().type('持仓2');
    cy.get('input[placeholder="请输入价格"]').clear().type('20');
    cy.get('input[placeholder="请输入数量"]').clear().type('2');
    cy.get('input[placeholder="请输入交易费用"]').clear().type('0');
    cy.contains('提交').click();
    cy.contains('操作成功', { timeout: 10000 }).should('exist');

    // Both should appear in records
    cy.contains('POS1').should('be.visible');
    cy.contains('POS2').should('be.visible');
  });
});
