import { AddCspMetaTagOptions, EnableCspThroughMetaTagOptions, TrustedValue, Violation } from './types';

let catchTrustedTypesViolationsEnabled = false;
let trustedTypesViolations: Violation[] = [];

beforeEach('clear Trusted Types violations', () => {
  trustedTypesViolations = [];
  catchTrustedTypesViolationsEnabled = false;
});

// NOTE: Based on https://glebbahmutov.com/blog/testing-csp-almost/
Cypress.Commands.add('enableCspThroughMetaTag', (options?: EnableCspThroughMetaTagOptions) => {
  const { urlPattern } = options ?? {};

  // Intercept all requests by default
  cy.intercept(urlPattern ?? '**/*', (req) => {
    return req.reply((res) => {
      const csp = res.headers['content-security-policy'];
      if (!csp || typeof res.body !== 'string') return;

      res.body = res.body
        .replace(
          new RegExp('<head>([\\s\\S]*)</head>'),
          new RegExp(`<head><meta http-equiv="Content-Security-Policy" content="${csp}">$1</head>`).toString()
        )
        // The following are needed because the regex replacement above inserts some characters
        .replace('/<head>', '<head>')
        .replace('<\\/head>/', '</head>');
    });
  }).as('enableCspThroughMetaTag');
});

// CSP policies merge so adding another CSP meta tag will not affect the ones already present in the HTML body
Cypress.Commands.add('addCspMetaTag', (options?: AddCspMetaTagOptions) => {
  const { urlPattern, cspValue } = options ?? {};

  // Intercept all requests by default
  cy.intercept(urlPattern ?? '**/*', (req) => {
    return req.reply((res) => {
      // The CSP should be provided by the user
      expect(cspValue).to.be.a('string');
      if (typeof res.body !== 'string') return;

      res.body = res.body
        .replace(
          new RegExp('<head>([\\s\\S]*)</head>'),
          new RegExp(`<head><meta http-equiv="Content-Security-Policy" content="${cspValue}">$1</head>`).toString()
        )
        // The following are caused because the regex replacement above inserts some characters
        .replace('/<head>', '<head>')
        .replace('<\\/head>/', '</head>');
    });
  }).as('addCspMetaTag');
});

Cypress.Commands.add('parseCspFromMetaTags', () => {
  return cy.document().then((doc) => {
    const cspMetas = [...doc.querySelectorAll('meta[http-equiv=Content-Security-Policy]')];
    return cspMetas.map((meta) => (meta as any).content);
  });
});

function formatViolationMessage(type: TrustedValue) {
  return `This document requires '${type}' assignment.`;
}

Cypress.Commands.add('catchTrustedTypesViolations', () => {
  if (catchTrustedTypesViolationsEnabled) return;
  catchTrustedTypesViolationsEnabled = true;
  cy.clearTrustedTypesViolations();

  // https://docs.cypress.io/api/events/catalog-of-events#To-catch-a-single-uncaught-exception
  // @ts-expect-error: The function violates the "noImplicitReturn" rule, but cypress types requires this
  cy.on('uncaught:exception', (err) => {
    const violationTypes = ['TrustedHTML', 'TrustedScript', 'TrustedScriptURL'];

    const type = violationTypes.find((type) => err.message.includes(formatViolationMessage(type as TrustedValue)));
    if (type) {
      trustedTypesViolations.push({
        message: formatViolationMessage(type as TrustedValue),
        error: err,
      });
      // Return false to prevent the error from failing this test
      return false;
    }
  });
});

Cypress.Commands.add('assertTrustedTypesViolations', (expectedTypes: TrustedValue[]) => {
  cy.getTrustedTypesViolations().then((_actual) => {
    const actual = _actual as Violation[];
    expect(actual).to.have.length(expectedTypes.length);

    return Cypress._.zip(actual, expectedTypes).forEach(([act, expType]) => {
      expect(act!.message).to.equal(formatViolationMessage(expType!));
    });
  });
});

Cypress.Commands.add('assertTrustedTypesViolation', (expectedType: TrustedValue) => {
  cy.assertTrustedTypesViolations([expectedType]);
});

Cypress.Commands.add('assertZeroTrustedTypesViolation', () => {
  cy.getTrustedTypesViolations().should('be.empty');
});

Cypress.Commands.add('clearTrustedTypesViolations', () => {
  const violations = trustedTypesViolations;
  trustedTypesViolations = [];
  return cy.wrap(violations);
});

Cypress.Commands.add('getTrustedTypesViolations', () => {
  return cy.wrap(trustedTypesViolations);
});
