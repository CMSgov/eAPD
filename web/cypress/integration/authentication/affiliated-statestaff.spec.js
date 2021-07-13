// affiliated-statestaff.spec.js created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test

describe('Logging in with a state staff user (no MFA) with an approved affiliation', () => {
    it('accept notice', () => {
        cy.visit('/');

        cy.findByRole('button', { name: /Agree and continue/i }).click()
        cy.findByRole('heading', { name: /Log in/i }).should('exist');
    });

    it('should login', () => {
        cy.findByRole('heading', { name: /Log in/i }).should('exist');
        cy.findByLabelText('EUA ID').type(Cypress.env('statestaff'));
        cy.findByLabelText('Password').type(Cypress.env('statestaff_pw'), { log: false });
        cy.findByRole('button', { name: /Log in/i }).click();
        cy.findByRole('button', { name: /Logging in/i }).should('exist');

        cy.findByRole('heading', { name: /Alaska APDs/i }).should('exist');
    });
})