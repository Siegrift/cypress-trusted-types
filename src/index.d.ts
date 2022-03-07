/// <reference types="cypress" />
/**
 * This file is supposed to be added to "types" section of tsconfig for the library users to provide out of the box TS
 * typings for the Trusted Types cypress commands.
 */

import { AddCspMetaTagOptions, EnableCspThroughMetaTagOptions, TrustedValue, Violation } from './types';

// https://docs.cypress.io/guides/tooling/typescript-support.html#Types-for-custom-commands
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      enableCspThroughMetaTag(options?: EnableCspThroughMetaTagOptions): Chainable<void>;
      addCspMetaTag(options: AddCspMetaTagOptions): Chainable<void>;
      parseCspFromMetaTags(): Chainable<JQuery<string[]>>;
      catchTrustedTypesViolations(): Chainable<void>;
      assertTrustedTypesViolations(expectedTypes: TrustedValue[]): Chainable<void>;
      assertTrustedTypesViolation(expectedType: TrustedValue): Chainable<void>;
      assertZeroTrustedTypesViolation(): Chainable<void>;
      getTrustedTypesViolations(): Chainable<Violation[]>;
      clearTrustedTypesViolations(): Chainable<Violation[]>;
    }
  }
}
