/// <reference path="../../build/index.d.ts" />

function runTests(url) {
  describe(`url ${url}`, () => {
    beforeEach(() => {
      cy.enableCspThroughMetaTag();
      cy.visit(url);

      cy.catchTrustedTypesViolations();
    });

    it('allows TrustedHTML', () => {
      cy.contains('safe html').click();

      cy.assertZeroTrustedTypesViolation();
      cy.get('iframe').should('exist');
    });

    it('disallows untrusted TrustedHTML', () => {
      cy.contains('unsafe html').click();

      cy.assertTrustedTypesViolation('TrustedHTML');
      cy.get('iframe').should('not.exist');
    });

    it('allows TrustedScript', () => {
      cy.get('script').should('have.length', 2);
      cy.contains('safe script').click();

      cy.assertZeroTrustedTypesViolation();
      cy.contains('created from script').should('be.visible');
      cy.get('script').should('have.length', 3);
    });

    it('disallows untrusted TrustedScript', () => {
      cy.get('script').should('have.length', 2);
      cy.contains('unsafe script').click();

      cy.assertTrustedTypesViolation('TrustedScript');
      cy.contains('created from script').should('not.exist');
      cy.get('script').should('have.length', 2);
    });

    it('allows TrustedScriptURL', () => {
      cy.get('script').should('have.length', 2);
      cy.contains('safe script url').click();

      cy.assertZeroTrustedTypesViolation();
      cy.contains('created from script').should('be.visible');
      cy.get('script').should('have.length', 3);
    });

    it('disallows untrusted TrustedScriptURL', () => {
      cy.get('script').should('have.length', 2);
      cy.contains('unsafe script url').click();

      cy.assertTrustedTypesViolation('TrustedScriptURL');
      cy.contains('created from script').should('not.exist');
      cy.get('script').should('have.length', 2);
    });

    it('clearTrustedTypesViolations', () => {
      cy.contains('unsafe html').click();
      cy.assertTrustedTypesViolation('TrustedHTML');

      // Clears previous violations
      cy.clearTrustedTypesViolations();
      cy.assertZeroTrustedTypesViolation();

      // But does NOT prevent further violations
      cy.contains('unsafe script').click();
      cy.assertTrustedTypesViolation('TrustedScript');
    });

    it('clearTrustedTypesViolations', () => {
      cy.contains('unsafe html').click();
      cy.contains('unsafe html').click();
      cy.contains('unsafe script').click();

      cy.assertTrustedTypesViolations(['TrustedHTML', 'TrustedHTML', 'TrustedScript']);
    });

    it('getTrustedTypesViolations', () => {
      cy.contains('unsafe html').click();
      cy.contains('unsafe script').click();

      cy.getTrustedTypesViolations().then((violations) => {
        expect(violations).to.have.length(2);
        expect(violations[0].message).to.equal("This document requires 'TrustedHTML' assignment.");
        expect(violations[1].message).to.equal("This document requires 'TrustedScript' assignment.");
      });
    });

    it('calling catchTrustedTypesViolations is noop', () => {
      cy.catchTrustedTypesViolations();
      cy.catchTrustedTypesViolations();

      cy.contains('unsafe html').click();

      // There should be just a single violation
      cy.assertTrustedTypesViolation('TrustedHTML');
    });

    describe('violations do NOT persist per test', () => {
      it('makes some violations', () => {
        cy.contains('unsafe html').click();
        cy.contains('unsafe script').click();
      });

      it('should not know about the violations of previous test', () => {
        cy.assertZeroTrustedTypesViolation();
      });
    });
  });
}

// // Run the tests where the server sends the CSP header directly
runTests('/');
// // Run the tests where the CSP is set inside the meta tag in the returned html
runTests('meta-csp/');
