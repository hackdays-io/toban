import { describe } from "mocha";

describe("Basic", () => {
  it("should visit", () => {
    cy.visit("/");
    const startButton = cy.get("button[data-testid=start-button]");
    startButton.should("be.visible");
    startButton.click();
    cy.url().should("include", "/login");

    cy.wait(1000);
    // Check if login button exists since it might not appear for users who already connected wallet
    cy.get("body").then(($body) => {
      if ($body.find("button[data-testid=login]").length > 0) {
        const loginButton = cy.get("button[data-testid=login]");
        loginButton.should("be.visible");
        loginButton.click();

        const selectWalletButton = cy
          .contains("div", "Continue with a wallet")
          .parent("button");
        console.log(selectWalletButton);
        selectWalletButton.should("be.visible");
        selectWalletButton.click();

        const metaMaskButton = cy.contains("span", "MetaMask").parent("button");
        metaMaskButton.should("be.visible");
        metaMaskButton.click();
      }
    });

    // Wait for redirect to complete
    cy.wait(2000);

    // Check if URL includes signup or workspace
    cy.url().then((url) => {
      if (url.includes("/signup")) {
        // If redirected to signup page
        cy.log("New user - redirected to signup page");
        // Add your signup page test steps here
        const signupForm = cy.get("[data-testid=signup-form]");
        signupForm.should("be.visible");
        // ... continue with signup flow
      } else if (url.includes("/workspace")) {
        // If redirected to workspace page (existing user)
        cy.log("Existing user - redirected to workspace page");
        // Add your workspace page test steps here
        const workspaceElement = cy.get("[data-testid=workspace-page]");
        workspaceElement.should("be.visible");
        // ... continue with workspace flow
      } else {
        // Handle unexpected redirect
        cy.log(`Unexpected redirect to: ${url}`);
        throw new Error(`Unexpected redirect to: ${url}`);
      }
    });

    // cy.connectToDapp();
  });
});
