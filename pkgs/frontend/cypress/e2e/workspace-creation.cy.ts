/// <reference types="cypress" />
/// <reference types="cypress-file-upload" />
/// <reference types="@synthetixio/synpress" />

import { WorkspaceCreationPage } from "../support/page-objects/WorkspaceCreationPage";
import * as TestDataUtils from "../support/utils/TestDataGenerator";

describe("Workspace Creation Flow", () => {
  let workspaceCreationPage: WorkspaceCreationPage;
  let workspaceName: string;
  let workspaceDescription: string;

  before(() => {
    // Connect wallet before tests
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
        selectWalletButton.should("be.visible");
        selectWalletButton.click();

        const metaMaskButton = cy.contains("span", "MetaMask").parent("button");
        metaMaskButton.should("be.visible");
        metaMaskButton.click();
      }
    });

    // Wait for redirect to complete
    cy.wait(2000);

    // Initialize test data
    workspaceName = TestDataUtils.generateWorkspaceName();
    workspaceDescription = TestDataUtils.generateWorkspaceDescription();
    workspaceCreationPage = new WorkspaceCreationPage();
  });

  it("should create a new workspace", () => {
    // 1. ワークスペース一覧ページにアクセスする
    workspaceCreationPage.visit();

    // 2. 「新しいワークスペースを作成」ボタンをクリックする
    workspaceCreationPage.clickCreateWorkspaceButton();

    // 3. ワークスペース作成フォームが表示されることを確認する
    cy.url().should("include", "/workspace/new");

    // 4. ワークスペース画像をアップロードする
    workspaceCreationPage.uploadImage(TestDataUtils.getSampleImagePath());

    // 5. ワークスペース名を入力する
    workspaceCreationPage.enterName(workspaceName);

    // 6. ワークスペースの説明を入力する
    workspaceCreationPage.enterDescription(workspaceDescription);

    // 7. 「作成」ボタンをクリックする
    workspaceCreationPage.clickCreateButton();

    // 8. MetaMaskウォレットでの署名要求が表示されることを確認する
    // 9. 署名を承認する
    workspaceCreationPage.confirmMetaMaskSignature();

    // 10. 新しく作成されたワークスペースのホームページに遷移することを確認する
    // 11. 作成したワークスペースの情報（名前、説明、画像）が正しく表示されていることを確認する
    workspaceCreationPage.verifyWorkspaceCreated(workspaceName);
  });
});
