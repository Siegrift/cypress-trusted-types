# cypress-trusted-types ![ContinuousBuild](https://github.com/siegrift/cypress-trusted-types/actions/workflows/main.yml/badge.svg?branch=main)

> A library to simplify Cypress e2e testing of Trusted Types compliant applications

## Installation

To install this package run either:

`yarn add @siegrift/cypress-trusted-types`

or if you use npm

`npm install @siegrift/cypress-trusted-types --save`

## Usage and API

After you install the library load the available support commands inside cypress `support/index.js` file by adding the
following import:

```js
import '@siegrift/cypress-trusted-types';
```

After the commands are loaded, you can begin writing your tests with Trusted Types assertions:

```js
cy.enableCspThroughMetaTag(); // Addresses Cypress limitation which removes CSP from response headers
cy.visit('/'); // Make sure to call "enableCspThroughMetaTag" before the site is visited
cy.catchTrustedTypesViolations(); // Starts catching Trusted Types violations

cy.contains('unsafe html').click();
cy.assertTrustedTypesViolation('TrustedHTML');
cy.get('iframe').should('not.exist');
```

### With TypeScript

Typings for TS can be added by modifying the `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["cypress", "@siegrift/cypress-trusted-types"]
  }
}
```

You can find all of the library definitions
[here](https://github.com/Siegrift/cypress-trusted-types/blob/main/src/index.d.ts).

### API

The most important are the following two methods:

- `enableCspThroughMetaTag(options)` - copies the CSP header returned by server to the HTML body using the `meta` tag
  because Cypress currently removes CSP header sent by the server. See:
  https://github.com/cypress-io/cypress/issues/1030. By default intercepts every request. You can override this in the
  `options` using the `urlPattern`.

  **This function must be called before you call `cy.visit`!**

- `catchTrustedTypesViolations` - Call this to setup an error handler which listens to uncaught errors and checks for
  Trusted Types violations. In case a Trusted Types violation is encountered, it will be remembered (and can be
  asserted) and more importantly the test will not fail.

#### Assertions

- `assertTrustedTypesViolations` - asserts multiple Trusted Types violations for the current test.

  ```js
  cy.contains('unsafe html').click();
  cy.contains('unsafe html').click();
  cy.contains('duplicate policy').click();
  cy.contains('unsafe script').click();

  cy.assertTrustedTypesViolations(['TrustedHTML', 'TrustedHTML', 'PolicyCreation', 'TrustedScript']);
  ```

- `assertTrustedTypesViolation` - similar to the assertion above, but expects only a single Trusted Types violation.

  ```js
  cy.contains('unsafe html').click();

  cy.assertTrustedTypesViolation('TrustedHTML');
  cy.get('iframe').should('not.exist');
  ```

- `assertZeroTrustedTypesViolation` - asserts that no Trusted Types violation was encountered.

  ```js
  cy.contains('safe html').click();

  cy.assertZeroTrustedTypesViolation();
  cy.get('iframe').should('exist');
  ```

- `getTrustedTypesViolations` - low level API to get the Trusted Types violations to make custom assertions against.

  ```js
  cy.contains('new policy').click();

  cy.getTrustedTypesViolations().then((violations) => {
    expect(violations[0].error.message).to.contain('Policy "new-policy" disallowed.');
  });
  ```

- `clearTrustedTypesViolations` - resets all violations already encountered by the current test.

  ```js
  cy.contains('unsafe html').click();
  cy.assertTrustedTypesViolation('TrustedHTML');

  // Clears previous violations
  cy.clearTrustedTypesViolations();
  cy.assertZeroTrustedTypesViolation();

  // But does NOT prevent further violations
  cy.contains('unsafe script').click();
  cy.assertTrustedTypesViolation('TrustedScript');
  ```

#### Other commands

- `parseCspFromMetaTags` - parses the CSP directives from the `meta` tags.

  ```js
  cy.parseCspFromMetaTags().then((csp) => {
    expect(csp).to.deep.equal(["require-trusted-types-for 'script'; trusted-types my-policy other-policy;"]);
  });
  ```

## Motivation and usage

[Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) is a more and more popular web API
for tackling the insecurities of the DOM to prevent client-side
[Cross-site scripting (XSS)](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting) attacks.

Cypress is, according to [state of JS 2021](https://2021.stateofjs.com/en-US/libraries/testing), one the most loved e2e
testing frameworks and I can relate to this experience.

### Out of the box support

There are many frameworks and libraries which already
[support Trusted Types](https://github.com/w3c/webappsec-trusted-types/wiki/Integrations) and actually Cypress has the
support for Trusted Types out of the box.

This means that if you have a Trusted Types compliant application, you can use Cypress to launch it in the integrated
browser and the app will just work _(\*some restrictions apply)_. This is because Cypress commands (including jQuery) do
not modify the DOM, but instead only query it (make read only operations) which does not cause Trusted Types violations.

### Cross browser support

Cypress [supports cross browser testing](https://docs.cypress.io/guides/guides/cross-browser-testing) - currently
chromium browsers and firefox. This is extremely nice, since you can leverage this to test the application in browsers
which do support Trusted Types (chromium) and the ones which do not (firefox).

### API design

_Reading the following section is not necessary to use and understand this library._

Unfortunately, Cypress has a limitation due to which it removes the CSP header sent by the server.For now the workaround
is to copy the CSP header returned by the server to the HTML body using the `meta` tag. The issue for this is tracked in
https://github.com/cypress-io/cypress/issues/1030.

The API focuses mostly on testing the Trusted Types violations, since they are harder to test. See the [API](#api)
section for the list of available commands.

You might be wondering where are the commands for testing policies and whether a value passed to sink indeed came
through a policy. You might also want to assert that the value came through a specific policy (e.g. the default one).
These commands are not (and will not be) implemented. The reason is that these assertions are impossible to implement
without the help of an user. More importantly though, such tests are too low level for e2e testing. Instead of asserting
that the value was properly sanitized/came through policy, prefer asserting that a certain "feature" worked
successfully. For example, make sure that iframe is present on the page instead of checking that a value of an iframe
`srcDoc` attribute was created by policy (the customers do not care whether you use Trusted Types or not).

## Developer docs

To publish run:

```sh
yarn publish --access public
```
