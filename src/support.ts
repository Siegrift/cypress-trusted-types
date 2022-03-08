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

function formatViolationMessage(type: ViolationType) {
  if (type === 'PolicyCreation') return "Failed to execute 'createPolicy' on 'TrustedTypePolicyFactory'";
  return `This document requires '${type}' assignment.`;
}

Cypress.Commands.add('catchTrustedTypesViolations', () => {
  if (catchTrustedTypesViolationsEnabled) return;
  catchTrustedTypesViolationsEnabled = true;
  cy.clearTrustedTypesViolations();

  // https://docs.cypress.io/api/events/catalog-of-events#To-catch-a-single-uncaught-exception
  // @ts-expect-error: The function violates the "noImplicitReturn" rule, but cypress types requires this
  cy.on('uncaught:exception', (err) => {
    const violationTypes = ['TrustedHTML', 'TrustedScript', 'TrustedScriptURL'] as const;
    const type = violationTypes.find((type) => err.message.includes(formatViolationMessage(type)));
    if (type) {
      trustedTypesViolations.push({
        message: formatViolationMessage(type),
        error: err,
      });
      // Return false to prevent the error from failing this test
      return false;
    }

    const policyCreationErrorMessage = formatViolationMessage('PolicyCreation');
    if (err.message.includes(policyCreationErrorMessage)) {
      trustedTypesViolations.push({
        message: policyCreationErrorMessage,
        error: err,
      });
      // Return false to prevent the error from failing this test
      return false;
    }
  });
});

Cypress.Commands.add('assertTrustedTypesViolations', (expectedTypes: ViolationType[]) => {
  cy.getTrustedTypesViolations().then((_actual) => {
    const actual = _actual as Violation[];
    expect(actual).to.have.length(expectedTypes.length);

    return Cypress._.zip(actual, expectedTypes).forEach(([act, expType]) => {
      expect(act!.message).to.equal(formatViolationMessage(expType!));
    });
  });
});

Cypress.Commands.add('assertTrustedTypesViolation', (expectedType: ViolationType) => {
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
