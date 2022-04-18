/// <reference path="./index.d.ts" />
import { EnableCspThroughMetaTagOptions, ViolationType, Violation } from './types';

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

Cypress.Commands.add('parseCspFromMetaTags', () => {
  return cy.document().then((doc) => {
    const cspMetas = [...doc.querySelectorAll('meta[http-equiv=Content-Security-Policy]')];
    return cspMetas.map((meta) => (meta as any).content);
  });
});

/**
 * Heuristic to extract the Trusted Types violation from the uncaught Cypress error caused by Trusted Types violation.
 *
 * @param err uncaught Cypress error caused by Trusted Types violation
 * @returns the extracted Trusted Types violation
 */
function extractViolationMessage(err: Error) {
  return err.message
    .replace('The following error originated from your application code, not from Cypress.\n\n  >', '')
    .replace(
      'When Cypress detects uncaught errors originating from your application it will automatically fail the current test.\n\nThis behavior is configurable, and you can choose to turn this off by listening to the `uncaught:exception` event.',
      ''
    )
    .trim();
}

/**
 * Quotes the violation type. This is another heuristic to check for Trusted Types violations.
 *
 * @param type the violation type to quote
 * @returns quoted string
 */
const quote = (type: ViolationType) => `'${type}'`;

const violationTypes = ['TrustedHTML', 'TrustedScript', 'TrustedScriptURL', 'TrustedTypePolicyFactory'] as const;

Cypress.Commands.add('catchTrustedTypesViolations', () => {
  if (catchTrustedTypesViolationsEnabled) return;
  catchTrustedTypesViolationsEnabled = true;
  cy.clearTrustedTypesViolations();

  // https://docs.cypress.io/api/events/catalog-of-events#To-catch-a-single-uncaught-exception
  // @ts-expect-error: The function violates the "noImplicitReturn" rule, but cypress types requires this
  cy.on('uncaught:exception', (err) => {
    const type = violationTypes.find((type) => err.message.includes(quote(type)));
    if (type) {
      trustedTypesViolations.push({
        type,
        message: extractViolationMessage(err),
        error: err,
      });
      // Return false to prevent the error from failing this test
      return false;
    }
  });
});

Cypress.Commands.add('assertTrustedTypesViolations', (expected: Partial<Violation>[]) => {
  cy.getTrustedTypesViolations().then((_actual) => {
    const actual = _actual as Violation[];
    expect(actual).to.have.length(expected.length);

    return Cypress._.zip(actual, expected).forEach(([act, exp]) => {
      Cypress._.forEach(exp!, (val, key) => {
        expect(act![key as keyof typeof act]).to.equal(val);
      });
    });
  });
});

Cypress.Commands.add('assertTrustedTypesViolation', (expected: Partial<Violation>) => {
  cy.assertTrustedTypesViolations([expected]);
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
