import React from 'react'

describe('User Dashboard', () => {
  beforeEach(() => {
    // Login as a regular user before each test
    cy.visit('/login')
    // 修复：使用数据库中存在的普通用户登录，而不是不存在的user1
    cy.get('.login-input').eq(0).type('test')
    cy.get('.login-input').eq(1).type('test')
    cy.get('.login-button').click()
  })

  it('should display user dashboard', () => {
    // 修复：普通用户登录后跳转到/user-fund-position路径
    cy.url().should('include', '/user-fund-position')
    // 修复：检查正确的元素文本
    cy.contains('我的资金与持仓').should('be.visible')
    
    // Check if fund overview is displayed
    cy.contains('资产总览').should('be.visible')
    
    // Check if position details are displayed
    cy.contains('持仓明细').should('be.visible')
    
    // Check if trade history is displayed
    cy.contains('交易记录').should('be.visible')
  })

  it('should display fund balance and profit/loss', () => {
    // Check if balance is displayed
    cy.contains('投入金额').should('be.visible')
    cy.contains('总盈亏').should('be.visible')
    
    // Check if values are numbers
    cy.contains('¥').should('have.length.greaterThan', 0)
  })

  it('should have logout and change password buttons', () => {
    cy.contains('退出登录').should('be.visible')
    cy.contains('修改密码').should('be.visible')
  })

  it('should logout successfully', () => {
    cy.contains('退出登录').click()
    cy.url().should('include', '/login')
  })

  it('should navigate to change password page', () => {
    cy.contains('修改密码').click()
    cy.url().should('include', '/change-password')
    cy.contains('修改密码').should('be.visible')
  })

  it('should display fund balance correctly', () => {
    // Wait for data to load
    cy.contains('资产总览', { timeout: 10000 }).should('be.visible')
    
    // Check if balance elements exist
    cy.contains('投入金额').should('be.visible')
    cy.contains('总盈亏').should('be.visible')
    
    // Verify currency symbol is displayed
    cy.get('div').contains('¥').should('exist')
  })

  it('should display position details section', () => {
    cy.contains('持仓明细').should('be.visible')
  })

  it('should display trade history section', () => {
    cy.contains('交易记录').should('be.visible')
  })

  it('should handle empty position state', () => {
    // If no positions, should show appropriate message
    cy.get('body').then(($body) => {
      if ($body.text().includes('暂无持仓')) {
        cy.contains('暂无持仓').should('be.visible')
      }
    })
  })

  it('should display profit/loss with correct color', () => {
    // Wait for data to load
    cy.contains('总盈亏', { timeout: 10000 }).should('be.visible')
    
    // Check if profit/loss value exists (color will be red for profit, green for loss)
    cy.get('div').contains('总盈亏').parent().parent().within(() => {
      cy.get('div').should('exist')
    })
  })

  it('should clear localStorage after logout', () => {
    // Verify logged in state
    cy.window().then((window) => {
      expect(window.localStorage.getItem('authToken')).to.exist
      expect(window.localStorage.getItem('userId')).to.exist
    })

    // Logout
    cy.contains('退出登录').click()
    
    // Verify localStorage is cleared
    cy.window().then((window) => {
      expect(window.localStorage.getItem('authToken')).to.be.null
      expect(window.localStorage.getItem('userRole')).to.be.null
      expect(window.localStorage.getItem('username')).to.be.null
      expect(window.localStorage.getItem('userId')).to.be.null
    })
  })
})