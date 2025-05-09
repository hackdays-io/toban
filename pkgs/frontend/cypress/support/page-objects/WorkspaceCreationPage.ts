/// <reference types="cypress" />
/// <reference types="cypress-file-upload" />
/// <reference types="@synthetixio/synpress" />

/**
 * Page Object for Workspace Creation page
 */
export class WorkspaceCreationPage {
  private createWorkspaceButtonSelector =
    "button:contains('新しいワークスペースを作成')";
  private workspaceNameInputSelector =
    "[data-testid='workspace-name-input'] input";
  private workspaceDescriptionInputSelector =
    "[data-testid='description-input'] textarea";
  private fileInputSelector = "[data-testid='file-input'] input";
  private createButtonSelector = "button:contains('作成')";

  /**
   * Visit the workspace list page
   */
  visit() {
    cy.visit("/workspace");
    return this;
  }

  /**
   * Click the "Create new workspace" button
   */
  clickCreateWorkspaceButton() {
    cy.get(this.createWorkspaceButtonSelector).click();
    return this;
  }

  /**
   * Upload workspace image
   * @param imagePath Path to the image file
   */
  uploadImage(imagePath: string) {
    cy.get(this.fileInputSelector).attachFile(imagePath);
    return this;
  }

  /**
   * Enter workspace name
   * @param name Workspace name
   */
  enterName(name: string) {
    cy.get(this.workspaceNameInputSelector).type(name);
    return this;
  }

  /**
   * Enter workspace description
   * @param description Workspace description
   */
  enterDescription(description: string) {
    cy.get(this.workspaceDescriptionInputSelector).type(description);
    return this;
  }

  /**
   * Click the create button to submit the form
   */
  clickCreateButton() {
    cy.get(this.createButtonSelector).click();
    return this;
  }

  /**
   * Verify that the MetaMask signature request is displayed and confirm it
   */
  confirmMetaMaskSignature() {
    cy.task("confirmMetamaskSignatureRequest");
    return this;
  }

  /**
   * Verify that the workspace was created successfully and redirected to the workspace home page
   * @param workspaceName Name of the created workspace
   */
  verifyWorkspaceCreated(workspaceName: string) {
    cy.wait(3000);

    cy.url().should("match", /\/\d+$/);

    cy.contains(workspaceName).should("be.visible");

    return this;
  }
}
