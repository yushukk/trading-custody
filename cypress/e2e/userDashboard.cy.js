import React from 'react'

describe('User Dashboard', () => {
  beforeEach(() => {
    // Login as a regular user before each test
    cy.visit('/login')
    // 修复：使用数据库中存在的普通用户登录，而不是不存在的user1
    cy.get('.login-input').eq(0).type('Bob')
    cy.get('.login-input').eq(1).type('bob123')
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
})