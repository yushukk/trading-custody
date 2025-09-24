// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Custom command to login as a user
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/login')
  cy.get('input[placeholder="用户名"]').type(username)
  cy.get('input[placeholder="密码"]').type(password)
  cy.get('button[type="submit"]').click()
})

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.get('button').contains('退出登录').click()
})