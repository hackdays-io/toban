import { synpressCommandsForMetaMask } from "@synthetixio/synpress/cypress/support";

Cypress.on("uncaught:exception", (err, runnable) => {
  if (
    /hydrat/i.test(err.message) ||
    /Minified React error #418/.test(err.message) ||
    /Minified React error #423/.test(err.message)
  ) {
    return false;
  }
});

synpressCommandsForMetaMask();
