/// <reference path="../../build/index.d.ts" />

describe('firefox behaviour', { browser: 'firefox' }, () => {
  it('catches violations only if TT are enabled', () => {
    cy.catchTrustedTypesViolations(); // Firefox does not support Trusted Types
    cy.visit('/');

    cy.contains('unsafe html').click();

    // The call above should produce a violation if TT were supported
    cy.assertZeroTrustedTypesViolation();
  });
});
