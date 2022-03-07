/// <reference path="../../build/index.d.ts" />

describe('enableCspThroughMetaTag', () => {
  it('applies the TT CSP header', () => {
    cy.enableCspThroughMetaTag();
    cy.visit('/');
    cy.catchTrustedTypesViolations();

    cy.contains('unsafe html').click();
    cy.assertTrustedTypesViolation('TrustedHTML');
  });

  it('needs to be called before the site is visited', () => {
    cy.visit('/');
    cy.enableCspThroughMetaTag(); // Too late now
    cy.catchTrustedTypesViolations();

    cy.contains('unsafe html').click();

    cy.assertZeroTrustedTypesViolation();
    cy.get('iframe').should('exist');
  });
});

describe('parseCspFromMetaTags', () => {
  it('parses the CSP sent by the server', () => {
    cy.enableCspThroughMetaTag();
    cy.visit('/');

    cy.parseCspFromMetaTags().then((csp) => {
      expect(csp).to.deep.equal(["require-trusted-types-for 'script'; trusted-types my-policy;"]);
    });
  });

  it('parses the CSP set by addCspMetaTag', () => {
    cy.addCspMetaTag({ cspValue: "require-trusted-types-for 'script'; trusted-types my-policy other-policy;" });
    cy.visit('/');

    cy.parseCspFromMetaTags().then((csp) => {
      expect(csp).to.deep.equal(["require-trusted-types-for 'script'; trusted-types my-policy other-policy;"]);
    });
  });
});

it('addCspMetaTag does not stack', () => {
  cy.addCspMetaTag({ cspValue: "require-trusted-types-for 'script'; trusted-types my-policy one" });
  cy.addCspMetaTag({ cspValue: "require-trusted-types-for 'script'; trusted-types my-policy two three" });
  cy.visit('/');

  cy.parseCspFromMetaTags().then((csp) => {
    // Only the second one is used
    expect(csp).to.deep.equal(["require-trusted-types-for 'script'; trusted-types my-policy two three"]);
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
