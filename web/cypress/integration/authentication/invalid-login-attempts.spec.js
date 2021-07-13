// invalid-password.spec.js created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test
describe('Invalid Login Attempts', () => {
  before(() => {
    cy.setCookie('gov.cms.eapd.hasConsented', 'true');
    cy.visit('/');
  });

  describe('password issues', () => {
    afterEach(() => {
      console.log(cy.url());
      if (cy.location() !== '/login') {
        cy.setCookie('gov.cms.eapd.hasConsented', 'true');
        cy.visit('/');
      } else {
        cy.findByLabelText('EUA ID').clear();
        cy.findByLabelText('Password').clear();
      }
    });

    it('disabled the login button until there is a username and password', () => {
      cy.findByRole('button', { name: /Log in/i }).should('be.disabled');

      cy.findByLabelText('EUA ID').type(Cypress.env('statestaff'));
      cy.findByRole('button', { name: /Log in/i }).should('be.disabled');

      cy.findByLabelText('Password').type(Cypress.env('statestaff_pw'), {
        log: false
      });
      cy.findByRole('button', { name: /Log in/i }).should('be.enabled');
    });

    it('uses the wrong username and password', () => {
      cy.findByLabelText('EUA ID').type('bad user');
      cy.findByLabelText('Password').type('bad password', { log: false });
      cy.findByRole('button', { name: /Log in/i }).click();

      cy.findByText('Your username and/or password is incorrect.').should(
        'exist'
      );
    });

    it('uses the wrong password', () => {
      cy.findByLabelText('EUA ID').type(Cypress.env('statestaff'));
      cy.findByLabelText('Password').type('bad password', { log: false });
      cy.findByRole('button', { name: /Log in/i }).click();

      cy.findByText('Your username and/or password is incorrect.').should(
        'exist'
      );
    });
  });

  //   it('locks the user out if they have three failed password attempts', () => {
  //     // A user will get three failed password attempts before they are locked out,
  //     // but this test has to use a variable number of attempts because the user
  //     // might already be locked out from previous test runs.
  //     let lockedOut = false;

  //     while (!lockedOut) {
  //       cy.findByLabelText('EUA ID').type(Cypress.env('lockedout'));
  //       cy.findByLabelText('Password').type('bad password', { log: false });
  //       cy.findByRole('button', { name: /Log in/i }).click();

  //       if (cy.findByText('Account Locked').length > 0) {
  //         lockedOut = true;
  //       }
  //     }

  //     cy.findByText('Your account will reset automatically in one hour').should(
  //       'exist'
  //     );
  //   });
});
