/// <reference path="../../build/index.d.ts" />

describe('parseCspFromMetaTags', () => {
  it('parses the CSP sent by the server', () => {
    cy.enableCspThroughMetaTag();
    cy.visit('/');

    cy.parseCspFromMetaTags().then((csp) => {
      expect(csp).to.deep.equal(["require-trusted-types-for 'script'; trusted-types my-policy;"]);
    });
  });

  it('parses the CSP set by meta tag', () => {
    cy.visit('meta-csp/');

    cy.parseCspFromMetaTags().then((csp) => {
      expect(csp).to.deep.equal(["require-trusted-types-for 'script'; trusted-types my-policy;"]);
    });
  });
});

it('catches violations only if TT are enabled', () => {
  // We have not called "enableCspThroughMetaTag" so the CSP header is lost after visit
  cy.visit('/');
  cy.catchTrustedTypesViolations();

  cy.contains('unsafe html').click();

  // The call above should produce a violation if TT were enabled. This is a Cypress limitation. See:
  // https://github.com/cypress-io/cypress/issues/1030
  cy.assertZeroTrustedTypesViolation();
});
