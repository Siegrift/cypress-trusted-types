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

      cy.assertTrustedTypesViolation({ type: 'TrustedHTML' });
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

      cy.assertTrustedTypesViolation({ type: 'TrustedScript' });
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

      cy.assertTrustedTypesViolation({ type: 'TrustedScriptURL' });
      cy.contains('created from script').should('not.exist');
      cy.get('script').should('have.length', 2);
    });

    it('clearTrustedTypesViolations', () => {
      cy.contains('unsafe html').click();
      cy.assertTrustedTypesViolation({ type: 'TrustedHTML' });

      // Clears previous violations
      cy.clearTrustedTypesViolations();
      cy.assertZeroTrustedTypesViolation();

      // But does NOT prevent further violations
      cy.contains('unsafe script').click();
      cy.assertTrustedTypesViolation({ type: 'TrustedScript' });
    });

    it('assertTrustedTypesViolations', () => {
      cy.contains('unsafe html').click();
      cy.contains('unsafe html').click();
      cy.contains('duplicate policy').click();
      cy.contains('unsafe script').click();

      cy.assertTrustedTypesViolations([
        {
          type: 'TrustedHTML',
          message:
            "Failed to set the 'srcdoc' property on 'HTMLIFrameElement': This document requires 'TrustedHTML' assignment.",
        },
        {}, // No assertion is made for this violation
        {
          type: 'TrustedTypePolicyFactory',
          message: `Failed to execute 'createPolicy' on 'TrustedTypePolicyFactory': Policy with name "my-policy" already exists.`,
        },
        { type: 'TrustedScript' },
      ]);
    });

    it('getTrustedTypesViolations', () => {
      cy.contains('unsafe html').click();
      cy.contains('unsafe script').click();

      cy.getTrustedTypesViolations().then((violations) => {
        expect(violations).to.have.length(2);
        expect(violations[0].message).to.equal(
          "Failed to set the 'srcdoc' property on 'HTMLIFrameElement': This document requires 'TrustedHTML' assignment."
        );
        expect(violations[1].message).to.equal(
          "Failed to set the 'textContent' property on 'Node': This document requires 'TrustedScript' assignment."
        );
      });
    });

    it('calling catchTrustedTypesViolations is noop', () => {
      cy.catchTrustedTypesViolations();
      cy.catchTrustedTypesViolations();

      cy.contains('unsafe html').click();

      // There should be just a single violation
      cy.assertTrustedTypesViolation({ type: 'TrustedHTML' });
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

    describe('disallowed policy creation', () => {
      it('policy already created', () => {
        cy.contains('duplicate policy').click();

        cy.assertTrustedTypesViolation({ type: 'TrustedTypePolicyFactory' });
        cy.getTrustedTypesViolations().then((violations) => {
          expect(violations[0].error.message).to.contain('Policy with name "my-policy" already exists.');
        });
      });

      it('policy not listed in CSP', () => {
        cy.contains('new policy').click();

        cy.assertTrustedTypesViolation({ type: 'TrustedTypePolicyFactory' });
        cy.getTrustedTypesViolations().then((violations) => {
          expect(violations[0].error.message).to.contain('Policy "new-policy" disallowed.');
        });
      });
    });
  });
}

describe('chrome spec', { browser: 'chrome' }, () => {
  describe('enableCspThroughMetaTag', () => {
    it('applies the TT CSP header', () => {
      cy.enableCspThroughMetaTag();
      cy.visit('/');
      cy.catchTrustedTypesViolations();

      cy.contains('unsafe html').click();
      cy.assertTrustedTypesViolation({ type: 'TrustedHTML' });
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

  it('supports TT', () => {
    expect(window.trustedTypes).not.to.be.undefined;
  });

  describe('default policy', () => {
    beforeEach(() => {
      cy.enableCspThroughMetaTag();
      cy.visit('/meta-csp/default-policy');
      cy.catchTrustedTypesViolations();
    });

    it('pipes the html value through', () => {
      cy.contains('default html').click();
      cy.contains('html').should('be.visible');
    });

    it('pipes the script value through', () => {
      cy.contains('default script').click();
      cy.contains('created from script').should('be.visible');
    });

    it('catches TT violation for default policy', () => {
      cy.contains('non existent script url').click();
      cy.assertTrustedTypesViolation({ type: 'TrustedScriptURL' });
    });
  });

  // Run the tests where the server sends the CSP header directly
  runTests('/');
  // Run the tests where the CSP is set inside the meta tag in the returned html
  runTests('meta-csp/');
});
