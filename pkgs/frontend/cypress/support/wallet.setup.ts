import { defineWalletSetup } from "@synthetixio/synpress";
import { MetaMask } from "@synthetixio/synpress/playwright";

const SEED_PHRASE =
  "shallow forest pool lake current network spell behave grass horror extend tortoise";
const PASSWORD = "testtest";

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const metamask = new MetaMask(context as any, walletPage as any, PASSWORD);
  await metamask.importWallet(SEED_PHRASE);
});
