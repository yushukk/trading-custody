describe('Fund Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login')
    cy.get('.login-input').eq(0).type('admin')
    cy.get('.login-input').eq(1).type('admin123')
    cy.get('.login-button').click()
    
    // Wait for admin dashboard to load
    cy.url().should('eq', 'http://localhost:3000/', { timeout: 10000 })
    
    // Navigate to fund management page
    cy.contains('资金管理').click()
    cy.url().should('include', '/fund-management', { timeout: 10000 })
  })

  it('should display fund management page', () => {
    cy.get('h1').should('contain', '资金管理')
    cy.contains('返回仪表盘').should('be.visible')
  })

  it('should display user selection', () => {
    // Check if user select component is visible
    cy.get('body').should('contain', '选择用户')
  })

  it('should select a user and display fund info', () => {
    // Select test user from dropdown
    // Note: antd-mobile Selector might need specific interaction
    cy.contains('test').click({ force: true })
    
    // Wait for fund info to load
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
  })

  it('should display fund operation options', () => {
    // Select a user first
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Check operation type selector
    cy.contains('设置初始资金').should('be.visible')
    cy.contains('追加资金').should('be.visible')
    cy.contains('取出资金').should('be.visible')
  })

  it('should set initial fund successfully', () => {
    // Select user
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Select operation type: initial
    cy.contains('设置初始资金').click()
    
    // Enter amount
    cy.get('input[placeholder="金额"]').clear().type('10000')
    
    // Enter remark (optional)
    cy.get('input[placeholder="备注（可选）"]').clear().type('初始资金设置')
    
    // Submit
    cy.contains('确认设置').click()
    
    // Wait for success message
    cy.contains('操作成功', { timeout: 10000 }).should('exist')
    
    // Verify balance updated
    cy.contains('当前余额：￥10000.00', { timeout: 10000 }).should('be.visible')
  })

  it('should deposit fund successfully', () => {
    // Select user
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Select operation type: deposit
    cy.contains('追加资金').click()
    
    // Enter amount
    cy.get('input[placeholder="金额"]').clear().type('5000')
    
    // Enter remark
    cy.get('input[placeholder="备注（可选）"]').clear().type('追加投资')
    
    // Submit
    cy.contains('确认追加').click()
    
    // Wait for success message
    cy.contains('操作成功', { timeout: 10000 }).should('exist')
  })

  it('should withdraw fund successfully', () => {
    // Select user
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Select operation type: withdraw
    cy.contains('取出资金').click()
    
    // Enter amount
    cy.get('input[placeholder="金额"]').clear().type('1000')
    
    // Enter remark
    cy.get('input[placeholder="备注（可选）"]').clear().type('部分提现')
    
    // Submit
    cy.contains('确认取出').click()
    
    // Wait for success message
    cy.contains('操作成功', { timeout: 10000 }).should('exist')
  })

  it('should show error when amount is invalid', () => {
    // Select user
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Try to submit without amount
    cy.contains('确认设置').click()
    
    // Should show error message
    cy.contains('请选择用户并输入有效金额', { timeout: 5000 }).should('exist')
  })

  it('should display fund transaction logs', () => {
    // Select user
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Check if fund logs section is visible
    cy.contains('资金流水').should('be.visible')
  })

  it('should display transaction details in logs', () => {
    // Select user
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Perform a transaction first
    cy.get('input[placeholder="金额"]').clear().type('100')
    cy.get('input[placeholder="备注（可选）"]').clear().type('测试交易')
    cy.contains('确认设置').click()
    cy.contains('操作成功', { timeout: 10000 }).should('exist')
    
    // Check if transaction appears in logs
    cy.contains('资金流水').parent().within(() => {
      cy.contains('初始资金').should('be.visible')
      cy.contains('￥100.00').should('be.visible')
      cy.contains('备注：测试交易').should('be.visible')
    })
  })

  it('should display empty state when no transactions', () => {
    // This test assumes there's a user with no transactions
    // Or we need to create a new user first
    cy.contains('暂无资金流水').should('exist')
  })

  it('should navigate back to dashboard', () => {
    cy.contains('返回仪表盘').click()
    cy.url().should('eq', 'http://localhost:3000/')
    cy.get('h1').should('contain', '欢迎管理员')
  })

  it('should update balance after multiple operations', () => {
    // Select user
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Get initial balance
    cy.contains('当前余额').then(($balance) => {
      const initialBalance = parseFloat($balance.text().match(/[\d.]+/)[0])
      
      // Deposit
      cy.contains('追加资金').click()
      cy.get('input[placeholder="金额"]').clear().type('1000')
      cy.contains('确认追加').click()
      cy.contains('操作成功', { timeout: 10000 }).should('exist')
      
      // Verify balance increased
      cy.contains('当前余额').should('contain', (initialBalance + 1000).toFixed(2))
    })
  })

  it('should allow operations without remark', () => {
    // Select user
    cy.contains('test').click({ force: true })
    cy.contains('当前余额', { timeout: 10000 }).should('be.visible')
    
    // Enter amount only, no remark
    cy.get('input[placeholder="金额"]').clear().type('500')
    
    // Submit
    cy.contains('确认设置').click()
    
    // Should succeed
    cy.contains('操作成功', { timeout: 10000 }).should('exist')
  })
})
